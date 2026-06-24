import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import '../admin.css';

interface LoginPageProps {
  setPage: (page: string) => void;
  isAdmin: boolean;
}

export function LoginPage({ setPage, isAdmin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in both fields.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Check if user has an admin profile
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile || !['admin', 'staff'].includes(profile.role)) {
          // Sign them out immediately if they aren't admin/staff
          await supabase.auth.signOut();
          setError('Access denied. Admin privileges required.');
          setLoading(false);
          return;
        }

        // Successfully logged in as admin
        setPage('admin/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-login-section">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <a href="#/" onClick={() => setPage('home')} className="admin-login-logo-link">
            <img
              src="/images/logo.png"
              alt="Olive Green Resort & Villas"
              className="admin-login-logo"
            />
          </a>
          <span className="tiny-label">Control Panel</span>
          <h2 className="admin-login-title">Admin Login</h2>
        </div>

        <form className="booking-form admin-login-form" onSubmit={handleLogin} noValidate>
          <label>
            <span>Email Address</span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              disabled={loading}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </label>

          {error && (
            <div className="admin-form-error">{error}</div>
          )}

          <button type="submit" disabled={loading} className="admin-form-submit">
            {loading ? 'Authenticating...' : 'Access Dashboard'}
            <ArrowRight size={19} />
          </button>
        </form>

        <div className="admin-login-back">
          <a
            href="#/"
            onClick={() => setPage('home')}
            className="admin-login-back-link"
          >
            Back to main site
          </a>
        </div>
      </div>
    </section>
  );
}
