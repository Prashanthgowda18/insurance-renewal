import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, ArrowLeft, Car, ShieldCheck, BellRing,
  History, FileText, Clock, Loader2, AlertTriangle,
  Phone, Mail, MapPin, MessageSquare,
} from 'lucide-react';
import api from '../services/api';
import { RenewPolicyModal } from './RenewPolicyModal';
import { StatusBadge, DaysBadge } from '../components/StatusBadge';
import { WhatsAppButton } from '../components/WhatsAppButton';

interface RenewalLog {
  id: string;
  policyId: string;
  renewalDate: string;
  newExpiryDate: string;
  renewedBy: string;
  remarks: string | null;
  createdAt: string;
}

interface ReminderScheduleItem {
  id: string;
  reminderType: string;
  scheduledDate: string;
  sent: boolean;
  notifications: Array<{
    id: string;
    recipientType: string;
    channel: string;
    status: string;
    deliveryResult: string | null;
    sentAt: string | null;
  }>;
}

interface PolicyItem {
  id: string;
  insuranceCompany: string;
  policyNumber: string;
  insuranceType: string;
  startDate: string;
  expiryDate: string;
  status: string;
  renewalStatus: string;
  policyDocumentUrl: string | null;
  renewalAmount: string;
  lastReminderDate: string | null;
  renewals: RenewalLog[];
  reminders: ReminderScheduleItem[];
}

interface VehicleItem {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  make: string | null;
  model: string | null;
  manufacturingYear: number | null;
  fuelType: string | null;
  policies: PolicyItem[];
}

interface CustomerProfileData {
  id: string;
  name: string;
  mobile: string;
  altMobile: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  preferredNotificationChannel: string;
  preferredLanguage: string;
  customerStatus: string;
  createdAt: string;
  vehicles: VehicleItem[];
}

interface TimelineEvent {
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

export const CustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<CustomerProfileData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [renewPolicyId, setRenewPolicyId] = useState<string | null>(null);

  const fetchProfileDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      // 1. Fetch customer details
      const response = await api.get(`/customers/${id}`);
      setCustomer(response.data);

