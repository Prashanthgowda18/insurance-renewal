import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = true,
  variant,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const activeDanger = isDanger || variant === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card max-w-md w-full p-6 space-y-5 border border-white/10 shadow-2xl relative animate-slide-up">
        
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 text-text-subtle hover:text-text-primary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            activeDanger ? 'bg-danger/15 border border-danger/30 text-danger' : 'bg-warning/15 border border-warning/30 text-warning'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">{title}</h3>
            <p className="text-xs text-text-muted mt-0.5">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="btn-ghost border border-white/10 px-4 py-2 text-xs font-semibold"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 ${
              activeDanger
                ? 'bg-danger hover:bg-danger/90 text-white shadow-danger/20'
                : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/20'
            }`}
          >
            {isLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</> : confirmLabel}
          </button>
        </div>

      </div>
    </div>
  );
};
