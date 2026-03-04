const helmet      = require('helmet')
const rateLimit   = require('express-rate-limit')
const { body, validationResult } = require('express-validator')

// ── HELMET (HTTP security headers) ──────────────────────────────────────────
const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // disable to allow Vite HMR in dev
  crossOriginEmbedderPolicy: false,
})

// ── RATE LIMITERS ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 login/register attempts
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests per minute per IP
  message: { error: 'Rate limit exceeded. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,             // 10 AI requests per minute (expensive)
  message: { error: 'AI request limit reached. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// ── INPUT VALIDATORS ─────────────────────────────────────────────────────────
const validateRegister = [
  body('email')
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('name')
    .optional()
    .isLength({ max: 100 }).withMessage('Name too long')
    .trim().escape(),
]

const validateLogin = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
]

const validateGrowthLog = [
  body('type')
    .isIn(['weight', 'height', 'head', 'sleep', 'feeding'])
    .withMessage('Invalid measurement type'),
  body('value')
    .isFloat({ min: 0, max: 999 }).withMessage('Value must be a positive number'),
  body('unit')
    .optional()
    .isLength({ max: 10 }).withMessage('Unit too long'),
]

const validateReminder = [
  body('type')
    .isIn(['vaccine', 'checkup', 'feeding', 'sleep', 'medication', 'custom'])
    .withMessage('Invalid reminder type'),
  body('title')
    .notEmpty().withMessage('Title required')
    .isLength({ max: 200 }).withMessage('Title too long')
    .trim().escape(),
  body('datetime')
    .isISO8601().withMessage('Valid datetime required'),
  body('repeat_frequency')
    .optional()
    .isIn(['once', 'daily', 'weekly', 'monthly']),
  body('notification_method')
    .optional()
    .isLength({ max: 50 }),
  body('notes')
    .optional()
    .isLength({ max: 1000 }).withMessage('Notes too long')
    .trim().escape(),
]

// ── VALIDATION RESULT HANDLER ────────────────────────────────────────────────
function handleValidation(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    })
  }
  next()
}

module.exports = {
  helmetMiddleware,
  authLimiter,
  apiLimiter,
  aiLimiter,
  validateRegister,
  validateLogin,
  validateGrowthLog,
  validateReminder,
  handleValidation,
}