      // 2. Fetch customer timeline events list
      const timelineResponse = await api.get(`/customers/${id}/timeline`);
      setTimeline(timelineResponse.data);
    } catch (err) {
      console.error('Failed to retrieve customer details', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, [id]);

  if (isLoading && !customer) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        <p className="text-sm font-medium">Loading customer profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-text-muted">
        <AlertTriangle className="w-12 h-12 text-danger/50" />
        <h3 className="font-bold text-lg text-text-primary">Profile Not Found</h3>
        <button onClick={() => navigate('/customers')} className="btn-secondary text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </button>
      </div>
    );
  }

  // Aggregate policies for flat loops
  const allPolicies: Array<PolicyItem & { vehicleNumber: string }> = [];
  customer.vehicles.forEach((v) => {
    v.policies.forEach((p) => {
      allPolicies.push({ ...p, vehicleNumber: v.vehicleNumber });
    });
  });

  // Calculate Last Reminder Sent and Next Reminder Date dynamically
  let lastReminderSentStr = 'Never';
  let nextReminderDateStr = 'None Scheduled';

  let lastSentDate: Date | null = null;
  let nextSchedDate: Date | null = null;

  customer.vehicles.forEach((v) => {
    v.policies.forEach((p) => {
      if (p.lastReminderDate) {
        const d = new Date(p.lastReminderDate);
        if (!lastSentDate || d > lastSentDate) {
          lastSentDate = d;
        }
      }
      p.reminders.forEach((r) => {
        if (!r.sent && r.scheduledDate) {
          const d = new Date(r.scheduledDate);
          if (!nextSchedDate || d < nextSchedDate) {
            nextSchedDate = d;
          }
        }
      });
    });
  });

  if (lastSentDate) {
    lastReminderSentStr = new Date(lastSentDate).toLocaleString();
  }
  if (nextSchedDate) {
    nextReminderDateStr = new Date(nextSchedDate).toLocaleDateString();
  }

  const getBadgeColor = (days: number, status: string) => {
    if (status === 'expired' || days < 0) return 'bg-slate-800 text-slate-400 border-slate-700';
    if (days < 7) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (days < 15) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    if (days < 30) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    return 'bg-green-500/10 text-green-400 border-green-500/20';
  };

  const initials = customer.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      
      {/* Back + Header */}
      <div className="space-y-4">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-text-subtle hover:text-text-primary transition text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </button>

        <div className="glass-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center font-bold text-brand-400 text-2xl">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-text-primary">{customer.name}</h1>
                  <StatusBadge status={customer.customerStatus} />
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-text-muted"><Phone className="w-3 h-3" />{customer.mobile}</span>
                  {customer.email && <span className="flex items-center gap-1.5 text-xs text-text-muted"><Mail className="w-3 h-3" />{customer.email}</span>}
                  {customer.address && <span className="flex items-center gap-1.5 text-xs text-text-subtle"><MapPin className="w-3 h-3" />{customer.address}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <WhatsAppButton
                variant="full"
                data={{
                  customerName: customer.name,
                  mobile: customer.mobile,
                  vehicleNumber: customer.vehicles[0]?.vehicleNumber,
                  vehicleType: customer.vehicles[0]?.vehicleType,
                  expiryDate: allPolicies[0]?.expiryDate,
                  insuranceCompany: allPolicies[0]?.insuranceCompany,
                  policyNumber: allPolicies[0]?.policyNumber,
                }}
              />
              <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-2xs text-text-subtle uppercase tracking-widest">Channel</p>
                <p className="text-sm font-bold text-brand-400 capitalize mt-0.5 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />{customer.preferredNotificationChannel}
                </p>
              </div>
              <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-2xs text-text-subtle uppercase tracking-widest">Vehicles</p>
                <p className="text-2xl font-bold text-text-primary mt-0.5">{customer.vehicles.length}</p>
              </div>
              <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <p className="text-2xs text-text-subtle uppercase tracking-widest">Policies</p>
                <p className="text-2xl font-bold text-text-primary mt-0.5">{allPolicies.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06] pb-3">
        {[
          { id: 'overview',  label: 'Overview',          icon: User       },
          { id: 'vehicles',  label: 'Vehicles',          icon: Car        },
          { id: 'policies',  label: 'Policies',          icon: ShieldCheck},
          { id: 'reminders', label: 'Reminder History',  icon: BellRing   },
          { id: 'renewals',  label: 'Renewal History',   icon: History    },
          { id: 'documents', label: 'Documents',         icon: FileText   },
          { id: 'timeline',  label: 'Activity',          icon: Clock      },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-600/15 text-brand-400 border border-brand-600/25'
                  : 'text-text-subtle hover:text-text-muted hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[40vh]">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="glass-card p-6 md:col-span-2 space-y-5">
              <h3 className="text-sm font-bold text-text-primary">Customer Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Address',        value: customer.address || '—'                       },
                  { label: 'Language',       value: customer.preferredLanguage?.toUpperCase() || '—'},
                  { label: 'Alt Mobile',     value: customer.altMobile || '—'                     },
                  { label: 'Registered',     value: new Date(customer.createdAt).toLocaleDateString() },
                  { label: 'Last Reminder',  value: lastReminderSentStr                            },
                  { label: 'Next Reminder',  value: nextReminderDateStr                            },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-2xs text-text-subtle uppercase tracking-widest font-semibold">{f.label}</p>
                    <p className="text-sm text-text-muted mt-0.5">{f.value}</p>
                  </div>
                ))}
                {customer.notes && (
                  <div className="col-span-2">
                    <p className="text-2xs text-text-subtle uppercase tracking-widest font-semibold">Notes</p>
                    <p className="text-sm text-text-muted mt-0.5 italic">{customer.notes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="glass-card p-6 space-y-3">
              <h3 className="text-sm font-bold text-text-primary">Quick Actions</h3>
              <button onClick={() => navigate(`/customers/${customer.id}?edit=true`)} className="btn-secondary w-full text-sm">
                Edit Profile
              </button>
            </div>
          </div>
        )}

        {/* VEHICLES */}
        {activeTab === 'vehicles' && (
          <div className="glass-card overflow-hidden">
            {customer.vehicles.length === 0 ? (
              <div className="py-12 text-center text-text-subtle text-sm">No vehicles registered.</div>
            ) : (
              <table className="data-table">
                <thead><tr>
                  <th>Vehicle Number</th><th>Type</th><th>Make / Model</th><th>Year</th><th>Fuel</th>
                </tr></thead>
                <tbody>
                  {customer.vehicles.map(v => (
                    <tr key={v.id}>
                      <td className="font-mono font-semibold text-text-primary">{v.vehicleNumber}</td>
                      <td className="capitalize">{v.vehicleType?.replace('_',' ')}</td>
                      <td>{v.make || '—'} {v.model || '—'}</td>
                      <td>{v.manufacturingYear || '—'}</td>
                      <td className="capitalize">{v.fuelType || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* POLICIES */}
        {activeTab === 'policies' && (
          <div className="glass-card overflow-hidden">
            {allPolicies.length === 0 ? (
              <div className="py-12 text-center text-text-subtle text-sm">No policies found.</div>
            ) : (
              <table className="data-table">
                <thead><tr>
                  <th>Policy</th><th>Vehicle</th><th>Company</th><th>Type</th><th>Expiry</th><th>Days Left</th><th className="text-right">Action</th>
                </tr></thead>
                <tbody>
                  {allPolicies.map(p => {
                    const days = Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / 86400000);
                    return (
                      <tr key={p.id}>
                        <td className="font-mono font-semibold text-text-primary">{p.policyNumber}</td>
                        <td className="font-mono text-xs">{p.vehicleNumber}</td>
                        <td>{p.insuranceCompany}</td>
                        <td className="capitalize">{p.insuranceType?.replace('_',' ')}</td>
                        <td>{new Date(p.expiryDate).toLocaleDateString()}</td>
                        <td><DaysBadge days={days} /></td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <WhatsAppButton
                              variant="compact"
                              data={{
                                customerName: customer.name,
                                mobile: customer.mobile,
                                vehicleNumber: p.vehicleNumber,
                                vehicleType: p.insuranceType,
                                expiryDate: p.expiryDate,
                                insuranceCompany: p.insuranceCompany,
                                policyNumber: p.policyNumber,
                              }}
                            />
                            <button onClick={() => setRenewPolicyId(p.id)} className="btn-primary text-xs px-3 py-1.5">
                              Renew
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* REMINDERS */}
        {activeTab === 'reminders' && (
          <div className="glass-card overflow-hidden">
            {allPolicies.every(p => p.reminders.length === 0) ? (
              <div className="py-12 text-center text-text-subtle text-sm">No reminder history.</div>
            ) : (
              <table className="data-table">
                <thead><tr>
                  <th>Policy</th><th>Type</th><th>Scheduled</th><th>Status</th><th>Channels</th>
                </tr></thead>
                <tbody>
                  {allPolicies.map(p => p.reminders.map(rem => (
                    <tr key={rem.id}>
                      <td className="font-mono font-semibold text-text-primary">{p.policyNumber}</td>
                      <td><span className="badge badge-muted uppercase text-[10px]">{rem.reminderType}</span></td>
                      <td>{new Date(rem.scheduledDate).toLocaleDateString()}</td>
                      <td><StatusBadge status={rem.sent ? 'sent' : 'pending'} size="sm" /></td>
                      <td className="text-xs">{rem.notifications.map(n=>`${n.channel}: ${n.status}`).join(' · ')||'—'}</td>
                    </tr>
                  )))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* RENEWALS */}
        {activeTab === 'renewals' && (
          <div className="glass-card overflow-hidden">
            {allPolicies.every(p => p.renewals.length === 0) ? (
              <div className="py-12 text-center text-text-subtle text-sm">No renewal history.</div>
            ) : (
              <table className="data-table">
                <thead><tr>
                  <th>Policy</th><th>Renewal Date</th><th>New Expiry</th><th>Renewed By</th><th>Remarks</th>
                </tr></thead>
                <tbody>
                  {allPolicies.map(p => p.renewals.map(ren => (
                    <tr key={ren.id}>
                      <td className="font-mono font-semibold text-text-primary">{p.policyNumber}</td>
                      <td>{new Date(ren.renewalDate).toLocaleDateString()}</td>
                      <td className="text-success font-medium">{new Date(ren.newExpiryDate).toLocaleDateString()}</td>
                      <td>{ren.renewedBy}</td>
                      <td className="italic max-w-xs truncate">{ren.remarks||'—'}</td>
                    </tr>
                  )))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-text-primary">Policy Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allPolicies.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div>
                    <p className="text-2xs text-text-subtle uppercase tracking-widest">{p.policyNumber}</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">{p.insuranceCompany}</p>
                  </div>
                  {p.policyDocumentUrl ? (
                    <a href={`http://localhost:5000${p.policyDocumentUrl}`} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs px-3 py-1.5">
                      Open PDF
                    </a>
                  ) : (
                    <span className="text-xs text-text-subtle">No document</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="glass-card p-6 space-y-5">
            <h3 className="text-sm font-bold text-text-primary">Activity Timeline</h3>
            {timeline.length === 0 ? (
              <p className="text-sm text-text-subtle text-center py-8">No activity recorded yet.</p>
            ) : (
              <div className="relative border-l border-white/[0.06] ml-4 space-y-5 pl-6">
                {timeline.map((e, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[25px] mt-1.5 w-2.5 h-2.5 rounded-full bg-brand-500 ring-4 ring-app" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-semibold text-text-primary">{e.title}</span>
                        <span className="text-2xs text-text-subtle">{new Date(e.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">{e.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <RenewPolicyModal
        isOpen={!!renewPolicyId}
        policyId={renewPolicyId}
        onClose={() => setRenewPolicyId(null)}
        onSuccess={() => { setRenewPolicyId(null); fetchProfileDetails(); }}
      />
    </div>
  );
};
