/**
 * Caretica — Auth Routes (Prisma)
 * POST /api/auth/register  — create account + default baby, start 7-day trial
 * POST /api/auth/login     — login, return JWT
 * GET  /api/auth/me        — get current user
 * GET  /api/auth/trial-status — trial / subscription info
 */
const express  = require('express');
const bcrypt   = require('bcryptjs');
const router   = express.Router();
const prisma   = require('../lib/prisma');
const { generateToken, authMiddleware } = require('../middleware/auth');
const { authLimiter, validateRegister, validateLogin, handleValidation } = require('../middleware/security');

// ── REGISTER ──
router.post('/register', authLimiter, validateRegister, handleValidation, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (password.length < 8)  return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const hash       = await bcrypt.hash(password, 12);
    const trialStart = new Date();
    const trialEnd   = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + 7);

    // Create user + default baby in one transaction
    const user = await prisma.user.create({
      data: {
        email:               email.toLowerCase(),
        password_hash:       hash,
        name:                name || email.split('@')[0],
        subscription_status: 'trialing',
        trial_start_date:    trialStart,
        trial_end_date:      trialEnd,
        is_premium:          true,
        babies: {
          create: {
            name:            name ? `${name.split(' ')[0]}'s Baby` : 'My Baby',
            birthdate:       new Date(),
            gender:          'unknown',
            baby_type:       'normal',
            weeks_premature: 0,
          },
        },
      },
      include: { babies: true },
    });

    const token = generateToken(user);
    res.status(201).json({
      message: 'Account created! Your 7-day free trial has started.',
      token,
      user:  safeUser(user),
      baby:  user.babies[0] || null,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── LOGIN ──
router.post('/login', authLimiter, validateLogin, handleValidation, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
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
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(safeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── COMPLETE ONBOARDING ──
router.post('/complete-onboarding', authMiddleware, async (req, res) => {
  try {
    const { stage, baby_type, weeks_premature, is_breastfeeding, due_date } = req.body;
    const isPregnant = stage === 'pregnancy';

    const userUpdate = {
      onboarding_completed: true,
      is_pregnant: isPregnant,
    };
    if (isPregnant && due_date) {
      userUpdate.due_date = new Date(due_date);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: userUpdate,
    });

    if (!isPregnant) {
      const baby = await prisma.baby.findFirst({ where: { user_id: req.user.id } });
      if (baby) {
        await prisma.baby.update({
          where: { id: baby.id },
          data: {
            baby_type: baby_type || 'normal',
            weeks_premature: baby_type === 'premature' ? parseInt(weeks_premature || 0) : 0,
          },
        });
      }
    }

    res.json({ user: safeUser(user) });
  } catch (err) {
    console.error('Onboarding error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── TRIAL STATUS ──
router.get('/trial-status', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function safeUser(u) {
  return {
    id:                   u.id,
    email:                u.email,
    name:                 u.name,
    subscription_status:  u.subscription_status,
    is_premium:           u.is_premium,
    trial_start_date:     u.trial_start_date,
    trial_end_date:       u.trial_end_date,
    subscription_expiry:  u.subscription_expiry,
    onboarding_completed: u.onboarding_completed,
    is_pregnant:          u.is_pregnant,
    due_date:             u.due_date,
    created_at:           u.created_at,
  };
}

module.exports = router;
