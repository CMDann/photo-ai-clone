import path from 'path';
import fs from 'fs';
import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persist the SQLite file within this package folder by default
const dbFile = process.env.DB_FILE || path.join(__dirname, '..', 'data.sqlite');
const dataDir = path.dirname(dbFile);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Ensure the wasm path points to this package's local node_modules
const wasmPath = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
const SQL = await initSqlJs({ locateFile: () => wasmPath });

let db;
if (fs.existsSync(dbFile)) {
  const filebuffer = fs.readFileSync(dbFile);
  db = new SQL.Database(filebuffer);
} else {
  db = new SQL.Database();
}

function persist() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbFile, buffer);
}

export function dbExec(sql) {
  db.exec(sql);
  persist();
}

export function dbRun(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  persist();
}

export function dbGet(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : undefined;
  stmt.free();
  return row;
}

export function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

export function transaction(fn) {
  try {
    db.exec('BEGIN;');
    const result = fn();
    db.exec('COMMIT;');
    persist();
    return result;
  } catch (e) {
    try { db.exec('ROLLBACK;'); } catch {}
    throw e;
  }
}

// Schema
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
persist();
