"use client";
import React from 'react';
import { AuthProvider } from '../components/AuthContext.jsx';

export default function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

