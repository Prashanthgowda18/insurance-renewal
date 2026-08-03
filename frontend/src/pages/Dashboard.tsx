import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Shield, AlertTriangle, XCircle,
  Car, Plus, FileText, Bell, BarChart3,
  ArrowRight, RefreshCw,
  UserPlus, Building2, CheckCircle, Clock,
  ChevronRight, Zap, TrendingUp, Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { StatusBadge, DaysBadge } from '../components/StatusBadge';

import { useToast } from '../components/Toast';
import { WhatsAppButton } from '../components/WhatsAppButton';

// ─── Types ──────────────────────────────────────────────────────────────────

interface KpiData {
  totalCustomers: number;
  activePolicies: number;
  expiringThisWeek: number;
  expiredPolicies: number;
}

interface UpcomingPolicy {
  id: string;
  customerName: string;
  customerMobile: string;
  vehicleNumber: string;
  vehicleType: string;
  insuranceCompany: string;
  policyNumber: string;
  expiryDate: string;
  daysRemaining: number;
  renewalStatus: string;
  customerId: string;
}

interface ActivityItem {
  id: string;
  type: 'customer_added' | 'policy_added' | 'reminder_sent' | 'policy_renewed' | 'policy_expired' | 'customer_updated' | string;
  message: string;
  timestamp: string;
  module?: string;
}

// ─── Activity config ─────────────────────────────────────────────────────────

