/**
 * Caretica — WHO Growth Standards (Local Percentile Calculator)
 * Uses WHO Child Growth Standards data embedded locally.
 * NO AI cost for percentile calculation.
 * Data covers ages 0–24 months for weight (kg) and height (cm).
 */

// ── WHO WEIGHT DATA (kg) ──
const WHO_WEIGHT = {
  girls: {
     0: { p3:2.4,  p15:2.8,  p50:3.2,  p85:3.7,  p97:4.2  },
     1: { p3:3.2,  p15:3.6,  p50:4.2,  p85:4.8,  p97:5.5  },
     2: { p3:3.9,  p15:4.5,  p50:5.1,  p85:5.8,  p97:6.6  },
     3: { p3:4.5,  p15:5.2,  p50:5.8,  p85:6.6,  p97:7.5  },
     4: { p3:5.0,  p15:5.7,  p50:6.4,  p85:7.3,  p97:8.2  },
     5: { p3:5.4,  p15:6.1,  p50:6.9,  p85:7.8,  p97:8.8  },
     6: { p3:5.7,  p15:6.5,  p50:7.3,  p85:8.2,  p97:9.3  },
     7: { p3:6.0,  p15:6.8,  p50:7.6,  p85:8.6,  p97:9.8  },
     8: { p3:6.3,  p15:7.0,  p50:7.9,  p85:9.0,  p97:10.2 },
     9: { p3:6.5,  p15:7.3,  p50:8.2,  p85:9.3,  p97:10.5 },
    10: { p3:6.7,  p15:7.5,  p50:8.5,  p85:9.6,  p97:10.9 },
    11: { p3:6.9,  p15:7.7,  p50:8.7,  p85:9.9,  p97:11.2 },
    12: { p3:7.0,  p15:7.9,  p50:8.9,  p85:10.1, p97:11.5 },
    13: { p3:7.2,  p15:8.1,  p50:9.2,  p85:10.4, p97:11.8 },
    14: { p3:7.4,  p15:8.3,  p50:9.4,  p85:10.7, p97:12.1 },
    15: { p3:7.6,  p15:8.5,  p50:9.6,  p85:10.9, p97:12.4 },
    16: { p3:7.7,  p15:8.7,  p50:9.8,  p85:11.2, p97:12.6 },
    17: { p3:7.9,  p15:8.9,  p50:10.0, p85:11.4, p97:12.9 },
    18: { p3:8.1,  p15:9.1,  p50:10.2, p85:11.6, p97:13.2 },
    19: { p3:8.2,  p15:9.2,  p50:10.4, p85:11.8, p97:13.5 },
    20: { p3:8.4,  p15:9.4,  p50:10.6, p85:12.1, p97:13.7 },
    21: { p3:8.6,  p15:9.6,  p50:10.9, p85:12.3, p97:14.0 },
    22: { p3:8.7,  p15:9.8,  p50:11.1, p85:12.5, p97:14.3 },
    23: { p3:8.9,  p15:10.0, p50:11.3, p85:12.8, p97:14.6 },
    24: { p3:9.0,  p15:10.2, p50:11.5, p85:13.0, p97:14.8 },
  },
  boys: {
     0: { p3:2.5,  p15:2.9,  p50:3.3,  p85:3.9,  p97:4.4  },
     1: { p3:3.4,  p15:3.9,  p50:4.5,  p85:5.1,  p97:5.8  },
     2: { p3:4.3,  p15:4.9,  p50:5.6,  p85:6.3,  p97:7.1  },
     3: { p3:5.0,  p15:5.7,  p50:6.4,  p85:7.2,  p97:8.0  },
     4: { p3:5.6,  p15:6.2,  p50:7.0,  p85:7.9,  p97:8.7  },
     5: { p3:6.0,  p15:6.7,  p50:7.5,  p85:8.4,  p97:9.3  },
     6: { p3:6.4,  p15:7.1,  p50:7.9,  p85:8.9,  p97:9.8  },
     7: { p3:6.7,  p15:7.4,  p50:8.3,  p85:9.4,  p97:10.3 },
     8: { p3:6.9,  p15:7.7,  p50:8.6,  p85:9.7,  p97:10.7 },
     9: { p3:7.1,  p15:7.9,  p50:8.9,  p85:10.0, p97:11.0 },
    10: { p3:7.4,  p15:8.2,  p50:9.2,  p85:10.4, p97:11.4 },
    11: { p3:7.6,  p15:8.4,  p50:9.4,  p85:10.6, p97:11.7 },
    12: { p3:7.7,  p15:8.6,  p50:9.6,  p85:10.9, p97:12.0 },
    13: { p3:7.9,  p15:8.8,  p50:9.9,  p85:11.2, p97:12.3 },
    14: { p3:8.1,  p15:9.0,  p50:10.1, p85:11.4, p97:12.6 },
    15: { p3:8.3,  p15:9.2,  p50:10.3, p85:11.7, p97:12.8 },
    16: { p3:8.4,  p15:9.4,  p50:10.5, p85:11.9, p97:13.1 },
    17: { p3:8.6,  p15:9.6,  p50:10.7, p85:12.2, p97:13.4 },
    18: { p3:8.8,  p15:9.8,  p50:10.9, p85:12.4, p97:13.7 },
    19: { p3:8.9,  p15:10.0, p50:11.1, p85:12.6, p97:13.9 },
    20: { p3:9.1,  p15:10.1, p50:11.3, p85:12.9, p97:14.2 },
    21: { p3:9.2,  p15:10.3, p50:11.5, p85:13.1, p97:14.5 },
    22: { p3:9.4,  p15:10.5, p50:11.8, p85:13.3, p97:14.7 },
    23: { p3:9.5,  p15:10.7, p50:12.0, p85:13.6, p97:15.0 },
    24: { p3:9.7,  p15:10.8, p50:12.2, p85:13.8, p97:15.3 },
  },
};

