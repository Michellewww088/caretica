/**
 * GET /api/who/percentile
 * Query: age_months, weight?, height?, gender
 * Returns local WHO percentile result — NO AI cost.
 */
const express = require('express');
const router  = express.Router();
const { calcPercentile, buildAIPromptData, buildAISummaryPrompt } = require('../who-percentile');

router.get('/percentile', (req, res) => {
  const { age_months, weight, height, gender = 'girls' } = req.query;
  if (!age_months) return res.status(400).json({ error: 'age_months required' });

  const age = parseInt(age_months);
  const result = {};

  if (weight) result.weight = calcPercentile(age, parseFloat(weight), 'weight', gender);
  if (height) result.height = calcPercentile(age, parseFloat(height), 'height', gender);

  const promptData = buildAIPromptData({
    ageMonths: age, gender,
    weight:    weight ? parseFloat(weight) : null,
    height:    height ? parseFloat(height) : null,
    weightPct: result.weight,
    heightPct: result.height,
  });

  res.json({
    age_months: age,
    gender,
    percentiles: result,
    ai_prompt: buildAISummaryPrompt(promptData), // Frontend can send this to AI if needed
  });
});

module.exports = router;
