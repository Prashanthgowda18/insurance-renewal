import React, { useEffect, useState } from 'react';
import { ScrollText, RefreshCw, Loader2, User, Shield, Users, Settings, LogIn } from 'lucide-react';
import api from '../services/api';

interface LogEntry {
  id: string;
  adminId: string;
  action: string;
  module: string;
  description: string;
  ipAddress?: string;
  createdAt: string;
}

const ACTION_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  login:   { color: 'text-success bg-success/10 border-success/20',       icon: <LogIn    className="w-3.5 h-3.5" /> },
  create:  { color: 'text-brand-400 bg-brand-600/10 border-brand-600/20', icon: <Users    className="w-3.5 h-3.5" /> },
  update:  { color: 'text-warning bg-warning/10 border-warning/20',       icon: <Settings className="w-3.5 h-3.5" /> },
  delete:  { color: 'text-danger bg-danger/10 border-danger/20',          icon: <Shield   className="w-3.5 h-3.5" /> },
  default: { color: 'text-text-muted bg-white/5 border-white/10',         icon: <ScrollText className="w-3.5 h-3.5" /> },
};

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/logs');
      setLogs(Array.isArray(res.data) ? res.data : (res.data?.logs || []));
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Activity Logs</h1>
          <p className="text-text-muted text-sm mt-1">Full audit trail of administrator actions</p>
        </div>
        <button onClick={fetchLogs} className="btn-ghost border border-white/[0.06] px-3 py-2 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {isLoading && logs.length === 0 ? (
        <div className="glass-card flex items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          <p className="text-sm text-text-muted">Loading logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-center text-text-subtle">
          <ScrollText className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">No activity logs yet</p>
          <p className="text-xs mt-1">Logs will appear as actions are performed</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Description</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const cfg = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.default;
                  return (
                    <tr key={log.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.02}s` }}>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                          {cfg.icon}
                          <span className="capitalize">{log.action}</span>
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-muted text-[10px] capitalize">{log.module}</span>
                      </td>
                      <td className="max-w-xs">
                        <p className="text-sm text-text-muted truncate" title={log.description}>{log.description}</p>
                      </td>
                      <td>
                        <span className="text-xs font-mono text-text-subtle">{log.ipAddress || '—'}</span>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="text-xs text-text-subtle">{new Date(log.createdAt).toLocaleString()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
