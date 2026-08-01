import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useToast } from './Toast';

export interface WhatsAppData {
  customerName: string;
  mobile: string;
  companyName?: string;
  companyPhone?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  expiryDate?: string;
  insuranceCompany?: string;
  policyNumber?: string;
}

export function formatWhatsAppNumber(mobile: string): string | null {
  if (!mobile) return null;
  const digits = mobile.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  if (/^[6-9]\d{9}$/.test(last10)) {
    return `91${last10}`;
  }
  return null;
}

export function buildWhatsAppMessage(data: WhatsAppData): string {
  const vType = data.vehicleType ? data.vehicleType.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Vehicle';
  const vNum = data.vehicleNumber || '—';
  let expDate = '—';
  if (data.expiryDate) {
    const d = new Date(data.expiryDate);
    if (!isNaN(d.getTime())) {
      expDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  const insComp = data.insuranceCompany || '—';
  const polNum = data.policyNumber || '—';

  return `🚗 Vaibhav Insurance

Hello ${data.customerName},

Your vehicle insurance is due for renewal.

📋 Vehicle Number: ${vNum}
🚘 Vehicle Type: ${vType}
🏢 Insurance Company: ${insComp}
📄 Policy Number: ${polNum}
📅 Expiry Date: ${expDate}

Please renew your insurance before the expiry date to avoid interruption in coverage.

Need assistance?

📞 Vishnu: +91 7676507977
📞 Yashwanth: +91 6362719134

Thank you for choosing Vaibhav Insurance.
Have a safe journey! 🚗`;
}

interface WhatsAppButtonProps {
  data: WhatsAppData;
  variant?: 'full' | 'compact' | 'icon';
  className?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  data,
  variant = 'full',
  className = '',
}) => {
  const { success: toastSuccess } = useToast();
  const phone91 = formatWhatsAppNumber(data.mobile);
  const isValid = !!phone91;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isValid || !phone91) return;

    const message = buildWhatsAppMessage(data);
    const url = `https://wa.me/${phone91}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toastSuccess('WhatsApp opened successfully.');
  };

  if (!isValid) {
    return (
      <button
        disabled
        title="Valid mobile number required."
        className={`opacity-50 cursor-not-allowed flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-700 ${className}`}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        {variant === 'full' ? 'Valid mobile number required' : variant === 'compact' ? 'WhatsApp' : ''}
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title="Send WhatsApp Reminder"
        className={`p-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
      >
        <MessageSquare className="w-4 h-4 fill-[#25D366]/20" />
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title="Send WhatsApp Reminder"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 ${className}`}
      >
        <MessageSquare className="w-3.5 h-3.5 fill-white/20" />
        WhatsApp
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Send WhatsApp Reminder"
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 ${className}`}
    >
      <MessageSquare className="w-4 h-4 fill-white/20" />
      Send WhatsApp Reminder
    </button>
  );
};
