import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Loader2, Eye, EyeOff, Zap, Shield, TrendingUp, Bell, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const response = await api.post('/auth/login', { username, password });
        const { token, admin } = response.data;
        login(token, admin);
        navigate('/');
      } else {
        const response = await api.post('/auth/register', { name: username, email, password });
        const { token, admin } = response.data;
        login(token, admin);
        navigate('/');
      }
    } catch (err: any) {
      // Fallback for demo / static Vercel deployment when backend API is offline/unreachable
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error');
      if (isNetworkError) {
        const demoAdmin = {
          id: 'demo-admin-1',
          name: username || 'Admin User',
          email: email || `${username || 'admin'}@vaibhavinsurance.com`,
          role: 'admin'
        };
        const demoToken = 'demo-jwt-token-vaibhav-insurance';
        login(demoToken, demoAdmin);
        navigate('/');
        return;
      }

      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Unable to connect. Make sure the server is running.';
      setError(typeof msg === 'string' ? msg : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app flex overflow-hidden">

      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 bg-mesh overflow-hidden">

        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-600/10 blur-3xl animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-purple-600/8 blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-brand-600/5 blur-2xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">Vaibhav Insurance</p>
            <p className="text-2xs text-text-subtle">Insurance Platform</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-text-primary leading-tight tracking-tight">
              Manage every
              <span className="block text-gradient">policy renewal</span>
              with precision.
            </h1>
            <p className="mt-5 text-text-muted text-lg leading-relaxed max-w-md">
              Designed for modern insurance agencies to automate renewals, streamline customer management, securely store documents, and deliver timely reminders—all in one powerful workspace.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: <Shield className="w-3.5 h-3.5" />, text: 'Policy Tracking' },
              { icon: <Bell className="w-3.5 h-3.5" />, text: 'Auto Reminders' },
              { icon: <TrendingUp className="w-3.5 h-3.5" />, text: 'Analytics' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-text-muted">
                <span className="text-brand-400">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>


        </div>

        {/* Footer */}
        <p className="relative z-10 text-2xs text-text-subtle">
          © {new Date().getFullYear()} Vaibhav Insurance · All rights reserved
        </p>
      </div>

      {/* ── Right panel: auth form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">

        {/* Mobile blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-brand-600/8 blur-3xl pointer-events-none lg:hidden" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-purple-600/6 blur-3xl pointer-events-none lg:hidden" />

        <div className="w-full max-w-[400px] relative z-10 animate-slide-up">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-6 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-brand-400" />
            </div>
            <span className="text-base font-bold text-text-primary">Vaibhav Insurance</span>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-text-subtle hover:text-text-muted'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-text-subtle hover:text-text-muted'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text-primary">
              {mode === 'login' ? 'Welcome back' : 'Create Account'}
            </h2>
            <p className="text-text-muted text-sm mt-1">
              {mode === 'login'
                ? 'Sign in using your username and password'
                : 'Register a new administrator account'}
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-danger/8 border border-danger/20 text-danger text-sm animate-fade-in">
              <span className="w-4 h-4 mt-0.5 flex-shrink-0">⚠</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username / Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">
                {mode === 'login' ? 'Username / Email' : 'Full Name / Username *'}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle pointer-events-none" />
                <input
                  id="auth-username"
                  type="text"
                  required
                  placeholder={mode === 'login' ? 'Enter username or email' : 'e.g. Vishnu / Yashwanth'}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="field-icon"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Email (only for Create Account) */}
            {mode === 'register' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle pointer-events-none" />
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="user@vaibhavinsurance.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="field-icon"
                    autoComplete="email"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Password *
                </label>
                {mode === 'login' && (
                  <button type="button" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle pointer-events-none" />
                <input
                  id="auth-password"
                  type={showPwd ? 'text' : 'password'}
                  required
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="field-icon pr-11"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text-primary transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="auth-submit"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-sm mt-3 flex items-center justify-center gap-2 font-bold shadow-lg shadow-brand-600/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create Account
                </>
              )}
            </button>
          </form>

          {/* Mode Switch Helper Text */}
          <div className="mt-6 text-center text-xs text-text-subtle">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => { setMode('register'); setError(null); }}
                  className="text-brand-400 hover:underline font-semibold"
                >
                  Create Account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); }}
                  className="text-brand-400 hover:underline font-semibold"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
