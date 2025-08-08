"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '../lib/api.js';

export default function PostCard({ post, onChange }) {
  const [likeBusy, setLikeBusy] = useState(false);

  const toggleLike = async () => {
    setLikeBusy(true);
    try {
      const newLiked = !post.liked_by_me;
      if (newLiked) await api(`/api/posts/${post.id}/like`, { method: 'POST' });
      else await api(`/api/posts/${post.id}/like`, { method: 'DELETE' });
      onChange && onChange({ ...post, liked_by_me: newLiked });
    } catch {}
    finally { setLikeBusy(false); }
  };

  return (
    <div className="post">
      <div className="post-header">
        <Link href={`/u/${post.author?.username || ''}`}>@{post.author?.username || 'user'}</Link>
        <span className="date">{new Date(post.created_at).toLocaleString()}</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={post.image_url} alt={post.caption || 'post image'} className="post-img" />
      <div className="post-actions">
        <button disabled={likeBusy} onClick={toggleLike}>{post.liked_by_me ? '♥ Unlike' : '♡ Like'}</button>
        <Link href={`/p/${post.id}`}>Comments</Link>
      </div>
      {post.caption && <div className="caption">{post.caption}</div>}
    </div>
  );
}

