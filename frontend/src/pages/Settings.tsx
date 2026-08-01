import React, { useEffect, useState } from 'react';
import {
  Building2, Bell, Clock, Mail, MessageSquare, Smartphone,
  Lock, Shield, Save, Loader2, CheckCircle, AlertCircle,
  Zap, ChevronRight, Database, Trash2, Download, Upload, RotateCcw,
} from 'lucide-react';
import api, { getStoredRecords, saveStoredRecords } from '../services/api';
import { useToast } from '../components/Toast';

type SettingsTab = 'company' | 'notifications' | 'reminders' | 'email' | 'whatsapp' | 'sms' | 'security' | 'backup' | 'archived';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'company',       label: 'Company',              icon: <Building2    className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications',        icon: <Bell         className="w-4 h-4" /> },
  { id: 'reminders',     label: 'Reminder Schedule',    icon: <Clock        className="w-4 h-4" /> },
  { id: 'email',         label: 'Email / SMTP',         icon: <Mail         className="w-4 h-4" /> },
  { id: 'whatsapp',      label: 'WhatsApp (Twilio)',    icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'sms',           label: 'SMS (Twilio)',         icon: <Smartphone   className="w-4 h-4" /> },
  { id: 'backup',        label: 'Database Backup',      icon: <Database     className="w-4 h-4" /> },
  { id: 'archived',      label: 'Archived Trash',       icon: <Trash2       className="w-4 h-4" /> },
  { id: 'security',      label: 'Security',             icon: <Lock         className="w-4 h-4" /> },
];

const ALL_REMINDER_DAYS = [30, 15, 7, 3, 1, 0];

