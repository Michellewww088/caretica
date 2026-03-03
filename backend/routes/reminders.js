/**
 * Caretica — Reminders Routes (Prisma)
 * GET    /api/reminders       — list all (FullCalendar format)
 * GET    /api/reminders/:id   — get one
 * POST   /api/reminders       — create
 * PUT    /api/reminders/:id   — update
 * DELETE /api/reminders/:id   — soft delete
 */
const express = require('express');
const router  = express.Router();
const prisma  = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');

const TYPE_COLORS = {
  vaccine:    '#10B981',
  checkup:    '#3B82F6',
  feeding:    '#F97316',
  sleep:      '#7C3AED',
  medication: '#EC4899',
  custom:     '#6B7280',
};

function toEvent(r) {
  return {
    id:                  r.id.toString(),
    title:               r.title,
    start:               r.datetime instanceof Date ? r.datetime.toISOString() : r.datetime,
    type:                r.type,
    notes:               r.notes,
    repeat_frequency:    r.repeat_frequency,
    notification_method: r.notification_method,
    status:              r.status,
    backgroundColor:     TYPE_COLORS[r.type] || '#6B7280',
  };
}

async function getUserBaby(userId) {
  return prisma.baby.findFirst({ where: { user_id: userId } });
}

// ── GET ALL ──
router.get('/', authMiddleware, async (req, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where:   { user_id: req.user.id, status: { not: 'deleted' } },
      orderBy: { datetime: 'asc' },
    });
    res.json(reminders.map(toEvent));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET ONE ──
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const reminder = await prisma.reminder.findFirst({
      where: { id: parseInt(req.params.id), user_id: req.user.id },
    });
    if (!reminder) return res.status(404).json({ error: 'Not found' });
    res.json(toEvent(reminder));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CREATE ──
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, title, start, datetime, repeat_frequency, notification_method, notes } = req.body;
    if (!title || (!start && !datetime)) {
      return res.status(400).json({ error: 'title and start datetime are required' });
    }

    const baby = await getUserBaby(req.user.id);
    if (!baby) return res.status(404).json({ error: 'No baby profile found' });

    const dt = new Date((start || datetime).replace(' ', 'T'));

    const reminder = await prisma.reminder.create({
      data: {
        user_id:             req.user.id,
        baby_id:             baby.id,
        type:                type || 'custom',
        title,
        datetime:            dt,
        repeat_frequency:    repeat_frequency    || 'once',
        notification_method: notification_method || 'in-app',
        notes:               notes || null,
        status:              'active',
        email_sent:          false,
      },
    });
    res.status(201).json({ id: reminder.id, message: 'Reminder created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE ──
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const id       = parseInt(req.params.id);
    const existing = await prisma.reminder.findFirst({ where: { id, user_id: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { type, title, start, datetime, repeat_frequency, notification_method, notes, status } = req.body;
    const dtRaw = start || datetime || existing.datetime;
    const dt    = dtRaw instanceof Date ? dtRaw : new Date(dtRaw.toString().replace(' ', 'T'));

    await prisma.reminder.update({
      where: { id },
      data: {
        type:                type                || existing.type,
        title:               title               || existing.title,
        datetime:            dt,
        repeat_frequency:    repeat_frequency    || existing.repeat_frequency,
        notification_method: notification_method || existing.notification_method,
        notes:               notes  !== undefined ? notes  : existing.notes,
        status:              status !== undefined ? status : existing.status,
      },
    });
    res.json({ message: 'Reminder updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE (soft) ──
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id       = parseInt(req.params.id);
    const existing = await prisma.reminder.findFirst({ where: { id, user_id: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    await prisma.reminder.update({ where: { id }, data: { status: 'deleted' } });
    res.json({ message: 'Reminder deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
