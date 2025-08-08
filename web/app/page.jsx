"use client";
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import Protected from '../components/Protected.jsx';
import PostCard from '../components/PostCard.jsx';

export default function FeedPage() {
  const [posts, setPosts] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api('/api/posts')
      .then((d) => setPosts(d.posts))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <Protected>
      {err && <div className="center error">{err}</div>}
      {!err && !posts && <div className="center">Loading feed...</div>}
      {!err && posts && posts.length === 0 && <div className="center">No posts yet. Follow users or create one!</div>}
      <div className="feed">
        {(posts || []).map((p) => (
          <PostCard key={p.id} post={p} onChange={(np) => setPosts((cur) => cur.map((x) => (x.id === np.id ? np : x)))} />
        ))}
      </div>
    </Protected>
  );
}

