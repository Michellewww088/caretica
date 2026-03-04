/**
 * Caretica — AI Growth Risk Report
 * POST /api/report/generate   — full structured medical-style report with risk flags
 * GET  /api/report/latest     — latest cached report for the user's baby
 */
const express = require('express')
const router  = express.Router()
const Anthropic = require('@anthropic-ai/sdk')
const prisma  = require('../lib/prisma')
const { authMiddleware } = require('../middleware/auth')
const { calcPercentile } = require('../who-percentile')
const { aiLimiter } = require('../middleware/security')

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── RISK FLAG LOGIC ─────────────────────────────────────────────────────────
function assessRisk(percentile, type) {
  if (percentile == null) return null
  if (percentile < 3)  return { level: 'HIGH',    label: 'Below 3rd percentile — refer to pediatrician' }
  if (percentile < 15) return { level: 'MODERATE', label: 'Below 15th percentile — monitor closely' }
  if (percentile > 97) return { level: 'HIGH',    label: 'Above 97th percentile — refer to pediatrician' }
  if (percentile > 85) return { level: 'MODERATE', label: 'Above 85th percentile — monitor closely' }
  return { level: 'NORMAL', label: 'Within normal WHO range' }
}

function detectTrend(logs, type) {
  const sorted = logs
    .filter(l => l.type === type)
    .sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at))
  if (sorted.length < 2) return null
  const last = sorted[sorted.length - 1].value
  const prev = sorted[sorted.length - 2].value
  const change = ((last - prev) / prev * 100).toFixed(1)
  return { from: prev, to: last, changePct: parseFloat(change) }
}

