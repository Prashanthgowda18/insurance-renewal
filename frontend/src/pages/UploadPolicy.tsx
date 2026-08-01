import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud, FileText, CheckCircle2, AlertTriangle, ShieldCheck,
  User, Car, Shield, Sparkles, Loader2, ArrowRight, Save, Eye, RefreshCw, X
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { SearchableSelect } from '../components/SearchableSelect';
import {
  BIKE_MANUFACTURERS, CAR_MANUFACTURERS, COMMERCIAL_MANUFACTURERS,
  MANUFACTURER_MODELS_MAP, INSURANCE_COMPANIES
} from '../data/vehicleInsuranceData';

interface ConfidenceField<T = string> {
  value: T;
  confidence: number;
}

interface ExtractedData {
  customer: {
    name: ConfidenceField<string>;
    mobile: ConfidenceField<string>;
    email: ConfidenceField<string>;
    address: ConfidenceField<string>;
    city: ConfidenceField<string>;
    state: ConfidenceField<string>;
    pincode: ConfidenceField<string>;
    nomineeName: ConfidenceField<string>;
    nomineeRelationship: ConfidenceField<string>;
    nomineeAge: ConfidenceField<string>;
  };
  vehicle: {
    registrationNumber: ConfidenceField<string>;
    vehicleType: ConfidenceField<string>;
    manufacturer: ConfidenceField<string>;
    model: ConfidenceField<string>;
    variant: ConfidenceField<string>;
    registrationDate: ConfidenceField<string>;
    registrationPlace: ConfidenceField<string>;
    manufacturingYear: ConfidenceField<number | null>;
    fuelType: ConfidenceField<string>;
    engineNumber: ConfidenceField<string>;
    chassisNumber: ConfidenceField<string>;
    cubicCapacity: ConfidenceField<string>;
    seatingCapacity: ConfidenceField<string>;
    idv: ConfidenceField<number | null>;
  };
  insurance: {
    companyName: ConfidenceField<string>;
    policyNumber: ConfidenceField<string>;
    policyType: ConfidenceField<string>;
    issueDate: ConfidenceField<string>;
    startDate: ConfidenceField<string>;
    expiryDate: ConfidenceField<string>;
    premiumAmount: ConfidenceField<number | null>;
    ownDamagePremium: ConfidenceField<number | null>;
    thirdPartyPremium: ConfidenceField<number | null>;
    gst: ConfidenceField<number | null>;
    ncb: ConfidenceField<string>;
    previousCompany: ConfidenceField<string>;
    previousPolicyNumber: ConfidenceField<string>;
    branchOffice: ConfidenceField<string>;
  };
  documentUrl?: string;
  rawTextPreview?: string;
}

