import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Plus, Trash2, Loader2, Check, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SearchableSelect } from '../components/SearchableSelect';
import {
  BIKE_MANUFACTURERS,
  CAR_MANUFACTURERS,
  COMMERCIAL_MANUFACTURERS,
  MANUFACTURER_MODELS_MAP,
  INSURANCE_COMPANIES,
  INSURANCE_TYPES,
  FUEL_TYPES,
} from '../data/vehicleInsuranceData';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface VehicleItem {
  vehicleNumber: string;
  vehicleType: string;
  make: string;
  model: string;
  manufacturingYear?: number;
  fuelType: string;
  photoBase64?: string;
  policy?: {
    insuranceCompany: string;
    policyNumber: string;
    insuranceType: string;
    startDate: string;
    expiryDate: string;
    renewalAmount: number;
    policyDocumentBase64?: string;
    rcBookBase64?: string;
    reminderSchedule: string[];
  };
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { success: showToastSuccess, error: showToastError } = useToast();
  
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  // Auto-focus ref
  const nameInputRef = useRef<HTMLInputElement>(null);
  const vNumberInputRef = useRef<HTMLInputElement>(null);

  // STEP 1 state: Personal Information
  const [name, setName] = useState('');
  const [mobileDigits, setMobileDigits] = useState(''); // 10 raw digits without +91
  const [altMobileDigits, setAltMobileDigits] = useState(''); // 10 raw digits without +91
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [preferredNotification, setPreferredNotification] = useState<string[]>(['whatsapp']);
  const [notes, setNotes] = useState('');

  // Touched states for inline validation
  const [nameTouched, setNameTouched] = useState(false);
  const [mobileTouched, setMobileTouched] = useState(false);
  const [altMobileTouched, setAltMobileTouched] = useState(false);

  // STEP 2 & 3 state: Vehicles list
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  
  // Temp state for editing current vehicle input
  const [vType, setVType] = useState('car');
  const [vNumber, setVNumber] = useState('');
  const [vMake, setVMake] = useState('');
  const [vModel, setVModel] = useState('');
  const [vYear, setVYear] = useState<string>(''); // Initially empty dropdown
  const [vFuel, setVFuel] = useState('petrol');
  const [vPhoto, setVPhoto] = useState<string>('');

  // Temp state for policy of current vehicle
  const [pCompany, setPCompany] = useState('');
  const [pNumber, setPNumber] = useState('');
  const [pType, setPType] = useState('comprehensive');
  const [pStart, setPStart] = useState(''); // Initially empty date
  const [pExpiry, setPExpiry] = useState(''); // Initially empty date
  const [pRenewalAmountStr, setPRenewalAmountStr] = useState<string>(''); // Initially empty currency input
  const [pDoc, setPDoc] = useState<string>('');
  const [pRc, setPRc] = useState<string>('');
  const [pSchedules, setPSchedules] = useState<string[]>(['30d', '15d', '7d', '3d', '1d', 'expiry']);

  // Focus management on step change / modal open
  useEffect(() => {
    if (isOpen) {
      if (step === 1 && nameInputRef.current) {
        setTimeout(() => nameInputRef.current?.focus(), 100);
      } else if (step === 2 && vNumberInputRef.current) {
        setTimeout(() => vNumberInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  // Validation helpers for Mobile numbers (+91 + 10 digits starting with 6,7,8,9)
  const isMobileValid = (digits: string) => {
    return /^[6-9]\d{9}$/.test(digits);
  };

  const isAltMobileValid = (digits: string) => {
    if (!digits) return true; // Optional field
    return /^[6-9]\d{9}$/.test(digits);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileDigits(clean);
  };

  const handleAltMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
    setAltMobileDigits(clean);
  };

  // Step 1 validity check
  const isStep1Valid = name.trim().length > 0 && isMobileValid(mobileDigits) && isAltMobileValid(altMobileDigits);

  // FileReader helper to parse uploaded documents as Base64 strings
  const parseFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await parseFileToBase64(e.target.files[0]);
        setter(base64);
      } catch (err) {
        console.error('File parsing error', err);
      }
    }
  };

  const handleAddVehicleToList = (): boolean => {
    if (!vNumber.trim()) {
      showToastError('Vehicle number is required');
      return false;
    }
    if (!pCompany.trim() || !pNumber.trim() || !pStart || !pExpiry) {
      showToastError('Fill in required policy details (Company, Policy #, Start Date, Expiry Date)');
      return false;
    }

    const newVehicle: VehicleItem = {
      vehicleNumber: vNumber.trim(),
      vehicleType: vType,
      make: vMake.trim(),
      model: vModel.trim(),
      manufacturingYear: vYear ? Number(vYear) : undefined,
      fuelType: vFuel,
      photoBase64: vPhoto || undefined,
      policy: {
        insuranceCompany: pCompany.trim(),
        policyNumber: pNumber.trim(),
        insuranceType: pType,
        startDate: pStart,
        expiryDate: pExpiry,
        renewalAmount: pRenewalAmountStr ? Number(pRenewalAmountStr.replace(/\D/g, '')) : 0,
        policyDocumentBase64: pDoc || undefined,
        rcBookBase64: pRc || undefined,
        reminderSchedule: pSchedules,
      },
    };

    setVehicles((prev) => [...prev, newVehicle]);

    // Reset inputs for next vehicle adding
    setVNumber('');
    setVMake('');
    setVModel('');
    setVYear('');
    setVPhoto('');
    setPCompany('');
    setPNumber('');
    setPStart('');
    setPExpiry('');
    setPRenewalAmountStr('');
    setPDoc('');
    setPRc('');
    return true;
  };

  const handleRemoveVehicleFromList = (idx: number) => {
    setVehicles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleToggleSchedule = (type: string) => {
    setPSchedules((prev) => 
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const isFormDirty = () => {
    return name || mobileDigits || altMobileDigits || email || address || notes || vehicles.length > 0 || vNumber || pNumber;
  };

  const handleAttemptClose = () => {
    if (isFormDirty()) {
      setShowConfirmCancel(true);
    } else {
      handleCloseReset();
    }
  };

  const handleSaveAll = async () => {
    if (vehicles.length === 0) {
      setError('Please add at least one vehicle with policy before saving.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      mobile: `+91${mobileDigits}`,
      altMobile: altMobileDigits ? `+91${altMobileDigits}` : undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      preferredNotificationChannel: preferredNotification.join(','),
      notes: notes.trim() || undefined,
      vehicles,
    };

    try {
      await api.post('/customers', payload);
      showToastSuccess('Customer profile registered successfully!');
      onSuccess();
      handleCloseReset();
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        const errorData = err.response.data.error;
        if (errorData.details) {
          const detailMsgs = Object.entries(errorData.details)
            .map(([field, msgs]: any) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
          setError(detailMsgs || errorData.message || 'Operation failed');
        } else {
          setError(errorData.message || 'Operation failed');
        }
      } else {
        setError('Connection issue. Ensure backend service is running.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseReset = () => {
    setStep(1);
    setName('');
    setMobileDigits('');
    setAltMobileDigits('');
    setEmail('');
    setAddress('');
    setNotes('');
    setNameTouched(false);
    setMobileTouched(false);
    setAltMobileTouched(false);
    setVehicles([]);
    setPreferredNotification(['whatsapp']);
    setError(null);
    setShowConfirmCancel(false);
    onClose();
  };

  // Generate Year options from 1980 to current year
  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYear; y >= 1980; y--) {
    yearOptions.push(y);
  }

  // Safe date formatter to prevent RangeError: Invalid time value crashes
  const formatDateSafe = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
  };

  // Currency formatter
  const formatRupees = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (!raw) return '';
    const num = parseInt(raw, 10);
    return new Intl.NumberFormat('en-IN').format(num);
  };

  // Dynamic Manufacturers based on Vehicle Type
  const manufacturerOptions =
    vType === 'bike'
      ? BIKE_MANUFACTURERS
      : vType === 'car' || vType === 'taxi'
      ? CAR_MANUFACTURERS
      : COMMERCIAL_MANUFACTURERS;

  // Dynamic Models based on selected Manufacturer
  const modelOptions = vMake ? (MANUFACTURER_MODELS_MAP[vMake] || ['Other']) : ['Other'];

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="glass-panel w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
          
          {/* Modal Header */}
          <header className="p-6 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xl text-text-primary">Register New Customer</h3>
              <p className="text-xs text-text-subtle mt-1">Progress: Step {step} of 3</p>
            </div>
            <button 
              onClick={handleAttemptClose}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-text-muted hover:text-text-primary transition"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Modal Content Scrollable Area */}
          <main className="p-6 overflow-y-auto flex-1 space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm text-center">
                {error}
              </div>
            )}

            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-text-primary uppercase text-xs tracking-wider text-brand-400">
                  Step 1: Owner Profile Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-text-muted text-xs font-medium mb-1.5">
                      Customer Name <span className="text-danger">*</span>
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      required
                      placeholder="Enter full name"
                      value={name}
                      onBlur={() => setNameTouched(true)}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full field text-sm ${nameTouched && !name.trim() ? 'border-danger focus:border-danger' : ''}`}
                    />
                    {nameTouched && !name.trim() && (
                      <p className="text-[11px] text-danger mt-1">Customer name is required.</p>
                    )}
                  </div>

                  {/* Mobile Number (+91 Fixed Prefix) */}
                  <div>
                    <label className="block text-text-muted text-xs font-medium mb-1.5">
                      Mobile Number <span className="text-danger">*</span>
                    </label>
                    <div className="flex items-center rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.03] focus-within:border-brand-500/50 focus-within:bg-white/[0.06] transition">
                      <span className="px-3 py-2.5 bg-white/[0.06] text-text-muted font-semibold text-sm border-r border-white/[0.08] select-none">
                        +91
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="9876543210"
                        value={mobileDigits}
                        onBlur={() => setMobileTouched(true)}
                        onChange={handleMobileChange}
                        className="w-full bg-transparent px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-subtle"
                      />
                    </div>
                    {mobileTouched && !isMobileValid(mobileDigits) && (
                      <p className="text-[11px] text-danger mt-1">
                        Must be a valid 10-digit Indian number starting with 6, 7, 8, or 9.
                      </p>
                    )}
                  </div>

                  {/* Alternate Mobile Number (+91 Fixed Prefix) */}
                  <div>
                    <label className="block text-text-muted text-xs font-medium mb-1.5">
                      Alternate Mobile
                    </label>
                    <div className="flex items-center rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.03] focus-within:border-brand-500/50 focus-within:bg-white/[0.06] transition">
                      <span className="px-3 py-2.5 bg-white/[0.06] text-text-muted font-semibold text-sm border-r border-white/[0.08] select-none">
                        +91
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="9876543210 (Optional)"
                        value={altMobileDigits}
                        onBlur={() => setAltMobileTouched(true)}
                        onChange={handleAltMobileChange}
                        className="w-full bg-transparent px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-subtle"
                      />
                    </div>
                    {altMobileTouched && !isAltMobileValid(altMobileDigits) && (
                      <p className="text-[11px] text-danger mt-1">
                        Must be a valid 10-digit number starting with 6-9.
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-text-muted text-xs font-medium mb-1.5">Email Address</label>
                    <input
                      type="email"
                      placeholder="owner@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full field text-sm"
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-text-muted text-xs font-medium mb-1.5">Mailing Address</label>
                    <textarea
                      rows={2}
                      placeholder="Mailing address details..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full field text-sm"
                    />
                  </div>

                  {/* Preferred Notification Channels */}
                  <div className="md:col-span-2">
                    <label className="block text-text-muted text-xs font-medium mb-2">
                      Preferred Alert Channels (Select Multiple)
                    </label>
                    <div className="flex flex-wrap gap-4 text-sm mt-1 bg-white/[0.02] border border-white/[0.06] p-3 rounded-xl">
                      {[
                        { id: 'whatsapp', label: 'WhatsApp' },
                        { id: 'sms', label: 'SMS text' },
                        { id: 'email', label: 'Email' }
                      ].map((ch) => (
                        <label key={ch.id} className="flex items-center gap-2 text-text-muted cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={preferredNotification.includes(ch.id)}
                            onChange={() => {
                              setPreferredNotification((prev) =>
                                prev.includes(ch.id)
                                  ? prev.filter((val) => val !== ch.id)
                                  : [...prev, ch.id]
                              );
                            }}
                            className="w-4 h-4 rounded accent-brand-600 cursor-pointer"
                          />
                          {ch.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-text-muted text-xs font-medium mb-1.5">Remarks / Customer Notes</label>
                    <textarea
                      rows={2}
                      placeholder="General observations, preferences, etc..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full field text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 & 3: Vehicles & Policies */}
            {step === 2 && (
              <div className="space-y-6">
                <h4 className="font-semibold text-text-primary uppercase text-xs tracking-wider text-brand-400">
                  Step 2 & 3: Vehicles & Policies
                </h4>
                
                {/* Seeded vehicles list */}
                {vehicles.length > 0 && (
                  <div className="space-y-2">
                    <span className="block text-xs font-medium text-text-subtle">
                      Registered Vehicles ({vehicles.length})
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {vehicles.map((v, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                          <div>
                            <p className="font-bold text-text-primary text-sm font-mono">{v.vehicleNumber}</p>
                            <p className="text-xs text-text-subtle capitalize">{v.vehicleType} • {v.make} {v.model}</p>
                            <p className="text-[11px] text-brand-400 mt-1 font-semibold">
                              {v.policy?.insuranceCompany} ({v.policy?.policyNumber}) — ₹{v.policy?.renewalAmount ? new Intl.NumberFormat('en-IN').format(v.policy.renewalAmount) : '0'}
                            </p>
                          </div>
                          <button 
                            onClick={() => handleRemoveVehicleFromList(idx)}
                            className="p-2 rounded-lg bg-danger/10 hover:bg-danger/20 border border-danger/20 text-danger transition"
                            title="Remove vehicle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Vehicle Sub-Form */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-5">
                  <h5 className="font-bold text-sm text-text-primary">Add Vehicle & Policy details</h5>
                  
                  {/* Vehicle specifications */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-text-subtle text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                        Vehicle Type
                      </label>
                      <select
                        value={vType}
                        onChange={(e) => {
                          setVType(e.target.value);
                          setVMake('');
                          setVModel('');
                        }}
                        className="w-full field text-sm appearance-none cursor-pointer"
                      >
                        <option value="car">Car / Sedan / SUV</option>
                        <option value="bike">Bike / Motorcycle</option>
                        <option value="truck">Truck / Commercial Vehicle</option>
                        <option value="bus">Bus</option>
                        <option value="auto">Auto Rickshaw</option>
                        <option value="taxi">Taxi</option>
                        <option value="other">Other Type</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-text-subtle text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                        Vehicle Number <span className="text-danger">*</span>
                      </label>
                      <input
                        ref={vNumberInputRef}
                        type="text"
                        placeholder="KA01AB1234"
                        value={vNumber}
                        onChange={(e) => setVNumber(e.target.value.toUpperCase())}
                        className="w-full field text-sm font-mono uppercase"
                      />
                    </div>

                    {/* Manufacturer (Searchable Dropdown, No free-text typing) */}
                    <div>
                      <SearchableSelect
                        label="Manufacturer"
                        options={manufacturerOptions}
                        value={vMake}
                        onChange={(val) => {
                          setVMake(val);
                          setVModel(''); // Reset model when make changes
                        }}
                        placeholder="Select Manufacturer"
                      />
                    </div>

                    {/* Model (Dependent Searchable Dropdown) */}
                    <div>
                      <SearchableSelect
                        label="Model"
                        options={modelOptions}
                        value={vModel}
                        onChange={setVModel}
                        placeholder={vMake ? "Select Model" : "Select Manufacturer first"}
                        disabled={!vMake}
                      />
                    </div>

                    {/* Manufacturing Year Dropdown (No spinners, empty initial state) */}
                    <div>
                      <label className="block text-text-subtle text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                        Manufacturing Year
                      </label>
                      <select
                        value={vYear}
                        onChange={(e) => setVYear(e.target.value)}
                        className="w-full field text-sm appearance-none cursor-pointer"
                      >
                        <option value="">Select Manufacturing Year</option>
                        {yearOptions.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-text-subtle text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                        Fuel Type
                      </label>
                      <select
                        value={vFuel}
                        onChange={(e) => setVFuel(e.target.value)}
                        className="w-full field text-sm appearance-none cursor-pointer"
                      >
                        {FUEL_TYPES.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-text-subtle text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                        Vehicle Photo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setVPhoto)}
                        className="w-full text-xs text-text-subtle file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/[0.06] file:text-text-muted hover:file:bg-white/[0.1] cursor-pointer"
                      />
                    </div>
                  </div>

                  <hr className="border-white/[0.06]" />

                  {/* Policy Specifications */}
                  <div className="space-y-4">
                    <span className="block text-xs font-semibold text-text-subtle uppercase tracking-wider">
                      Insurance Details
                    </span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Insurance Company (Searchable Dropdown) */}
                      <div>
                        <SearchableSelect
                          label="Insurance Company"
                          required
                          options={INSURANCE_COMPANIES}
                          value={pCompany}
                          onChange={setPCompany}
                          placeholder="Select Insurance Company"
                        />
                      </div>

                      <div>
                        <label className="block text-text-subtle text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                          Policy Number <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="POL-12345678"
                          value={pNumber}
                          onChange={(e) => setPNumber(e.target.value)}
                          className="w-full field text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-text-subtle text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                          Insurance Type
                        </label>
                        <select
                          value={pType}
                          onChange={(e) => setPType(e.target.value)}
                          className="w-full field text-sm appearance-none cursor-pointer"
                        >
                          {INSURANCE_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Start Date (Initially empty, no auto-fill) */}
                      <div>
                        <label className="block text-text-subtle text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                          Start Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          placeholder="Select Start Date"
                          value={pStart}
                          onChange={(e) => setPStart(e.target.value)}
                          className="w-full field text-sm"
                        />
                      </div>

                      {/* Expiry Date (Initially empty, no auto-fill) */}
                      <div>
                        <label className="block text-text-subtle text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                          Expiry Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          placeholder="Select Expiry Date"
                          value={pExpiry}
                          onChange={(e) => setPExpiry(e.target.value)}
                          className="w-full field text-sm"
                        />
                      </div>

                      {/* Renewal Amount (Formatted in INR, no spinners) */}
                      <div>
                        <label className="block text-text-subtle text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                          Renewal Amount (₹)
                        </label>
                        <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03] focus-within:border-brand-500/50 focus-within:bg-white/[0.06] transition">
                          <span className="px-3 py-2 text-text-muted font-bold text-sm border-r border-white/[0.08] select-none">
                            ₹
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Enter Renewal Amount"
                            value={pRenewalAmountStr}
                            onChange={(e) => setPRenewalAmountStr(formatRupees(e.target.value))}
                            className="w-full bg-transparent px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-subtle"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-text-subtle text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                          Upload Policy PDF
                        </label>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => handleFileUpload(e, setPDoc)}
                          className="w-full text-xs text-text-subtle file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/[0.06] file:text-text-muted hover:file:bg-white/[0.1] cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-text-subtle text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                          Upload RC Book
                        </label>
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={(e) => handleFileUpload(e, setPRc)}
                          className="w-full text-xs text-text-subtle file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/[0.06] file:text-text-muted hover:file:bg-white/[0.1] cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    {/* Alert Reminders schedules checkboxes */}
                    <div className="space-y-2 pt-2">
                      <span className="block text-[10px] font-semibold text-text-subtle uppercase tracking-wider">
                        Reminder Alert Windows
                      </span>
                      <div className="flex flex-wrap gap-4 text-xs">
                        {['30d', '15d', '7d', '3d', '1d', 'expiry'].map((type) => (
                          <label key={type} className="flex items-center gap-2 text-text-muted cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={pSchedules.includes(type)}
                              onChange={() => handleToggleSchedule(type)}
                              className="w-4 h-4 rounded accent-brand-600 cursor-pointer"
                            />
                            {type === 'expiry' ? 'Expiry Day' : `${type.replace('d', '')} Days`}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sub-form action button */}
                  <button
                    type="button"
                    onClick={handleAddVehicleToList}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-brand-500/40 hover:border-brand-500 text-brand-400 font-semibold text-sm hover:bg-brand-600/10 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Save Vehicle and Policy to List
                  </button>
                </div>

              </div>
            )}

            {/* STEP 3: Final confirmation review */}
            {step === 3 && (
              <div className="space-y-6">
                <h4 className="font-semibold text-text-primary uppercase text-xs tracking-wider text-brand-400">
                  Step 3: Review Customer profile details
                </h4>
                
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-text-subtle block">Customer Name</span>
                      <span className="font-semibold text-text-primary">{name}</span>
                    </div>
                    <div>
                      <span className="text-xs text-text-subtle block">Mobile Number</span>
                      <span className="font-semibold text-text-primary">+91 {mobileDigits}</span>
                    </div>
                    {altMobileDigits && (
                      <div>
                        <span className="text-xs text-text-subtle block">Alt Mobile</span>
                        <span className="font-semibold text-text-primary">+91 {altMobileDigits}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-text-subtle block">Email Address</span>
                      <span className="font-semibold text-text-primary">{email || '—'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-text-subtle block">Alert Delivery Channel</span>
                      <span className="font-semibold text-brand-400 uppercase">{preferredNotification.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="block text-xs font-semibold text-text-subtle uppercase tracking-wider">
                    Registered Vehicles ({vehicles.length})
                  </span>
                  <div className="space-y-2">
                    {vehicles.map((v, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex justify-between items-center text-sm">
                        <div>
                          <p className="font-bold text-text-primary font-mono">{v.vehicleNumber} ({v.make} {v.model})</p>
                          <p className="text-xs text-text-subtle">
                            Policy: {v.policy?.policyNumber} • Company: {v.policy?.insuranceCompany}
                          </p>
                        </div>
                        <span className="text-xs text-text-muted font-bold">
                          Expiry: {formatDateSafe(v.policy?.expiryDate)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Modal Footer containing Wizard buttons */}
          <footer className="p-6 border-t border-white/[0.06] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="btn-secondary text-sm px-4 py-2.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            {step < 3 ? (
              <button
                type="button"
                disabled={step === 1 && !isStep1Valid}
                onClick={() => {
                  if (step === 1 && !isStep1Valid) return;
                  if (step === 2) {
                    // If user filled in vehicle fields but didn't click "+ Save Vehicle", auto-save it!
                    if (vNumber.trim() || pCompany.trim() || pNumber.trim() || pStart || pExpiry) {
                      const saved = handleAddVehicleToList();
                      if (!saved) return; // Validation failed, stop
                    } else if (vehicles.length === 0) {
                      showToastError('Please add at least one vehicle with policy before proceeding.');
                      return;
                    }
                  }
                  setStep((s) => s + 1);
                }}
                className="btn-primary text-sm px-5 py-2.5"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving || vehicles.length === 0}
                className="btn-primary text-sm px-5 py-2.5"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Customer Profile
                  </>
                )}
              </button>
            )}
          </footer>

        </div>
      </div>

      {/* Confirmation Dialog before canceling unsaved inputs */}
      <ConfirmDialog
        isOpen={showConfirmCancel}
        title="Discard Unsaved Changes?"
        message="You have entered information that has not been saved. Closing now will discard these entries."
        confirmLabel="Discard & Close"
        cancelLabel="Keep Editing"
        variant="warning"
        onConfirm={handleCloseReset}
        onCancel={() => setShowConfirmCancel(false)}
      />
    </>
  );
};