// ── GENERATE REPORT ─────────────────────────────────────────────────────────
router.post('/generate', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const baby = await prisma.baby.findFirst({ where: { user_id: req.user.id } })
    if (!baby) return res.status(404).json({ error: 'No baby profile found' })

    const logs = await prisma.growthLog.findMany({
      where:   { baby_id: baby.id },
      orderBy: { logged_at: 'desc' },
    })
    if (logs.length === 0) return res.status(400).json({ error: 'No growth data available for report' })

    // Age calculation with premature correction
    const now = new Date()
    const birth = new Date(baby.birthdate)
    let ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
    if (baby.baby_type === 'premature' && baby.weeks_premature > 0) {
      ageMonths = Math.max(0, ageMonths - Math.round(baby.weeks_premature / 4.33))
    }

    const gender = baby.gender === 'male' || baby.gender === 'boy' ? 'boys' : 'girls'

    // Latest values
    const latest = (type) => logs.find(l => l.type === type)

    const latestWeight = latest('weight')
    const latestHeight = latest('height')
    const latestHead   = latest('head')
    const latestSleep  = latest('sleep')
    const latestFeed   = latest('feeding')

    // Percentiles
    const weightPct = latestWeight ? calcPercentile(ageMonths, latestWeight.value, 'weight', gender) : null
    const heightPct = latestHeight ? calcPercentile(ageMonths, latestHeight.value, 'height', gender) : null

    // Risk flags
    const riskFlags = []
    const weightRisk = assessRisk(weightPct?.percentile, 'weight')
    const heightRisk = assessRisk(heightPct?.percentile, 'height')

    if (weightRisk && weightRisk.level !== 'NORMAL') {
      riskFlags.push({ metric: 'Weight', ...weightRisk })
    }
    if (heightRisk && heightRisk.level !== 'NORMAL') {
      riskFlags.push({ metric: 'Height', ...heightRisk })
    }

    // Trend detection
    const weightTrend = detectTrend(logs, 'weight')
    const heightTrend = detectTrend(logs, 'height')

    if (weightTrend && Math.abs(weightTrend.changePct) > 15) {
      riskFlags.push({
        metric: 'Weight Change',
        level: 'MODERATE',
        label: `Rapid ${weightTrend.changePct > 0 ? 'gain' : 'loss'} of ${Math.abs(weightTrend.changePct)}% detected`,
      })
    }

    if (latestSleep && latestSleep.value < 10) {
      riskFlags.push({ metric: 'Sleep', level: 'MODERATE', label: `Sleep ${latestSleep.value}hrs — below recommended minimum` })
    }

    // Build AI prompt
    const prompt = `
You are a senior pediatric consultant generating a structured medical growth report.

PATIENT:
- Name: ${baby.name}
- Age: ${ageMonths} months${baby.baby_type === 'premature' ? ` (corrected, born ${baby.weeks_premature} weeks early)` : ''}
- Gender: ${baby.gender || 'unknown'}
- Blood type: ${baby.blood_type || 'unknown'}

LATEST MEASUREMENTS:
- Weight: ${latestWeight ? `${latestWeight.value} kg (${weightPct?.label || 'percentile unknown'})` : 'not recorded'}
- Height: ${latestHeight ? `${latestHeight.value} cm (${heightPct?.label || 'percentile unknown'})` : 'not recorded'}
- Head circ: ${latestHead ? `${latestHead.value} cm` : 'not recorded'}
- Sleep: ${latestSleep ? `${latestSleep.value} hrs/day` : 'not recorded'}
- Feeding: ${latestFeed ? `${latestFeed.value} ml` : 'not recorded'}

WEIGHT TREND: ${weightTrend ? `${weightTrend.from}kg → ${weightTrend.to}kg (${weightTrend.changePct > 0 ? '+' : ''}${weightTrend.changePct}%)` : 'insufficient data'}
HEIGHT TREND: ${heightTrend ? `${heightTrend.from}cm → ${heightTrend.to}cm (${heightTrend.changePct > 0 ? '+' : ''}${heightTrend.changePct}%)` : 'insufficient data'}

RISK FLAGS: ${riskFlags.length > 0 ? riskFlags.map(f => `${f.metric}: ${f.level} — ${f.label}`).join('; ') : 'None'}

Generate a concise structured pediatric growth report with these sections:
1. Summary (2 sentences)
2. Growth Assessment (weight, height, head status vs WHO standards)
3. Developmental Stage (what to expect at ${ageMonths} months)
4. Risk Observations (reference the flags above, or state "No concerns identified")
5. Recommendations (3 bullet points: diet, activity, next checkup timing)
6. Disclaimer

Write in professional medical style. Keep each section 1-3 sentences. Total max 300 words.
    `.trim()

    let reportText = null
    if (process.env.ANTHROPIC_API_KEY) {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      })
      reportText = msg.content[0]?.text || null
    } else {
      // Demo fallback
      reportText = `GROWTH REPORT — ${baby.name} (${ageMonths} months)\n\n` +
        `Summary: ${baby.name} is ${ageMonths} months old with ${logs.length} recorded measurements. ` +
        `${riskFlags.length > 0 ? `${riskFlags.length} observation(s) flagged for attention.` : 'No concerns identified at this time.'}\n\n` +
        `Growth Assessment: Weight ${latestWeight ? `${latestWeight.value}kg` : 'not recorded'}, ` +
        `Height ${latestHeight ? `${latestHeight.value}cm` : 'not recorded'}.\n\n` +
        `Risk Observations: ${riskFlags.length > 0 ? riskFlags.map(f => `${f.metric} — ${f.label}`).join('. ') : 'No concerns identified.'}\n\n` +
        `Recommendations: • Maintain regular checkup schedule • Track measurements monthly • Consult pediatrician if any concern arises.\n\n` +
        `Disclaimer: This report is for informational purposes only and does not constitute medical advice.`
    }

    const report = {
      generated_at: new Date().toISOString(),
      baby: {
        name:         baby.name,
        age_months:   ageMonths,
        gender:       baby.gender,
        blood_type:   baby.blood_type,
        baby_type:    baby.baby_type,
      },
      measurements: {
        weight: latestWeight ? { value: latestWeight.value, unit: 'kg', percentile: weightPct?.percentile, label: weightPct?.label } : null,
        height: latestHeight ? { value: latestHeight.value, unit: 'cm', percentile: heightPct?.percentile, label: heightPct?.label } : null,
        head:   latestHead   ? { value: latestHead.value,   unit: 'cm' } : null,
        sleep:  latestSleep  ? { value: latestSleep.value,  unit: 'hrs' } : null,
        feeding: latestFeed  ? { value: latestFeed.value,   unit: 'ml' } : null,
      },
      trends: { weight: weightTrend, height: heightTrend },
      risk_flags:  riskFlags,
      overall_risk: riskFlags.some(f => f.level === 'HIGH') ? 'HIGH'
                  : riskFlags.some(f => f.level === 'MODERATE') ? 'MODERATE'
                  : 'NORMAL',
      report: reportText,
    }

    res.json(report)
  } catch (err) {
    console.error('Report generation error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ── LATEST REPORT (re-generate on demand — no caching for reports) ───────────
router.get('/latest', authMiddleware, async (req, res) => {
  // Redirect to generate since reports should be fresh
  res.json({ message: 'POST /api/report/generate to create a new report' })
})

module.exports = router