export const UploadPolicy: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessData, setSaveSuccessData] = useState<any>(null);

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      toastError('File size exceeds 10 MB limit.');
      return;
    }
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) {
      toastError('Unsupported format. Please upload PDF, JPG, JPEG, or PNG.');
      return;
    }

    // Always clear previous state and OCR cache before processing new document
    setExtractedData(null);
    setSaveSuccessData(null);
    setFile(selectedFile);
    processDocument(selectedFile);
  };

  const processDocument = async (docFile: File) => {
    setIsExtracting(true);
    setExtractionProgress(15);

    const progressInterval = setInterval(() => {
      setExtractionProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 250);

    try {
      const now = new Date();
      const dateTag = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') + '_' +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');
      const fileExt = docFile.name.split('.').pop() || 'pdf';
      const uniqueFilename = `policy_${dateTag}_${Math.floor(1000 + Math.random() * 9000)}.${fileExt}`;

      const reader = new FileReader();
      reader.readAsDataURL(docFile);
      reader.onload = async () => {
        try {
          const base64String = reader.result as string;
          const res = await api.post('/policies/extract-policy', {
            fileBase64: base64String,
            filename: uniqueFilename,
            originalName: docFile.name,
            timestamp: Date.now(),
          });

          clearInterval(progressInterval);
          setExtractionProgress(100);

          if (!res.data || !res.data.extractedData) {
            setIsExtracting(false);
            setExtractedData(null);
            toastError('Unable to extract information from this document.');
            return;
          }

          setTimeout(() => {
            setExtractedData(res.data.extractedData);
            setIsExtracting(false);
            success('Insurance policy processed successfully.');
          }, 400);
        } catch (err: any) {
          clearInterval(progressInterval);
          setIsExtracting(false);
          setExtractedData(null);
          toastError(err.response?.data?.error?.message || 'Unable to extract information from this document.');
        }
      };
    } catch (err) {
      clearInterval(progressInterval);
      setIsExtracting(false);
      toastError('Failed to read document file.');
    }
  };

  // Helper for field change in state
  const updateField = (category: 'customer' | 'vehicle' | 'insurance', field: string, value: any) => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      [category]: {
        ...extractedData[category],
        [field]: {
          ...(extractedData[category] as any)[field],
          value,
        },
      },
    });
  };

  // Confidence Badge component
  const ConfidenceBadge = ({ confidence }: { confidence: number }) => {
    if (confidence >= 90) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/20">
          {confidence}% Match
        </span>
      );
    }
    if (confidence >= 70) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/20">
          {confidence}% Review
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger/15 text-danger border border-danger/20">
        Manual Entry
      </span>
    );
  };

  // Input wrapper styling based on confidence
  const fieldBorderClass = (confidence: number, value: any) => {
    if (!value || value === '' || value === null) return 'border-danger/50 focus:border-danger';
    if (confidence < 70) return 'border-danger/40 focus:border-danger';
    if (confidence < 90) return 'border-warning/50 focus:border-warning';
    return 'border-white/[0.08] focus:border-brand-500/50';
  };

  // Manufacturer options depending on vehicle type
  const getManufacturerOptions = () => {
    const vType = extractedData?.vehicle.vehicleType.value || 'car';
    if (vType === 'bike' || vType === 'two_wheeler') return BIKE_MANUFACTURERS;
    if (vType === 'commercial' || vType === 'truck' || vType === 'bus') return COMMERCIAL_MANUFACTURERS;
    return CAR_MANUFACTURERS;
  };

  const getModelOptions = () => {
    const make = extractedData?.vehicle.manufacturer.value || '';
    return MANUFACTURER_MODELS_MAP[make] || [];
  };

  // Save Extracted Data
  const handleSave = async () => {
    if (!extractedData) return;
    setIsSaving(true);

    try {
      const payload = {
        customer: {
          name: extractedData.customer.name.value,
          mobile: extractedData.customer.mobile.value,
          email: extractedData.customer.email.value,
          address: extractedData.customer.address.value,
          city: extractedData.customer.city.value,
          state: extractedData.customer.state.value,
          pincode: extractedData.customer.pincode.value,
        },
        vehicle: {
          registrationNumber: extractedData.vehicle.registrationNumber.value,
          vehicleType: extractedData.vehicle.vehicleType.value,
          manufacturer: extractedData.vehicle.manufacturer.value,
          model: extractedData.vehicle.model.value,
          variant: extractedData.vehicle.variant.value,
          manufacturingYear: extractedData.vehicle.manufacturingYear.value,
          fuelType: extractedData.vehicle.fuelType.value,
        },
        insurance: {
          companyName: extractedData.insurance.companyName.value,
          policyNumber: extractedData.insurance.policyNumber.value,
          policyType: extractedData.insurance.policyType.value,
          startDate: extractedData.insurance.startDate.value,
          expiryDate: extractedData.insurance.expiryDate.value,
          premiumAmount: extractedData.insurance.premiumAmount.value,
        },
        documentUrl: extractedData.documentUrl,
      };

      const res = await api.post('/policies/import-extracted', payload);
      setIsSaving(false);
      setSaveSuccessData(res.data);
      success('Customer and Insurance Policy saved successfully.');

      const targetCustomerId = res.data?.customerId || res.data?.customer?.id;
      setTimeout(() => {
        if (targetCustomerId) {
          navigate(`/customers/${targetCustomerId}`);
        } else {
          navigate('/customers');
        }
      }, 1000);
    } catch (err: any) {
      setIsSaving(false);
      toastError(err.response?.data?.error?.message || err.message || 'Failed to save extracted policy.');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-7 animate-fade-in max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xs uppercase tracking-widest font-bold text-brand-400 bg-brand-600/10 border border-brand-600/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-brand-400" /> AI Document Import
            </span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Upload Insurance Policy</h1>
          <p className="text-text-muted text-sm mt-1">
            Upload PDF or scanned policy images to automatically extract customer, vehicle, and insurance details.
          </p>
        </div>
      </div>

      {/* ── STEP 1: DRAG & DROP UPLOAD ZONE ─────────────────────────────── */}
      {!extractedData && !isExtracting && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`glass-card border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
            isDragOver ? 'border-brand-500 bg-brand-600/10 scale-[1.01]' : 'border-white/15 hover:border-brand-500/50 hover:bg-white/[0.02]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-brand-600/15 border border-brand-600/30 flex items-center justify-center text-brand-400 shadow-xl shadow-brand-600/10">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">Drag & drop insurance policy document here</h3>
            <p className="text-xs text-text-subtle mt-1">
              Supports <span className="text-text-muted font-medium">PDF, JPG, JPEG, PNG</span> (Max 10 MB)
            </p>
          </div>
          <button className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2 mt-2 font-semibold shadow-lg shadow-brand-600/20">
            <FileText className="w-4 h-4" /> Browse Files
          </button>
        </div>
      )}

      {/* ── LOADING & EXTRACTION ANIMATION ─────────────────────────────── */}
      {isExtracting && (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-brand-600/20 border-t-brand-500 animate-spin flex items-center justify-center" />
            <Sparkles className="w-8 h-8 text-brand-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">Processing new insurance policy...</h3>
            <p className="text-xs text-text-subtle mt-1 max-w-md mx-auto">
              Reading policy headers, registration numbers, customer info, IDV, and policy dates across major Indian insurers.
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md bg-white/[0.06] rounded-full h-2 overflow-hidden border border-white/[0.05]">
            <div
              className="bg-brand-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${extractionProgress}%` }}
            />
          </div>
          <span className="text-xs font-mono text-brand-400 font-semibold">{extractionProgress}% Processing</span>
        </div>
      )}

      {/* ── STEP 2: REVIEW & EDIT EXTRACTED SCREEN ──────────────────────── */}
      {extractedData && !saveSuccessData && (
        <div className="space-y-6 animate-slide-up">
          {/* Header Bar */}
          <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-l-4 border-l-brand-500">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-success" />
              <div>
                <h3 className="text-sm font-bold text-text-primary">Extraction Complete — Review Details</h3>
                <p className="text-xs text-text-subtle">
                  Fields with <span className="text-warning font-semibold">Yellow</span> or <span className="text-danger font-semibold">Red</span> confidence require quick verification before saving.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExtractedData(null)}
                className="btn-ghost border border-white/[0.06] text-xs px-3.5 py-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Upload Different File
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary text-xs px-5 py-2 flex items-center gap-2 font-bold shadow-lg shadow-brand-500/20"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Customer & Policy
              </button>
            </div>
          </div>

          {/* 3 Grid Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 👤 CUSTOMER DETAILS */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-400" />
                  <h3 className="text-sm font-bold text-text-primary">1. Customer Details</h3>
                </div>
                <ConfidenceBadge confidence={extractedData.customer.name.confidence} />
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label className="text-text-muted font-medium">Customer Name *</label>
                    <ConfidenceBadge confidence={extractedData.customer.name.confidence} />
                  </div>
                  <input
                    type="text"
                    value={extractedData.customer.name.value}
                    onChange={(e) => updateField('customer', 'name', e.target.value)}
                    className={`field ${fieldBorderClass(extractedData.customer.name.confidence, extractedData.customer.name.value)}`}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label className="text-text-muted font-medium">Mobile Number *</label>
                    <ConfidenceBadge confidence={extractedData.customer.mobile.confidence} />
                  </div>
                  <input
                    type="text"
                    value={extractedData.customer.mobile.value}
                    onChange={(e) => updateField('customer', 'mobile', e.target.value)}
                    className={`field ${fieldBorderClass(extractedData.customer.mobile.confidence, extractedData.customer.mobile.value)}`}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label className="text-text-muted font-medium">Email Address</label>
                    <ConfidenceBadge confidence={extractedData.customer.email.confidence} />
                  </div>
                  <input
                    type="email"
                    value={extractedData.customer.email.value}
                    onChange={(e) => updateField('customer', 'email', e.target.value)}
                    className={`field ${fieldBorderClass(extractedData.customer.email.confidence, extractedData.customer.email.value)}`}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label className="text-text-muted font-medium">Address</label>
                    <ConfidenceBadge confidence={extractedData.customer.address.confidence} />
                  </div>
                  <textarea
                    rows={2}
                    value={extractedData.customer.address.value}
                    onChange={(e) => updateField('customer', 'address', e.target.value)}
                    className={`field ${fieldBorderClass(extractedData.customer.address.confidence, extractedData.customer.address.value)}`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-text-subtle mb-1 block">City</label>
                    <input
                      type="text"
                      value={extractedData.customer.city.value}
                      onChange={(e) => updateField('customer', 'city', e.target.value)}
                      className="field text-xs py-1.5 px-2"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-subtle mb-1 block">State</label>
                    <input
                      type="text"
                      value={extractedData.customer.state.value}
                      onChange={(e) => updateField('customer', 'state', e.target.value)}
                      className="field text-xs py-1.5 px-2"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-subtle mb-1 block">PIN</label>
                    <input
                      type="text"
                      value={extractedData.customer.pincode.value}
                      onChange={(e) => updateField('customer', 'pincode', e.target.value)}
                      className="field text-xs py-1.5 px-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 🚘 VEHICLE DETAILS */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-success" />
                  <h3 className="text-sm font-bold text-text-primary">2. Vehicle Details</h3>
                </div>
                <ConfidenceBadge confidence={extractedData.vehicle.registrationNumber.confidence} />
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label className="text-text-muted font-medium">Registration Number *</label>
                    <ConfidenceBadge confidence={extractedData.vehicle.registrationNumber.confidence} />
                  </div>
                  <input
                    type="text"
                    value={extractedData.vehicle.registrationNumber.value}
                    onChange={(e) => updateField('vehicle', 'registrationNumber', e.target.value.toUpperCase())}
                    className={`field font-mono font-bold tracking-wide uppercase ${fieldBorderClass(extractedData.vehicle.registrationNumber.confidence, extractedData.vehicle.registrationNumber.value)}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted font-medium mb-1 block">Vehicle Type</label>
                    <select
                      value={extractedData.vehicle.vehicleType.value}
                      onChange={(e) => updateField('vehicle', 'vehicleType', e.target.value)}
                      className="field"
                    >
                      <option value="car">Car (4-Wheeler)</option>
                      <option value="bike">Bike (2-Wheeler)</option>
                      <option value="commercial">Commercial / Truck</option>
                      <option value="bus">Bus</option>
                      <option value="auto">Auto Rickshaw</option>
                      <option value="taxi">Taxi / Cab</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted font-medium mb-1 block">Fuel Type</label>
                    <select
                      value={extractedData.vehicle.fuelType.value}
                      onChange={(e) => updateField('vehicle', 'fuelType', e.target.value)}
                      className="field"
                    >
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="cng">CNG</option>
                      <option value="electric">Electric</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-muted font-medium mb-1 block">Manufacturer</label>
                  <SearchableSelect
                    options={getManufacturerOptions()}
                    value={extractedData.vehicle.manufacturer.value}
                    onChange={(val) => updateField('vehicle', 'manufacturer', val)}
                    placeholder="Search Manufacturer..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted font-medium mb-1 block">Model</label>
                    <SearchableSelect
                      options={getModelOptions()}
                      value={extractedData.vehicle.model.value}
                      onChange={(val) => updateField('vehicle', 'model', val)}
                      placeholder="Select Model..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted font-medium mb-1 block">Year</label>
                    <input
                      type="number"
                      value={extractedData.vehicle.manufacturingYear.value || ''}
                      onChange={(e) => updateField('vehicle', 'manufacturingYear', Number(e.target.value))}
                      className="field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-text-subtle mb-1 block">Engine No.</label>
                    <input
                      type="text"
                      value={extractedData.vehicle.engineNumber.value}
                      onChange={(e) => updateField('vehicle', 'engineNumber', e.target.value)}
                      className="field text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-subtle mb-1 block">Chassis No.</label>
                    <input
                      type="text"
                      value={extractedData.vehicle.chassisNumber.value}
                      onChange={(e) => updateField('vehicle', 'chassisNumber', e.target.value)}
                      className="field text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 📄 INSURANCE POLICY DETAILS */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-text-primary">3. Insurance Details</h3>
                </div>
                <ConfidenceBadge confidence={extractedData.insurance.policyNumber.confidence} />
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label className="text-text-muted font-medium">Insurance Company *</label>
                    <ConfidenceBadge confidence={extractedData.insurance.companyName.confidence} />
                  </div>
                  <SearchableSelect
                    options={INSURANCE_COMPANIES}
                    value={extractedData.insurance.companyName.value}
                    onChange={(val) => updateField('insurance', 'companyName', val)}
                    placeholder="Search Insurance Company..."
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label className="text-text-muted font-medium">Policy Number *</label>
                    <ConfidenceBadge confidence={extractedData.insurance.policyNumber.confidence} />
                  </div>
                  <input
                    type="text"
                    value={extractedData.insurance.policyNumber.value}
                    onChange={(e) => updateField('insurance', 'policyNumber', e.target.value.toUpperCase())}
                    className={`field font-mono uppercase ${fieldBorderClass(extractedData.insurance.policyNumber.confidence, extractedData.insurance.policyNumber.value)}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted font-medium mb-1 block">Start Date</label>
                    <input
                      type="date"
                      value={extractedData.insurance.startDate.value}
                      onChange={(e) => updateField('insurance', 'startDate', e.target.value)}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted font-medium mb-1 block">Expiry Date *</label>
                    <input
                      type="date"
                      value={extractedData.insurance.expiryDate.value}
                      onChange={(e) => updateField('insurance', 'expiryDate', e.target.value)}
                      className={`field ${fieldBorderClass(extractedData.insurance.expiryDate.confidence, extractedData.insurance.expiryDate.value)}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted font-medium mb-1 block">Premium Amount (₹)</label>
                    <input
                      type="number"
                      value={extractedData.insurance.premiumAmount.value || ''}
                      onChange={(e) => updateField('insurance', 'premiumAmount', Number(e.target.value))}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted font-medium mb-1 block">Policy Type</label>
                    <select
                      value={extractedData.insurance.policyType.value}
                      onChange={(e) => updateField('insurance', 'policyType', e.target.value)}
                      className="field"
                    >
                      <option value="comprehensive">Comprehensive</option>
                      <option value="third_party">Third Party Only</option>
                      <option value="own_damage">Standalone Own Damage</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: SUCCESS & WHATSAPP REMINDER MODAL ────────────────────── */}
      {saveSuccessData && (
        <div className="glass-card p-8 text-center max-w-xl mx-auto space-y-5 animate-scale-in border-l-4 border-l-success">
          <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 text-success flex items-center justify-center mx-auto shadow-xl">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Policy Imported Successfully!</h2>
            <p className="text-xs text-text-subtle mt-1">
              Customer profile, vehicle record, insurance policy, 6-stage reminder schedule, and document link created.
            </p>
          </div>

          <div className="glass-card p-4 text-left space-y-2 bg-white/[0.02]">
            <p className="text-xs text-text-muted"><strong>Customer:</strong> {saveSuccessData.customer?.name}</p>
            <p className="text-xs text-text-muted"><strong>Vehicle:</strong> {saveSuccessData.vehicle?.vehicleNumber}</p>
            <p className="text-xs text-text-muted"><strong>Policy No:</strong> {saveSuccessData.policy?.policyNumber}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <WhatsAppButton
              variant="full"
              data={{
                customerName: saveSuccessData.customer?.name,
                mobile: saveSuccessData.customer?.mobile,
                vehicleNumber: saveSuccessData.vehicle?.vehicleNumber,
                vehicleType: saveSuccessData.vehicle?.vehicleType,
                expiryDate: saveSuccessData.policy?.expiryDate,
                insuranceCompany: saveSuccessData.policy?.insuranceCompany,
                policyNumber: saveSuccessData.policy?.policyNumber,
              }}
            />
            <button
              onClick={() => {
                setSaveSuccessData(null);
                setExtractedData(null);
                setFile(null);
              }}
              className="btn-ghost border border-white/[0.06] text-xs px-4 py-2.5 w-full sm:w-auto"
            >
              Upload Another Policy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
