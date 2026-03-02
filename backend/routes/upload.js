/**
 * Caretica — Upload Route
 * POST /api/upload — receive file, run OCR, AI-structure, save to DB
 *
 * Integrations:
 *   OCR  → Google Vision API  (set GOOGLE_APPLICATION_CREDENTIALS)
 *   AI   → Anthropic Claude   (set ANTHROPIC_API_KEY)
 *   Both are optional — a mock response is returned if keys not set.
 */
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const { stmts } = require('../database');
const { calcPercentile, buildAIPromptData, buildAISummaryPrompt, getVaccineFollowups } = require('../who-percentile');

// ── UPLOAD STORAGE ──
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `record_${Date.now()}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only JPG, PNG, and PDF files are allowed.'));
  },
});

// ── AI SUMMARY (Claude API — only for text, not calculations) ──
async function generateAISummary(prompt) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return "Emma's measurements are tracking well within healthy ranges based on WHO growth standards. Growth is progressing consistently. Continue current feeding and sleep routines. Always consult your pediatrician for personalized medical advice.";
  }
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic.default();
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', // Use Haiku — cheap for summaries
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });
    return msg.content[0].text;
  } catch (err) {
    console.error('AI summary error:', err.message);
    return null;
  }
}

// ── OCR (Google Vision API) ──
async function runOCR(filePath) {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Mock OCR output for demo
    return `Checkup Report
Patient: Emma Martinez  DOB: July 2, 2025
Date: March 2, 2026
Doctor: Dr. Amara Johnson
Weight: 7.5 kg   Height: 68 cm
Vaccine: DTaP Booster — Administered January 15, 2026
Next Visit: April 5, 2026 — 9-Month Checkup
Notes: Growth is on track. Continue Vitamin D supplementation.`;
  }

  const vision = require('@google-cloud/vision');
  const client = new vision.ImageAnnotatorClient();
  const [result] = await client.textDetection(filePath);
  return result.fullTextAnnotation?.text || '';
}

// ── AI STRUCTURING (Anthropic Claude) ──
async function structureWithAI(ocrText) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Mock structured JSON for demo
    return {
      vaccine_name:  'DTaP Booster',
      date:          '2026-01-15',
      weight:        7.5,
      height:        68,
      doctor_notes:  'Growth is on track. Continue Vitamin D supplementation.',
      next_visit:    'April 5, 2026 — 9-Month Checkup',
      ai_summary:    "Emma's checkup shows healthy growth at 7.5 kg and 68 cm, tracking well within WHO normal ranges. DTaP booster was successfully administered. The next 9-month visit is scheduled for April 5, 2026. Continue daily Vitamin D supplementation as recommended. This information is for educational purposes only — not medical advice.",
    };
  }

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic.default();

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a pediatric health assistant.

Extract structured data from this medical record text and return ONLY valid JSON:

${ocrText}

Return JSON with these fields (use null if not found):
{
  "vaccine_name": string or null,
  "date": "YYYY-MM-DD" or null,
  "weight": number (kg) or null,
  "height": number (cm) or null,
  "doctor_notes": string or null,
  "next_visit": string or null,
  "ai_summary": "A 2-3 sentence educational summary for parents. End with: This information is for educational purposes only and does not replace professional medical advice."
}`,
    }],
  });

  const text = message.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI did not return valid JSON');
  return JSON.parse(jsonMatch[0]);
}

// ── POST /api/upload ──
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filePath = req.file.path;
  const babyId   = req.body.baby_id || 'emma';

  try {
    // Step 2: OCR
    console.log('🔍 Running OCR on:', req.file.filename);
    const ocrText = await runOCR(filePath);

    // Step 3: AI structuring
    console.log('🤖 Sending to AI for structuring...');
    const structured = await structureWithAI(ocrText);

    // Step 4: WHO percentile calculation (local — no AI cost)
    let weightPct = null, heightPct = null;
    const ageMonths = parseInt(req.body.age_months) || 8;
    const gender    = req.body.gender || 'girls';
    if (structured.weight) weightPct = calcPercentile(ageMonths, structured.weight, 'weight', gender);
    if (structured.height) heightPct = calcPercentile(ageMonths, structured.height, 'height', gender);

    // Step 5: AI summary (only for text — percentiles already done locally)
    if (!structured.ai_summary && (structured.weight || structured.height)) {
      const promptData = buildAIPromptData({
        ageMonths, gender,
        weight:         structured.weight,
        height:         structured.height,
        weightPct, heightPct,
      });
      const prompt = buildAISummaryPrompt(promptData);
      structured.ai_summary = await generateAISummary(prompt);
    }

    // Step 6: Save to DB
    const info = stmts.addRecord.run({
      baby_id:      babyId,
      record_type:  req.body.record_type || 'checkup',
      vaccine_name: structured.vaccine_name  || null,
      date:         structured.date          || null,
      weight:       structured.weight        || null,
      height:       structured.height        || null,
      doctor_notes: structured.doctor_notes  || null,
      ai_summary:   structured.ai_summary    || null,
      file_path:    req.file.filename,
    });

    // Step 7: Auto vaccine follow-up reminders
    const autoReminders = [];
    if (structured.vaccine_name) {
      const followups = getVaccineFollowups(structured.vaccine_name, structured.date);
      for (const fu of followups) {
        stmts.createReminder.run({
          user_id: 'user1', baby_id: babyId,
          type: 'vaccine',
          title: fu.name,
          datetime: `${fu.date} 09:00:00`,
          repeat_frequency: 'once',
          notification_method: 'in-app,email',
          notes: `Auto-scheduled based on ${structured.vaccine_name} administered on ${structured.date}`,
        });
        autoReminders.push(fu.name);
      }
    }

    // Step 8: Checkup next visit reminder
    if (structured.next_visit) {
      stmts.createReminder.run({
        user_id: 'user1', baby_id: babyId,
        type: 'checkup', title: `Follow-up: ${structured.next_visit}`,
        datetime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        repeat_frequency: 'once',
        notification_method: 'in-app,email',
        notes: `Auto-generated from uploaded medical record.`,
      });
    }

    console.log(`✅ Record saved (id: ${info.lastInsertRowid}) | Auto reminders: ${autoReminders.length}`);
    res.json({
      success:          true,
      record_id:        info.lastInsertRowid,
      extracted:        structured,
      percentiles:      { weight: weightPct, height: heightPct },
      auto_reminders:   autoReminders,
      ocr_text_preview: ocrText.slice(0, 300),
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/records — list all medical records
router.get('/records', (req, res) => {
  const babyId = req.query.baby_id || 'emma';
  const records = stmts.getRecords.all(babyId);
  res.json(records);
});

module.exports = router;
