import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { dbGet, dbAll, dbRun } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const uploadsDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'server', 'uploads');
const postsDir = path.join(uploadsDir, 'posts');
if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });
const publicBase = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;

router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const following = dbAll('select following_id from follows where follower_id = ?', [userId]).map(r => r.following_id);
  let rows;
  if (following.length > 0) {
    const placeholders = following.map(() => '?').join(',');
    rows = dbAll(`
      select p.id, p.caption, p.image_url, p.image_path, p.created_at,
             pr.id as author_id, pr.username, pr.full_name, pr.avatar_path
      from posts p
      join profiles pr on pr.id = p.author_id
      where p.author_id in (${placeholders})
      order by p.created_at desc
      limit 30
    `, following);
  } else {
    rows = dbAll(`
      select p.id, p.caption, p.image_url, p.image_path, p.created_at,
             pr.id as author_id, pr.username, pr.full_name, pr.avatar_path
      from posts p
      join profiles pr on pr.id = p.author_id
      order by p.created_at desc
      limit 30
    `);
  }
  const liked = new Set(dbAll('select post_id from likes where user_id = ?', [userId]).map(r => r.post_id));
  const posts = (rows || []).map(r => ({
    id: r.id,
    caption: r.caption,
    image_url: r.image_url,
    image_path: r.image_path,
    created_at: r.created_at,
    author: { id: r.author_id, username: r.username, full_name: r.full_name, avatar_path: r.avatar_path },
    liked_by_me: liked.has(r.id),
  }));
  res.json({ posts });
});

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  const file = req.file;
  const { caption } = req.body || {};
  if (!file) return res.status(400).json({ error: 'Image required' });

  const ext = (file.originalname || 'jpg').split('.').pop();
  const dir = path.join(postsDir, req.user.id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const key = `${uuidv4()}.${ext}`;
  const savedPath = path.join(dir, key);
  fs.writeFileSync(savedPath, file.buffer);
  const relPath = path.relative(uploadsDir, savedPath).split(path.sep).join('/');
  const imageUrl = `${publicBase}/uploads/${relPath}`;

  const id = uuidv4();
  dbRun('insert into posts (id, author_id, caption, image_path, image_url) values (?, ?, ?, ?, ?)', [id, req.user.id, caption || null, relPath, imageUrl]);
  const inserted = dbGet('select id, caption, image_url, image_path, created_at from posts where id = ?', [id]);
  res.status(201).json({ post: { ...inserted, author: { id: req.user.id } } });
});

router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const post = dbGet(`
    select p.id, p.caption, p.image_url, p.image_path, p.created_at,
           pr.id as author_id, pr.username, pr.full_name, pr.avatar_path
    from posts p join profiles pr on pr.id = p.author_id
    where p.id = ?
  `, [id]);
  if (!post) return res.status(404).json({ error: 'Not found' });
  const likeCount = dbGet('select count(*) as c from likes where post_id = ?', [id]).c;
  const comments = dbAll(`
    select c.id, c.body, c.created_at,
           pr.id as user_id, pr.username, pr.full_name, pr.avatar_path
    from comments c join profiles pr on pr.id = c.user_id
    where c.post_id = ? order by c.created_at asc
  `, [id]).map(r => ({ id: r.id, body: r.body, created_at: r.created_at, user: { id: r.user_id, username: r.username, full_name: r.full_name, avatar_path: r.avatar_path } }));
  const liked_by_me = !!dbGet('select 1 as one from likes where post_id = ? and user_id = ?', [id, req.user.id]);
  res.json({ post: {
    id: post.id, caption: post.caption, image_url: post.image_url, image_path: post.image_path, created_at: post.created_at,
    author: { id: post.author_id, username: post.username, full_name: post.full_name, avatar_path: post.avatar_path },
    like_count: likeCount, comments, liked_by_me,
  }});
});

router.post('/:id/like', requireAuth, async (req, res) => {
  const { id } = req.params;
  try { dbRun('insert into likes (post_id, user_id) values (?, ?)', [id, req.user.id]); } catch {}
  res.json({ ok: true });
});

router.delete('/:id/like', requireAuth, async (req, res) => {
  const { id } = req.params;
  dbRun('delete from likes where post_id = ? and user_id = ?', [id, req.user.id]);
  res.json({ ok: true });
});

router.get('/:id/comments', requireAuth, async (req, res) => {
  const { id } = req.params;
  const data = dbAll(`
    select c.id, c.body, c.created_at, pr.id as user_id, pr.username, pr.full_name, pr.avatar_path
    from comments c join profiles pr on pr.id = c.user_id
    where c.post_id = ? order by c.created_at asc
  `, [id]).map(r => ({ id: r.id, body: r.body, created_at: r.created_at, user: { id: r.user_id, username: r.username, full_name: r.full_name, avatar_path: r.avatar_path } }));
  res.json({ comments: data || [] });
});

router.post('/:id/comments', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { body } = req.body || {};
  if (!body) return res.status(400).json({ error: 'Body required' });
  const cid = uuidv4();
  dbRun('insert into comments (id, post_id, user_id, body) values (?, ?, ?, ?)', [cid, id, req.user.id, body]);
  const data = dbGet('select id, body, created_at from comments where id = ?', [cid]);
  res.status(201).json({ comment: data });
});

export default router;
