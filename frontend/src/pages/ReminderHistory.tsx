import React, { useEffect, useState } from 'react';
import {
  Bell, MessageSquare, Mail, Smartphone, Clock, CheckCircle,
  XCircle, RefreshCw, Loader2, AlertTriangle,
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

interface NotifRecord {
  id: string;
  recipient?: string;
  policyNumber?: string;
  channel: string;
  status: string;
  deliveryResult?: string;
  sentAt: string;
  reminderType?: string;
}

const CHANNEL_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  whatsapp: { icon: <MessageSquare className="w-4 h-4" />, color: 'text-success bg-success/10 border-success/20'   },
  sms:      { icon: <Smartphone    className="w-4 h-4" />, color: 'text-brand-400 bg-brand-600/10 border-brand-600/20' },
  email:    { icon: <Mail          className="w-4 h-4" />, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

export const ReminderHistory: React.FC = () => {
  const [records, setRecords] = useState<NotifRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterChannel, setFilterChannel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/policies/notifications');
      setRecords(res.data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, []);

  const filtered = records.filter(r => {
    if (filterChannel && r.channel !== filterChannel) return false;
    if (filterStatus  && r.status  !== filterStatus)  return false;
    return true;
  });

  const totalSent    = records.filter(r => r.status === 'sent').length;
  const totalFailed  = records.filter(r => r.status === 'failed').length;
  const successRate  = records.length > 0 ? Math.round((totalSent / records.length) * 100) : 100;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Reminder History</h1>
          <p className="text-text-muted text-sm mt-1">Full notification dispatch log</p>
        </div>
        <button onClick={fetchHistory} className="btn-ghost border border-white/[0.06] px-3 py-2 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Sent',    value: totalSent,   color: 'text-success',   bg: 'bg-success/10'    },
          { label: 'Failed',        value: totalFailed, color: 'text-danger',    bg: 'bg-danger/10'     },
          { label: 'WhatsApp',      value: records.filter(r=>r.channel==='whatsapp').length, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Success Rate',  value: `${successRate}%`, color: 'text-brand-400', bg: 'bg-brand-600/10' },
        ].map(s => (
          <div key={s.label} className={`glass-card p-4 flex items-center gap-3 ${s.bg} border border-white/[0.06]`}>
            <div>
              <p className="text-2xs uppercase tracking-widest text-text-subtle font-semibold">{s.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)} className="field py-2.5 text-sm appearance-none cursor-pointer min-w-[140px]">
          <option value="">All Channels</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
          <option value="email">Email</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="field py-2.5 text-sm appearance-none cursor-pointer min-w-[140px]">
          <option value="">All Statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Timeline */}
      {isLoading && records.length === 0 ? (
        <div className="glass-card flex items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          <p className="text-sm text-text-muted">Loading history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={<Bell className="w-8 h-8" />}
            title="No Notifications Yet"
            description="Notifications will appear here once reminders are triggered."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, i) => {
            const ch = CHANNEL_CONFIG[r.channel] ?? { icon: <Bell className="w-4 h-4" />, color: 'text-text-muted bg-white/5 border-white/10' };
            const isSuccess = r.status === 'sent';
            const isFailed  = r.status === 'failed';
            return (
              <div key={r.id} className="glass-card p-4 flex items-start gap-4 hover:border-white/[0.08] transition-all animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                {/* Channel icon */}
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${ch.color}`}>
                  {ch.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {r.recipient || 'Unknown recipient'}
                      </p>
                      <p className="text-xs text-text-subtle mt-0.5">
                        {r.policyNumber && <span className="font-mono mr-2">{r.policyNumber}</span>}
                        {r.reminderType && <span className="badge badge-muted text-[10px]">{r.reminderType} reminder</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={r.status} size="sm" />
                      <span className="text-xs text-text-subtle whitespace-nowrap">
                        {new Date(r.sentAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {r.deliveryResult && (
                    <div className={`mt-2 flex items-start gap-1.5 text-xs rounded-lg px-3 py-1.5 ${
                      isSuccess ? 'bg-success/5 text-success/80' : isFailed ? 'bg-danger/5 text-danger/80' : 'bg-white/[0.03] text-text-subtle'
                    }`}>
                      {isSuccess ? <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> : isFailed ? <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> : <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                      {r.deliveryResult}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
