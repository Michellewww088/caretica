export const PREGNANCY_STAGES = [
  {
    id: 'first_trimester',
    label: 'First Trimester',
    icon: '🌱',
    weeksRange: [1, 12],
    color: 'teal',
    milestone: 'Baby is forming all major organs. Focus on prenatal vitamins and first OB visits.',
    tasks: [
      'Schedule first prenatal appointment',
      'Start prenatal vitamins with folic acid',
      'Avoid alcohol, tobacco, and raw foods',
      'First trimester screening (10–13 weeks)',
      'Rest and manage morning sickness',
    ],
    tips: [
      'Folic acid (400–800 mcg/day) is critical for neural tube development.',
      'Stay hydrated and eat small, frequent meals to ease nausea.',
      'Light exercise like walking is safe and beneficial.',
    ],
    warnings: [
      'Heavy bleeding or severe cramping',
      'High fever above 38°C (100.4°F)',
      'Severe vomiting preventing any food intake',
    ],
    aiTip: 'The first trimester is a critical time for baby\'s organ development. Prenatal vitamins with folic acid are one of the most important things you can do right now!',
    suggestedQuestions: [
      'What should I eat in the first trimester?',
      'Is light exercise safe during early pregnancy?',
      'How much folic acid do I need?',
    ],
  },
  {
    id: 'second_trimester',
    label: 'Second Trimester',
    icon: '🌸',
    weeksRange: [13, 26],
    color: 'pink',
    milestone: 'Baby is growing rapidly. You may feel first movements (quickening) around week 16–20.',
    tasks: [
      'Anatomy ultrasound at 18–20 weeks',
      'Glucose screening test (24–28 weeks)',
      'Begin pregnancy-safe exercise routine',
      'Start planning nursery and baby gear',
      'Discuss birth plan with your OB',
    ],
    tips: [
      'Most moms feel best in the second trimester — use this energy wisely!',
      'Sleep on your left side to improve blood flow to baby.',
      'Talk and sing to your belly — baby can hear you from week 18!',
    ],
    warnings: [
      'Sudden severe swelling in face or hands',
      'Decreased fetal movement after week 20',
      'Signs of preterm labor (contractions before 37 weeks)',
    ],
    aiTip: 'Your baby can now hear your voice! Talking, singing, and reading aloud helps build early neural connections.',
    suggestedQuestions: [
      'When will I feel baby move?',
      'What is the anatomy ultrasound looking for?',
      'Is it safe to travel during the second trimester?',
    ],
  },
  {
    id: 'third_trimester',
    label: 'Third Trimester',
    icon: '🌺',
    weeksRange: [27, 40],
    color: 'orange',
    milestone: 'Baby is gaining weight and preparing for birth. Focus on birth prep and hospital readiness.',
    tasks: [
      'Finalize birth plan with your OB/midwife',
      'Pack hospital bag by week 36',
      'Group B Strep test at 35–37 weeks',
      'Baby kicks count: 10 movements in 2 hours',
      'Complete newborn care and breastfeeding classes',
    ],
    tips: [
      'Kick counts: track daily fetal movement starting at 28 weeks.',
      'Practice relaxation and breathing techniques for labor.',
      'Install the car seat before your due date.',
    ],
    warnings: [
      'Sudden decrease in fetal movement',
      'Severe headache with vision changes (preeclampsia)',
      'Water breaking before 37 weeks',
    ],
    aiTip: 'Start counting baby\'s kicks daily from 28 weeks. Ten kicks within 2 hours is reassuring — contact your OB if you notice fewer movements.',
    suggestedQuestions: [
      'How do I count fetal kicks?',
      'What are signs of labor?',
      'When should I go to the hospital?',
    ],
  },
]

