import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  // Policy statuses
  active:          { label: 'Active',          className: 'badge-success', dot: 'bg-success' },
  expired:         { label: 'Expired',         className: 'badge-danger',  dot: 'bg-danger'  },
  cancelled:       { label: 'Cancelled',       className: 'badge-muted',   dot: 'bg-text-subtle' },
  pending:         { label: 'Pending',         className: 'badge-warning', dot: 'bg-warning' },

  // Renewal statuses
  renewed:         { label: 'Renewed',         className: 'badge-success', dot: 'bg-success' },
  reminder_sent:   { label: 'Reminder Sent',   className: 'badge-blue',    dot: 'bg-brand-500' },
  not_contacted:   { label: 'Not Contacted',   className: 'badge-muted',   dot: 'bg-text-subtle' },

  // Customer statuses
  inactive:        { label: 'Inactive',        className: 'badge-danger',  dot: 'bg-danger' },

  // Notification channels
  whatsapp:        { label: 'WhatsApp',        className: 'badge-success', dot: 'bg-success' },
  sms:             { label: 'SMS',             className: 'badge-blue',    dot: 'bg-brand-500' },
  email:           { label: 'Email',           className: 'badge-warning', dot: 'bg-warning' },

  // Delivery statuses
  sent:            { label: 'Sent',            className: 'badge-success', dot: 'bg-success' },
  failed:          { label: 'Failed',          className: 'badge-danger',  dot: 'bg-danger'  },
  delivered:       { label: 'Delivered',       className: 'badge-success', dot: 'bg-success' },
  undelivered:     { label: 'Undelivered',     className: 'badge-danger',  dot: 'bg-danger'  },

  // Days urgency
  critical:        { label: 'Critical',        className: 'badge-danger',  dot: 'bg-danger'  },
  urgent:          { label: 'Urgent',          className: 'badge-warning', dot: 'bg-warning' },
  upcoming:        { label: 'Upcoming',        className: 'badge-blue',    dot: 'bg-brand-500' },
};

function getDaysStatus(days: number) {
  if (days < 0)  return statusConfig.expired;
  if (days === 0) return { label: 'Today!', className: 'badge-danger', dot: 'bg-danger' };
  if (days <= 3)  return { label: `${days}d`, className: 'badge-danger', dot: 'bg-danger' };
  if (days <= 7)  return { label: `${days}d`, className: 'badge-warning', dot: 'bg-warning' };
  if (days <= 30) return { label: `${days}d`, className: 'badge-blue', dot: 'bg-brand-500' };
  return { label: `${days}d`, className: 'badge-success', dot: 'bg-success' };
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status?.toLowerCase()] ?? {
    label: status,
    className: 'badge-muted',
    dot: 'bg-text-subtle',
  };

  return (
    <span className={`badge ${config.className} ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} />
      {config.label}
    </span>
  );
};

export const DaysBadge: React.FC<{ days: number }> = ({ days }) => {
  const config = getDaysStatus(days);
  return (
    <span className={`badge ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} />
      {days < 0 ? `${Math.abs(days)}d ago` : config.label}
    </span>
  );
};
