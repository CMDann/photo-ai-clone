"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    api('/api/auth/me')
      .then((d) => { if (mounted) { setUser(d.user); setReady(true); } })
      .catch(() => setReady(true));
    return () => { mounted = false; };
  }, []);

  const login = async (email, password) => {
    await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    const me = await api('/api/auth/me');
    setUser(me.user);
  };

  const signup = async (payload) => {
    await api('/api/auth/signup', { method: 'POST', body: JSON.stringify(payload) });
  };

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, signup, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