export const Settings: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Company
  const [companyName, setCompanyName]                 = useState('');
  const [companyEmail, setCompanyEmail]               = useState('');
  const [companyPhone, setCompanyPhone]               = useState('');

  // Notifications
  const [channelToggles, setChannelToggles] = useState({ sms: true, whatsapp: true, email: true });
  const [notificationProvider, setNotificationProvider] = useState('mock');

  // Reminders
  const [reminderDays, setReminderDays]               = useState<number[]>([30, 15, 7, 3, 1, 0]);
  const [reminderTime, setReminderTime]               = useState('09:00');

  // Email / SMTP
  const [smtpHost, setSmtpHost]                       = useState('');
  const [smtpPort, setSmtpPort]                       = useState('587');
  const [smtpUser, setSmtpUser]                       = useState('');
  const [smtpPassword, setSmtpPassword]               = useState('');

  // Twilio
  const [twilioSid, setTwilioSid]                     = useState('');
  const [twilioToken, setTwilioToken]                 = useState('');
  const [twilioWhatsApp, setTwilioWhatsApp]           = useState('');
  const [twilioPhone, setTwilioPhone]                 = useState('');

  // Security / test
  const [testRecipient, setTestRecipient]             = useState('');
  const [testChannel, setTestChannel]                 = useState('whatsapp');
  const [isTesting, setIsTesting]                     = useState(false);
  const [testResult, setTestResult]                   = useState<string | null>(null);

  // Archived items state
  const [archivedCustomers, setArchivedCustomers]     = useState<any[]>([]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/settings');
      const d = res.data;
      setCompanyName(d.company_name || '');
      setCompanyEmail(d.company_email || '');
      setCompanyPhone(d.company_contact_number || '');
      setReminderDays(d.reminder_days_config || [30,15,7,3,1,0]);
      setChannelToggles(d.channel_toggles || { sms: true, whatsapp: true, email: true });
      setNotificationProvider(d.notification_provider || 'mock');
      setSmtpHost(d.smtp_host || '');
      setSmtpPort(d.smtp_port || '587');
      setSmtpUser(d.smtp_user || '');
      setSmtpPassword(d.smtp_password || '');
      setTwilioSid(d.twilio_account_sid || '');
      setTwilioToken(d.twilio_auth_token || '');
      setTwilioWhatsApp(d.twilio_whatsapp_number || '');
      setTwilioPhone(d.twilio_phone_number || '');
      setReminderTime(d.reminder_time || '09:00');

      // Load archived items
      const allCust = getStoredRecords<any>('shield_crm_customers_v2');
      setArchivedCustomers(allCust.filter(c => c.archived));
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/settings', {
        company_name: companyName,
        company_email: companyEmail,
        company_contact_number: companyPhone,
        reminder_days_config: reminderDays,
        channel_toggles: channelToggles,
        notification_provider: notificationProvider,
        smtp_host: smtpHost, smtp_port: smtpPort, smtp_user: smtpUser, smtp_password: smtpPassword,
        twilio_account_sid: twilioSid, twilio_auth_token: twilioToken,
        twilio_whatsapp_number: twilioWhatsApp, twilio_phone_number: twilioPhone,
        reminder_time: reminderTime,
      });
      success('Settings saved successfully!');
    } catch { toastError('Failed to save settings.'); }
    finally { setIsSaving(false); }
  };

  const handleExportBackup = () => {
    const backupData = {
      customers: getStoredRecords('shield_crm_customers_v2'),
      policies: getStoredRecords('shield_crm_policies_v2'),
      vehicles: getStoredRecords('shield_crm_vehicles_v2'),
      logs: getStoredRecords('shield_crm_logs_v2'),
      exportedAt: new Date().toISOString(),
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `shield_crm_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    success('Database backup exported successfully!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.customers) saveStoredRecords('shield_crm_customers_v2', parsed.customers);
          if (parsed.policies) saveStoredRecords('shield_crm_policies_v2', parsed.policies);
          if (parsed.vehicles) saveStoredRecords('shield_crm_vehicles_v2', parsed.vehicles);
          if (parsed.logs) saveStoredRecords('shield_crm_logs_v2', parsed.logs);
          success('Database restored successfully from backup!');
          fetchSettings();
        } catch {
          toastError('Invalid backup file format.');
        }
      };
    }
  };

  const handleRestoreCustomer = (id: string) => {
    const allCust = getStoredRecords<any>('shield_crm_customers_v2');
    const target = allCust.find(c => c.id === id);
    if (target) {
      target.archived = false;
      saveStoredRecords('shield_crm_customers_v2', allCust);
      setArchivedCustomers(allCust.filter(c => c.archived));
      success(`Restored customer ${target.name}`);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) return;
    setIsTesting(true); setTestResult(null);
    try {
      const res = await api.post('/policies/send-test-notification', { recipient: testRecipient, channel: testChannel });
      setTestResult(res.data.success ? `✓ ${res.data.deliveryResult}` : `✗ ${res.data.deliveryResult}`);
    } catch (err: any) {
      setTestResult(`Error: ${err.response?.data?.error?.message || 'Test dispatch failed.'}`);
    } finally { setIsTesting(false); }
  };

  const toggleReminderDay = (day: number) => {
    setReminderDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a,b)=>b-a));
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 'company':
        return (
          <div className="space-y-5">
            <SectionTitle title="Company Information" subtitle="Basic details about your insurance agency" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="Company Name">
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="field" placeholder="Vaibhav Insurance" />
              </FieldGroup>
              <FieldGroup label="Contact Email">
                <input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} className="field" placeholder="contact@agency.com" />
              </FieldGroup>
              <FieldGroup label="Phone Number">
                <input type="tel" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} className="field" placeholder="+1 555 0199" />
              </FieldGroup>
            </div>
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-6">
            <SectionTitle title="Database Backup & Restore" subtitle="Export or restore your full commercial CRM database" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-brand-600/15 border border-brand-600/30 flex items-center justify-center text-brand-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary text-base">Export Database Backup</h4>
                  <p className="text-xs text-text-muted mt-1">Download a full JSON backup of all customers, vehicles, policies, and logs for permanent offline archive.</p>
                </div>
                <button onClick={handleExportBackup} className="btn-primary text-xs w-full py-2.5 flex items-center justify-center gap-2 font-bold">
                  <Download className="w-4 h-4" /> Download Backup (.json)
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-600/30 flex items-center justify-center text-purple-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary text-base">Restore Database from File</h4>
                  <p className="text-xs text-text-muted mt-1">Import a previously saved `.json` database backup to restore customer records.</p>
                </div>
                <label className="btn-ghost border border-white/10 text-xs w-full py-2.5 flex items-center justify-center gap-2 font-bold cursor-pointer hover:bg-white/[0.05]">
                  <Upload className="w-4 h-4 text-purple-400" /> Choose Backup File
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
              </div>

            </div>
          </div>
        );

      case 'archived':
        return (
          <div className="space-y-6">
            <SectionTitle title="Archived Records / Trash Manager" subtitle="View and restore soft-deleted records" />
            {archivedCustomers.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                <Trash2 className="w-8 h-8 text-text-subtle mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-text-muted">Trash is empty</p>
                <p className="text-xs text-text-subtle mt-0.5">No soft-deleted records pending restoration.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {archivedCustomers.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div>
                      <p className="text-sm font-bold text-text-primary">{c.name}</p>
                      <p className="text-xs text-text-subtle">📱 {c.mobile} · Archived on {new Date(c.archivedAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => handleRestoreCustomer(c.id)}
                      className="px-3 py-1.5 rounded-lg bg-brand-600/20 border border-brand-600/30 text-brand-400 text-xs font-bold flex items-center gap-1.5 hover:bg-brand-600/30"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore Record
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <SectionTitle title="Notification Channels" subtitle="Enable or disable delivery channels" />
            <div className="space-y-3">
              {(['whatsapp', 'sms', 'email'] as const).map(ch => (
                <div key={ch} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center text-brand-400">
                      {ch === 'whatsapp' ? <MessageSquare className="w-4 h-4" /> : ch === 'sms' ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary capitalize">{ch}</p>
                      <p className="text-xs text-text-subtle">{ch === 'whatsapp' ? 'Via Twilio WhatsApp API' : ch === 'sms' ? 'Via Twilio SMS' : 'Via SMTP relay'}</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={channelToggles[ch]}
                    onChange={v => setChannelToggles(p => ({ ...p, [ch]: v }))}
                  />
                </div>
              ))}
            </div>

            <SectionTitle title="Notification Provider" subtitle="Choose mock mode or live API" />
            <div className="flex gap-3">
              {['mock', 'live'].map(p => (
                <button
                  key={p}
                  onClick={() => setNotificationProvider(p)}
                  className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium capitalize transition-all ${
                    notificationProvider === p
                      ? 'bg-brand-600/15 border-brand-600/40 text-brand-400'
                      : 'bg-white/[0.03] border-white/[0.06] text-text-muted hover:bg-white/[0.05]'
                  }`}
                >
                  {p === 'mock' ? '🧪 Mock (Testing)' : '⚡ Live (Production)'}
                </button>
              ))}
            </div>
          </div>
        );

      case 'reminders':
        return (
          <div className="space-y-6">
            <SectionTitle title="Reminder Schedule" subtitle="Select which days before expiry to send reminders" />
            <div className="flex flex-wrap gap-3">
              {ALL_REMINDER_DAYS.map(day => {
                const active = reminderDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleReminderDay(day)}
                    className={`px-5 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      active
                        ? 'bg-brand-600/15 border-brand-600/40 text-brand-400'
                        : 'bg-white/[0.03] border-white/[0.06] text-text-muted hover:bg-white/[0.05]'
                    }`}
                  >
                    {day === 0 ? 'Expiry Day' : `${day} days`}
                  </button>
                );
              })}
            </div>
            <FieldGroup label="Reminder Dispatch Time">
              <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)} className="field max-w-[200px]" />
            </FieldGroup>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-5">
            <SectionTitle title="SMTP Email Configuration" subtitle="Configure your email relay server" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="SMTP Host">
                <input type="text" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} className="field" placeholder="smtp.mailgun.org" />
              </FieldGroup>
              <FieldGroup label="SMTP Port">
                <input type="number" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} className="field" placeholder="587" />
              </FieldGroup>
              <FieldGroup label="SMTP Username">
                <input type="text" value={smtpUser} onChange={e => setSmtpUser(e.target.value)} className="field" placeholder="postmaster@domain.com" />
              </FieldGroup>
              <FieldGroup label="SMTP Password">
                <input type="password" value={smtpPassword} onChange={e => setSmtpPassword(e.target.value)} className="field" placeholder="••••••••" />
              </FieldGroup>
            </div>
          </div>
        );

      case 'whatsapp':
      case 'sms':
        return (
          <div className="space-y-5">
            <SectionTitle title="Twilio API Configuration" subtitle="Used for both WhatsApp and SMS delivery" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldGroup label="Account SID">
                <input type="text" value={twilioSid} onChange={e => setTwilioSid(e.target.value)} className="field font-mono text-sm" placeholder="ACxxxxxxxxxxxxxxxxxx" />
              </FieldGroup>
              <FieldGroup label="Auth Token">
                <input type="password" value={twilioToken} onChange={e => setTwilioToken(e.target.value)} className="field font-mono text-sm" placeholder="••••••••••••••" />
              </FieldGroup>
              <FieldGroup label="WhatsApp Number">
                <input type="text" value={twilioWhatsApp} onChange={e => setTwilioWhatsApp(e.target.value)} className="field" placeholder="whatsapp:+14155238886" />
              </FieldGroup>
              <FieldGroup label="SMS Phone Number">
                <input type="text" value={twilioPhone} onChange={e => setTwilioPhone(e.target.value)} className="field" placeholder="+15550199" />
              </FieldGroup>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <SectionTitle title="Test Notification Dispatch" subtitle="Send a live test to verify your configuration" />
            <form onSubmit={handleSendTest} className="space-y-4 max-w-md">
              <FieldGroup label="Recipient">
                <input type="text" value={testRecipient} onChange={e => setTestRecipient(e.target.value)} className="field" placeholder="+15550100 or email@example.com" />
              </FieldGroup>
              <FieldGroup label="Channel">
                <select value={testChannel} onChange={e => setTestChannel(e.target.value)} className="field appearance-none cursor-pointer">
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </select>
              </FieldGroup>
              <button type="submit" disabled={isTesting} className="btn-primary">
                {isTesting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Zap className="w-4 h-4" /> Send Test</>}
              </button>
              {testResult && (
                <div className={`flex items-start gap-2 p-3 rounded-xl text-sm border ${testResult.startsWith('✓') ? 'bg-success/8 border-success/20 text-success' : 'bg-danger/8 border-danger/20 text-danger'}`}>
                  {testResult.startsWith('✓') ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  {testResult}
                </div>
              )}
            </form>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Settings</h1>
          <p className="text-text-muted text-sm mt-1">Configure your insurance platform & database backups</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="btn-primary text-sm px-5 py-2.5">
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar nav */}
        <nav className="lg:w-56 flex-shrink-0">
          <div className="glass-card p-2 space-y-0.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-600/15 text-brand-400 font-semibold'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/[0.04]'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-brand-400' : 'text-text-subtle'}>{tab.icon}</span>
                <span className="flex-1 text-left">{tab.label}</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-opacity ${activeTab === tab.id ? 'opacity-100 text-brand-400' : 'opacity-0'}`} />
              </button>
            ))}
          </div>
        </nav>

        {/* Panel */}
        <div className="flex-1 glass-card p-6 min-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
              <p className="text-sm text-text-muted">Loading settings...</p>
            </div>
          ) : renderPanel()}
        </div>
      </div>
    </div>
  );
};

// Sub-components
const SectionTitle: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="pb-4 border-b border-white/[0.06]">
    <h3 className="text-sm font-bold text-text-primary">{title}</h3>
    <p className="text-xs text-text-subtle mt-0.5">{subtitle}</p>
  </div>
);

const FieldGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full border transition-all duration-200 ${
      checked ? 'bg-brand-600 border-brand-600' : 'bg-white/[0.06] border-white/[0.1]'
    }`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);