export const BABY_STAGES = [
  {
    id: 'newborn',
    label: 'Newborn',
    icon: '🌱',
    range: [0, 1],
    color: 'blue',
    milestone: 'Focus on feeding, skin-to-skin bonding, and establishing sleep patterns.',
    tasks: [
      'Feed every 2–3 hours (8–12 times/day)',
      'Track wet & dirty diapers daily',
      'Schedule first pediatric visit (1–2 weeks)',
      'Practice short tummy time sessions',
      'Monitor for jaundice (yellow skin/eyes)',
    ],
    tips: [
      'Skin-to-skin contact helps regulate baby\'s temperature and heart rate.',
      'Newborns sleep 14–17 hours/day — sleep when baby sleeps!',
      'Your voice is the most soothing sound to your baby.',
    ],
    warnings: [
      'Fewer than 6 wet diapers/day after day 5',
      'Jaundice worsening after day 3',
      'Not regaining birth weight by 2 weeks',
    ],
    aiTip: 'Your newborn can already recognize your voice! Talking and singing now builds brain connections that last a lifetime.',
    suggestedQuestions: [
      'How often should I feed my newborn?',
      'How many wet diapers should a newborn have?',
      'When should I schedule the first pediatric visit?',
    ],
  },
  {
    id: 'early_infant',
    label: 'Early Infant',
    icon: '🌸',
    range: [1, 3],
    color: 'pink',
    milestone: 'Baby is starting to smile and beginning to track objects with their eyes.',
    tasks: [
      'Watch for first social smile (around 6–8 weeks)',
      'Schedule 1-month and 2-month well-child visits',
      '2-month vaccines: HepB, DTaP, Hib, Polio, PCV',
      'Daily tummy time (start with 3–5 minutes)',
      'Introduce high-contrast black/white patterns',
    ],
    tips: [
      'High-contrast patterns (black & white) stimulate early vision development.',
      'Follow hunger cues — demand feeding supports healthy milk supply.',
      'A consistent bedtime routine helps regulate sleep cycles.',
    ],
    warnings: [
      'Not smiling by 2 months',
      'Not following objects with eyes by 2 months',
      'Difficulty feeding or poor weight gain',
    ],
    aiTip: 'Around 6 weeks, watch for the first social smile — it\'s a key milestone showing that baby\'s social-emotional brain is developing!',
    suggestedQuestions: [
      'Is 14 hours of sleep normal at this age?',
      'When should I start tummy time?',
      'What vaccines does my baby need at 2 months?',
    ],
  },
  {
    id: 'infant',
    label: 'Infant',
    icon: '🌻',
    range: [3, 6],
    color: 'yellow',
    milestone: 'Baby is rolling over, cooing, and reaching for objects intentionally.',
    tasks: [
      'Schedule 4-month well-child visit',
      '4-month vaccines: DTaP, Hib, Polio, PCV',
      'Tummy time on floor for 20+ minutes/day',
      'Start reading board books together',
      'Introduce cause-and-effect toys (rattles)',
    ],
    tips: [
      'Babies love mirrors — let them explore their own reflection.',
      'Narrate your day constantly to build vocabulary.',
      'Safe sleep: firm mattress, no loose bedding, room-sharing.',
    ],
    warnings: [
      'Not rolling front-to-back by 4 months',
      'Not laughing or squealing by 4 months',
      'Not reaching for objects',
    ],
    aiTip: 'Rolling is a big motor milestone! Always supervise floor time and never leave baby alone on elevated surfaces.',
    suggestedQuestions: [
      'When do babies start rolling over?',
      'How much tummy time should my baby get?',
      'Is it safe to start solids at 4 months?',
    ],
  },
  {
    id: 'older_infant',
    label: 'Older Infant',
    icon: '🍎',
    range: [6, 9],
    color: 'orange',
    milestone: 'Baby sits with support, starts solids, and babbles consonant sounds.',
    tasks: [
      'Introduce first foods: pureed vegetables, fruits, cereals',
      'Schedule 6-month well-child visit',
      '6-month vaccines: DTaP, Hib, Polio, PCV, Flu',
      'Baby-proof floors and low cabinets',
      'Offer water in a sippy cup with meals',
    ],
    tips: [
      'Introduce one new food every 3–5 days to watch for reactions.',
      'Stranger anxiety is normal — it shows healthy attachment.',
      'Offer soft finger foods to develop self-feeding skills.',
    ],
    warnings: [
      'Not sitting with support by 6 months',
      'Not babbling (ba, da, ma) by 6 months',
      'Not passing objects hand-to-hand',
    ],
    aiTip: 'WHO recommends exclusive breastfeeding until 6 months, then complementary foods alongside continued breastfeeding.',
    suggestedQuestions: [
      'What first foods are safe for my baby?',
      'How do I know if my baby is allergic to a food?',
      'When should I introduce a sippy cup?',
    ],
  },
  {
    id: 'late_infant',
    label: 'Late Infant',
    icon: '🐣',
    range: [9, 12],
    color: 'teal',
    milestone: 'Baby is crawling, pulling to stand, and saying "mama" or "dada".',
    tasks: [
      'Schedule 9-month well-child visit',
      'Practice waving bye-bye and clapping',
      'Introduce soft finger foods (O-shaped cereal)',
      'Check for pincer grasp development',
      'Begin bedtime story routine',
    ],
    tips: [
      'Crawling builds coordination — encourage safe floor exploration.',
      'Point to objects and name them to build vocabulary.',
      'Offer a variety of textures to prevent picky eating later.',
    ],
    warnings: [
      'Not crawling or bottom-scooting by 9 months',
      'Not saying "mama"/"dada" by 12 months',
      'Not able to stand while holding on by 12 months',
    ],
    aiTip: 'Pincer grasp (picking up small items with thumb + forefinger) is a key fine motor skill emerging around 9–10 months!',
    suggestedQuestions: [
      'When do babies start walking?',
      'What finger foods are safe for 9–12 months?',
      'How can I encourage my baby to talk more?',
    ],
  },
  {
    id: 'early_toddler',
    label: 'Early Toddler',
    icon: '👟',
    range: [12, 18],
    color: 'purple',
    milestone: 'Baby takes first steps, says first words, and explores everything.',
    tasks: [
      'Schedule 12-month and 15-month well-child visits',
      '12-month vaccines: MMR, Varicella, HepA, PCV',
      'Transition from bottle to sippy cup',
      'Transition to whole cow\'s milk (after 12 months)',
      'Encourage safe walking practice',
    ],
    tips: [
      'Toddlers need 11–14 hours of sleep/day including naps.',
      'Read together daily — aim for 15–20 minutes.',
      'Limit screen time; prioritize hands-on exploration.',
    ],
    warnings: [
      'Not walking by 15 months',
      'Loss of previously learned skills',
      'Not pointing to communicate by 12 months',
    ],
    aiTip: 'First words usually arrive around 12 months. If your toddler isn\'t saying 1–2 words by then, mention it to your pediatrician.',
    suggestedQuestions: [
      'How many words should a 12-month-old know?',
      'When can my toddler switch to cow\'s milk?',
      'How do I handle toddler tantrums?',
    ],
  },
  {
    id: 'toddler',
    label: 'Toddler',
    icon: '🏃',
    range: [18, 24],
    color: 'green',
    milestone: 'Toddler runs, begins combining words, and develops strong preferences.',
    tasks: [
      'Schedule 18-month and 24-month well-child visits',
      '18-month vaccines: DTaP, Hib, HepA',
      'Encourage two-word phrases ("more milk", "big ball")',
      'Introduce potty training awareness',
      'Structured playdates for social development',
    ],
    tips: [
      'Tantrums are normal — stay calm and validate feelings.',
      'Offer limited choices to build autonomy ("apple or banana?").',
      'Pretend play is vital for creativity and social skills.',
    ],
    warnings: [
      'Fewer than 50 words by 24 months',
      'Not combining two words by 24 months',
      'Not walking steadily by 18 months',
    ],
    aiTip: 'Toddlers learn best through play. Sensory activities like playdough and water play build critical fine motor skills!',
    suggestedQuestions: [
      'How do I start potty training?',
      'Is it normal for my toddler to have tantrums every day?',
      'What should a 2-year-old be eating?',
    ],
  },
  {
    id: 'preschooler',
    label: 'Preschooler',
    icon: '🎨',
    range: [24, Infinity],
    color: 'indigo',
    milestone: 'Child speaks in sentences, plays with peers, and grows in independence.',
    tasks: [
      'Schedule 2-year and 3-year well-child visits',
      '2-year vaccines: MMR booster, Varicella booster',
      'Begin potty training if readiness signs are present',
      'Encourage drawing, coloring, and puzzles',
      'Establish clear daily routines',
    ],
    tips: [
      'Consistent routines for meals, play, and sleep reduce anxiety.',
      'Praise effort, not just results, to build a growth mindset.',
      'Books with repetition and rhyme support language development.',
    ],
    warnings: [
      'Not speaking in 2-word phrases by 24 months',
      'Not following simple 2-step instructions',
      'Loss of previously acquired language',
    ],
    aiTip: 'Reading 20 minutes a day can expose children to 1 million more words per year — a huge advantage for school readiness!',
    suggestedQuestions: [
      'When should my child start preschool?',
      'How do I encourage my child to share?',
      'What screen time limits are recommended for preschoolers?',
    ],
  },
]

