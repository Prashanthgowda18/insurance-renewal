import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, User, Send, Paperclip, Sparkles, Loader2, CheckCircle2,
  AlertTriangle, FileText, Save, ExternalLink, RefreshCw, X, Eye
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { SearchableSelect } from './SearchableSelect';
import { INSURANCE_COMPANIES } from '../data/vehicleInsuranceData';
import { WhatsAppButton } from './WhatsAppButton';

export interface ExtractedData {
  customerName: string;
  mobileNumber: string;
  email: string;
  address: string;
  vehicleNumber: string;
  vehicleType: string;
  insuranceCompany: string;
  policyNumber: string;
  policyType: string;
  policyStartDate: string;
  policyExpiryDate: string;
  premiumAmount: string;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text?: string;
  timestamp: string;
  type?: 'text' | 'file_upload' | 'extraction_card' | 'import_success';
  fileData?: {
    name: string;
    size: string;
    url?: string;
  };
  extractedData?: ExtractedData;
  documentUrl?: string;
  savedCustomer?: any;
}

export const ExtractionChatbot: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      type: 'text',
      text: "👋 Hi! I'm your Insurance Policy Extractor Bot. Upload your policy PDF or document image below, and I will automatically extract and fill ONLY your document's real details into your Customer List!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Handle file selection from chat
  const handleFileSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toastError('File size exceeds 10 MB limit.');
      return;
    }
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toastError('Unsupported format. Please upload PDF, JPG, or PNG.');
      return;
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user-msg-${Date.now()}`;

    // 1. Push user message with uploaded file
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      type: 'file_upload',
      text: `Uploaded policy document: ${file.name}`,
      timestamp,
      fileData: {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        url: URL.createObjectURL(file),
      },
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    // 2. Push bot typing indicator response
    const botThinkingId = `bot-think-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: botThinkingId,
        sender: 'bot',
        type: 'text',
        text: '⚡ Reading and analyzing policy document using AI Vision...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64String = reader.result as string;
          const now = new Date();
          const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
          const fileExt = file.name.split('.').pop() || 'pdf';
          const uniqueFilename = `policy_${dateTag}_${Math.floor(1000 + Math.random() * 9000)}.${fileExt}`;

          const res = await api.post('/policies/extract-policy', {
            fileBase64: base64String,
            filename: uniqueFilename,
            originalName: file.name,
            timestamp: Date.now(),
          });

          const raw = res.data?.extractedData || res.data || {};
          
          const rawVType = String(raw.vehicleType || raw.vehicle_type || raw.type || '').trim();
          let normalizedVType = rawVType;
          if (/bike|two|2|scooter|motorcycle/i.test(rawVType)) normalizedVType = 'Bike';
          else if (/car|four|4|private/i.test(rawVType)) normalizedVType = 'Car';
          else if (/commercial|goods|passenger/i.test(rawVType)) normalizedVType = 'Commercial';

          const rawPType = String(raw.policyType || raw.policy_type || raw.planType || '').trim();
          let normalizedPType = rawPType;
          if (/package|comprehensive|bundled/i.test(rawPType)) normalizedPType = 'Package';
          else if (/own damage|standalone|sood/i.test(rawPType)) normalizedPType = 'Own Damage';
          else if (/third party|tp|act/i.test(rawPType)) normalizedPType = 'Third Party';

          const isNotFoundVal = (v: any) => !v || !String(v).trim() || String(v).trim().toLowerCase() === 'n/a' || String(v).trim().toLowerCase() === 'not found' || String(v).trim() === '""';
          const sanitizeField = (v: any) => isNotFoundVal(v) ? 'Not Found' : String(v).trim();

          const extracted: ExtractedData = {
            customerName: sanitizeField(raw.customerName || raw.name || raw.customer_name || raw.proposerName),
            mobileNumber: sanitizeField(raw.mobileNumber || raw.mobile || raw.phone || raw.mobile_number || raw.contactNumber),
            email: sanitizeField(raw.email || raw.emailAddress || raw.email_id),
            address: sanitizeField(raw.address || raw.communicationAddress || raw.custAddress),
            vehicleNumber: sanitizeField(raw.vehicleNumber || raw.registrationNumber || raw.regNo || raw.vehicle_number).toUpperCase(),
            vehicleType: normalizedVType,
            insuranceCompany: sanitizeField(raw.insuranceCompany || raw.companyName || raw.insurer || raw.insurance_company),
            policyNumber: sanitizeField(raw.policyNumber || raw.policyNo || raw.policy_number).toUpperCase(),
            policyType: normalizedPType,
            policyStartDate: sanitizeField(raw.policyStartDate || raw.startDate || raw.start_date || raw.fromDate),
            policyExpiryDate: sanitizeField(raw.policyExpiryDate || raw.expiryDate || raw.expiry_date || raw.toDate),
            premiumAmount: sanitizeField(raw.premiumAmount || raw.premium || raw.renewalAmount || raw.totalPremium),
          };

          setIsProcessing(false);

          const summaryText = `✅ Policy Extracted Successfully!

CUSTOMER
• Name: ${extracted.customerName}
• Mobile Number: ${extracted.mobileNumber}
• Email: ${extracted.email}
• Address: ${extracted.address}

VEHICLE & POLICY
• Vehicle Number: ${extracted.vehicleNumber}
• Vehicle Type: ${extracted.vehicleType}
• Insurance Company: ${extracted.insuranceCompany}
• Policy Number: ${extracted.policyNumber}
• Policy Type: ${extracted.policyType}
• Policy Start Date: ${extracted.policyStartDate}
• Policy Expiry Date: ${extracted.policyExpiryDate}
• Premium Amount: ${extracted.premiumAmount !== 'Not Found' ? '₹' + extracted.premiumAmount : 'Not Found'}`;

          // Replace bot thinking with Extraction Card
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botThinkingId
                ? {
                    id: `card-${Date.now()}`,
                    sender: 'bot',
                    type: 'extraction_card',
                    text: summaryText,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    extractedData: extracted,
                    documentUrl: res.data?.documentUrl,
                  }
                : msg
            )
          );

          success('Policy extracted successfully! Review card rendered in chat.');
        } catch (err: any) {
          setIsProcessing(false);
          const errMsg = err.response?.data?.error?.message || err.message || 'Failed to extract policy document.';
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botThinkingId
                ? {
                    id: `err-${Date.now()}`,
                    sender: 'bot',
                    type: 'text',
                    text: `❌ Extraction Error:\n\n${errMsg}\n\nPlease try uploading a valid policy PDF.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  }
                : msg
            )
          );
          toastError(errMsg);
        }
      };
    } catch (err: any) {
      setIsProcessing(false);
      toastError('Failed to read file.');
    }
  };

  const isInvalidField = (val: string) => !val || !val.trim() || val.trim() === 'Not Found';

  // Import Extracted Card into Customer List
  const handleImportToCustomerList = async (msgId: string, data: ExtractedData, docUrl?: string) => {
    if (isInvalidField(data.customerName)) {
      toastError('Customer Name is missing (Not Found). Please enter Customer Name.');
      return;
    }
    const cleanedMobile = (data.mobileNumber || '').replace(/\D/g, '').slice(-10);
    if (isInvalidField(data.mobileNumber) || data.mobileNumber.includes('*') || !/^[6-9]\d{9}$/.test(cleanedMobile)) {
      toastError('Valid 10-digit customer mobile number starting with 6-9 is required.');
      return;
    }
    if (isInvalidField(data.vehicleNumber)) {
      toastError('Vehicle Registration Number is missing (Not Found). Please enter Vehicle Number.');
      return;
    }
    if (isInvalidField(data.policyNumber)) {
      toastError('Policy Number is missing (Not Found). Please enter Policy Number.');
    }
    if (isInvalidField(data.insuranceCompany)) {
      toastError('Insurance Company is missing (Not Found). Please select Insurance Company.');
      return;
    }
    if (isInvalidField(data.policyExpiryDate)) {
      toastError('Policy Expiry Date is missing (Not Found). Please select Policy Expiry Date.');
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        customer: {
          name: data.customerName,
          mobile: cleanedMobile,
          email: isInvalidField(data.email) ? '' : data.email,
          address: isInvalidField(data.address) ? '' : data.address,
        },
        vehicle: {
          registrationNumber: data.vehicleNumber.toUpperCase(),
          vehicleType: (isInvalidField(data.vehicleType) ? 'car' : data.vehicleType).toLowerCase(),
        },
        insurance: {
          companyName: data.insuranceCompany,
          policyNumber: data.policyNumber.toUpperCase(),
          policyType: (isInvalidField(data.policyType) ? 'comprehensive' : data.policyType).toLowerCase().replace(/ /g, '_'),
          startDate: isInvalidField(data.policyStartDate) ? '' : data.policyStartDate,
          expiryDate: data.policyExpiryDate,
          premiumAmount: isInvalidField(data.premiumAmount) ? 0 : Number(data.premiumAmount.replace(/[^0-9.]/g, '')) || 0,
        },
        documentUrl: docUrl,
      };

      const res = await api.post('/policies/import-extracted', payload);
      setIsProcessing(false);

      if (res.data && (res.data.success || res.data.customer)) {
        success(`Customer ${res.data.customer?.name} imported into Customer List!`);

        // Add success bubble into chat stream
        setMessages((prev) => [
          ...prev,
          {
            id: `success-${Date.now()}`,
            sender: 'bot',
            type: 'import_success',
            text: `🎉 Customer **${res.data.customer?.name}** (${res.data.vehicle?.vehicleNumber}) has been saved into your Customer List! Reminder schedules have been set automatically.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            savedCustomer: res.data,
          },
        ]);
      } else {
        const errMsg = res.data?.error?.message || 'Failed to import customer.';
        toastError(errMsg);
      }
    } catch (err: any) {
      setIsProcessing(false);
      const errMsg = err.response?.data?.error?.message || err.message || 'Failed to import customer into database.';
      toastError(errMsg);
    }
  };

  // Update card field inside chat
  const handleUpdateCardField = (msgId: string, field: keyof ExtractedData, value: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId && msg.extractedData) {
          return {
            ...msg,
            extractedData: {
              ...msg.extractedData,
              [field]: value,
            },
          };
        }
        return msg;
      })
    );
  };

  // Send plain user text message
  const handleSendTextMessage = () => {
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const userMsgId = `user-txt-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        type: 'text',
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Bot response helper
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-resp-${Date.now()}`,
          sender: 'bot',
          type: 'text',
          text: `🤖 Upload your policy PDF or document image using the **Upload Policy PDF** button below, and I will automatically extract and fill ONLY your document's real details into your Customer List!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 500);
  };

  return (
    <div className="flex flex-col h-[700px] glass-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Bot Top Bar */}
      <div className="p-4 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center text-brand-400 shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              Policy AI Extraction Bot
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            </h3>
            <p className="text-xs text-text-subtle">Extracts policies & imports directly into Customer List</p>
          </div>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 font-bold shadow-md shadow-brand-500/20"
        >
          <Paperclip className="w-4 h-4" /> Upload Policy PDF
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        className="hidden"
      />

      {/* Chat Messages Stream */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-black/20">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                msg.sender === 'bot'
                  ? 'bg-brand-600/20 border border-brand-600/30 text-brand-400'
                  : 'bg-white/10 border border-white/20 text-text-primary'
              }`}
            >
              {msg.sender === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>

            {/* Bubble Container */}
            <div className="space-y-2 max-w-full">
              {/* Text Bubble */}
              {msg.text && (
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'glass-card border border-white/10 text-text-primary rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              )}

              {/* Uploaded File Badge */}
              {msg.type === 'file_upload' && msg.fileData && (
                <div className="glass-card p-3 rounded-xl border border-brand-500/30 bg-brand-500/10 flex items-center gap-3 text-xs">
                  <FileText className="w-5 h-5 text-brand-400 shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold text-text-primary truncate">{msg.fileData.name}</p>
                    <p className="text-[10px] text-text-subtle">{msg.fileData.size}</p>
                  </div>
                </div>
              )}

              {/* Extraction Review Card inside Bot Bubble */}
              {msg.type === 'extraction_card' && msg.extractedData && (
                <div className="glass-card p-5 rounded-2xl border-l-4 border-l-brand-500 bg-white/[0.02] space-y-4 max-w-2xl animate-fade-in shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Real PDF Extracted Details
                    </span>
                    {msg.documentUrl && (
                      <a
                        href={msg.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-brand-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <Eye className="w-3 h-3" /> View Original PDF
                      </a>
                    )}
                  </div>

                  {/* 📋 PROMINENT SUMMARY LIST BADGE WITH EMOJIS */}
                  <div className="bg-brand-600/10 p-4 rounded-xl border border-brand-500/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-brand-500/20 pb-1.5">
                      <p className="font-bold text-brand-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Extracted Policy Summary List:
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium pt-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span>👤 <strong>Customer Name:</strong></span>
                        {isInvalidField(msg.extractedData.customerName) ? (
                          <span className="text-amber-400 font-bold italic">Not Found</span>
                        ) : (
                          <span className="text-text-primary font-bold truncate">{msg.extractedData.customerName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>📞 <strong>Phone Number:</strong></span>
                        {isInvalidField(msg.extractedData.mobileNumber) ? (
                          <span className="text-amber-400 font-bold italic">Not Found</span>
                        ) : (
                          <span className="text-brand-400 font-mono font-bold">{msg.extractedData.mobileNumber}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>🚘 <strong>Vehicle Number:</strong></span>
                        {isInvalidField(msg.extractedData.vehicleNumber) ? (
                          <span className="text-amber-400 font-bold italic">Not Found</span>
                        ) : (
                          <span className="text-success font-mono font-bold uppercase">{msg.extractedData.vehicleNumber}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <span>📄 <strong>Policy Number:</strong></span>
                        {isInvalidField(msg.extractedData.policyNumber) ? (
                          <span className="text-amber-400 font-bold italic">Not Found</span>
                        ) : (
                          <span className="text-purple-400 font-mono font-bold truncate">{msg.extractedData.policyNumber}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <span>🏢 <strong>Insurance Company:</strong></span>
                        {isInvalidField(msg.extractedData.insuranceCompany) ? (
                          <span className="text-amber-400 font-bold italic">Not Found</span>
                        ) : (
                          <span className="text-text-primary font-medium truncate">{msg.extractedData.insuranceCompany}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>📋 <strong>Policy Type:</strong></span>
                        {isInvalidField(msg.extractedData.policyType) ? (
                          <span className="text-amber-400 font-bold italic">Not Found</span>
                        ) : (
                          <span className="text-text-primary font-medium">{msg.extractedData.policyType}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>📅 <strong>Expiry Date:</strong></span>
                        {isInvalidField(msg.extractedData.policyExpiryDate) ? (
                          <span className="text-amber-400 font-bold italic">Not Found</span>
                        ) : (
                          <span className="text-amber-400 font-bold">{msg.extractedData.policyExpiryDate}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>💰 <strong>Premium Amount:</strong></span>
                        {isInvalidField(msg.extractedData.premiumAmount) ? (
                          <span className="text-amber-400 font-bold italic">Not Found</span>
                        ) : (
                          <span className="text-text-primary font-bold">₹{msg.extractedData.premiumAmount}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3 Section Grid inside Chat Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Customer */}
                    <div className="space-y-2 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      <p className="font-bold text-text-primary border-b border-white/5 pb-1">👤 Customer Information</p>
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-text-muted">Customer Name *</label>
                          {isInvalidField(msg.extractedData.customerName) && (
                            <span className="text-[9px] text-red-400 font-bold">⚠️ Required</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={isInvalidField(msg.extractedData.customerName) ? '' : msg.extractedData.customerName}
                          onChange={(e) => handleUpdateCardField(msg.id, 'customerName', e.target.value)}
                          className={`field py-1 text-xs ${isInvalidField(msg.extractedData.customerName) ? 'border-red-500/80 bg-red-500/5' : ''}`}
                          placeholder="Enter Customer Name"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-text-muted">Phone Number *</label>
                          {isInvalidField(msg.extractedData.mobileNumber) ? (
                            <span className="text-[9px] text-red-400 font-bold">⚠️ Required</span>
                          ) : (msg.extractedData.mobileNumber || '').includes('*') ? (
                            <span className="text-[9px] text-amber-400 font-semibold">⚠️ Masked</span>
                          ) : null}
                        </div>
                        <input
                          type="text"
                          value={isInvalidField(msg.extractedData.mobileNumber) ? '' : msg.extractedData.mobileNumber}
                          onChange={(e) => handleUpdateCardField(msg.id, 'mobileNumber', e.target.value)}
                          className={`field py-1 text-xs ${isInvalidField(msg.extractedData.mobileNumber) ? 'border-red-500/80 bg-red-500/5' : ''}`}
                          placeholder="Enter 10-digit mobile"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-text-muted">Email</label>
                        <input
                          type="email"
                          value={isInvalidField(msg.extractedData.email) ? '' : msg.extractedData.email}
                          onChange={(e) => handleUpdateCardField(msg.id, 'email', e.target.value)}
                          className="field py-1 text-xs"
                          placeholder="Email (optional)"
                        />
                      </div>
                    </div>

                    {/* Vehicle */}
                    <div className="space-y-2 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      <p className="font-bold text-text-primary border-b border-white/5 pb-1">🚘 Vehicle Information</p>
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-text-muted">Vehicle Number *</label>
                          {isInvalidField(msg.extractedData.vehicleNumber) && (
                            <span className="text-[9px] text-red-400 font-bold">⚠️ Required</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={isInvalidField(msg.extractedData.vehicleNumber) ? '' : msg.extractedData.vehicleNumber}
                          onChange={(e) => handleUpdateCardField(msg.id, 'vehicleNumber', e.target.value.toUpperCase())}
                          className={`field py-1 text-xs font-mono uppercase font-bold ${isInvalidField(msg.extractedData.vehicleNumber) ? 'border-red-500/80 bg-red-500/5' : ''}`}
                          placeholder="e.g. KA01AB1234"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-text-muted">Vehicle Type</label>
                        <select
                          value={isInvalidField(msg.extractedData.vehicleType) ? '' : msg.extractedData.vehicleType}
                          onChange={(e) => handleUpdateCardField(msg.id, 'vehicleType', e.target.value)}
                          className="field py-1 text-xs"
                        >
                          <option value="">-- Select --</option>
                          <option value="Car">Car</option>
                          <option value="Bike">Bike</option>
                          <option value="Commercial">Commercial</option>
                        </select>
                      </div>
                    </div>

                    {/* Insurance Policy Details */}
                    <div className="sm:col-span-2 space-y-2 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      <p className="font-bold text-text-primary border-b border-white/5 pb-1">📄 Policy Information</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-text-muted">Insurance Company *</label>
                            {isInvalidField(msg.extractedData.insuranceCompany) && (
                              <span className="text-[9px] text-red-400 font-bold">⚠️ Required</span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={isInvalidField(msg.extractedData.insuranceCompany) ? '' : msg.extractedData.insuranceCompany}
                            onChange={(e) => handleUpdateCardField(msg.id, 'insuranceCompany', e.target.value)}
                            className={`field py-1 text-xs ${isInvalidField(msg.extractedData.insuranceCompany) ? 'border-red-500/80 bg-red-500/5' : ''}`}
                            placeholder="Insurance company name"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-text-muted">Policy Number *</label>
                            {isInvalidField(msg.extractedData.policyNumber) && (
                              <span className="text-[9px] text-red-400 font-bold">⚠️ Required</span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={isInvalidField(msg.extractedData.policyNumber) ? '' : msg.extractedData.policyNumber}
                            onChange={(e) => handleUpdateCardField(msg.id, 'policyNumber', e.target.value.toUpperCase())}
                            className={`field py-1 text-xs font-mono uppercase ${isInvalidField(msg.extractedData.policyNumber) ? 'border-red-500/80 bg-red-500/5' : ''}`}
                            placeholder="Policy number"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-text-muted">Expiry Date *</label>
                            {isInvalidField(msg.extractedData.policyExpiryDate) && (
                              <span className="text-[9px] text-red-400 font-bold">⚠️ Required</span>
                            )}
                          </div>
                          <input
                            type="date"
                            value={isInvalidField(msg.extractedData.policyExpiryDate) ? '' : msg.extractedData.policyExpiryDate}
                            onChange={(e) => handleUpdateCardField(msg.id, 'policyExpiryDate', e.target.value)}
                            className={`field py-1 text-xs ${isInvalidField(msg.extractedData.policyExpiryDate) ? 'border-red-500/80 bg-red-500/5' : ''}`}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-text-muted">Premium (₹)</label>
                          <input
                            type="text"
                            value={isInvalidField(msg.extractedData.premiumAmount) ? '' : msg.extractedData.premiumAmount}
                            onChange={(e) => handleUpdateCardField(msg.id, 'premiumAmount', e.target.value)}
                            className="field py-1 text-xs"
                            placeholder="Premium in ₹"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      onClick={() => handleImportToCustomerList(msg.id, msg.extractedData!, msg.documentUrl)}
                      disabled={isProcessing}
                      className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2 font-bold shadow-lg shadow-brand-500/20"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Import to Customer List
                    </button>
                  </div>
                </div>
              )}

              {/* Import Success Bubble */}
              {msg.type === 'import_success' && msg.savedCustomer && (
                <div className="glass-card p-4 rounded-2xl border-l-4 border-l-success bg-success/10 text-xs space-y-3">
                  <div className="flex items-center gap-2 font-bold text-success">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Added to Customer List Successfully!</span>
                  </div>
                  <div className="space-y-1 text-text-muted">
                    <p><strong>Customer:</strong> {msg.savedCustomer.customer?.name}</p>
                    <p><strong>Vehicle:</strong> {msg.savedCustomer.vehicle?.vehicleNumber}</p>
                    <p><strong>Policy No:</strong> {msg.savedCustomer.policy?.policyNumber}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => navigate(`/customers/${msg.savedCustomer.customer?.id}`)}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Profile
                    </button>
                    <WhatsAppButton
                      variant="compact"
                      data={{
                        customerName: msg.savedCustomer.customer?.name,
                        mobile: msg.savedCustomer.customer?.mobile,
                        vehicleNumber: msg.savedCustomer.vehicle?.vehicleNumber,
                        expiryDate: msg.savedCustomer.policy?.expiryDate,
                        insuranceCompany: msg.savedCustomer.policy?.insuranceCompany,
                        policyNumber: msg.savedCustomer.policy?.policyNumber,
                      }}
                    />
                  </div>
                </div>
              )}

              <span className="text-[10px] text-text-subtle px-1 block">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-brand-400 bg-brand-600/10 p-3 rounded-xl w-fit">
            <Loader2 className="w-4 h-4 animate-spin" /> AI Assistant is processing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 bg-white/[0.03] border-t border-white/10 flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-ghost border border-white/10 text-text-muted hover:text-brand-400 p-2.5 rounded-xl shrink-0"
          title="Upload Policy PDF"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendTextMessage()}
          placeholder="Ask AI or upload policy PDF..."
          className="field flex-1 text-xs py-2.5"
        />

        <button
          onClick={handleSendTextMessage}
          disabled={!inputMessage.trim()}
          className="btn-primary p-2.5 rounded-xl shrink-0 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