// ── WHO HEIGHT DATA (cm) ──
const WHO_HEIGHT = {
  girls: {
     0: { p3:45.6, p15:47.3, p50:49.1, p85:51.0, p97:52.7 },
     1: { p3:50.6, p15:52.4, p50:54.2, p85:56.1, p97:57.9 },
     2: { p3:53.8, p15:55.8, p50:57.6, p85:59.6, p97:61.4 },
     3: { p3:56.7, p15:58.7, p50:60.9, p85:63.0, p97:64.8 },
     4: { p3:59.2, p15:61.4, p50:63.7, p85:66.0, p97:67.9 },
     5: { p3:61.5, p15:63.8, p50:65.8, p85:68.2, p97:70.1 },
     6: { p3:63.5, p15:65.8, p50:67.6, p85:70.0, p97:72.0 },
     7: { p3:65.2, p15:67.5, p50:69.2, p85:71.5, p97:73.5 },
     8: { p3:66.8, p15:69.0, p50:70.8, p85:73.2, p97:75.2 },
     9: { p3:68.2, p15:70.4, p50:72.3, p85:74.7, p97:76.8 },
    10: { p3:69.5, p15:71.7, p50:73.7, p85:76.2, p97:78.2 },
    11: { p3:70.8, p15:73.0, p50:75.1, p85:77.6, p97:79.7 },
    12: { p3:72.1, p15:74.4, p50:76.6, p85:79.0, p97:81.2 },
    13: { p3:73.3, p15:75.7, p50:78.1, p85:80.5, p97:82.7 },
    14: { p3:74.5, p15:77.0, p50:79.5, p85:82.0, p97:84.2 },
    15: { p3:75.7, p15:78.3, p50:80.7, p85:83.4, p97:85.7 },
    16: { p3:77.0, p15:79.6, p50:82.1, p85:84.8, p97:87.1 },
    17: { p3:78.2, p15:80.8, p50:83.4, p85:86.2, p97:88.5 },
    18: { p3:79.4, p15:82.1, p50:84.7, p85:87.5, p97:89.8 },
    19: { p3:80.5, p15:83.2, p50:85.8, p85:88.6, p97:91.0 },
    20: { p3:81.6, p15:84.3, p50:86.9, p85:89.7, p97:92.1 },
    21: { p3:82.6, p15:85.3, p50:87.9, p85:90.7, p97:93.1 },
    22: { p3:83.5, p15:86.2, p50:88.9, p85:91.7, p97:94.1 },
    23: { p3:84.4, p15:87.1, p50:89.9, p85:92.7, p97:95.1 },
    24: { p3:85.3, p15:88.0, p50:91.0, p85:93.8, p97:96.1 },
  },
  boys: {
     0: { p3:46.1, p15:47.8, p50:49.9, p85:51.8, p97:53.4 },
     1: { p3:51.1, p15:52.9, p50:54.7, p85:56.6, p97:58.2 },
     2: { p3:54.4, p15:56.2, p50:58.4, p85:60.3, p97:62.0 },
     3: { p3:57.3, p15:59.2, p50:61.4, p85:63.5, p97:65.2 },
     4: { p3:59.9, p15:62.0, p50:64.2, p85:66.4, p97:68.1 },
     5: { p3:62.2, p15:64.3, p50:66.6, p85:69.0, p97:70.9 },
     6: { p3:64.1, p15:66.3, p50:67.8, p85:70.4, p97:72.3 },
     7: { p3:65.9, p15:68.1, p50:70.1, p85:72.6, p97:74.5 },
     8: { p3:67.5, p15:69.7, p50:72.0, p85:74.4, p97:76.3 },
     9: { p3:69.0, p15:71.2, p50:73.5, p85:76.0, p97:77.9 },
    10: { p3:70.5, p15:72.7, p50:75.0, p85:77.5, p97:79.4 },
    11: { p3:71.8, p15:74.1, p50:76.4, p85:78.9, p97:80.8 },
    12: { p3:73.1, p15:75.4, p50:77.8, p85:80.3, p97:82.3 },
    13: { p3:74.4, p15:76.8, p50:79.2, p85:81.7, p97:83.8 },
    14: { p3:75.7, p15:78.1, p50:80.6, p85:83.2, p97:85.3 },
    15: { p3:77.0, p15:79.5, p50:82.0, p85:84.6, p97:86.7 },
    16: { p3:78.3, p15:80.8, p50:83.4, p85:86.0, p97:88.2 },
    17: { p3:79.5, p15:82.1, p50:84.7, p85:87.3, p97:89.6 },
    18: { p3:80.7, p15:83.3, p50:86.0, p85:88.7, p97:91.0 },
    19: { p3:81.9, p15:84.5, p50:87.2, p85:90.0, p97:92.3 },
    20: { p3:83.0, p15:85.7, p50:88.5, p85:91.2, p97:93.6 },
    21: { p3:84.1, p15:86.8, p50:89.6, p85:92.4, p97:94.8 },
    22: { p3:85.1, p15:87.9, p50:90.7, p85:93.5, p97:95.9 },
    23: { p3:86.1, p15:88.9, p50:91.9, p85:94.7, p97:97.1 },
    24: { p3:87.1, p15:90.0, p50:93.0, p85:96.0, p97:98.4 },
  },
};

