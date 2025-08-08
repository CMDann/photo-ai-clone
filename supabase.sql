-- Enable extensions
create extension if not exists pgcrypto;

-- Public storage buckets
insert into storage.buckets (id, name, public) values ('posts', 'posts', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  avatar_path text,
  bio text,
  website text,
  created_at timestamptz default now()
);

-- Posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  caption text,
  image_path text not null,
  image_url text,
  created_at timestamptz default now()
);
create index if not exists posts_author_id_idx on public.posts(author_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);

-- Likes
create table if not exists public.likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);
create index if not exists likes_post_id_idx on public.likes(post_id);

-- Comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);
create index if not exists comments_post_id_idx on public.comments(post_id);

-- Follows
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);
create index if not exists follows_follower_idx on public.follows(follower_id);
create index if not exists follows_following_idx on public.follows(following_id);

-- RLS: enable with permissive reads; writes reserved for service role
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;

do $$ begin
  create policy "Public read profiles" on public.profiles for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public read posts" on public.posts for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public read likes" on public.likes for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public read comments" on public.comments for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public read follows" on public.follows for select using (true);
exception when duplicate_object then null; end $$;

-- Storage policies: allow public read
do $$ begin
  create policy "Public read posts images" on storage.objects for select to public using (bucket_id = 'posts');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public read avatars images" on storage.objects for select to public using (bucket_id = 'avatars');
exception when duplicate_object then null; end $$;

