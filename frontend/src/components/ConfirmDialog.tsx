import React from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig = {
  danger:  { icon: <Trash2 className="w-5 h-5 text-danger" />,         btn: 'bg-danger hover:bg-danger/90 text-white', iconBg: 'bg-danger/10 border-danger/20'   },
  warning: { icon: <AlertTriangle className="w-5 h-5 text-warning" />,  btn: 'bg-warning hover:bg-warning/90 text-black', iconBg: 'bg-warning/10 border-warning/20' },
  info:    { icon: <AlertTriangle className="w-5 h-5 text-brand-400" />,btn: 'btn-primary',                               iconBg: 'bg-brand-600/10 border-brand-600/20' },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const cfg = variantConfig[variant];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-panel max-w-sm p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${cfg.iconBg}`}>
          {cfg.icon}
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
          <p className="text-sm text-text-muted leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="btn-secondary text-sm px-4 py-2"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${cfg.btn}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
