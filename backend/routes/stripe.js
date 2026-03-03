/**
 * Caretica — Stripe Integration (Prisma)
 * POST /api/stripe/create-checkout   — create Stripe Checkout Session
 * POST /api/stripe/webhook           — handle Stripe events
 * GET  /api/stripe/status            — subscription status for current user
 */
const express = require('express');
const router  = express.Router();
const prisma  = require('../lib/prisma');
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
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await s.customers.create({
        email:    user.email,
        name:     user.name || user.email,
        metadata: { caretica_user_id: user.id.toString() },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data:  { stripe_customer_id: customerId },
      });
    }

    const session = await s.checkout.sessions.create({
      customer:   customerId,
      mode:       'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/premium?success=true`,
      cancel_url:  `${process.env.FRONTEND_URL || 'http://localhost:5173'}/premium?cancelled=true`,
      payment_method_types: ['card'],
      metadata: { user_id: user.id.toString() },
      subscription_data: {
        metadata: { caretica_user_id: user.id.toString() },
      },
    });

    res.json({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── WEBHOOK ──
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
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session    = event.data.object;
        const userId     = parseInt(session.metadata?.user_id);
        const customerId = session.customer;
        const subId      = session.subscription;
        if (!userId) break;

        const sub    = await s.subscriptions.retrieve(subId);
        const expiry = new Date(sub.current_period_end * 1000);

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscription_status:    'active',
            is_premium:             true,
            stripe_customer_id:     customerId,
            stripe_subscription_id: subId,
            subscription_expiry:    expiry,
          },
        });
        console.log(`✅ Subscription activated for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub    = event.data.object;
        const userId = parseInt(sub.metadata?.caretica_user_id);
        if (!userId) break;

        const status = sub.status === 'active'    ? 'active'
                     : sub.status === 'trialing'  ? 'trialing'
                     : sub.cancel_at_period_end   ? 'cancelled'
                     : 'expired';
        const expiry    = new Date(sub.current_period_end * 1000);
        const isPremium = ['active', 'trialing'].includes(sub.status);

        await prisma.user.update({
          where: { id: userId },
          data:  { subscription_status: status, is_premium: isPremium, subscription_expiry: expiry },
        });
        console.log(`📋 Subscription updated for user ${userId}: ${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub    = event.data.object;
        const userId = parseInt(sub.metadata?.caretica_user_id);
        if (!userId) break;

        await prisma.user.update({
          where: { id: userId },
          data:  { subscription_status: 'cancelled', is_premium: false },
        });
        console.log(`❌ Subscription cancelled for user ${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice    = event.data.object;
        const customerId = invoice.customer;
        await prisma.user.updateMany({
          where: { stripe_customer_id: customerId },
          data:  { subscription_status: 'expired', is_premium: false },
        });
        console.log(`⚠️  Payment failed for customer ${customerId}`);
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

// ── SUBSCRIPTION STATUS ──
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now      = new Date();
    const trialEnd = new Date(user.trial_end_date);
    const daysLeft = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));

    res.json({
      subscription_status: user.subscription_status,
      is_premium:          user.is_premium,
      days_left_in_trial:  user.subscription_status === 'trialing' ? daysLeft : null,
      subscription_expiry: user.subscription_expiry,
      stripe_configured:   !!process.env.STRIPE_SECRET_KEY,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
