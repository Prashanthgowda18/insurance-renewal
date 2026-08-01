import React, { useEffect, useState } from 'react';
import { X, Save, Loader2, Calendar } from 'lucide-react';
import api from '../services/api';

interface RenewPolicyModalProps {
  isOpen: boolean;
  policyId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RenewPolicyModal: React.FC<RenewPolicyModalProps> = ({
  isOpen,
  policyId,
  onClose,
  onSuccess,
}) => {
  const [company, setCompany] = useState('');
  const [policyNum, setPolicyNum] = useState('');
  const [oldExpiry, setOldExpiry] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [remarks, setRemarks] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !policyId) return;

    const fetchPolicyDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/policies');
        const list = response.data;
        const matchingPolicy = list.find((p: any) => p.id === policyId);

        if (matchingPolicy) {
          setCompany(matchingPolicy.insuranceCompany);
          setPolicyNum(matchingPolicy.policyNumber);
          setOldExpiry(matchingPolicy.expiryDate);
          setAmount(matchingPolicy.renewalAmount || 0);

          // Calculate defaults:
          // New Start = Old Expiry + 1 Day
          // New Expiry = Old Expiry + 1 Year
          const expiryDateObj = new Date(matchingPolicy.expiryDate);
          
          const startDateObj = new Date(expiryDateObj);
          startDateObj.setDate(startDateObj.getDate() + 1);

          const nextYearDateObj = new Date(startDateObj);
          nextYearDateObj.setFullYear(nextYearDateObj.getFullYear() + 1);
          nextYearDateObj.setDate(nextYearDateObj.getDate() - 1); // Adjust leap day boundaries

          setNewStart(startDateObj.toISOString().split('T')[0]);
          setNewExpiry(nextYearDateObj.toISOString().split('T')[0]);
        }
      } catch (err) {
        console.error('Failed to load policy details for renewal', err);
        setError('Failed to fetch existing policy metrics.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicyDetails();
  }, [isOpen, policyId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyId) return;

    setIsSaving(true);
    setError(null);

    try {
      await api.post(`/policies/${policyId}/renew`, {
        startDate: newStart,
        expiryDate: newExpiry,
        renewalAmount: Number(amount),
        remarks: remarks || undefined,
      });
      onSuccess();
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error.message || 'Renewal transaction failed');
      } else {
        setError('Network error. Ensure backend service is active.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <header className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-400" />
            <h3 className="font-bold text-lg text-white">Renew Policy</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
              <p className="text-sm">Retrieving original terms...</p>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              {/* Read Only Meta Info */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Company</span>
                  <span className="font-medium text-white">{company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Policy Number</span>
                  <span className="font-medium text-white">{policyNum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Current Expiry</span>
                  <span className="font-medium text-slate-300">
                    {oldExpiry ? new Date(oldExpiry).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>

              {/* Form Input Variables */}
              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1.5">New Start Date *</label>
                <input
                  type="date"
                  required
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-brand-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1.5">New Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-brand-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1.5">Premium / Renewal Amount ($) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-900/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-brand-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1.5">Remarks / Audit Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Paid via credit card, no-claims bonus applied..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 text-white rounded-xl py-2 px-3 text-sm outline-none focus:border-brand-500/50"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Renewal
                </button>
              </div>

            </div>
          )}
        </form>

      </div>
    </div>
  );
};
