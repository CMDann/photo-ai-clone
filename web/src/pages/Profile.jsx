import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const p = await api(`/api/profiles/by-username/${username}`);
      if (!mounted) return;
      setProfile(p.profile);
      const { posts } = await api(`/api/profiles/${p.profile.id}/posts`);
      setPosts(posts);
      if (me && me.id !== p.profile.id) {
        const s = await api(`/api/follows/status/${p.profile.id}`);
        setFollowing(s.following);
      }
    })().catch((err) => console.error(err));
    return () => {
      mounted = false;
    };
  }, [username, me?.id]);

  const toggleFollow = async () => {
    if (!profile) return;
    if (following) await api(`/api/follows/${profile.id}`, { method: 'DELETE' });
    else await api(`/api/follows/${profile.id}`, { method: 'POST' });
    setFollowing(!following);
  };

  if (!profile) return <div className="center">Loading profile...</div>;

  const isMe = me?.id === profile.id;

  return (
    <div>
      <div className="profile-header">
        <div className="avatar">
          {profile.avatar_url ? <img src={profile.avatar_url} /> : profile.username[0].toUpperCase()}
        </div>
        <div>
          <h2>@{profile.username}</h2>
          <div className="counts">
            <span><b>{profile.counts?.posts || 0}</b> posts</span>
            <span><b>{profile.counts?.followers || 0}</b> followers</span>
            <span><b>{profile.counts?.following || 0}</b> following</span>
          </div>
          {!isMe && <button onClick={toggleFollow}>{following ? 'Unfollow' : 'Follow'}</button>}
        </div>
      </div>
      <div className="grid">
        {posts.map((p) => (
          <img key={p.id} src={p.image_url} alt="" className="grid-img" />
        ))}
      </div>
    </div>
  );
}

