import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="brand">InstaClone</Link>
      </div>
      <div className="nav-right">
        {user && (
          <>
            <Link to="/new">New Post</Link>
            <Link to={`/u/${user.username || 'me'}`}>Profile</Link>
            <button onClick={async () => { await logout(); nav('/login'); }}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

