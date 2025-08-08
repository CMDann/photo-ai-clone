InstaClone (React + Node + Supabase)

Overview
- Full-stack Instagram-like app with core features: auth, posts with images, likes, comments, profiles, and follow graph.
- Backend: Node.js (Express) using Supabase (Postgres + Auth + Storage).
- Frontend: Vite + React + React Router.

Quick Start
1) Create a Supabase project and get `SUPABASE_URL`, `anon key`, and `service role key`.
2) Apply `supabase.sql` in the Supabase SQL editor to create tables, buckets, and policies.
3) Server setup:
   - `cd server`
   - Copy `.env.example` to `.env` and fill values.
   - Set `WEB_ORIGIN` to your frontend origin (e.g., http://localhost:5173).
   - Install deps: `npm install`
   - Run: `npm run dev`
4) Web setup:
   - `cd web`
   - Copy `.env.example` to `.env` and set `VITE_API_BASE` to the server URL (e.g., http://localhost:4000)
   - Install deps: `npm install`
   - Run: `npm run dev`

Core Features Implemented
- Sign up, log in/out via Node server (Supabase Auth behind the scenes).
- Create posts with image upload to Supabase Storage.
- Feed of recent posts (prioritizes followed accounts when present).
- Like/unlike posts; view post detail with comments and add comments.
- User profiles with counts and grids; follow/unfollow users.

Design Notes
- The server stores Supabase auth tokens in HttpOnly cookies to protect from XSS.
- All database and storage mutations go through the server using the service role key.
- Storage buckets `posts` and `avatars` are public-read to simplify serving media.

Next Steps (Optional Enhancements)
- Add explore/search, hashtags, stories, and direct messaging.
- Add optimistic UI updates and infinite scroll.
- Add image processing (resize) and rate limiting.
- Add notifications and activity feed.

