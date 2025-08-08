import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import PostCard from '../components/PostCard.jsx';

export default function Feed() {
  const [posts, setPosts] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api('/api/posts')
      .then((d) => setPosts(d.posts))
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="center error">{err}</div>;
  if (!posts) return <div className="center">Loading feed...</div>;
  if (posts.length === 0) return <div className="center">No posts yet. Follow users or create one!</div>;

  return (
    <div className="feed">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} onChange={(np) => setPosts(posts.map((x) => (x.id === np.id ? np : x)))} />
      ))}
    </div>
  );
}

