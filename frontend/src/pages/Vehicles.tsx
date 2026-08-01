import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Search, Filter, Plus, Loader2, AlertTriangle,
  Calendar, Building2, User, RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { DaysBadge, StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { WhatsAppButton } from '../components/WhatsAppButton';

interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  make: string;
  model: string;
  manufacturingYear: number;
  fuelType: string;
  customerName?: string;
  customerMobile?: string;
  customerId?: string;
  insuranceCompany?: string;
  policyNumber?: string;
  expiryDate?: string;
  daysRemaining?: number;
  policyStatus?: string;
  owner?: { id: string; name: string; mobile: string } | null;
  policy?: { id: string; policyNumber: string; insuranceCompany: string; expiryDate: string; daysRemaining?: number; status: string } | null;
}

const getVehicleIcon = (type?: string): string => {
  if (!type) return '🚘';
  const t = type.toLowerCase().trim();
  if (t === 'bike' || t === 'two_wheeler' || t === 'scooter' || t === 'motorcycle') return '🏍️';
  if (t === 'car' || t === 'four_wheeler') return '🚗';
  if (t === 'commercial' || t === 'truck') return '🚛';
  if (t === 'bus') return '🚌';
  if (t === 'auto') return '🛺';
  if (t === 'taxi') return '🚖';
  return '🚘';
};

const getCategoryKey = (type?: string): string => {
  if (!type) return 'other';
  const t = type.toLowerCase().trim();
  if (t === 'bike' || t === 'two_wheeler' || t === 'scooter' || t === 'motorcycle') return 'bike';
  if (t === 'car' || t === 'four_wheeler') return 'car';
  if (t === 'bus') return 'bus';
  if (t === 'auto') return 'auto';
  if (t === 'commercial' || t === 'truck') return 'commercial';
  return 'other';
};

const CATEGORIES = [
  { key: 'all', label: 'All Vehicles', icon: '🚘' },
  { key: 'car', label: 'Cars', icon: '🚗' },
  { key: 'bike', label: 'Bikes / 2-Wheelers', icon: '🏍️' },
  { key: 'bus', label: 'Buses', icon: '🚌' },
  { key: 'auto', label: 'Autos', icon: '🛺' },
  { key: 'commercial', label: 'Commercial / Trucks', icon: '🚛' },
];

