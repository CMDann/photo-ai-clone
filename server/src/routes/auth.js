import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbRun, transaction } from '../db.js';
import { attachUser, setSessionCookie, clearSessionCookie } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  let { email, password, username, fullName } = req.body || {};
  if (!email || !password || !username) return res.status(400).json({ error: 'Missing fields' });

  // Normalize input
  email = String(email).trim().toLowerCase();
  username = String(username).trim().toLowerCase();
  if (fullName !== undefined && fullName !== null) fullName = String(fullName).trim();

  // Basic validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
  if (username.length < 3 || !/^[a-z0-9_]+$/.test(username)) return res.status(400).json({ error: 'Invalid username' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Password too short' });

  const existsEmail = dbGet('select id from users where email = ?', [email]);
  if (existsEmail) return res.status(409).json({ error: 'Email already in use' });
  const existsUser = dbGet('select id from profiles where username = ?', [username]);
  if (existsUser) return res.status(409).json({ error: 'Username taken' });

  const id = uuidv4();
  const password_hash = await bcrypt.hash(password, 10);
  try {
    transaction(() => {
      dbRun('insert into users (id, email, password_hash) values (?, ?, ?)', [id, email, password_hash]);
      dbRun('insert into profiles (id, username, full_name) values (?, ?, ?)', [id, username, fullName || null]);
    });
  } catch (e) {
    const msg = (e && e.message) || '';
    if (msg.includes('UNIQUE') && msg.includes('users.email')) return res.status(409).json({ error: 'Email already in use' });
    if (msg.includes('UNIQUE') && msg.includes('profiles.username')) return res.status(409).json({ error: 'Username taken' });
    console.error('Signup error:', e);
    return res.status(500).json({ error: 'Failed to create user' });
  }

  res.json({ ok: true, user: { id, email, username, fullName } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const user = dbGet('select id, password_hash from users where email = ?', [email]);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  setSessionCookie(res, { sub: user.id, email });
  res.json({ ok: true, user: { id: user.id, email } });
});

router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/me', attachUser, async (req, res) => {
  if (!req.user) return res.json({ user: null });
  const profile = dbGet('select id, username, full_name, avatar_path, bio, website from profiles where id = ?', [req.user.id]);
  res.json({ user: { id: req.user.id, email: req.user.email, ...profile } });
});

export default router;
