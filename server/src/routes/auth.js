import express from 'express';
import { supabaseAnon, supabaseAdmin } from '../supabase.js';
import { attachUser, setAuthCookies } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { email, password, username, fullName } = req.body;
  if (!email || !password || !username) return res.status(400).json({ error: 'Missing fields' });

  const { data: userExists } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (userExists) return res.status(409).json({ error: 'Username taken' });

  const { data, error } = await supabaseAnon.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  const user = data.user;
  if (!user) return res.status(500).json({ error: 'No user returned' });

  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: user.id,
    username,
    full_name: fullName || null,
  });
  if (profileError) return res.status(500).json({ error: profileError.message });

  res.json({ ok: true, user: { id: user.id, email, username, fullName } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  const { session, user } = data;
  setAuthCookies(res, session);
  res.json({ ok: true, user: { id: user.id, email: user.email } });
});

router.post('/logout', (req, res) => {
  res.clearCookie('sb-access-token', { path: '/' });
  res.clearCookie('sb-refresh-token', { path: '/' });
  res.json({ ok: true });
});

router.get('/me', attachUser, async (req, res) => {
  if (!req.user) return res.json({ user: null });
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name, avatar_path, bio, website')
    .eq('id', req.user.id)
    .maybeSingle();
  res.json({ user: { id: req.user.id, email: req.user.email, ...profile } });
});

export default router;

