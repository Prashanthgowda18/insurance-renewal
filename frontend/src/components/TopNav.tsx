import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TopNavProps {
  upcomingCount?: number;
  companyName?: string;
}

export const TopNav: React.FC<TopNavProps> = ({ upcomingCount = 0, companyName = 'Vaibhav Insurance' }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = admin?.name
    ? admin.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar sticky top-0 z-20 flex items-center gap-4 px-6">
      {/* Logo mark (mobile) */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="w-7 h-7 rounded-lg bg-brand-600/20 border border-brand-600/30 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-brand-400" />
        </div>
        <span className="text-sm font-bold text-text-primary">{companyName}</span>
      </div>

      <div className="flex-1" />

      <div className="ml-auto flex items-center gap-2">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] flex items-center justify-center text-text-muted hover:text-text-primary transition-all duration-200"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-warning animate-fade-in" />
          ) : (
            <Moon className="w-4 h-4 text-brand-500 animate-fade-in" />
          )}
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => navigate('/reminder-history')}
          className="relative w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] flex items-center justify-center text-text-muted hover:text-text-primary transition-all duration-200"
        >
          <Bell className="w-4 h-4" />
          {upcomingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center px-1">
              {upcomingCount > 99 ? '99+' : upcomingCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/[0.06] mx-1" />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all duration-200"
          >
            <div className="w-7 h-7 rounded-full bg-brand-600/25 border border-brand-600/30 flex items-center justify-center text-brand-400 text-xs font-bold">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-text-primary leading-none">{admin?.name || 'Admin'}</p>
              <p className="text-[10px] text-text-subtle capitalize mt-0.5">{admin?.role || 'admin'}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-text-subtle transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown menu */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 glass-panel border border-white/[0.08] rounded-2xl py-1.5 shadow-modal animate-scale-in z-50">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-sm font-semibold text-text-primary">{admin?.name}</p>
                <p className="text-xs text-text-subtle">{admin?.email}</p>
              </div>

              <div className="py-1.5">
                <button
                  onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                >
                  <User className="w-4 h-4" /> Profile
                </button>
                <button
                  onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
              </div>

              <div className="border-t border-white/[0.06] pt-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/[0.08] transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
