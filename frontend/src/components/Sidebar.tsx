import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Car,
  Shield,
  RefreshCw,
  CalendarDays,
  Bell,
  BarChart3,
  ScrollText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { icon: <LayoutDashboard className="w-[18px] h-[18px]" />, label: 'Dashboard',         path: '/'              },
      { icon: <UserPlus        className="w-[18px] h-[18px] text-brand-400" />, label: 'Add Customer', path: '/add-customer' },
    ],
  },
  {
    title: 'CRM',
    items: [
      { icon: <Users    className="w-[18px] h-[18px]" />, label: 'Customers',         path: '/customers'         },
      { icon: <Car      className="w-[18px] h-[18px]" />, label: 'Vehicles',           path: '/vehicles'          },
    ],
  },
  {
    title: 'Operations',
    items: [
      { icon: <RefreshCw    className="w-[18px] h-[18px]" />, label: 'Renewals',          path: '/renewals'        },
      { icon: <CalendarDays className="w-[18px] h-[18px]" />, label: 'Reminder Calendar', path: '/calendar'        },
      { icon: <BarChart3    className="w-[18px] h-[18px]" />, label: 'Reports',           path: '/reports'         },
    ],
  },
  {
    title: 'System',
    items: [
      { icon: <ScrollText className="w-[18px] h-[18px]" />, label: 'Activity Logs',   path: '/activity-logs' },
      { icon: <Settings   className="w-[18px] h-[18px]" />, label: 'Settings',        path: '/settings'      },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const initials = admin?.name
    ? admin.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  return (
    <aside
      className="sidebar flex flex-col relative z-30 transition-all duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ width: collapsed ? '72px' : '240px' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.05]">
        <div className="w-8 h-8 rounded-xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-brand-400" />
        </div>
        {!collapsed && (
          <div className="min-w-0 animate-fade-in">
            <p className="text-sm font-bold text-text-primary truncate tracking-tight">Vaibhav Insurance</p>
            <p className="text-2xs text-text-subtle truncate">Insurance Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-5 no-scrollbar">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.title && !collapsed && (
              <p className="section-label">{section.title}</p>
            )}
            <div className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    title={collapsed ? item.label : undefined}
                    className={`nav-item w-full ${active ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                  >
                    <span className={`flex-shrink-0 nav-icon ${active ? 'text-brand-400' : 'text-text-subtle'}`}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User profile + logout */}
      <div className="border-t border-white/[0.05] p-3 space-y-1">
        {/* Profile row */}
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-600/30 flex items-center justify-center flex-shrink-0 text-brand-400 text-xs font-bold">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-xs font-semibold text-text-primary truncate">{admin?.name || 'Admin'}</p>
              <p className="text-2xs text-text-subtle truncate uppercase tracking-wider">{admin?.role || 'admin'}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`nav-item w-full hover:bg-danger/10 hover:text-danger ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span className="truncate">Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-card border border-white/[0.08] flex items-center justify-center text-text-subtle hover:text-text-primary shadow-card transition-all duration-200 hover:scale-110 z-10"
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft  className="w-3 h-3" />}
      </button>
    </aside>
  );
};