const activityConfig: Record<string, { dot: string; icon: React.ReactNode; label: string }> = {
  customer_added:   { dot: 'bg-success',   icon: <UserPlus   className="w-3.5 h-3.5" />, label: 'Customer Added'   },
  create:           { dot: 'bg-success',   icon: <Plus        className="w-3.5 h-3.5" />, label: 'Created'         },
  policy_added:     { dot: 'bg-brand-400', icon: <FileText   className="w-3.5 h-3.5" />, label: 'Policy Added'     },
  reminder_sent:    { dot: 'bg-brand-400', icon: <Bell       className="w-3.5 h-3.5" />, label: 'Reminder Sent'    },
  policy_renewed:   { dot: 'bg-purple-400',icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Policy Renewed' },
  policy_expired:   { dot: 'bg-danger',    icon: <XCircle    className="w-3.5 h-3.5" />, label: 'Expired'          },
  customer_updated: { dot: 'bg-warning',   icon: <Users      className="w-3.5 h-3.5" />, label: 'Customer Updated' },
  update:           { dot: 'bg-warning',   icon: <Users      className="w-3.5 h-3.5" />, label: 'Updated'          },
  login:            { dot: 'bg-brand-400', icon: <Zap        className="w-3.5 h-3.5" />, label: 'Login'            },
  delete:           { dot: 'bg-danger',    icon: <XCircle    className="w-3.5 h-3.5" />, label: 'Deleted'          },
  default:          { dot: 'bg-text-subtle',icon: <Clock     className="w-3.5 h-3.5" />, label: 'Activity'         },
};

function getActivityCfg(type: string) {
  return activityConfig[type] ?? activityConfig.default;
}

function formatRelativeTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Line Chart (Pure SVG) ────────────────────────────────────────────────────

const LineChart: React.FC<{ data: number[]; labels: string[] }> = ({ data, labels }) => {
  const W = 420, H = 160, PAD_L = 30, PAD_B = 28, PAD_T = 16, PAD_R = 12;
  const cW = W - PAD_L - PAD_R;
  const cH = H - PAD_B - PAD_T;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({
    x: PAD_L + (i / (data.length - 1)) * cW,
    y: PAD_T + (1 - v / max) * cH,
  }));

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');

  // Area fill path
  const areaPath = [
    `M ${pts[0].x} ${PAD_T + cH}`,
    ...pts.map(p => `L ${p.x} ${p.y}`),
    `L ${pts[pts.length - 1].x} ${PAD_T + cH}`,
    'Z',
  ].join(' ');

  const currentMonth = new Date().getMonth();

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2563EB" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
        </linearGradient>
        <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>

      {/* Horizontal grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const y = PAD_T + f * cH;
        return (
          <line key={i} x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#lineGrad)" />

      {/* Smooth polyline */}
      <polyline
        points={polyline}
        fill="none"
        stroke="url(#lineStroke)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {pts.map((p, i) => (
        <g key={i} className="group">
          <circle cx={p.x} cy={p.y} r="8" fill="transparent" />
          <circle
            cx={p.x} cy={p.y} r={i === currentMonth ? 4 : 3}
            fill={i === currentMonth ? '#2563EB' : '#1e3a8a'}
            stroke={i === currentMonth ? '#60A5FA' : '#3B82F6'}
            strokeWidth="1.5"
          />
        </g>
      ))}

      {/* X-axis labels */}
      {labels.map((l, i) => (
        <text
          key={i}
          x={PAD_L + (i / (labels.length - 1)) * cW}
          y={H - 6}
          textAnchor="middle"
          fontSize="9"
          fill={i === currentMonth ? '#60A5FA' : 'rgba(148,163,184,0.7)'}
          fontWeight={i === currentMonth ? '700' : '400'}
        >
          {l}
        </text>
      ))}
    </svg>
  );
};

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
  trendUp?: boolean;
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, iconBg, trend, trendUp, onClick }) => (
  <button
    onClick={onClick}
    className={`glass-card p-5 text-left w-full group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
  >
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${trendUp ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>
          <TrendingUp className={`w-2.5 h-2.5 ${!trendUp ? 'rotate-180' : ''}`} />
          {trend}
        </span>
      )}
    </div>
    <div className="mt-4">
      <p className="text-3xl font-bold text-text-primary tabular-nums tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-text-subtle mt-1 font-medium">{label}</p>
    </div>
    {onClick && (
      <div className="flex items-center gap-1 mt-3 text-[10px] text-text-subtle group-hover:text-brand-400 transition-colors">
        View details <ChevronRight className="w-3 h-3" />
      </div>
    )}
  </button>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();


  const [isLoading, setIsLoading]   = useState(false);

  const [kpi, setKpi]               = useState<KpiData>({ totalCustomers: 0, activePolicies: 0, expiringThisWeek: 0, expiredPolicies: 0 });
  const [upcoming, setUpcoming]     = useState<UpcomingPolicy[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<number[]>(Array(12).fill(0));

  // Greeting
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [custRes, polRes, logsRes] = await Promise.all([
        api.get('/customers'),
        api.get('/policies'),
        api.get('/logs').catch(() => ({ data: [] })),
      ]);

      const policies: any[]  = Array.isArray(polRes.data) ? polRes.data : (polRes.data?.policies || []);
      const customers: any[] = Array.isArray(custRes.data) ? custRes.data : (custRes.data?.customers || []);
      const logs: any[]      = Array.isArray(logsRes.data) ? logsRes.data : (logsRes.data?.logs || []);

      // ── KPIs ──
      const active        = policies.filter(p => p.status === 'active').length;
      const expiringWeek  = policies.filter(p => p.daysRemaining >= 0 && p.daysRemaining <= 7).length;
      const expired       = policies.filter(p => p.daysRemaining < 0 || p.status === 'expired').length;
      setKpi({ totalCustomers: customers.length, activePolicies: active, expiringThisWeek: expiringWeek, expiredPolicies: expired });

      // ── Upcoming (next 30 days) ──
      const up = policies
        .filter(p => p.daysRemaining >= 0 && p.daysRemaining <= 30)
        .sort((a, b) => a.daysRemaining - b.daysRemaining)
        .slice(0, 8)
        .map(p => ({
          id: p.id,
          customerName:    p.customerName    || '—',
          customerMobile:  p.customerMobile  || p.mobile || '—',
          vehicleNumber:   p.vehicleNumber   || '—',
          vehicleType:     p.vehicleType     || '—',
          insuranceCompany:p.insuranceCompany|| '—',
          policyNumber:    p.policyNumber    || '—',
          expiryDate:      p.expiryDate,
          daysRemaining:   p.daysRemaining,
          renewalStatus:   p.renewalStatus   || 'pending',
          customerId:      p.customerId      || '',
        }));
      setUpcoming(up);

      // ── Monthly chart: count policies expiring per month in current year ──
      const year = new Date().getFullYear();
      const monthly = Array(12).fill(0);
      policies.forEach((p: any) => {
        if (!p.expiryDate) return;
        const d = new Date(p.expiryDate);
        if (d.getFullYear() === year) monthly[d.getMonth()]++;
      });
      setMonthlyData(monthly);

      // ── Activity log ──
      const acts: ActivityItem[] = logs.slice(0, 10).map((l: any) => ({
        id:        l.id,
        type:      l.action || 'default',
        message:   l.description || `${l.action} on ${l.module}`,
        timestamp: l.createdAt,
        module:    l.module,
      }));
      setActivities(acts);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const triggerReminders = async () => {
    setIsLoading(true);
    try {
      const res = await api.post('/policies/trigger-reminders');
      success(res.data.message || 'Reminders dispatched successfully!');
      fetchAll();
    } catch { toastError('Failed to trigger reminders.'); }
    finally { setIsLoading(false); }
  };

  const vehicleTypeLabel = (t: string) => {
    const map: Record<string,string> = {
      four_wheeler:'Car', two_wheeler:'Bike', truck:'Truck',
      bus:'Bus', auto:'Auto', taxi:'Taxi', other:'Other',
    };
    return map[t] || t;
  };

  return (
    <div className="p-6 lg:p-8 space-y-7 animate-fade-in">

      {/* ── TOP HEADER ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xs uppercase tracking-widest font-bold text-brand-400 bg-brand-600/10 border border-brand-600/20 px-2.5 py-0.5 rounded-full">
              Dashboard
            </span>
          </div>
          <h1 className="text-2xl lg:text-[26px] font-bold text-text-primary tracking-tight leading-tight">
            {greeting}, {admin?.name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p className="text-sm text-text-muted mt-0.5">{todayStr}</p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => navigate('/add-customer')}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-2 font-bold shadow-lg shadow-brand-500/20 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </button>
          <button
            onClick={fetchAll}
            disabled={isLoading}
            className="btn-ghost border border-white/[0.06] px-3 py-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── INITIAL WELCOME EMPTY BANNER ── */}
      {kpi.totalCustomers === 0 && (
        <div className="glass-card p-8 text-center border-brand-500/30 bg-gradient-to-b from-brand-600/10 to-transparent relative overflow-hidden animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center mx-auto mb-4 text-brand-400">
            <Zap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Welcome to Shield Insurance CRM</h2>
          <p className="text-text-muted max-w-md mx-auto mt-2 text-sm">
            Start by adding your first customer or uploading an insurance policy.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <button
              onClick={() => navigate('/add-customer')}
              className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 font-bold shadow-lg shadow-brand-500/20"
            >
              <UserPlus className="w-4 h-4" /> ➕ Add Customer
            </button>
          </div>
        </div>
      )}

      {/* ── ROW 1 · KPI CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          label="Total Customers"
          value={kpi.totalCustomers}
          icon={<Users className="w-5 h-5 text-brand-400" />}
          iconBg="bg-brand-600/15 border border-brand-600/20"
          onClick={() => navigate('/customers')}
        />
        <KpiCard
          label="Expired Policies"
          value={kpi.expiredPolicies}
          icon={<XCircle className="w-5 h-5 text-danger" />}
          iconBg="bg-danger/10 border border-danger/20"
          onClick={() => navigate('/policies')}
        />
      </div>

      {/* ── ROW 2 · UPCOMING RENEWALS + LINE CHART ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Upcoming Renewals Table — 3 cols */}
        <div className="glass-card overflow-hidden lg:col-span-3 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] flex-shrink-0">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Upcoming Renewals</h2>
              <p className="text-xs text-text-subtle mt-0.5">Next 30 days · {upcoming.length} policies</p>
            </div>
            <button
              onClick={() => navigate('/policies')}
              className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-auto flex-1">
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-text-subtle">
                <CheckCircle className="w-9 h-9 mb-2.5 text-success/30" />
                <p className="text-sm font-medium text-text-muted">All clear!</p>
                <p className="text-xs mt-1">No policies expiring in the next 30 days.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#111827] border-b border-white/[0.05]">
                    {['Customer','Vehicle','Type','Company','Expiry','Days',''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-text-subtle whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors group ${p.daysRemaining <= 3 ? 'bg-danger/[0.02]' : ''}`}
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-text-primary text-xs truncate max-w-[110px]">{p.customerName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-text-muted">{p.vehicleNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-subtle capitalize">{vehicleTypeLabel(p.vehicleType)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-muted truncate max-w-[100px] block">{p.insuranceCompany}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-muted whitespace-nowrap">
                          {new Date(p.expiryDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <DaysBadge days={p.daysRemaining} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <WhatsAppButton
                            variant="compact"
                            data={{
                              customerName: p.customerName,
                              mobile: p.customerMobile,
                              vehicleType: p.vehicleType,
                              vehicleNumber: p.vehicleNumber,
                              expiryDate: p.expiryDate,
                              insuranceCompany: p.insuranceCompany,
                              policyNumber: p.policyNumber,
                            }}
                          />
                          <button
                            onClick={() => p.customerId && navigate(`/customers/${p.customerId}`)}
                            className="px-2.5 py-1.5 text-[10px] font-semibold rounded-xl bg-brand-600/15 text-brand-400 hover:bg-brand-600/25 border border-brand-600/20 whitespace-nowrap"
                          >
                            Renew
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Monthly Renewals Line Chart — 2 cols */}
        <div className="glass-card p-5 lg:col-span-2 flex flex-col">
          <div className="mb-4 flex-shrink-0">
            <h2 className="text-sm font-bold text-text-primary">Monthly Renewals</h2>
            <p className="text-xs text-text-subtle mt-0.5">Policies expiring per month · {new Date().getFullYear()}</p>
          </div>

          {/* Total for year badge */}
          <div className="flex items-center gap-3 mb-5 flex-shrink-0">
            <div className="text-2xl font-bold text-text-primary tabular-nums">
              {monthlyData.reduce((a, b) => a + b, 0)}
            </div>
            <div>
              <p className="text-xs text-text-subtle">Total expirations</p>
              <p className="text-[10px] text-brand-400 font-medium">this year</p>
            </div>
          </div>

          <div className="flex-1 min-h-[140px]">
            <LineChart data={monthlyData} labels={MONTHS_SHORT} />
          </div>

          {/* Peak month */}
          <div className="mt-4 pt-4 border-t border-white/[0.05] flex-shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-subtle">Peak month</span>
              <span className="font-semibold text-text-primary">
                {MONTHS_SHORT[monthlyData.indexOf(Math.max(...monthlyData))]} · {Math.max(...monthlyData)} policies
              </span>
            </div>
      {/* ── TOP HEADER ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xs uppercase tracking-widest font-bold text-brand-400 bg-brand-600/10 border border-brand-600/20 px-2.5 py-0.5 rounded-full">
              Dashboard
            </span>
          </div>
          <h1 className="text-2xl lg:text-[26px] font-bold text-text-primary tracking-tight leading-tight">
            {greeting}, {admin?.name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p className="text-sm text-text-muted mt-0.5">{todayStr}</p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => navigate('/add-customer')}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-2 font-bold shadow-lg shadow-brand-500/20 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </button>
          <button
            onClick={fetchAll}
            disabled={isLoading}
            className="btn-ghost border border-white/[0.06] px-3 py-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── INITIAL WELCOME EMPTY BANNER ── */}
      {kpi.totalCustomers === 0 && (
        <div className="glass-card p-8 text-center border-brand-500/30 bg-gradient-to-b from-brand-600/10 to-transparent relative overflow-hidden animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center mx-auto mb-4 text-brand-400">
            <Zap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Welcome to Shield Insurance CRM</h2>
          <p className="text-text-muted max-w-md mx-auto mt-2 text-sm">
            Start by adding your first customer or uploading an insurance policy.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <button
              onClick={() => navigate('/add-customer')}
              className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 font-bold shadow-lg shadow-brand-500/20"
            >
              <UserPlus className="w-4 h-4" /> ➕ Add Customer
            </button>
          </div>
        </div>
      )}

      {/* ── ROW 1 · KPI CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          label="Total Customers"
          value={kpi.totalCustomers}
          icon={<Users className="w-5 h-5 text-brand-400" />}
          iconBg="bg-brand-600/15 border border-brand-600/20"
          onClick={() => navigate('/customers')}
        />
        <KpiCard
          label="Expired Policies"
          value={kpi.expiredPolicies}
          icon={<XCircle className="w-5 h-5 text-danger" />}
          iconBg="bg-danger/10 border border-danger/20"
          onClick={() => navigate('/policies')}
        />
      </div>

      {/* ── ROW 2 · UPCOMING RENEWALS + LINE CHART ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Upcoming Renewals Table — 3 cols */}
        <div className="glass-card overflow-hidden lg:col-span-3 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] flex-shrink-0">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Upcoming Renewals</h2>
              <p className="text-xs text-text-subtle mt-0.5">Next 30 days · {upcoming.length} policies</p>
            </div>
            <button
              onClick={() => navigate('/policies')}
              className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-auto flex-1">
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-text-subtle">
                <CheckCircle className="w-9 h-9 mb-2.5 text-success/30" />
                <p className="text-sm font-medium text-text-muted">All clear!</p>
                <p className="text-xs mt-1">No policies expiring in the next 30 days.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#111827] border-b border-white/[0.05]">
                    {['Customer','Vehicle','Type','Company','Expiry','Days',''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-text-subtle whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors group ${p.daysRemaining <= 3 ? 'bg-danger/[0.02]' : ''}`}
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-text-primary text-xs truncate max-w-[110px]">{p.customerName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-text-muted">{p.vehicleNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-subtle capitalize">{vehicleTypeLabel(p.vehicleType)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-muted truncate max-w-[100px] block">{p.insuranceCompany}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-muted whitespace-nowrap">
                          {new Date(p.expiryDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <DaysBadge days={p.daysRemaining} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <WhatsAppButton
                            variant="compact"
                            data={{
                              customerName: p.customerName,
                              mobile: p.customerMobile,
                              vehicleType: p.vehicleType,
                              vehicleNumber: p.vehicleNumber,
                              expiryDate: p.expiryDate,
                              insuranceCompany: p.insuranceCompany,
                              policyNumber: p.policyNumber,
                            }}
                          />
                          <button
                            onClick={() => p.customerId && navigate(`/customers/${p.customerId}`)}
                            className="px-2.5 py-1.5 text-[10px] font-semibold rounded-xl bg-brand-600/15 text-brand-400 hover:bg-brand-600/25 border border-brand-600/20 whitespace-nowrap"
                          >
                            Renew
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Monthly Renewals Line Chart — 2 cols */}
        <div className="glass-card p-5 lg:col-span-2 flex flex-col">
          <div className="mb-4 flex-shrink-0">
            <h2 className="text-sm font-bold text-text-primary">Monthly Renewals</h2>
            <p className="text-xs text-text-subtle mt-0.5">Policies expiring per month · {new Date().getFullYear()}</p>
          </div>

          {/* Total for year badge */}
          <div className="flex items-center gap-3 mb-5 flex-shrink-0">
            <div className="text-2xl font-bold text-text-primary tabular-nums">
              {monthlyData.reduce((a, b) => a + b, 0)}
            </div>
            <div>
              <p className="text-xs text-text-subtle">Total expirations</p>
              <p className="text-[10px] text-brand-400 font-medium">this year</p>
            </div>
          </div>

          <div className="flex-1 min-h-[140px]">
            <LineChart data={monthlyData} labels={MONTHS_SHORT} />
          </div>

          {/* Peak month */}
          <div className="mt-4 pt-4 border-t border-white/[0.05] flex-shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-subtle">Peak month</span>
              <span className="font-semibold text-text-primary">
                {MONTHS_SHORT[monthlyData.indexOf(Math.max(...monthlyData))]} · {Math.max(...monthlyData)} policies
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
    </div>
  );
};
