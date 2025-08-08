Server (Express + Supabase)

Environment
- Copy .env.example to .env and fill values.
- Ensure buckets 'posts' and 'avatars' exist (apply supabase.sql at project root).

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
- Auth uses Supabase GoTrue; tokens stored in HttpOnly cookies.
- All DB/storage ops use the service role key on the server.

