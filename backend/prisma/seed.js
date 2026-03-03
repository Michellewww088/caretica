/**
 * Caretica — Prisma Seed
 * Run: npx prisma db seed
 * Or:  node prisma/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🌱 Seeding database...');

  // ── DEMO USER ──
  const hash = await bcrypt.hash('password123', 12);
  const trialStart = new Date();
  const trialEnd   = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const user = await prisma.user.upsert({
    where:  { email: 'demo@caretica.com' },
    update: {},
    create: {
      email:               'demo@caretica.com',
      password_hash:       hash,
      name:                'Demo User',
      subscription_status: 'trialing',
      trial_start_date:    trialStart,
      trial_end_date:      trialEnd,
      is_premium:          true,
    },
  });
  console.log(`  ✅ User: ${user.email} (id: ${user.id})`);

  // ── DEMO BABY ──
  let baby = await prisma.baby.findFirst({ where: { user_id: user.id } });
  if (!baby) {
    baby = await prisma.baby.create({
      data: {
        user_id:         user.id,
        name:            'Emma Martinez',
        birthdate:       new Date('2025-07-02'),
        gender:          'female',
        blood_type:      'A+',
        baby_type:       'normal',
        weeks_premature: 0,
      },
    });
  }
  console.log(`  ✅ Baby: ${baby.name} (id: ${baby.id})`);

  // ── GROWTH LOGS ──
  const growthData = [
    { type: 'weight', value: 6.2,  unit: 'kg', logged_at: new Date('2025-11-15') },
    { type: 'height', value: 63.5, unit: 'cm', logged_at: new Date('2025-11-15') },
    { type: 'weight', value: 6.8,  unit: 'kg', logged_at: new Date('2025-12-10') },
    { type: 'height', value: 65.2, unit: 'cm', logged_at: new Date('2025-12-10') },
    { type: 'weight', value: 7.1,  unit: 'kg', logged_at: new Date('2026-01-08') },
    { type: 'height', value: 67.1, unit: 'cm', logged_at: new Date('2026-01-08') },
    { type: 'weight', value: 7.5,  unit: 'kg', logged_at: new Date('2026-02-15') },
    { type: 'height', value: 68.0, unit: 'cm', logged_at: new Date('2026-02-15') },
  ];
  const existing = await prisma.growthLog.count({ where: { baby_id: baby.id } });
  if (existing === 0) {
    await prisma.growthLog.createMany({
      data: growthData.map((d) => ({ ...d, baby_id: baby.id })),
    });
    console.log(`  ✅ Growth logs: ${growthData.length} entries`);
  } else {
    console.log(`  ⏭  Growth logs already exist, skipping`);
  }

  // ── REMINDERS ──
  const reminderCount = await prisma.reminder.count({ where: { user_id: user.id } });
  if (reminderCount === 0) {
    await prisma.reminder.createMany({
      data: [
        {
          user_id: user.id, baby_id: baby.id,
          type: 'checkup', title: '9-Month Checkup',
          datetime: new Date('2026-04-05T09:00:00'),
          repeat_frequency: 'once', notification_method: 'in-app,email',
          notes: 'Dr. Amara Johnson', status: 'active', email_sent: false,
        },
        {
          user_id: user.id, baby_id: baby.id,
          type: 'vaccine', title: 'Flu Vaccine',
          datetime: new Date('2026-03-18T09:00:00'),
          repeat_frequency: 'once', notification_method: 'in-app',
          notes: 'Annual flu shot', status: 'active', email_sent: false,
        },
      ],
    });
    console.log('  ✅ Reminders: 2 entries');
  } else {
    console.log('  ⏭  Reminders already exist, skipping');
  }

  console.log('');
  console.log('🌸 Seed complete!');
  console.log('   Demo login: demo@caretica.com / password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
