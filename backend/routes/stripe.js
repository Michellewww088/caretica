/**
 * Caretica — Stripe Integration (Philippines-compatible)
 * POST /api/stripe/create-checkout   — create Stripe Checkout Session
 * POST /api/stripe/webhook           — handle Stripe events
 * GET  /api/stripe/status            — subscription status for current user
 *
 * Stripe is fully available in the Philippines (PHP or USD).
 * Supported: Visa, Mastercard, GCash (via Stripe), Maya, GrabPay
 *
 * Setup:
 *   1. Create account at stripe.com
 *   2. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to .env
 *   3. Create a Price in Stripe Dashboard (monthly subscription)
 *   4. Add STRIPE_PRICE_ID to .env
 */
const express  = require('express');
const router   = express.Router();
const { db }   = require('../database');
const { authMiddleware } = require('../middleware/auth');

let stripe;
function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

// ── CREATE CHECKOUT SESSION ──
router.post('/create-checkout', authMiddleware, async (req, res) => {
  const s = getStripe();
  if (!s) return res.status(503).json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY to .env' });

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Create or retrieve Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await s.customers.create({
        email: user.email,
        name:  user.name || user.email,
        metadata: { caretica_user_id: user.id.toString() },
      });
      customerId = customer.id;
      db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customerId, user.id);
    }

    const session = await s.checkout.sessions.create({
      customer:    customerId,
      mode:        'subscription',
      line_items:  [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/premium.html?success=true`,
      cancel_url:  `${process.env.FRONTEND_URL || 'http://localhost:3001'}/premium.html?cancelled=true`,
      // Philippines-relevant payment methods
      payment_method_types: ['card'],
      // Enable GCash, GrabPay, Maya for PH users (if configured in Stripe Dashboard)
      metadata: { user_id: user.id.toString() },
      subscription_data: {
        trial_period_days: user.subscription_status === 'trialing' ? undefined : 0,
        metadata: { caretica_user_id: user.id.toString() },
      },
    });

    res.json({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── WEBHOOK (raw body required) ──
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const s = getStripe();
  if (!s) return res.status(503).json({ error: 'Stripe not configured' });

  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(400).json({ error: 'STRIPE_WEBHOOK_SECRET not set' });

  let event;
  try {
    event = s.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session    = event.data.object;
        const userId     = session.metadata?.user_id;
        const customerId = session.customer;
        const subId      = session.subscription;
        if (!userId) break;

        // Fetch subscription details
        const sub    = await s.subscriptions.retrieve(subId);
        const expiry = new Date(sub.current_period_end * 1000).toISOString();

        db.prepare(`
          UPDATE users SET
            subscription_status    = 'active',
            is_premium             = 1,
            stripe_customer_id     = ?,
            stripe_subscription_id = ?,
            subscription_expiry    = ?
          WHERE id = ?
        `).run(customerId, subId, expiry, userId);

        console.log(`✅ Subscription activated for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub    = event.data.object;
        const userId = sub.metadata?.caretica_user_id;
        if (!userId) break;

        const status = sub.status === 'active' ? 'active'
                     : sub.status === 'trialing' ? 'trialing'
                     : sub.cancel_at_period_end ? 'cancelled'
                     : 'expired';
        const expiry = new Date(sub.current_period_end * 1000).toISOString();
        const isPremium = ['active', 'trialing'].includes(sub.status) ? 1 : 0;

        db.prepare(`
          UPDATE users SET
            subscription_status = ?,
            is_premium          = ?,
            subscription_expiry = ?
          WHERE id = ?
        `).run(status, isPremium, expiry, userId);

        console.log(`📋 Subscription updated for user ${userId}: ${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub    = event.data.object;
        const userId = sub.metadata?.caretica_user_id;
        if (!userId) break;

        db.prepare(`
          UPDATE users SET
            subscription_status = 'cancelled',
            is_premium          = 0
          WHERE id = ?
        `).run(userId);

        console.log(`❌ Subscription cancelled for user ${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const custId  = invoice.customer;
        db.prepare(`
          UPDATE users SET subscription_status = 'expired', is_premium = 0
          WHERE stripe_customer_id = ?
        `).run(custId);
        console.log(`⚠️ Payment failed — access suspended for customer ${custId}`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.json({ received: true });
});

// ── GET SUBSCRIPTION STATUS ──
router.get('/status', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const now      = new Date();
  const trialEnd = new Date(user.trial_end_date);
  const daysLeft = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));

  res.json({
    subscription_status: user.subscription_status,
    is_premium:          !!user.is_premium,
    days_left_in_trial:  user.subscription_status === 'trialing' ? daysLeft : null,
    subscription_expiry: user.subscription_expiry,
    stripe_configured:   !!process.env.STRIPE_SECRET_KEY,
  });
});

module.exports = router;
