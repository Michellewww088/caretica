/**
 * Caretica — Email Reminder Scheduler
 * Runs every minute, finds reminders due within ±5 min, sends email, marks sent.
 */
const cron       = require('node-cron');
const nodemailer = require('nodemailer');
const { stmts, db } = require('./database');

// ── EMAIL TRANSPORT ──
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const typeEmojis = {
  vaccine:    '💉',
  checkup:    '🩺',
  feeding:    '🍼',
  sleep:      '😴',
  medication: '💊',
  custom:     '📋',
};

// ── EMAIL TEMPLATE ──
function buildEmail(reminder) {
  const emoji = typeEmojis[reminder.type] || '📋';
  const dt    = new Date(reminder.datetime).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  return {
    from:    process.env.EMAIL_FROM || '"Caretica" <noreply@caretica.app>',
    to:      process.env.EMAIL_USER, // In production: look up user email from DB
    subject: `${emoji} Reminder: ${reminder.title} — Caretica`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="font-family:'Helvetica Neue',sans-serif; background:#F0F7FF; margin:0; padding:40px 16px;">
  <div style="max-width:520px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(59,130,246,0.1);">

    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#1D4ED8,#7C3AED); padding:28px 32px; text-align:center;">
      <div style="font-size:2.4rem; margin-bottom:8px;">${emoji}</div>
      <h2 style="color:#fff; margin:0; font-size:1.3rem;">Health Reminder</h2>
      <p style="color:rgba(255,255,255,0.8); margin:4px 0 0; font-size:0.88rem;">Caretica — Maternal & Infant Health</p>
    </div>

    <!-- BODY -->
    <div style="padding:28px 32px;">
      <p style="color:#64748B; font-size:0.88rem; margin:0 0 20px;">Hi Sarah! This is your scheduled reminder from Caretica.</p>

      <div style="background:#EFF6FF; border:1.5px solid #BFDBFE; border-radius:12px; padding:20px; margin-bottom:20px;">
        <h3 style="margin:0 0 8px; color:#1E3A5F; font-size:1.05rem;">${reminder.title}</h3>
        <p style="margin:0 0 4px; color:#64748B; font-size:0.88rem;">
          <strong>Type:</strong> ${reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1)}
        </p>
        <p style="margin:0 0 4px; color:#64748B; font-size:0.88rem;">
          <strong>When:</strong> ${dt}
        </p>
        ${reminder.notes ? `<p style="margin:6px 0 0; color:#64748B; font-size:0.88rem;"><strong>Notes:</strong> ${reminder.notes}</p>` : ''}
      </div>

      <a href="http://localhost:3001" style="display:block; text-align:center; background:linear-gradient(135deg,#1D4ED8,#4F46E5); color:#fff; padding:14px; border-radius:50px; text-decoration:none; font-weight:700; font-size:0.95rem; margin-bottom:20px;">
        Open Caretica App
      </a>

      <div style="background:#ECFDF5; border-radius:10px; padding:12px 16px; font-size:0.78rem; color:#065F46;">
        <strong>🛡️ Health & Privacy:</strong> Caretica provides educational information only and does not replace professional medical consultation. Your data is encrypted and never shared.
      </div>
    </div>

    <!-- FOOTER -->
    <div style="padding:16px 32px; border-top:1px solid #F3F4F6; text-align:center;">
      <p style="color:#94A3B8; font-size:0.75rem; margin:0;">
        © 2026 Caretica. You received this because you set up a reminder.<br/>
        <a href="#" style="color:#3B82F6;">Manage preferences</a> · <a href="#" style="color:#3B82F6;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  };
}

// ── SCHEDULER (every minute) ──
function startScheduler() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  Email not configured. Set EMAIL_USER and EMAIL_PASS in .env to enable email reminders.');
    return;
  }

  console.log('⏰  Reminder scheduler started — checking every minute...');

  // ── DAILY: Expire trials ──
  cron.schedule('0 0 * * *', () => {
    try {
      const result = db.prepare(`
        UPDATE users
        SET subscription_status = 'expired',
            is_premium = 0
        WHERE subscription_status = 'trialing'
          AND trial_end_date < datetime('now')
      `).run();
      if (result.changes > 0) {
        console.log(`⏱️  Trial expiry: ${result.changes} user(s) downgraded to free plan.`);
      }
    } catch (err) {
      console.error('Trial expiry error:', err.message);
    }
  });

  cron.schedule('* * * * *', async () => {
    try {
      const due = stmts.getDueReminders.all();
      if (due.length === 0) return;

      console.log(`📧  Found ${due.length} reminder(s) due — sending emails...`);

      for (const reminder of due) {
        try {
          const mail = buildEmail(reminder);
          await transporter.sendMail(mail);
          stmts.markEmailSent.run(reminder.id);
          console.log(`  ✅ Email sent for: "${reminder.title}" (id: ${reminder.id})`);

          // If reminder repeats, schedule next occurrence
          if (reminder.repeat_frequency !== 'once') {
            const next = new Date(reminder.datetime);
            if (reminder.repeat_frequency === 'daily')   next.setDate(next.getDate() + 1);
            if (reminder.repeat_frequency === 'weekly')  next.setDate(next.getDate() + 7);
            if (reminder.repeat_frequency === 'monthly') next.setMonth(next.getMonth() + 1);

            stmts.createReminder.run({
              user_id: reminder.user_id,
              baby_id: reminder.baby_id,
              type:    reminder.type,
              title:   reminder.title,
              datetime: next.toISOString().slice(0, 19).replace('T', ' '),
              repeat_frequency: reminder.repeat_frequency,
              notification_method: reminder.notification_method,
              notes: reminder.notes,
            });
          }
        } catch (emailErr) {
          console.error(`  ❌ Failed to send email for "${reminder.title}":`, emailErr.message);
        }
      }
    } catch (err) {
      console.error('Scheduler error:', err.message);
    }
  });
}

module.exports = { startScheduler };
