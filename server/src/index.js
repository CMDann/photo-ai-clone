import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import authRouter from './routes/auth.js';
import postsRouter from './routes/posts.js';
import profilesRouter from './routes/profiles.js';
import followsRouter from './routes/follows.js';
import { attachUser } from './middleware/auth.js';

const app = express();

const corsOrigin = process.env.WEB_ORIGIN || 'http://localhost:5173';

app.use(morgan('dev'));
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/follows', followsRouter);

// Static uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persist uploads within this package folder by default
const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on ${port}`));
