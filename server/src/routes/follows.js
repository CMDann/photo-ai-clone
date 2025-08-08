import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot follow self' });
  try {
    db.prepare('insert into follows (follower_id, following_id) values (?, ?)').run(req.user.id, id);
  } catch {}
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  db.prepare('delete from follows where follower_id = ? and following_id = ?').run(req.user.id, id);
  res.json({ ok: true });
});

router.get('/status/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const row = db.prepare('select 1 from follows where follower_id = ? and following_id = ?').get(req.user.id, id);
  res.json({ following: !!row });
});

export default router;
