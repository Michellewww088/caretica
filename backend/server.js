/**
 * Caretica Backend Server
 * Express + SQLite + Email Scheduler
 *
 * Setup:
 *   1. cd backend
 *   2. copy .env.example to .env and fill in values
 *   3. npm install
 *   4. node server.js
 */
require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const path        = require('path');
const { stmts }   = require('./database');
const remindersRouter = require('./routes/reminders');
const uploadRouter    = require('./routes/upload');
const authRouter      = require('./routes/auth');
const stripeRouter    = require('./routes/stripe');
const { startScheduler } = require('./scheduler');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── MIDDLEWARE ──
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── ROUTES ──
app.use('/api/auth',      authRouter);
app.use('/api/stripe',    stripeRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/upload',    uploadRouter);
app.use('/api/who',       require('./routes/who-api'));

// Growth logs
app.get('/api/growth', (req, res) => {
  const logs = stmts.getGrowthLogs.all(req.query.baby_id || 'emma');
  res.json(logs);
});
app.post('/api/growth', (req, res) => {
  const { type, value, unit, baby_id } = req.body;
  if (!type || value === undefined) return res.status(400).json({ error: 'type and value required' });
  const info = stmts.addGrowthLog.run({ baby_id: baby_id || 'emma', type, value, unit: unit || '' });
  res.status(201).json({ id: info.lastInsertRowid });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      scheduler: 'running',
      email: process.env.EMAIL_USER ? 'configured' : 'not configured',
      ocr: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'configured' : 'demo mode',
      ai: process.env.ANTHROPIC_API_KEY ? 'configured' : 'demo mode',
    }
  });
});

// ── START ──
app.listen(PORT, () => {
  console.log('');
  console.log('  🌸  Caretica Backend Server');
  console.log('  ─────────────────────────────────');
  console.log(`  🚀  Running on http://localhost:${PORT}`);
  console.log(`  📦  Database: SQLite (./data/caretica.db)`);
  console.log(`  📧  Email:    ${process.env.EMAIL_USER ? process.env.EMAIL_USER : '⚠️  Not configured'}`);
  console.log(`  🤖  AI/OCR:   ${process.env.ANTHROPIC_API_KEY ? 'Configured' : 'Demo mode (mock responses)'}`);
  console.log('  ─────────────────────────────────');
  console.log('');
  startScheduler();
});
