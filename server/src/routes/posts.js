import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { data: following } = await supabaseAdmin.from('follows').select('following_id').eq('follower_id', userId);
  let q = supabaseAdmin
    .from('posts')
    .select('id, caption, image_url, image_path, created_at, author:profiles(id, username, full_name, avatar_path)');
  if (following && following.length > 0) {
    const ids = following.map((f) => f.following_id);
    q = q.in('author_id', ids);
  }
  const { data, error } = await q.order('created_at', { ascending: false }).limit(30);
  if (error) return res.status(500).json({ error: error.message });

  const { data: likesData } = await supabaseAdmin.from('likes').select('post_id').eq('user_id', userId);
  const liked = new Set(likesData?.map((l) => l.post_id) || []);

  res.json({ posts: (data || []).map((p) => ({ ...p, liked_by_me: liked.has(p.id) })) });
});

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  const file = req.file;
  const { caption } = req.body;
  if (!file) return res.status(400).json({ error: 'Image required' });

  const ext = (file.originalname || 'jpg').split('.').pop();
  const key = `${req.user.id}/${uuidv4()}.${ext}`;
  const { error: upErr } = await supabaseAdmin.storage
    .from('posts')
    .upload(key, file.buffer, { contentType: file.mimetype, upsert: false });
  if (upErr) return res.status(500).json({ error: upErr.message });

  const { data: pub } = supabaseAdmin.storage.from('posts').getPublicUrl(key);
  const imageUrl = pub.publicUrl;

  const { data: inserted, error } = await supabaseAdmin
    .from('posts')
    .insert({
      author_id: req.user.id,
      caption: caption || null,
      image_path: key,
      image_url: imageUrl,
    })
    .select('id, caption, image_url, image_path, created_at')
    .single();
  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ post: { ...inserted, author: { id: req.user.id } } });
});

router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('id, caption, image_url, image_path, created_at, author:profiles(id, username, full_name, avatar_path)')
    .eq('id', id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Not found' });

  const { count } = await supabaseAdmin
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', id);
  const { data: comments } = await supabaseAdmin
    .from('comments')
    .select('id, body, created_at, user:profiles(id, username, full_name, avatar_path)')
    .eq('post_id', id)
    .order('created_at', { ascending: true });

  const { data: likedRow } = await supabaseAdmin
    .from('likes')
    .select('post_id')
    .eq('post_id', id)
    .eq('user_id', req.user.id);
  const liked_by_me = (likedRow || []).length > 0;

  res.json({ post: { ...data, like_count: count || 0, comments: comments || [], liked_by_me } });
});

router.post('/:id/like', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.from('likes').insert({ post_id: id, user_id: req.user.id });
  if (error && !String(error.message).includes('duplicate')) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ ok: true });
});

router.delete('/:id/like', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.from('likes').delete().eq('post_id', id).eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

router.get('/:id/comments', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from('comments')
    .select('id, body, created_at, user:profiles(id, username, full_name, avatar_path)')
    .eq('post_id', id)
    .order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ comments: data || [] });
});

router.post('/:id/comments', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'Body required' });
  const { data, error } = await supabaseAdmin
    .from('comments')
    .insert({ id: uuidv4(), post_id: id, user_id: req.user.id, body })
    .select('id, body, created_at')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ comment: data });
});

export default router;

