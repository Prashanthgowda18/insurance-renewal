import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Search, Download, Filter, Loader2, RefreshCw, Plus,
  Calendar, Building2, User, Car, ArrowUpDown,
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge, DaysBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { WhatsAppButton } from '../components/WhatsAppButton';

interface Policy {
  id: string;
  policyNumber: string;
  insuranceCompany: string;
  insuranceType: string;
  startDate: string;
  expiryDate: string;
  status: string;
  renewalStatus: string;
  daysRemaining: number;
  renewalAmount?: number;
  customerName?: string;
  customerMobile?: string;
  customerId?: string;
  vehicleNumber?: string;
}

export const Policies: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRenewal, setFilterRenewal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'expiry' | 'company' | 'days'>('expiry');

  const fetchPolicies = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/policies');
      let data: Policy[] = res.data || [];
      if (search) data = data.filter(p =>
        p.policyNumber?.toLowerCase().includes(search.toLowerCase()) ||
        p.insuranceCompany?.toLowerCase().includes(search.toLowerCase()) ||
        p.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        p.vehicleNumber?.toLowerCase().includes(search.toLowerCase())
      );
      if (filterStatus)  data = data.filter(p => p.status === filterStatus);
      if (filterRenewal) data = data.filter(p => p.renewalStatus === filterRenewal);
      if (sortBy === 'days')    data.sort((a,b) => a.daysRemaining - b.daysRemaining);
      if (sortBy === 'company') data.sort((a,b) => a.insuranceCompany.localeCompare(b.insuranceCompany));
      if (sortBy === 'expiry')  data.sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
      setPolicies(data);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(fetchPolicies, 300);
    return () => clearTimeout(t);
  }, [search, filterStatus, filterRenewal, sortBy]);

  const exportCSV = () => {
    if (!policies.length) return;
    const headers = ['Policy#','Company','Type','Customer','Vehicle','Start','Expiry','Days Left','Status','Renewal'];
    const rows = policies.map(p => [p.policyNumber,p.insuranceCompany,p.insuranceType,p.customerName||'',p.vehicleNumber||'',p.startDate,p.expiryDate,p.daysRemaining,p.status,p.renewalStatus]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r=>r.join(','))].join('\n');
    const a = document.createElement('a');
    a.setAttribute('href', encodeURI(csv));
    a.setAttribute('download', `policies_${Date.now()}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    success('Policies exported!');
  };

  const urgentCount  = policies.filter(p => p.daysRemaining >= 0 && p.daysRemaining <= 7).length;
  const expiredCount = policies.filter(p => p.daysRemaining < 0).length;
  const renewedCount = policies.filter(p => p.renewalStatus === 'renewed').length;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Insurance Policies</h1>
          <p className="text-text-muted text-sm mt-1">
            {policies.length} {policies.length === 1 ? 'policy' : 'policies'} registered
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={exportCSV} className="btn-secondary text-xs px-4 py-2">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => navigate('/customers')} className="btn-primary text-xs px-4 py-2">
            <Plus className="w-3.5 h-3.5" /> New Policy
          </button>
        </div>
      </div>



      {/* Toolbar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle pointer-events-none" />
          <input type="text" placeholder="Search policy, company, customer, vehicle..." value={search} onChange={e => setSearch(e.target.value)} className="field-icon w-full" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { val: filterStatus,  set: setFilterStatus,  label: 'Status',          opts: [['active','Active'],['expired','Expired'],['cancelled','Cancelled']] },
            { val: filterRenewal, set: setFilterRenewal, label: 'Renewal',          opts: [['pending','Pending'],['renewed','Renewed'],['reminder_sent','Reminder Sent'],['not_contacted','Not Contacted']] },
          ].map(({ val, set, label, opts }) => (
            <div key={label} className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle pointer-events-none" />
              <select value={val} onChange={e => set(e.target.value)} className="field pl-9 pr-8 py-2.5 text-sm appearance-none cursor-pointer min-w-[140px]">
                <option value="">All {label}</option>
                {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle pointer-events-none" />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="field pl-9 pr-8 py-2.5 text-sm appearance-none cursor-pointer">
              <option value="days">Sort: Days Left</option>
              <option value="expiry">Sort: Expiry Date</option>
              <option value="company">Sort: Company</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading && policies.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          <p className="text-sm text-text-muted">Loading policies...</p>
        </div>
      ) : policies.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={<Shield className="w-8 h-8" />}
            title="No Policies Found"
            description="Add insurance policies through customer profiles."
            action={{ label: 'Go to Customers', onClick: () => navigate('/customers'), icon: <User className="w-4 h-4" /> }}
          />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Policy</th>
                  <th>Company</th>
                  <th>Customer & Vehicle</th>
                  <th>Type</th>
                  <th>Start → Expiry</th>
                  <th>Days Left</th>
                  <th>Policy Status</th>
                  <th>Renewal</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.map(p => (
                  <tr
                    key={p.id}
                    className={`cursor-pointer ${p.daysRemaining >= 0 && p.daysRemaining <= 3 ? 'bg-danger/[0.03]' : ''}`}
                    onClick={() => p.customerId && navigate(`/customers/${p.customerId}`)}
                  >
                    <td>
                      <p className="font-mono text-sm font-semibold text-text-primary">{p.policyNumber}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm text-text-muted">
                        <Building2 className="w-3 h-3 text-text-subtle flex-shrink-0" />
                        {p.insuranceCompany}
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        {p.customerName && (
                          <div className="flex items-center gap-1.5 text-xs text-text-muted">
                            <User className="w-3 h-3 text-text-subtle flex-shrink-0" />{p.customerName}
                          </div>
                        )}
                        {p.vehicleNumber && (
                          <div className="flex items-center gap-1.5 text-xs text-text-subtle font-mono">
                            <Car className="w-3 h-3 flex-shrink-0" />{p.vehicleNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-text-muted capitalize">{p.insuranceType?.replace('_',' ')}</span>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-text-subtle">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          {new Date(p.startDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          {new Date(p.expiryDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td><DaysBadge days={p.daysRemaining} /></td>
                    <td><StatusBadge status={p.status} size="sm" /></td>
                    <td><StatusBadge status={p.renewalStatus || 'pending'} size="sm" /></td>
                    <td className="text-right" onClick={e => e.stopPropagation()}>
                      <WhatsAppButton
                        variant="compact"
                        data={{
                          customerName: p.customerName || 'Customer',
                          mobile: p.customerMobile || '',
                          vehicleNumber: p.vehicleNumber,
                          vehicleType: p.insuranceType,
                          expiryDate: p.expiryDate,
                          insuranceCompany: p.insuranceCompany,
                          policyNumber: p.policyNumber,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer stats */}
          <div className="px-5 py-3 border-t border-white/[0.05] flex items-center gap-6 text-xs text-text-subtle bg-white/[0.01]">
            <span>{policies.length} total</span>
            <span className="text-danger">{expiredCount} expired</span>
          </div>
        </div>
      )}
    </div>
  );
};