// ── PERCENTILE LABEL ──
function getPercentileLabel(value, row) {
  if (value < row.p3)  return { label: 'Below 3rd percentile',   status: 'low',    color: '#EF4444' };
  if (value < row.p15) return { label: '3rd–15th percentile',    status: 'watch',  color: '#F59E0B' };
  if (value < row.p50) return { label: '15th–50th percentile',   status: 'normal', color: '#10B981' };
  if (value < row.p85) return { label: '50th–85th percentile',   status: 'normal', color: '#10B981' };
  if (value < row.p97) return { label: '85th–97th percentile',   status: 'watch',  color: '#F59E0B' };
  return                      { label: 'Above 97th percentile',  status: 'high',   color: '#EF4444' };
}

/**
 * Calculate WHO percentile for weight or height.
 * @param {number} ageMonths  - Baby age in months (0–24)
 * @param {number} value      - Measurement value
 * @param {'weight'|'height'} type
 * @param {'girls'|'boys'}    gender
 * @returns {{ label, status, color, p3, p50, p97 }}
 */
function calcPercentile(ageMonths, value, type, gender = 'girls') {
  const age  = Math.round(Math.min(ageMonths, 24));
  const table = type === 'weight' ? WHO_WEIGHT : WHO_HEIGHT;
  const genderKey = gender === 'male' || gender === 'boys' ? 'boys' : 'girls';
  const row = table[genderKey][age];
  if (!row) return { label: 'Data unavailable', status: 'unknown', color: '#94A3B8', p3: null, p50: null, p97: null };
  return { ...getPercentileLabel(value, row), p3: row.p3, p15: row.p15, p50: row.p50, p85: row.p85, p97: row.p97 };
}

/**
 * Build a structured data object for AI summary prompt.
 * This is what gets passed to the AI — percentiles are already calculated locally.
 */
