import express from 'express';
import { dbGet, dbRun } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot follow self' });
  try { dbRun('insert into follows (follower_id, following_id) values (?, ?)', [req.user.id, id]); } catch {}
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  dbRun('delete from follows where follower_id = ? and following_id = ?', [req.user.id, id]);
  res.json({ ok: true });
});

router.get('/status/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const row = dbGet('select 1 as one from follows where follower_id = ? and following_id = ?', [req.user.id, id]);
  res.json({ following: !!row });
});

export default router;
