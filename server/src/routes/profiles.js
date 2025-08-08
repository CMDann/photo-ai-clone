import express from 'express';
import { supabaseAdmin } from '../supabase.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/by-username/:username', async (req, res) => {
  const { username } = req.params;
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name, bio, website, avatar_path')
    .eq('username', username)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Not found' });

  let avatar_url = null;
  if (data.avatar_path) {
    const { data: pub } = supabaseAdmin.storage.from('avatars').getPublicUrl(data.avatar_path);
    avatar_url = pub.publicUrl;
  }

  const { count: posts } = await supabaseAdmin
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', data.id);
  const { count: followers } = await supabaseAdmin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', data.id);
  const { count: following } = await supabaseAdmin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', data.id);

  res.json({
    profile: {
      ...data,
      avatar_url,
      counts: { posts: posts || 0, followers: followers || 0, following: following || 0 },
    },
  });
});

router.patch('/', requireAuth, upload.single('avatar'), async (req, res) => {
  const { full_name, bio, website, username } = req.body;
  let avatar_path;
  if (req.file) {
    const ext = req.file.originalname.split('.').pop();
    const key = `${req.user.id}/${uuidv4()}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from('avatars')
      .upload(key, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
    if (upErr) return res.status(500).json({ error: upErr.message });
    avatar_path = key;
  }
  if (username) {
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', req.user.id)
      .maybeSingle();
    if (existing) return res.status(409).json({ error: 'Username taken' });
  }
  const update = { full_name, bio, website };
  if (avatar_path) update.avatar_path = avatar_path;
  if (username) update.username = username;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(update)
    .eq('id', req.user.id)
    .select('id, username, full_name, bio, website, avatar_path')
    .single();
  if (error) return res.status(500).json({ error: error.message });

  let avatar_url = null;
  if (data.avatar_path) {
    const { data: pub } = supabaseAdmin.storage.from('avatars').getPublicUrl(data.avatar_path);
    avatar_url = pub.publicUrl;
  }

  res.json({ profile: { ...data, avatar_url } });
});

router.get('/:id/posts', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('id, image_url, created_at, caption')
    .eq('author_id', id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ posts: data || [] });
});

export default router;

