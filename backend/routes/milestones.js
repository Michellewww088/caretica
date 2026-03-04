/**
 * Caretica — Milestones Routes
 * GET    /api/milestones       — list milestones for user's baby
 * POST   /api/milestones       — create milestone
 * PUT    /api/milestones/:id   — update milestone
 * DELETE /api/milestones/:id   — delete milestone
 */
const express = require('express');
const router  = express.Router();
const prisma  = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');

async function getUserBaby(userId) {
  return prisma.baby.findFirst({ where: { user_id: userId } });
}

// ── GET ALL ──
router.get('/', authMiddleware, async (req, res) => {
  try {
    const baby = await getUserBaby(req.user.id);
    if (!baby) return res.json([]);

    const milestones = await prisma.milestone.findMany({
      where:   { baby_id: baby.id },
      orderBy: { achieved_at: 'desc' },
    });
    res.json(milestones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CREATE ──
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, category, achieved_at, notes } = req.body;
    if (!title || !achieved_at) {
      return res.status(400).json({ error: 'title and achieved_at are required' });
    }

    const baby = await getUserBaby(req.user.id);
    if (!baby) return res.status(404).json({ error: 'No baby profile found' });

    const milestone = await prisma.milestone.create({
      data: {
        baby_id:     baby.id,
        title:       title.trim(),
        category:    category || 'other',
        achieved_at: new Date(achieved_at),
        notes:       notes || null,
      },
    });
    res.status(201).json(milestone);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE ──
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const id   = parseInt(req.params.id);
    const baby = await getUserBaby(req.user.id);
    if (!baby) return res.status(404).json({ error: 'No baby profile found' });

    const existing = await prisma.milestone.findFirst({ where: { id, baby_id: baby.id } });
    if (!existing) return res.status(404).json({ error: 'Milestone not found' });

    const { title, category, achieved_at, notes } = req.body;
    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        title:       title       ? title.trim()        : existing.title,
        category:    category                          ?? existing.category,
        achieved_at: achieved_at ? new Date(achieved_at) : existing.achieved_at,
        notes:       notes !== undefined ? notes       : existing.notes,
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE ──
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id   = parseInt(req.params.id);
    const baby = await getUserBaby(req.user.id);
    if (!baby) return res.status(404).json({ error: 'No baby profile found' });

    const existing = await prisma.milestone.findFirst({ where: { id, baby_id: baby.id } });
    if (!existing) return res.status(404).json({ error: 'Milestone not found' });

    await prisma.milestone.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
