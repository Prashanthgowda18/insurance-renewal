import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-fade-in">
      {/* Icon container */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/[0.06] flex items-center justify-center text-text-subtle">
          {icon}
        </div>
        {/* Decorative glow */}
        <div className="absolute inset-0 rounded-2xl bg-brand-600/5 blur-xl" />
      </div>

      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-muted max-w-xs leading-relaxed mb-6">{description}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary"
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </div>
  );
};