function buildAIPromptData({ ageMonths, weight, height, gender, weightPct, heightPct, sleepHrs, feedingsPerDay }) {
  return {
    age: `${ageMonths} months`,
    weight: weight ? `${weight} kg (${weightPct?.label || 'N/A'})` : null,
    height: height ? `${height} cm (${heightPct?.label || 'N/A'})` : null,
    sleep_avg: sleepHrs ? `${sleepHrs} hours/day` : null,
    feedings_per_day: feedingsPerDay || null,
    weight_status: weightPct?.status || 'unknown',
    height_status: heightPct?.status || 'unknown',
  };
}

/**
 * Build the AI prompt for summary generation.
 * AI is only responsible for the educational text — no heavy computation.
 */
function buildAISummaryPrompt(data) {
  return `You are a pediatric health assistant writing for parents.

Baby Data:
- Age: ${data.age}
- Weight: ${data.weight || 'Not recorded'}
- Height: ${data.height || 'Not recorded'}
- Average sleep: ${data.sleep_avg || 'Not recorded'}
- Feedings per day: ${data.feedings_per_day || 'Not recorded'}

Write a short, reassuring educational summary for parents. Rules:
- Maximum 120 words
- Highlight what is going well
- Gently mention anything to monitor (if status is "watch" or "low"/"high")
- Use warm, supportive tone — not clinical
- End with: "Always consult your pediatrician for personalized medical advice."
- Do NOT give diagnosis or prescribe treatment`;
}

// ── VACCINE AUTO-REMINDER LOGIC ──
const VACCINE_FOLLOWUPS = {
  'birth':     [{ name: 'HepB 2nd dose',          months: 2 }, { name: 'BCG (if not at birth)', months: 0 }],
  '2month':    [{ name: 'DTaP 2nd dose',           months: 2 }, { name: 'IPV 2nd dose', months: 2 }, { name: 'Hib 2nd dose', months: 2 }],
  '4month':    [{ name: 'DTaP 3rd dose',           months: 2 }, { name: 'IPV 3rd dose', months: 2 }],
  '6month':    [{ name: 'Influenza (annual)',       months: 6 }, { name: 'MMR 1st dose', months: 6 }],
  '12month':   [{ name: 'MMR 2nd dose',            months: 6 }, { name: 'Varicella', months: 0 }],
  '18month':   [{ name: 'DTaP booster',            months: 18 }],
  'dtap':      [{ name: 'DTaP next dose (check schedule)', months: 2 }],
  'mmr':       [{ name: 'MMR 2nd dose',            months: 28 }],
  'hepatitis': [{ name: 'HepB next dose',          months: 1  }],
  'influenza': [{ name: 'Influenza (annual)',       months: 12 }],
};

/**
 * Determine follow-up vaccine reminders based on vaccine name.
 * Returns array of { name, date } for auto-scheduling.
 */
function getVaccineFollowups(vaccineName, administeredDate) {
  const base = administeredDate ? new Date(administeredDate) : new Date();
  const name = (vaccineName || '').toLowerCase();
  let key = null;

  if (name.includes('birth') || name.includes('newborn'))     key = 'birth';
  else if (name.includes('2 month') || name.includes('2m'))   key = '2month';
  else if (name.includes('4 month') || name.includes('4m'))   key = '4month';
  else if (name.includes('6 month') || name.includes('6m'))   key = '6month';
  else if (name.includes('12 month') || name.includes('12m')) key = '12month';
  else if (name.includes('18 month') || name.includes('18m')) key = '18month';
  else if (name.includes('dtap') || name.includes('dpt'))     key = 'dtap';
  else if (name.includes('mmr'))                               key = 'mmr';
  else if (name.includes('hep'))                               key = 'hepatitis';
  else if (name.includes('flu') || name.includes('influenza')) key = 'influenza';

  if (!key || !VACCINE_FOLLOWUPS[key]) return [];

  return VACCINE_FOLLOWUPS[key]
    .filter(f => f.months > 0)
    .map(f => {
      const d = new Date(base);
      d.setMonth(d.getMonth() + f.months);
      return { name: f.name, date: d.toISOString().slice(0, 10) };
    });
}

module.exports = { calcPercentile, buildAIPromptData, buildAISummaryPrompt, getVaccineFollowups, WHO_WEIGHT, WHO_HEIGHT };
