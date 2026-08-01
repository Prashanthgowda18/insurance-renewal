import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: string;
  trend?: { value: number; label: string };
  accent?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const accentMap = {
  blue:   { bg: 'bg-brand-600/10',  border: 'border-brand-600/20',  text: 'text-brand-400',   glow: 'rgba(37,99,235,0.15)'    },
  green:  { bg: 'bg-success/10',    border: 'border-success/20',    text: 'text-success',      glow: 'rgba(34,197,94,0.15)'   },
  yellow: { bg: 'bg-warning/10',    border: 'border-warning/20',    text: 'text-warning',      glow: 'rgba(245,158,11,0.15)'  },
  red:    { bg: 'bg-danger/10',     border: 'border-danger/20',     text: 'text-danger',       glow: 'rgba(239,68,68,0.15)'   },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400',   glow: 'rgba(168,85,247,0.15)'  },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400',   glow: 'rgba(99,102,241,0.15)'  },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  iconColor,
  trend,
  accent = 'blue',
  subtitle,
  size = 'md',
  onClick,
}) => {
  const colors = accentMap[accent];
  const isClickable = !!onClick;

  return (
    <div
      className={`stat-card ${isClickable ? 'cursor-pointer' : ''} animate-fade-in`}
      onClick={onClick}
      style={isClickable ? { transition: 'transform 0.2s ease, box-shadow 0.2s ease' } : undefined}
      onMouseEnter={isClickable ? (e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      } : undefined}
      onMouseLeave={isClickable ? (e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      } : undefined}
    >
      {/* Icon + Label Row */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-2xs font-semibold uppercase tracking-widest text-text-subtle mb-1">
            {label}
          </p>
          <p className={`font-bold text-text-primary leading-none ${
            size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-xl' : 'text-3xl'
          }`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-text-muted mt-1">{subtitle}</p>
          )}
        </div>

        <div className={`flex-shrink-0 p-2.5 rounded-xl ${colors.bg} border ${colors.border} ${iconColor ?? colors.text}`}>
          {icon}
        </div>
      </div>

      {/* Trend indicator */}
      {trend && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-xs font-semibold ${trend.value >= 0 ? 'text-success' : 'text-danger'}`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-2xs text-text-subtle">{trend.label}</span>
        </div>
      )}
    </div>
  );
};
