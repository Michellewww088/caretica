/**
 * Caretica — Auth Routes
 * POST /api/auth/register  — create account, auto-start 7-day trial
 * POST /api/auth/login     — login, return JWT
 * GET  /api/auth/me        — get current user (requires token)
 */
const express  = require('express');
const bcrypt   = require('bcryptjs');
const router   = express.Router();
const { db }   = require('../database');
const { generateToken, authMiddleware } = require('../middleware/auth');

// ── REGISTER ──
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (password.length < 8)  return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // Check duplicate email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const hash          = await bcrypt.hash(password, 12);
    const trialStart    = new Date();
    const trialEnd      = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + 7);

    const info = db.prepare(`
      INSERT INTO users (email, password_hash, name, subscription_status, trial_start_date, trial_end_date, is_premium)
      VALUES (?, ?, ?, 'trialing', ?, ?, 1)
    `).run(email.toLowerCase(), hash, name || email.split('@')[0], trialStart.toISOString(), trialEnd.toISOString());

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    const token = generateToken(user);

    res.status(201).json({
      message: 'Account created! Your 7-day free trial has started.',
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── LOGIN ──
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = generateToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET CURRENT USER ──
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(safeUser(user));
});

// ── TRIAL STATUS ──
router.get('/trial-status', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });

  const now      = new Date();
  const trialEnd = new Date(user.trial_end_date);
  const daysLeft = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));

  res.json({
    subscription_status: user.subscription_status,
    is_premium:          user.is_premium,
    trial_end_date:      user.trial_end_date,
    days_left:           daysLeft,
    subscription_expiry: user.subscription_expiry,
  });
});

function safeUser(u) {
  return {
    id:                  u.id,
    email:               u.email,
    name:                u.name,
    subscription_status: u.subscription_status,
    is_premium:          u.is_premium,
    trial_start_date:    u.trial_start_date,
    trial_end_date:      u.trial_end_date,
    subscription_expiry: u.subscription_expiry,
    created_at:          u.created_at,
  };
}

module.exports = router;
