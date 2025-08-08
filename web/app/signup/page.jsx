"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/AuthContext.jsx';

export default function SignupPage() {
  const { signup, login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', username: '', fullName: '' });
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      await signup(form);
      await login(form.email, form.password);
      router.replace('/');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center">
      <h2>Sign up</h2>
      <form onSubmit={submit} className="card">
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        <input placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {err && <div className="error">{err}</div>}
        <button disabled={loading}>{loading ? 'Signing up...' : 'Create Account'}</button>
      </form>
      <p>Have an account? <Link href="/login">Log in</Link></p>
    </div>
  );
}

