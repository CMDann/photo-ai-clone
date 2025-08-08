"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api.js';
import Protected from '../../../components/Protected.jsx';

export default function PostDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!id) return;
    api(`/api/posts/${id}`)
      .then((d) => setPost(d.post))
      .catch((e) => setErr(e.message));
  }, [id]);

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment) return;
    const { comment: added } = await api(`/api/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: comment }),
    });
    setPost({ ...post, comments: [...(post.comments || []), added] });
    setComment('');
  };

  return (
    <Protected>
      {err && <div className="center error">{err}</div>}
      {!err && !post && <div className="center">Loading...</div>}
      {post && (
        <div className="post-detail">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image_url} alt="" className="post-detail-img" />
          <div className="post-detail-side">
            <div className="comments">
              {(post.comments || []).map((c) => (
                <div key={c.id} className="comment"><b>@{c.user?.username}</b> {c.body}</div>
              ))}
            </div>
            <form onSubmit={addComment} className="comment-form">
              <input placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} />
              <button>Post</button>
            </form>
          </div>
        </div>
      )}
    </Protected>
  );
}