export const Vehicles: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/vehicles', { params: { search: search || undefined } });
      setVehicles(Array.isArray(res.data) ? res.data : (res.data?.vehicles || []));
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(fetchVehicles, 300);
    return () => clearTimeout(t);
  }, [search]);

  const filteredVehicles = vehicles.filter(v => {
    if (selectedCategory === 'all') return true;
    return getCategoryKey(v.vehicleType) === selectedCategory;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Fleet Management</h1>
          <p className="text-text-muted text-sm mt-1">
            {vehicles.length > 0 ? `${vehicles.length} vehicles registered` : 'Track all customer vehicles'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={fetchVehicles} className="btn-ghost border border-white/[0.06] px-3 py-2 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Category Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {CATEGORIES.map(cat => {
          const count = cat.key === 'all'
            ? vehicles.length
            : vehicles.filter(v => getCategoryKey(v.vehicleType) === cat.key).length;
          const isActive = selectedCategory === cat.key;

          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`glass-card p-3.5 text-left transition-all duration-200 flex flex-col justify-between group ${
                isActive
                  ? 'border-brand-500/50 bg-brand-500/10 ring-2 ring-brand-500/20 shadow-lg shadow-brand-500/10'
                  : 'hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-brand-500 text-white' : 'bg-white/[0.06] text-text-subtle'
                }`}>
                  {count}
                </span>
              </div>
              <div>
                <p className={`text-xs font-semibold truncate ${isActive ? 'text-brand-400' : 'text-text-primary'}`}>
                  {cat.label}
                </p>
                <p className="text-[10px] text-text-subtle mt-0.5">
                  {count === 1 ? '1 vehicle' : `${count} vehicles`}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle pointer-events-none" />
          <input type="text" placeholder="Search by vehicle number, make, model..." value={search} onChange={e => setSearch(e.target.value)} className="field-icon w-full" />
        </div>
      </div>

      {/* Content */}
      {isLoading && vehicles.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          <p className="text-sm text-text-muted">Loading vehicles...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={<Car className="w-8 h-8" />}
            title={selectedCategory !== 'all' ? `No ${CATEGORIES.find(c => c.key === selectedCategory)?.label} Found` : "No Vehicles Found"}
            description={selectedCategory !== 'all' ? "No vehicles found in this category." : "Add customers with vehicles to start tracking insurance policies."}
            action={{ label: 'Go to Customers', onClick: () => navigate('/customers'), icon: <User className="w-4 h-4" /> }}
          />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Owner</th>
                  <th>Type / Year</th>
                  <th>Insurance Co.</th>
                  <th>Expiry Date</th>
                  <th>Days Left</th>
                  <th>Policy Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map(v => {
                  const ownerName = v.customerName || v.owner?.name;
                  const ownerMobile = v.customerMobile || v.owner?.mobile || '';
                  const ownerId = v.customerId || v.owner?.id;
                  const insCompany = v.insuranceCompany || v.policy?.insuranceCompany;
                  const polNumber = v.policyNumber || v.policy?.policyNumber;
                  const expDate = v.expiryDate || v.policy?.expiryDate;
                  const daysLeft = v.daysRemaining ?? v.policy?.daysRemaining;
                  const polStatus = v.policyStatus || v.policy?.status;

                  return (
                    <tr key={v.id} className="cursor-pointer" onClick={() => ownerId && navigate(`/customers/${ownerId}`)}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-lg flex-shrink-0">
                            {getVehicleIcon(v.vehicleType)}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary text-sm font-mono tracking-wide">{v.vehicleNumber}</p>
                            <p className="text-xs text-text-subtle">{v.make} {v.model}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        {ownerName ? (
                          <div className="flex items-center gap-1.5 text-sm text-text-muted">
                            <User className="w-3 h-3 text-text-subtle flex-shrink-0" />
                            {ownerName}
                          </div>
                        ) : <span className="text-text-subtle">—</span>}
                      </td>
                      <td>
                        <div>
                          <p className="text-sm text-text-muted capitalize">{v.vehicleType?.replace('_',' ')}</p>
                          <p className="text-xs text-text-subtle">{v.manufacturingYear || '—'} · {v.fuelType || '—'}</p>
                        </div>
                      </td>
                      <td>
                        {insCompany ? (
                          <div className="flex items-center gap-1.5 text-sm text-text-muted">
                            <Building2 className="w-3 h-3 text-text-subtle flex-shrink-0" />
                            {insCompany}
                          </div>
                        ) : <span className="text-text-subtle text-xs">No policy</span>}
                      </td>
                      <td>
                        {expDate ? (
                          <div className="flex items-center gap-1.5 text-xs text-text-muted">
                            <Calendar className="w-3 h-3 text-text-subtle flex-shrink-0" />
                            {new Date(expDate).toLocaleDateString()}
                          </div>
                        ) : <span className="text-text-subtle">—</span>}
                      </td>
                      <td>
                        {daysLeft !== undefined && daysLeft !== null ? (
                          <DaysBadge days={daysLeft} />
                        ) : <span className="text-text-subtle">—</span>}
                      </td>
                      <td>
                        {polStatus ? (
                          <StatusBadge status={polStatus} size="sm" />
                        ) : (
                          <span className="text-xs text-text-subtle flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> No policy
                          </span>
                        )}
                      </td>
                      <td className="text-right" onClick={e => e.stopPropagation()}>
                        <WhatsAppButton
                          variant="compact"
                          data={{
                            customerName: ownerName || 'Customer',
                            mobile: ownerMobile,
                            vehicleNumber: v.vehicleNumber,
                            vehicleType: v.vehicleType,
                            expiryDate: expDate,
                            insuranceCompany: insCompany,
                            policyNumber: polNumber,
                          }}
                        />
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
