"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link href="/" className="brand">InstaClone</Link>
      </div>
      <div className="nav-right">
        {user && (
          <>
            <Link href="/new">New Post</Link>
            <Link href={`/u/${user.username || 'me'}`}>Profile</Link>
            <button onClick={async () => { await logout(); router.replace('/login'); }}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

