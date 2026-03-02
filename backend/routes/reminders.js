const express = require('express');
const router  = express.Router();
const { stmts } = require('../database');

// GET  /api/reminders — list all
router.get('/', (req, res) => {
  try {
    const reminders = stmts.getAllReminders.all();
    // Format as FullCalendar-compatible events
    const typeColors = {
      vaccine: '#10B981', checkup: '#3B82F6', feeding: '#F97316',
      sleep: '#7C3AED', medication: '#EC4899', custom: '#6B7280',
    };
    const events = reminders.map(r => ({
      id:    r.id.toString(),
      title: r.title,
      start: r.datetime.replace(' ', 'T'),
      type:  r.type,
      notes: r.notes,
      repeat_frequency:    r.repeat_frequency,
      notification_method: r.notification_method,
      status: r.status,
      backgroundColor: typeColors[r.type] || '#6B7280',
    }));
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reminders/:id
router.get('/:id', (req, res) => {
  const reminder = stmts.getReminderById.get(req.params.id);
  if (!reminder) return res.status(404).json({ error: 'Not found' });
  res.json(reminder);
});

// POST /api/reminders — create
router.post('/', (req, res) => {
  try {
    const { type, title, start, datetime, repeat_frequency, notification_method, notes, baby_id, user_id } = req.body;
    if (!title || (!start && !datetime)) {
      return res.status(400).json({ error: 'title and start datetime are required' });
    }
    const dt = (start || datetime).replace('T', ' ').slice(0, 19);
    const info = stmts.createReminder.run({
      user_id: user_id || 'user1',
      baby_id: baby_id || 'emma',
      type: type || 'custom',
      title,
      datetime: dt,
      repeat_frequency: repeat_frequency || 'once',
      notification_method: notification_method || 'in-app',
      notes: notes || null,
    });
    res.status(201).json({ id: info.lastInsertRowid, message: 'Reminder created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/reminders/:id — update
router.put('/:id', (req, res) => {
  try {
    const existing = stmts.getReminderById.get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const { type, title, start, datetime, repeat_frequency, notification_method, notes, status } = req.body;
    const dt = ((start || datetime || existing.datetime)).replace('T', ' ').slice(0, 19);
    stmts.updateReminder.run({
      id:   req.params.id,
      type: type || existing.type,
      title: title || existing.title,
      datetime: dt,
      repeat_frequency:    repeat_frequency    || existing.repeat_frequency,
      notification_method: notification_method || existing.notification_method,
      notes:  notes  !== undefined ? notes  : existing.notes,
      status: status !== undefined ? status : existing.status,
    });
    res.json({ message: 'Reminder updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reminders/:id — soft delete
router.delete('/:id', (req, res) => {
  try {
    stmts.deleteReminder.run(req.params.id);
    res.json({ message: 'Reminder deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
