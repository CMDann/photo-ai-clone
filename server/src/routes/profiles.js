import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dbGet, dbAll, dbRun } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const upload = multer({ storage: multer.memoryStorage() });
const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });
const publicBase = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;

router.get('/by-username/:username', async (req, res) => {
  const { username } = req.params;
  const data = dbGet('select id, username, full_name, bio, website, avatar_path from profiles where username = ?', [username]);
  if (!data) return res.status(404).json({ error: 'Not found' });
  let avatar_url = null;
  if (data.avatar_path) avatar_url = `${publicBase}/uploads/${data.avatar_path}`;
  const posts = dbGet('select count(*) as c from posts where author_id = ?', [data.id]).c;
  const followers = dbGet('select count(*) as c from follows where following_id = ?', [data.id]).c;
  const following = dbGet('select count(*) as c from follows where follower_id = ?', [data.id]).c;
  res.json({ profile: { ...data, avatar_url, counts: { posts, followers, following } } });
});

router.patch('/', requireAuth, upload.single('avatar'), async (req, res) => {
  const { full_name, bio, website, username } = req.body || {};
  let avatar_path;
  if (req.file) {
    const ext = (req.file.originalname || 'jpg').split('.').pop();
    const dir = path.join(avatarsDir, req.user.id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const key = `${uuidv4()}.${ext}`;
    const saved = path.join(dir, key);
    fs.writeFileSync(saved, req.file.buffer);
    avatar_path = path.relative(uploadsDir, saved).split(path.sep).join('/');
  }
  if (username) {
    const existing = dbGet('select id from profiles where username = ? and id != ?', [username, req.user.id]);
    if (existing) return res.status(409).json({ error: 'Username taken' });
  }
  const updateFields = [];
  const params = [];
  if (full_name !== undefined) { updateFields.push('full_name = ?'); params.push(full_name || null); }
  if (bio !== undefined) { updateFields.push('bio = ?'); params.push(bio || null); }
  if (website !== undefined) { updateFields.push('website = ?'); params.push(website || null); }
  if (avatar_path) { updateFields.push('avatar_path = ?'); params.push(avatar_path); }
  if (username) { updateFields.push('username = ?'); params.push(username); }
  if (updateFields.length > 0) {
    params.push(req.user.id);
    dbRun(`update profiles set ${updateFields.join(', ')} where id = ?`, params);
  }
  const data = dbGet('select id, username, full_name, bio, website, avatar_path from profiles where id = ?', [req.user.id]);
  const avatar_url = data.avatar_path ? `${publicBase}/uploads/${data.avatar_path}` : null;
  res.json({ profile: { ...data, avatar_url } });
});

router.get('/:id/posts', async (req, res) => {
  const { id } = req.params;
  const data = dbAll('select id, image_url, created_at, caption from posts where author_id = ? order by created_at desc', [id]);
  res.json({ posts: data || [] });
});

export default router;
