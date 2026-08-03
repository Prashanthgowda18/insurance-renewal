import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Car, Shield, Save, Loader2, FileText, AlertTriangle, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { SearchableSelect } from '../components/SearchableSelect';
import { INSURANCE_COMPANIES } from '../data/vehicleInsuranceData';

export const AddCustomer: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');

  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [policyType, setPolicyType] = useState('');
  const [policyStartDate, setPolicyStartDate] = useState('');
  const [policyExpiryDate, setPolicyExpiryDate] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = () => {
        setFileBase64(reader.result as string);
      };
    }
  };

  const getValidationErrors = (): string[] => {
    const errors: string[] = [];
    if (!customerName.trim()) errors.push('Customer Name is required.');
    
    const cleanedMobile = mobileNumber.replace(/\D/g, '').slice(-10);
    if (!cleanedMobile || !/^[6-9]\d{9}$/.test(cleanedMobile)) {
      errors.push('Valid 10-digit Customer Mobile Number is required.');
    }
    
    if (!vehicleNumber.trim()) errors.push('Vehicle Number is required.');
    if (!policyNumber.trim()) errors.push('Policy Number is required.');
    if (!insuranceCompany.trim()) errors.push('Insurance Company is required.');
    if (!policyExpiryDate) errors.push('Policy Expiry Date is required.');

    if (policyStartDate && policyExpiryDate) {
      if (new Date(policyExpiryDate) <= new Date(policyStartDate)) {
        errors.push('Policy Expiry Date must be later than Policy Start Date.');
      }
    }
    return errors;
  };

  const handleSave = async () => {
    setSaveError(null);
    const errors = getValidationErrors();
    if (errors.length > 0) {
      toastError(errors[0]);
      return;
    }

    setIsSaving(true);
    try {
      const cleanedMobile = mobileNumber.replace(/\D/g, '').slice(-10);
      const payload = {
        customer: {
          name: customerName.trim(),
          mobile: cleanedMobile,
          email: email.trim(),
          address: address.trim(),
        },
        vehicle: {
          registrationNumber: vehicleNumber.trim().toUpperCase(),
          vehicleType: vehicleType.toLowerCase() || 'car',
        },
        insurance: {
          companyName: insuranceCompany.trim(),
          policyNumber: policyNumber.trim().toUpperCase(),
          policyType: policyType.toLowerCase().replace(/ /g, '_') || 'comprehensive',
          startDate: policyStartDate,
          expiryDate: policyExpiryDate,
          premiumAmount: Number(premiumAmount) || 0,
        },
        policyDocumentBase64: fileBase64,
      };

      const res = await api.post('/policies/import-extracted', payload);
      setIsSaving(false);

      if (res.data && (res.data.success || res.data.customer)) {
        success('Customer, Vehicle, and Policy saved into CRM successfully!');
        const targetCustomerId = res.data?.customer?.id || res.data?.customerId;
        setTimeout(() => {
          if (targetCustomerId) {
            navigate(`/customers/${targetCustomerId}`);
          } else {
            navigate('/customers');
          }
        }, 1500);
      } else {
        const errMsg = 'Failed to save record.';
        setSaveError(errMsg);
        toastError(errMsg);
      }
    } catch (err: any) {
      setIsSaving(false);
      const errMsg = err.response?.data?.message || err.message || 'Database Connection Failed.';
      setSaveError(errMsg);
      toastError(errMsg);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-7 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Add Customer</h1>
          <p className="text-text-muted text-sm mt-1">
            Manually enter customer, vehicle, and policy details to add them to your CRM.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost border border-white/[0.08] text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary text-xs px-5 py-2 flex items-center gap-2 font-bold shadow-lg shadow-brand-500/20"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Policy
          </button>
        </div>
      </div>

      {saveError && (
        <div className="glass-card p-4 border-l-4 border-l-amber-500 bg-amber-950/40 text-amber-200 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-200">Database Save Failed</h4>
              <p className="text-xs text-amber-300 mt-0.5">{saveError}</p>
            </div>
          </div>
          <button onClick={() => setSaveError(null)} className="text-amber-400 hover:text-amber-200 p-1 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Manual Entry Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CUSTOMER INFORMATION */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <User className="w-4 h-4 text-brand-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">1. Customer Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-muted font-medium block mb-1">Customer Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="field border-white/[0.08]"
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted font-medium block mb-1">Phone Number *</label>
              <input
                type="text"
                inputMode="numeric"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="field border-white/[0.08]"
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>
            <div>
              <label className="text-xs text-text-muted font-medium mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field border-white/[0.08]"
                placeholder="Email (optional)"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted font-medium mb-1 block">Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="field border-white/[0.08]"
                placeholder="Customer address (optional)"
              />
            </div>
          </div>
        </div>

        {/* VEHICLE INFORMATION */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <Car className="w-4 h-4 text-success" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">2. Vehicle Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-muted font-medium block mb-1">Vehicle Number *</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                className="field font-mono font-bold tracking-wide uppercase border-white/[0.08]"
                placeholder="e.g., KA01AB1234"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted font-medium mb-1 block">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="field"
              >
                <option value="">-- Select --</option>
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>
          </div>
        </div>

        {/* POLICY INFORMATION */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <Shield className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">3. Policy Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-muted font-medium block mb-1">Insurance Company *</label>
              <SearchableSelect
                options={INSURANCE_COMPANIES}
                value={insuranceCompany}
                onChange={(val) => setInsuranceCompany(val)}
                placeholder="Search Insurance Company..."
              />
            </div>
            <div>
              <label className="text-xs text-text-muted font-medium block mb-1">Policy Number *</label>
              <input
                type="text"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value.toUpperCase())}
                className="field font-mono uppercase border-white/[0.08]"
                placeholder="Policy number"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted font-medium mb-1 block">Policy Type</label>
              <select
                value={policyType}
                onChange={(e) => setPolicyType(e.target.value)}
                className="field"
              >
                <option value="">-- Select --</option>
                <option value="Comprehensive">Comprehensive</option>
                <option value="Third Party">Third Party</option>
                <option value="Own Damage">Own Damage</option>
                <option value="Package">Package</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-muted font-medium mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={policyStartDate}
                  onChange={(e) => setPolicyStartDate(e.target.value)}
                  className="field border-white/[0.08]"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted font-medium block mb-1">Expiry Date *</label>
                <input
                  type="date"
                  value={policyExpiryDate}
                  onChange={(e) => setPolicyExpiryDate(e.target.value)}
                  className="field border-white/[0.08]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted font-medium mb-1 block">Premium Amount (₹)</label>
              <input
                type="text"
                value={premiumAmount}
                onChange={(e) => setPremiumAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                className="field border-white/[0.08]"
                placeholder="Premium in ₹"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* ATTACH DOCUMENT */}
      <div className="glass-card p-5 mt-6">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 mb-4">
          <FileText className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">4. Attach Document (Optional)</h3>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelected}
            className="text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-600/10 file:text-brand-400 hover:file:bg-brand-600/20 cursor-pointer"
          />
          {file && <span className="text-xs text-success flex items-center gap-1">Attached: {file.name}</span>}
        </div>
      </div>

    </div>
  );
};
