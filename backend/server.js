/**
 * Caretica Backend Server (Prisma + PostgreSQL)
 *
 * Setup:
 *   1. cd backend
 *   2. cp .env.example .env   — fill in DATABASE_URL and other vars
 *   3. npm install
 *   4. npx prisma migrate dev --name init
 *   5. node prisma/seed.js
 *   6. node server.js
 */
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const prisma   = require('./lib/prisma');
const { authMiddleware } = require('./middleware/auth');

const remindersRouter = require('./routes/reminders');
const uploadRouter    = require('./routes/upload');
const authRouter      = require('./routes/auth');
const stripeRouter    = require('./routes/stripe');
const whoRouter       = require('./routes/who-api');
const aiRouter        = require('./routes/ai');
const { startScheduler } = require('./scheduler');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── MIDDLEWARE ──
app.use(cors({
  origin: [
    'http://localhost:5173',  // Vite dev
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── ROUTES ──
app.use('/api/auth',      authRouter);
app.use('/api/stripe',    stripeRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/upload',    uploadRouter);
app.use('/api/who',       whoRouter);
app.use('/api/ai',        aiRouter);

// ── BABIES ──
app.get('/api/babies', authMiddleware, async (req, res) => {
  try {
    const babies = await prisma.baby.findMany({
      where:   { user_id: req.user.id },
      orderBy: { created_at: 'asc' },
    });
    res.json(babies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/babies/:id', authMiddleware, async (req, res) => {
  try {
    const id    = parseInt(req.params.id);
    const baby  = await prisma.baby.findFirst({ where: { id, user_id: req.user.id } });
    if (!baby) return res.status(404).json({ error: 'Baby not found' });

    const { name, birthdate, gender, blood_type, baby_type, weeks_premature } = req.body;
    const updated = await prisma.baby.update({
      where: { id },
      data: {
        name:            name            || baby.name,
        birthdate:       birthdate       ? new Date(birthdate) : baby.birthdate,
        gender:          gender          || baby.gender,
        blood_type:      blood_type      || baby.blood_type,
        baby_type:       baby_type       || baby.baby_type,
        weeks_premature: weeks_premature != null ? parseInt(weeks_premature) : baby.weeks_premature,
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GROWTH LOGS ──
app.get('/api/growth', authMiddleware, async (req, res) => {
  try {
    const baby = await prisma.baby.findFirst({ where: { user_id: req.user.id } });
    if (!baby) return res.json([]);
    const logs = await prisma.growthLog.findMany({
      where:   { baby_id: baby.id },
      orderBy: { logged_at: 'desc' },
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/growth', authMiddleware, async (req, res) => {
  try {
    const { type, value, unit } = req.body;
    if (!type || value === undefined) {
      return res.status(400).json({ error: 'type and value required' });
    }
    const baby = await prisma.baby.findFirst({ where: { user_id: req.user.id } });
    if (!baby) return res.status(404).json({ error: 'No baby profile found' });

    const log = await prisma.growthLog.create({
      data: { baby_id: baby.id, type, value: parseFloat(value), unit: unit || '' },
    });
    res.status(201).json({ id: log.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GROWTH BATCH ──
app.post('/api/growth/batch', authMiddleware, async (req, res) => {
  try {
    const { rows } = req.body; // [{ date, weight, height, head, sleep_hours, feeding_amount }]
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'rows array required' });
    }
    const baby = await prisma.baby.findFirst({ where: { user_id: req.user.id } });
    if (!baby) return res.status(404).json({ error: 'No baby profile found' });

    const FIELD_MAP = [
      { field: 'weight',          type: 'weight',  unit: 'kg'  },
      { field: 'height',          type: 'height',  unit: 'cm'  },
      { field: 'head',            type: 'head',    unit: 'cm'  },
      { field: 'sleep_hours',     type: 'sleep',   unit: 'hrs' },
      { field: 'feeding_amount',  type: 'feeding', unit: 'ml'  },
    ];

    const records = [];
    for (const row of rows) {
      const loggedAt = row.date ? new Date(row.date) : new Date();
      for (const { field, type, unit } of FIELD_MAP) {
        if (row[field] != null && row[field] !== '') {
          records.push({ baby_id: baby.id, type, value: parseFloat(row[field]), unit, logged_at: loggedAt });
        }
      }
    }

    if (records.length === 0) {
      return res.status(400).json({ error: 'No valid measurements in rows' });
    }

    await prisma.growthLog.createMany({ data: records });

    // Compute WHO percentiles for the latest weight + height after insert
    const { calcPercentile } = require('./who-percentile');
    const now = new Date();
    const ageMonths = Math.max(0,
      (now.getFullYear() - new Date(baby.birthdate).getFullYear()) * 12 +
      (now.getMonth() - new Date(baby.birthdate).getMonth())
    );
    const genderKey = baby.gender === 'male' || baby.gender === 'boy' ? 'boys' : 'girls';
    const summary = { inserted: records.length };
    const weightRow = records.find((r) => r.type === 'weight');
    const heightRow = records.find((r) => r.type === 'height');
    if (weightRow) summary.weight_percentile = calcPercentile(ageMonths, weightRow.value, 'weight', genderKey);
    if (heightRow) summary.height_percentile = calcPercentile(ageMonths, heightRow.value, 'height', genderKey);

    res.status(201).json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── HEALTH CHECK ──
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {}
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    version:   '2.0.0',
    services: {
      database:  dbStatus,
      scheduler: 'running',
      email:     process.env.EMAIL_USER ? 'configured' : 'not configured',
      ocr:       process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'configured' : 'demo mode',
      ai:        process.env.ANTHROPIC_API_KEY ? 'configured' : 'demo mode',
    },
  });
});

// ── START ──
async function start() {
  try {
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log('');
      console.log('  🌸  Caretica Backend Server v2.0');
      console.log('  ─────────────────────────────────');
      console.log(`  🚀  Running on   http://localhost:${PORT}`);
      console.log(`  🗄️   Database:    PostgreSQL (Prisma)`);
      console.log(`  📧  Email:       ${process.env.EMAIL_USER || '⚠️  Not configured'}`);
      console.log(`  🤖  AI/OCR:      ${process.env.ANTHROPIC_API_KEY ? 'Configured' : 'Demo mode'}`);
      console.log('  ─────────────────────────────────');
      console.log('');
      startScheduler();
    });
  } catch (err) {
    console.error('❌  Failed to connect to database:', err.message);
    console.error('    Make sure DATABASE_URL is set in .env and PostgreSQL is running.');
    process.exit(1);
  }
}

start();
