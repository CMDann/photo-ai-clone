import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbFile = process.env.DB_FILE || path.join(process.cwd(), 'server', 'data.sqlite');
const dataDir = path.dirname(dbFile);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  create table if not exists users (
    id text primary key,
    email text unique not null,
    password_hash text not null,
    created_at text default (datetime('now'))
  );

  create table if not exists profiles (
    id text primary key references users(id) on delete cascade,
    username text unique not null,
    full_name text,
    avatar_path text,
    bio text,
    website text,
    created_at text default (datetime('now'))
  );

  create table if not exists posts (
    id text primary key,
    author_id text not null references users(id) on delete cascade,
    caption text,
    image_path text not null,
    image_url text,
    created_at text default (datetime('now'))
  );
  create index if not exists posts_author_idx on posts(author_id);
  create index if not exists posts_created_idx on posts(created_at);

  create table if not exists likes (
    user_id text not null references users(id) on delete cascade,
    post_id text not null references posts(id) on delete cascade,
    created_at text default (datetime('now')),
    primary key (user_id, post_id)
  );
  create index if not exists likes_post_idx on likes(post_id);

  create table if not exists comments (
    id text primary key,
    user_id text not null references users(id) on delete cascade,
    post_id text not null references posts(id) on delete cascade,
    body text not null,
    created_at text default (datetime('now'))
  );
  create index if not exists comments_post_idx on comments(post_id);

  create table if not exists follows (
    follower_id text not null references users(id) on delete cascade,
    following_id text not null references users(id) on delete cascade,
    created_at text default (datetime('now')),
    primary key (follower_id, following_id)
  );
  create index if not exists follows_follower_idx on follows(follower_id);
  create index if not exists follows_following_idx on follows(following_id);
`);

export function transaction(fn) {
  const trx = db.transaction(fn);
  return trx();
}

