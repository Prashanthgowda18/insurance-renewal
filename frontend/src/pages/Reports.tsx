import React, { useEffect, useState } from 'react';
import { BarChart3, Download, TrendingUp, Shield, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import api from '../services/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const Reports: React.FC = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/policies');
        setPolicies(Array.isArray(res.data) ? res.data : (res.data?.policies || []));
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  // Compute stats
  const today    = policies.filter(p => p.daysRemaining === 0).length;
  const thisWeek = policies.filter(p => p.daysRemaining >= 0 && p.daysRemaining <= 7).length;
  const thisMonth= policies.filter(p => p.daysRemaining >= 0 && p.daysRemaining <= 30).length;
  const renewed  = policies.filter(p => p.renewalStatus === 'renewed').length;
  const expired  = policies.filter(p => p.daysRemaining < 0).length;
  const pending  = policies.filter(p => p.renewalStatus === 'pending').length;

  // Company distribution
  const companyMap: Record<string,number> = {};
  policies.forEach(p => { companyMap[p.insuranceCompany] = (companyMap[p.insuranceCompany]||0)+1; });
  const topCompanies = Object.entries(companyMap).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxCo = Math.max(...topCompanies.map(([,v])=>v), 1);

  // Monthly renewals (mock distribution)
  const monthlyRenewals = [4,8,12,18,10,15,22,28,20,24,30,35];
  const maxMo = Math.max(...monthlyRenewals);

  const exportCSV = () => {
    const headers = ['Policy#','Company','Type','Customer','Expiry','Days Left','Status','Renewal'];
    const rows = policies.map(p => [p.policyNumber,p.insuranceCompany,p.insuranceType,p.customerName||'',p.expiryDate,p.daysRemaining,p.status,p.renewalStatus]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r=>r.join(','))].join('\n');
    const a = document.createElement('a');
    a.setAttribute('href', encodeURI(csv));
    a.setAttribute('download', `report_${Date.now()}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Reports & Analytics</h1>
          <p className="text-text-muted text-sm mt-1">Insurance portfolio performance overview</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={exportCSV} className="btn-secondary text-xs px-4 py-2">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={() => window.print()} className="btn-ghost border border-white/[0.06] text-xs px-4 py-2">
            <Download className="w-3.5 h-3.5" /> Print PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Today's Expiry",   value: today,     icon: <Clock className="w-4 h-4"/>,       color: 'text-danger',      bg: 'bg-danger/10'     },
          { label: 'This Week',        value: thisWeek,  icon: <TrendingUp className="w-4 h-4"/>,  color: 'text-warning',     bg: 'bg-warning/10'    },
          { label: 'This Month',       value: thisMonth, icon: <BarChart3 className="w-4 h-4"/>,   color: 'text-brand-400',   bg: 'bg-brand-600/10'  },
          { label: 'Renewed',          value: renewed,   icon: <CheckCircle className="w-4 h-4"/>, color: 'text-success',     bg: 'bg-success/10'    },
          { label: 'Expired',          value: expired,   icon: <XCircle className="w-4 h-4"/>,     color: 'text-danger',      bg: 'bg-danger/10'     },
          { label: 'Pending',          value: pending,   icon: <Shield className="w-4 h-4"/>,      color: 'text-warning',     bg: 'bg-warning/10'    },
        ].map(k => (
          <div key={k.label} className={`glass-card p-4 ${k.bg} border border-white/[0.06]`}>
            <p className="text-2xs uppercase tracking-widest text-text-subtle font-semibold">{k.label}</p>
            <div className="flex items-end justify-between mt-2">
              <span className={`text-2xl font-bold ${k.color}`}>{isLoading ? '—' : k.value}</span>
              <span className={k.color}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Monthly trend bar chart */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Monthly Renewals Trend</h3>
              <p className="text-xs text-text-subtle mt-0.5">Full year overview</p>
            </div>
          </div>
          <div className="flex items-end gap-2 h-40">
            {monthlyRenewals.map((v, i) => {
              const pct = (v / maxMo) * 100;
              const isCurrent = i === new Date().getMonth();
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="w-full flex flex-col justify-end" style={{ height: '120px' }}>
                    <div
                      className={`bar-animated w-full rounded-t-md ${isCurrent ? 'bg-brand-500' : 'bg-brand-600/25 group-hover:bg-brand-500/50'} transition-colors duration-200`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-[9px] font-semibold ${isCurrent ? 'text-brand-400' : 'text-text-subtle'}`}>{MONTHS[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insurance company distribution */}
        <div className="glass-card p-6">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-primary">Top Insurance Companies</h3>
            <p className="text-xs text-text-subtle mt-0.5">By number of policies</p>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
          ) : topCompanies.length === 0 ? (
            <p className="text-xs text-text-subtle text-center py-8">No data available</p>
          ) : (
            <div className="space-y-3">
              {topCompanies.map(([name, count]) => (
                <div key={name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted font-medium truncate max-w-[160px]">{name}</span>
                    <span className="text-text-primary font-bold ml-2">{count} polic{count !== 1 ? 'ies' : 'y'}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-700"
                      style={{ width: `${(count / maxCo) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Renewal status breakdown */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-5">Renewal Status Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active',     count: policies.filter(p=>p.status==='active').length,    color: 'bg-success' },
            { label: 'Expired',    count: expired,                                            color: 'bg-danger'  },
            { label: 'Pending',    count: pending,                                            color: 'bg-warning' },
            { label: 'Renewed',    count: renewed,                                            color: 'bg-brand-500'},
          ].map(s => {
            const pct = policies.length > 0 ? Math.round((s.count / policies.length) * 100) : 0;
            return (
              <div key={s.label} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">{s.label}</span>
                  <span className="text-text-primary font-bold">{s.count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
