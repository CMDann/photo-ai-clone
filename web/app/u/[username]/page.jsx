"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api.js';
import { useAuth } from '../../../components/AuthContext.jsx';
import Protected from '../../../components/Protected.jsx';

export default function ProfilePage() {
  const params = useParams();
  const username = params?.username;
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!username) return;
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
    return () => { mounted = false; };
  }, [username, me?.id]);

  const toggleFollow = async () => {
    if (!profile) return;
    if (following) await api(`/api/follows/${profile.id}`, { method: 'DELETE' });
    else await api(`/api/follows/${profile.id}`, { method: 'POST' });
    setFollowing(!following);
  };

  return (
    <Protected>
      {!profile && <div className="center">Loading profile...</div>}
      {profile && (
        <div>
          <div className="profile-header">
            <div className="avatar">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="avatar" />
              ) : (
                profile.username[0].toUpperCase()
              )}
            </div>
            <div>
              <h2>@{profile.username}</h2>
              <div className="counts">
                <span><b>{profile.counts?.posts || 0}</b> posts</span>
                <span><b>{profile.counts?.followers || 0}</b> followers</span>
                <span><b>{profile.counts?.following || 0}</b> following</span>
              </div>
              {me?.id !== profile.id && (
                <button onClick={toggleFollow}>{following ? 'Unfollow' : 'Follow'}</button>
              )}
            </div>
          </div>
          <div className="grid">
            {posts.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.id} src={p.image_url} alt="" className="grid-img" />
            ))}
          </div>
        </div>
      )}
    </Protected>
  );
}

