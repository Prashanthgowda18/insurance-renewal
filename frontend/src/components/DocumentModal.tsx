import React from 'react';
import { FileText, X, Download, ExternalLink, Shield, CheckCircle2, User, Car } from 'lucide-react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData: {
    policyNumber?: string;
    customerName?: string;
    vehicleNumber?: string;
    vehicleType?: string;
    insuranceCompany?: string;
    startDate?: string;
    expiryDate?: string;
    premiumAmount?: string | number;
    documentUrl?: string | null;
  } | null;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({ isOpen, onClose, documentData }) => {
  if (!isOpen || !documentData) return null;

  const getFullDocUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return cleanPath;
  };

  const fullDocUrl = getFullDocUrl(documentData.documentUrl);
  const isBase64 = documentData.documentUrl && documentData.documentUrl.startsWith('data:');

  const handleOpenNewTab = () => {
    if (fullDocUrl) {
      window.open(fullDocUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (fullDocUrl) {
      const link = document.createElement('a');
      link.href = fullDocUrl;
      link.target = '_blank';
      link.download = `Policy_${documentData.policyNumber || 'Document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card max-w-4xl w-full p-6 sm:p-8 space-y-6 border border-white/15 shadow-2xl relative animate-slide-up max-h-[90vh] flex flex-col">
        
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">Policy Document Certificate</h3>
                <span className="badge badge-success text-[10px] uppercase font-bold">Verified</span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">Policy Number: <span className="font-mono text-brand-400 font-bold">{documentData.policyNumber || 'N/A'}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {fullDocUrl && (
              <>
                <button
                  onClick={handleDownload}
                  className="btn-ghost border border-white/10 text-xs px-3 py-1.5 flex items-center gap-1.5 hover:bg-white/[0.05]"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button
                  onClick={handleOpenNewTab}
                  className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5 shadow-lg shadow-brand-600/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open PDF in New Tab
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-subtle hover:text-text-primary hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Uploaded PDF Viewer */}
        <div className="flex-1 min-h-[500px] rounded-xl overflow-hidden border border-white/10 bg-black/50">
          {fullDocUrl ? (
            isBase64 && documentData.documentUrl?.startsWith('data:image/') ? (
              <img src={fullDocUrl} alt="Policy Document" className="w-full h-full object-contain" />
            ) : (
              <iframe
                src={fullDocUrl}
                title="Uploaded Policy Document PDF"
                className="w-full h-[500px] border-0 rounded-xl"
              />
            )
          ) : (
            <div className="p-8 text-center space-y-4 flex flex-col items-center justify-center h-full">
              <Shield className="w-12 h-12 text-brand-400 opacity-50" />
              <div>
                <h4 className="text-sm font-bold text-text-primary">{documentData.insuranceCompany || 'Insurance Policy'}</h4>
                <p className="text-xs text-text-muted mt-1">No original PDF file attached to this policy record.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
