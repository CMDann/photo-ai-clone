import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function PostCard({ post, onChange }) {
  const [likeBusy, setLikeBusy] = useState(false);

  const toggleLike = async () => {
    setLikeBusy(true);
    try {
      const newLiked = !post.liked_by_me;
      if (newLiked) await api(`/api/posts/${post.id}/like`, { method: 'POST' });
      else await api(`/api/posts/${post.id}/like`, { method: 'DELETE' });
      onChange && onChange({ ...post, liked_by_me: newLiked });
    } catch (e) {
      // ignore
    } finally {
      setLikeBusy(false);
    }
  };

  return (
    <div className="post">
      <div className="post-header">
        <Link to={`/u/${post.author?.username || ''}`}>@{post.author?.username || 'user'}</Link>
        <span className="date">{new Date(post.created_at).toLocaleString()}</span>
      </div>
      <img src={post.image_url} alt={post.caption || 'post image'} className="post-img" />
      <div className="post-actions">
        <button disabled={likeBusy} onClick={toggleLike}>{post.liked_by_me ? '♥ Unlike' : '♡ Like'}</button>
        <Link to={`/p/${post.id}`}>Comments</Link>
      </div>
      {post.caption && <div className="caption">{post.caption}</div>}
    </div>
  );
}