export function getStage(ageMonths) {
  return (
    BABY_STAGES.find((s) => ageMonths >= s.range[0] && ageMonths < s.range[1]) ||
    BABY_STAGES[BABY_STAGES.length - 1]
  )
}

export function getPregnancyStage(weeksPregnant) {
  return (
    PREGNANCY_STAGES.find((s) => weeksPregnant >= s.weeksRange[0] && weeksPregnant <= s.weeksRange[1]) ||
    PREGNANCY_STAGES[PREGNANCY_STAGES.length - 1]
  )
}

export function getCorrectedAgeMonths(ageMonths, babyType, weeksPremature = 0) {
  if (babyType !== 'premature' || !weeksPremature) return ageMonths
  const correction = weeksPremature / 4.33
  return Math.max(0, ageMonths - correction)
}

export const STAGE_COLORS = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400' },
  pink:   { bg: 'bg-pink-50',   border: 'border-pink-100',   text: 'text-pink-700',   dot: 'bg-pink-400' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
  teal:   { bg: 'bg-teal-50',   border: 'border-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-400' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700', dot: 'bg-purple-400' },
  green:  { bg: 'bg-green-50',  border: 'border-green-100',  text: 'text-green-700',  dot: 'bg-green-400' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-400' },
}

export const BABY_TYPE_CONFIG = {
  normal:    { label: 'Full Term',  icon: '👶', badge: 'bg-blue-100 text-blue-700' },
  premature: { label: 'Premature', icon: '🏥', badge: 'bg-amber-100 text-amber-700' },
  twins:     { label: 'Twins',     icon: '👫', badge: 'bg-purple-100 text-purple-700' },
}
