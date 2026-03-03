/**
 * Caretica — AI Routes
 * GET  /api/ai/daily-tip  — personalized daily parenting tip (cached per baby per day)
 * POST /api/ai/chat       — multi-turn pediatric Q&A
 */
const express = require('express');
const router  = express.Router();
const prisma  = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');
const { calcPercentile } = require('../who-percentile');
const { getStage } = require('../baby-stages-data');

// ── HELPERS ──

function getTodayString() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getAgeMonths(birthdate) {
  if (!birthdate) return 0;
  const birth = new Date(birthdate);
  const now   = new Date();
  return Math.max(
    0,
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  );
}

function getCorrectedAge(ageMonths, babyType, weeksPremature) {
  if (babyType !== 'premature' || !weeksPremature) return ageMonths;
  return Math.max(0, ageMonths - weeksPremature / 4.33);
}

async function callClaude(messages, systemPrompt, maxTokens = 300) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    system:     systemPrompt,
    messages,
  });
  return response.content[0]?.text || '';
}

// ── GET /api/ai/daily-tip ──
router.get('/daily-tip', authMiddleware, async (req, res) => {
  try {
    const baby = await prisma.baby.findFirst({ where: { user_id: req.user.id } });
    if (!baby) return res.status(404).json({ error: 'No baby profile found' });

    const today = getTodayString();

    // Check cache
    const cached = await prisma.dailyTip.findFirst({
      where: { baby_id: baby.id, date: today },
    });
    if (cached) {
      return res.json({ tip: cached.content, cached: true });
    }

    // No API key → use stage fallback
    if (!process.env.ANTHROPIC_API_KEY) {
      const ageMonths    = getAgeMonths(baby.birthdate);
      const correctedAge = getCorrectedAge(ageMonths, baby.baby_type, baby.weeks_premature);
      const stage        = getStage(correctedAge);
      return res.json({ tip: stage.aiTip, cached: false, fallback: true });
    }

    // Fetch latest weight log
    const weightLog = await prisma.growthLog.findFirst({
      where:   { baby_id: baby.id, type: 'weight' },
      orderBy: { logged_at: 'desc' },
    });

    const ageMonths    = getAgeMonths(baby.birthdate);
    const correctedAge = getCorrectedAge(ageMonths, baby.baby_type, baby.weeks_premature);
    const stage        = getStage(correctedAge);

    let weightContext = '';
    if (weightLog) {
      const genderKey = baby.gender === 'male' ? 'boys' : 'girls';
      const pct = calcPercentile(Math.round(correctedAge), weightLog.value, 'weight', genderKey);
      weightContext = `, weight: ${weightLog.value}kg (${pct.label})`;
    }

    const babyTypeLabel = baby.baby_type === 'premature'
      ? `premature (${baby.weeks_premature}wks early, corrected age ${Math.round(correctedAge)}mo)`
      : baby.baby_type;

    const prompt = `You are a warm pediatric assistant. Baby: ${Math.round(correctedAge)} months old, type: ${babyTypeLabel}${weightContext}, stage: ${stage.label}.
Generate 1 personalized daily parenting tip (2–3 sentences). Reference WHO standards where relevant. Do not diagnose. Use a friendly, encouraging tone.`;

    const tip = await callClaude([{ role: 'user', content: 'Give me today\'s parenting tip.' }], prompt, 200);

    // Cache it
    await prisma.dailyTip.create({
      data: { baby_id: baby.id, date: today, content: tip },
    });

    res.json({ tip, cached: false, stage: stage.id, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('Daily tip error:', err);
    // Fallback to static tip
    try {
      const baby = await prisma.baby.findFirst({ where: { user_id: req.user.id } });
      const ageMonths = baby ? getAgeMonths(baby.birthdate) : 0;
      const correctedAge = baby ? getCorrectedAge(ageMonths, baby.baby_type, baby.weeks_premature) : 0;
      const stage = getStage(correctedAge);
      return res.json({ tip: stage.aiTip, cached: false, fallback: true });
    } catch {
      res.status(500).json({ error: err.message });
    }
  }
});

// ── Build a data-aware summary without Claude (used as fallback) ──
function buildDataAwareSummary(baby, correctedAge, stage, latestLogs, weightPct, heightPct) {
  const name = baby.name;
  const age  = Math.round(correctedAge);
  const parts = [];

  // Opening line with age + stage
  parts.push(`${name} is ${age < 1 ? 'a newborn' : `${age} month${age !== 1 ? 's' : ''} old`} and currently in the ${stage.label} stage.`);

  // Weight assessment
  if (latestLogs.weight && weightPct) {
    const w = latestLogs.weight.value;
    if (weightPct.status === 'normal') {
      parts.push(`Weight is ${w}kg — ${weightPct.label} per WHO standards, which is a healthy range.`);
    } else if (weightPct.status === 'watch') {
      parts.push(`Weight is ${w}kg — ${weightPct.label} per WHO standards. Keep monitoring and discuss with your pediatrician.`);
    } else {
      parts.push(`Weight is ${w}kg — ${weightPct.label} per WHO standards. Please consult your pediatrician soon.`);
    }
  } else if (latestLogs.weight) {
    parts.push(`Latest weight recorded: ${latestLogs.weight.value}kg.`);
  }

  // Height assessment
  if (latestLogs.height && heightPct) {
    parts.push(`Height is ${latestLogs.height.value}cm — ${heightPct.label}.`);
  } else if (latestLogs.height) {
    parts.push(`Latest height recorded: ${latestLogs.height.value}cm.`);
  }

  // Extra metrics
  if (latestLogs.head)    parts.push(`Head circumference: ${latestLogs.head.value}cm.`);
  if (latestLogs.sleep)   parts.push(`Averaging ${latestLogs.sleep.value} hours of sleep per day.`);
  if (latestLogs.feeding) parts.push(`Latest feeding: ${latestLogs.feeding.value}ml.`);

  // Stage-based development tip
  parts.push(stage.aiTip);

  // Always end with disclaimer
  parts.push('Always consult your pediatrician for personalized advice.');

  return parts.join(' ');
}

// ── POST /api/ai/growth-summary ──
router.post('/growth-summary', authMiddleware, async (req, res) => {
  try {
    const baby = await prisma.baby.findFirst({ where: { user_id: req.user.id } });
    if (!baby) return res.status(404).json({ error: 'No baby profile found' });

    const today        = getTodayString();
    const forceRefresh = req.body?.force === true;

    // Check cache (unless force refresh)
    if (!forceRefresh) {
      const cached = await prisma.growthSummary.findFirst({
        where: { baby_id: baby.id, date: today },
      });
      if (cached) return res.json({ summary: cached.content, cached: true });
    }

    // Fetch latest of each measurement type
    const types = ['weight', 'height', 'head', 'sleep', 'feeding'];
    const latestLogs = {};
    for (const type of types) {
      const log = await prisma.growthLog.findFirst({
        where:   { baby_id: baby.id, type },
        orderBy: { logged_at: 'desc' },
      });
      if (log) latestLogs[type] = log;
    }

    const ageMonths    = getAgeMonths(baby.birthdate);
    const correctedAge = getCorrectedAge(ageMonths, baby.baby_type, baby.weeks_premature);
    const stage        = getStage(correctedAge);
    const genderKey    = baby.gender === 'female' ? 'girls' : 'boys';

    // Compute percentiles
    const weightPct = latestLogs.weight
      ? calcPercentile(Math.round(correctedAge), latestLogs.weight.value, 'weight', genderKey)
      : null;
    const heightPct = latestLogs.height
      ? calcPercentile(Math.round(correctedAge), latestLogs.height.value, 'height', genderKey)
      : null;

    const hasData = Object.keys(latestLogs).length > 0;

    // No measurements logged yet
    if (!hasData) {
      const summary = `${baby.name} is in the ${stage.label} stage. Start logging measurements to receive personalized insights based on WHO growth standards. Always consult your pediatrician for personalized advice.`;
      return res.json({ summary, cached: false, fallback: true });
    }

    // Try Claude if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const babyTypeLabel = baby.baby_type === 'premature'
          ? `premature (${baby.weeks_premature}wks early, corrected age ${Math.round(correctedAge)}mo)`
          : baby.baby_type;

        const measurementLines = [];
        if (latestLogs.weight) measurementLines.push(`- Weight: ${latestLogs.weight.value}kg — ${weightPct ? weightPct.label : 'no percentile data'}`);
        if (latestLogs.height) measurementLines.push(`- Height: ${latestLogs.height.value}cm — ${heightPct ? heightPct.label : 'no percentile data'}`);
        if (latestLogs.head)    measurementLines.push(`- Head circumference: ${latestLogs.head.value}cm`);
        if (latestLogs.sleep)   measurementLines.push(`- Sleep: ${latestLogs.sleep.value}hrs/day`);
        if (latestLogs.feeding) measurementLines.push(`- Feeding: ${latestLogs.feeding.value}ml`);

        const systemPrompt = `You are a warm pediatric health assistant writing for parents.
Baby: ${baby.name}, ${Math.round(correctedAge)}mo (${babyTypeLabel}). Stage: ${stage.label}.
Latest measurements:
${measurementLines.join('\n')}

Write a short, warm educational growth summary (3–5 sentences):
- Comment on what's going well based on WHO standards
- Note any measurements to monitor (gently, not alarmist)
- Give 1 age-appropriate development tip
- End with: "Always consult your pediatrician for personalized advice."
Do not diagnose. Max 150 words.`;

        const summary = await callClaude(
          [{ role: 'user', content: 'Please write a growth summary for this baby.' }],
          systemPrompt,
          300
        );

        await prisma.growthSummary.upsert({
          where:  { baby_id_date: { baby_id: baby.id, date: today } },
          update: { content: summary },
          create: { baby_id: baby.id, date: today, content: summary },
        });

        return res.json({
          summary,
          cached:       false,
          generated_at: new Date().toISOString(),
          percentiles:  { weight: weightPct, height: heightPct },
        });
      } catch (claudeErr) {
        console.warn('Claude API failed, using data-aware fallback:', claudeErr.message);
        // Fall through to data-aware summary below
      }
    }

    // Data-aware fallback — always reflects the latest logged measurements
    const summary = buildDataAwareSummary(baby, correctedAge, stage, latestLogs, weightPct, heightPct);

    await prisma.growthSummary.upsert({
      where:  { baby_id_date: { baby_id: baby.id, date: today } },
      update: { content: summary },
      create: { baby_id: baby.id, date: today, content: summary },
    });

    return res.json({
      summary,
      cached:      false,
      fallback:    true,
      percentiles: { weight: weightPct, height: heightPct },
    });

  } catch (err) {
    console.error('Growth summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/chat ──
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { question, history = [] } = req.body;
    if (!question) return res.status(400).json({ error: 'question is required' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // Build system prompt
    let systemPrompt;
    const isPremium = user?.is_premium;

    if (isPremium) {
      const baby = await prisma.baby.findFirst({ where: { user_id: req.user.id } });
      if (baby) {
        const ageMonths    = getAgeMonths(baby.birthdate);
        const correctedAge = getCorrectedAge(ageMonths, baby.baby_type, baby.weeks_premature);
        const stage        = getStage(correctedAge);

        const weightLog = await prisma.growthLog.findFirst({
          where:   { baby_id: baby.id, type: 'weight' },
          orderBy: { logged_at: 'desc' },
        });
        let weightCtx = '';
        if (weightLog) {
          const genderKey = baby.gender === 'male' ? 'boys' : 'girls';
          const pct = calcPercentile(Math.round(correctedAge), weightLog.value, 'weight', genderKey);
          weightCtx = `, latest weight: ${weightLog.value}kg (${pct.label})`;
        }

        systemPrompt = `You are a knowledgeable, warm pediatric health assistant with full context about this specific baby.
Baby profile: ${baby.name}, ${Math.round(correctedAge)} months old (${baby.baby_type}), ${baby.gender || 'unknown gender'}${weightCtx}, stage: ${stage.label}.
Provide personalized educational guidance based on this baby's specific age and profile. Reference WHO/CDC guidelines.
Do not provide medical diagnoses. End each response with a brief note to consult their pediatrician for medical concerns.`;
      } else {
        systemPrompt = `You are a warm pediatric health assistant. Provide personalized educational guidance based on WHO/CDC guidelines. Do not diagnose.`;
      }
    } else {
      systemPrompt = `You are a pediatric health assistant. Provide general educational information based on WHO/CDC guidelines. Do not diagnose or prescribe. End each response with: "Consult your pediatrician for personalized advice."`;
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json({
        answer: "I'm here to help with parenting questions! For the best personalized advice, please consult your pediatrician. General guidance: follow WHO recommendations for your baby's age stage.",
        source_note: 'Educational reference: WHO Growth Standards / CDC Guidelines',
        is_premium_response: isPremium,
      });
    }

    // Build message history (max 5 prior turns)
    const recentHistory = history.slice(-10); // last 5 pairs
    const messages = [
      ...recentHistory.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: question },
    ];

    const answer = await callClaude(messages, systemPrompt, 400);

    res.json({
      answer,
      source_note: 'Educational reference: WHO Growth Standards / CDC Guidelines',
      is_premium_response: isPremium,
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
