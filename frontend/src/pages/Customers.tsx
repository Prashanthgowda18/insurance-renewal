import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Download, Plus, Trash2, Edit3, Eye,
  Loader2, Filter, LayoutGrid, List, Phone, Mail, Car, Shield,
} from 'lucide-react';
import api from '../services/api';
import { AddCustomerModal } from './AddCustomerModal';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { useToast } from '../components/Toast';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  address: string | null;
  vehiclesCount: number;
  activePolicies: number;
  renewalStatus: string;
  customerStatus: string;
  primaryVehicleNumber?: string;
  primaryVehicleType?: string;
  primaryInsuranceCompany?: string;
  primaryPolicyNumber?: string;
  primaryExpiryDate?: string;
}

const AVATAR_COLORS = [
  'bg-brand-600/20 text-brand-400 border-brand-600/30',
  'bg-success/20 text-success border-success/30',
  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'bg-warning/20 text-warning border-warning/30',
  'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
];

function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export const Customers: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/customers', {
        params: { search: search || undefined, status: filterStatus || undefined },
      });
      setCustomers(Array.isArray(res.data) ? res.data : (res.data?.customers || []));
    } catch { toastError('Failed to load customers.'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(t);
  }, [search, filterStatus]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/customers/${deleteId}`);
      setCustomers(prev => prev.filter(c => c.id !== deleteId));
      setDeleteId(null);
      success('Customer deleted successfully.');
    } catch { toastError('Failed to delete customer.'); }
    finally { setIsDeleting(false); }
  };

  const exportCSV = () => {
    if (!customers.length) return;
    const headers = ['Name','Mobile','Email','Address','Vehicles','Active Policies','Status'];
    const rows = customers.map(c => [c.name, c.mobile, c.email||'N/A', c.address||'N/A', c.vehiclesCount, c.activePolicies, c.customerStatus]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r=>r.join(','))].join('\n');
    const a = document.createElement('a');
    a.setAttribute('href', encodeURI(csv));
    a.setAttribute('download', `customers_${Date.now()}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    success('Customer list exported!');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Customer Directory</h1>
          <p className="text-text-muted text-sm mt-1">
            {customers.length > 0 ? `${customers.length} customer${customers.length !== 1 ? 's' : ''} registered` : 'Manage policy owners and profiles'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={exportCSV} className="btn-secondary text-xs px-4 py-2">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => setIsAddOpen(true)} className="btn-primary text-xs px-4 py-2">
            <Plus className="w-3.5 h-3.5" /> Add Customer
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, mobile, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="field-icon w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-subtle pointer-events-none" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="field pl-9 pr-8 py-2.5 text-sm appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-brand-600/20 text-brand-400' : 'text-text-subtle hover:text-text-muted'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'cards' ? 'bg-brand-600/20 text-brand-400' : 'text-text-subtle hover:text-text-muted'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading && customers.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          <p className="text-sm text-text-muted">Loading customers...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="No Customers Found"
            description={search ? 'No customers match your search. Try a different query.' : 'Start by adding your first customer to track their insurance policies.'}
            action={{ label: 'Add First Customer', onClick: () => setIsAddOpen(true), icon: <Plus className="w-4 h-4" /> }}
          />
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Vehicles</th>
                  <th>Policies</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} className="cursor-pointer" onClick={() => navigate(`/customers/${c.id}`)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(c.name)}`}>
                          {initials(c.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary text-sm">{c.name}</p>
                          {c.address && <p className="text-xs text-text-subtle truncate max-w-[180px]">{c.address}</p>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-text-muted">
                          <Phone className="w-3 h-3 text-text-subtle flex-shrink-0" />
                          {c.mobile}
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-xs text-text-subtle">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            {c.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm text-text-muted">
                        <Car className="w-3.5 h-3.5 text-text-subtle" />
                        {c.vehiclesCount}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Shield className="w-3.5 h-3.5 text-text-subtle" />
                        <span className={c.activePolicies > 0 ? 'text-success font-semibold' : 'text-text-muted'}>
                          {c.activePolicies} active
                        </span>
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <StatusBadge status={c.customerStatus} size="sm" />
                    </td>
                    <td className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <WhatsAppButton
                          variant="icon"
                          data={{
                            customerName: c.name,
                            mobile: c.mobile,
                            vehicleNumber: c.primaryVehicleNumber,
                            vehicleType: c.primaryVehicleType,
                            insuranceCompany: c.primaryInsuranceCompany,
                            policyNumber: c.primaryPolicyNumber,
                            expiryDate: c.primaryExpiryDate,
                          }}
                        />
                        <button onClick={() => navigate(`/customers/${c.id}`)} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-text-subtle hover:text-text-primary transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => navigate(`/customers/${c.id}?edit=true`)} className="p-1.5 rounded-lg hover:bg-brand-600/10 text-text-subtle hover:text-brand-400 transition-colors" title="Edit">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-text-subtle hover:text-danger transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {customers.map(c => (
            <div
              key={c.id}
              onClick={() => navigate(`/customers/${c.id}`)}
              className="glass-card p-5 cursor-pointer hover-lift group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-sm font-bold ${avatarColor(c.name)}`}>
                  {initials(c.name)}
                </div>
                <StatusBadge status={c.customerStatus} size="sm" />
              </div>
              <h3 className="font-semibold text-text-primary text-sm mb-1 group-hover:text-brand-400 transition-colors">{c.name}</h3>
              <div className="space-y-1.5 mt-3">
                <div className="flex items-center gap-2 text-xs text-text-subtle">
                  <Phone className="w-3 h-3" /> {c.mobile}
                </div>
                {c.email && <div className="flex items-center gap-2 text-xs text-text-subtle truncate">
                  <Mail className="w-3 h-3 flex-shrink-0" /> {c.email}
                </div>}
              </div>
              <div className="flex gap-3 mt-4 pt-3 border-t border-white/[0.05]">
                <div className="flex items-center gap-1.5 text-xs text-text-subtle">
                  <Car className="w-3 h-3" /> {c.vehiclesCount} vehicle{c.vehiclesCount !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-subtle">
                  <Shield className="w-3 h-3" /> {c.activePolicies} polic{c.activePolicies !== 1 ? 'ies' : 'y'}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3" onClick={e => e.stopPropagation()}>
                <WhatsAppButton
                  variant="compact"
                  data={{
                    customerName: c.name,
                    mobile: c.mobile,
                    vehicleNumber: c.primaryVehicleNumber,
                    vehicleType: c.primaryVehicleType,
                    insuranceCompany: c.primaryInsuranceCompany,
                    policyNumber: c.primaryPolicyNumber,
                    expiryDate: c.primaryExpiryDate,
                  }}
                  className="flex-1"
                />
                <button onClick={() => navigate(`/customers/${c.id}?edit=true`)} className="btn-ghost text-xs py-1.5 px-3 border border-white/[0.05]">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-text-subtle hover:text-danger border border-white/[0.05] transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Customer Profile?"
        message="This is permanent and will also remove all associated vehicles, policies, and reminder schedules."
        confirmLabel="Delete Customer"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
      <AddCustomerModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSuccess={fetchCustomers} />
    </div>
  );
};
