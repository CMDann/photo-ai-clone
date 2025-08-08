Server (Express + SQLite)

Environment
- Copy .env.example to .env and fill values.
- Key vars: JWT_SECRET, DB_FILE (SQLite path), UPLOAD_DIR, PUBLIC_BASE_URL, WEB_ORIGIN.

Scripts
- dev: node --watch src/index.js
- start: node src/index.js

API Overview
- POST /api/auth/signup { email, password, username, fullName }
- POST /api/auth/login { email, password }
- POST /api/auth/logout
- GET  /api/auth/me
- GET  /api/posts
- POST /api/posts (multipart form: image, caption)
- GET  /api/posts/:id
- POST /api/posts/:id/like
- DELETE /api/posts/:id/like
- GET  /api/posts/:id/comments
- POST /api/posts/:id/comments { body }
- GET  /api/profiles/by-username/:username
- PATCH /api/profiles (multipart optional: avatar + fields)
- GET  /api/profiles/:id/posts
- POST /api/follows/:id
- DELETE /api/follows/:id
- GET  /api/follows/status/:id

Notes
- Auth uses JWT in HttpOnly cookie named `session`.
- SQLite is embedded; data file at DB_FILE.
- Uploaded images are stored under UPLOAD_DIR and served at `/uploads/...`.
