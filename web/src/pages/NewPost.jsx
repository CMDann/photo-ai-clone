import React, { useState } from 'react';
import { api } from '../api/client.js';
import { useNavigate } from 'react-router-dom';

export default function NewPost() {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return setErr('Please choose an image');
    setErr(null); setBusy(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('caption', caption);
      await api('/api/posts', { method: 'POST', body: fd });
      nav('/');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center">
      <h2>New Post</h2>
      <form onSubmit={submit} className="card">
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <textarea placeholder="Write a caption..." value={caption} onChange={(e) => setCaption(e.target.value)} />
        {err && <div className="error">{err}</div>}
        <button disabled={busy}>{busy ? 'Uploading...' : 'Share'}</button>
      </form>
    </div>
  );
}

