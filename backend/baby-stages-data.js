/**
 * Minimal baby stage lookup for backend AI tip generation.
 * Mirrors frontend babyStages.js — stage id, label, and fallback aiTip.
 */
const STAGES = [
  { id: 'newborn',       label: 'Newborn',       range: [0, 1],        aiTip: 'Your newborn can already recognize your voice! Talking and singing now builds brain connections that last a lifetime.' },
  { id: 'early_infant',  label: 'Early Infant',  range: [1, 3],        aiTip: 'Around 6 weeks, watch for the first social smile — it\'s a key milestone showing that baby\'s social-emotional brain is developing!' },
  { id: 'infant',        label: 'Infant',        range: [3, 6],        aiTip: 'Rolling is a big motor milestone! Always supervise floor time and never leave baby alone on elevated surfaces.' },
  { id: 'older_infant',  label: 'Older Infant',  range: [6, 9],        aiTip: 'WHO recommends exclusive breastfeeding until 6 months, then complementary foods alongside continued breastfeeding.' },
  { id: 'late_infant',   label: 'Late Infant',   range: [9, 12],       aiTip: 'Pincer grasp (picking up small items with thumb + forefinger) is a key fine motor skill emerging around 9–10 months!' },
  { id: 'early_toddler', label: 'Early Toddler', range: [12, 18],      aiTip: 'First words usually arrive around 12 months. If your toddler isn\'t saying 1–2 words by then, mention it to your pediatrician.' },
  { id: 'toddler',       label: 'Toddler',       range: [18, 24],      aiTip: 'Toddlers learn best through play. Sensory activities like playdough and water play build critical fine motor skills!' },
  { id: 'preschooler',   label: 'Preschooler',   range: [24, Infinity], aiTip: 'Reading 20 minutes a day can expose children to 1 million more words per year — a huge advantage for school readiness!' },
];

function getStage(ageMonths) {
  return (
    STAGES.find((s) => ageMonths >= s.range[0] && ageMonths < s.range[1]) ||
    STAGES[STAGES.length - 1]
  );
}

module.exports = { getStage };
