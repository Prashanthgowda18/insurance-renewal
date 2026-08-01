import React, { useState } from 'react';
import { ThemeMode, COLORS } from '../theme/colors';

interface Props {
  theme: ThemeMode;
  customerId?: string;
  onBack: () => void;
}

export const CustomerProfileScreen: React.FC<Props> = ({ theme, customerId = 'c1', onBack }) => {
  const colors = COLORS[theme];
  const [showQR, setShowQR] = useState(false);

  const customer = {
    id: customerId,
    name: 'Vishnu Kumar',
    mobile: '9876543210',
    email: 'vishnu@example.com',
    address: 'Indiranagar, Bangalore, Karnataka',
    vehicleNumber: 'KA-01-MJ-2024',
    insuranceCompany: 'HDFC ERGO',
    policyNumber: 'POL-HDFC-9921',
    expiryDate: '2026-08-15',
    daysRemaining: 14,
    renewalAmount: 4850,
  };

  return (
    <div style={{ backgroundColor: colors.bg, color: colors.textPrimary, minHeight: '100vh', padding: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button 
          onClick={onBack}
          style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, color: colors.textPrimary, padding: '8px 12px', borderRadius: '10px', fontWeight: 'bold' }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Customer Profile</h1>
      </div>

      {/* Customer Info Card */}
      <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, padding: '16px', borderRadius: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{customer.name}</h2>
            <p style={{ fontSize: '13px', color: colors.textMuted, margin: '2px 0 0 0' }}>📱 +91 {customer.mobile}</p>
            <p style={{ fontSize: '13px', color: colors.textMuted, margin: '2px 0 0 0' }}>✉️ {customer.email}</p>
            <p style={{ fontSize: '12px', color: colors.textSubtle, margin: '6px 0 0 0' }}>📍 {customer.address}</p>
          </div>
          <button 
            onClick={() => setShowQR(true)}
            style={{ backgroundColor: colors.primary + '15', border: `1px solid ${colors.primary}40`, color: colors.primary, padding: '8px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}
          >
            QR Code
          </button>
        </div>

        {/* 1-Tap Action Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
          <a href={`tel:${customer.mobile}`} style={{ textDecoration: 'none', backgroundColor: colors.primary, color: '#FFF', padding: '10px 4px', borderRadius: '10px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>
            📞 Call
          </a>
          <a href={`https://wa.me/91${customer.mobile}?text=Hello%20${customer.name},%20your%20vehicle%20policy%20${customer.policyNumber}%20is%20due%20for%20renewal.`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', backgroundColor: '#25D366', color: '#FFF', padding: '10px 4px', borderRadius: '10px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>
            💬 WA
          </a>
          <a href={`sms:${customer.mobile}`} style={{ textDecoration: 'none', backgroundColor: colors.purple, color: '#FFF', padding: '10px 4px', borderRadius: '10px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>
            💬 SMS
          </a>
          <a href={`mailto:${customer.email}`} style={{ textDecoration: 'none', backgroundColor: colors.warning, color: '#FFF', padding: '10px 4px', borderRadius: '10px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>
            ✉️ Mail
          </a>
          <a href={`https://maps.google.com/?q=${encodeURIComponent(customer.address)}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', backgroundColor: colors.danger, color: '#FFF', padding: '10px 4px', borderRadius: '10px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>
            🗺️ Maps
          </a>
        </div>
      </div>

      {/* Policy Card */}
      <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, padding: '16px', borderRadius: '16px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0' }}>Vehicle Insurance Policy</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: colors.textMuted }}>Vehicle Number:</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{customer.vehicleNumber}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: colors.textMuted }}>Insurer:</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{customer.insuranceCompany}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: colors.textMuted }}>Policy Number:</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{customer.policyNumber}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: colors.textMuted }}>Expiry Date:</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: colors.warning }}>{customer.expiryDate} ({customer.daysRemaining}d left)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', color: colors.textMuted }}>Renewal Premium:</span>
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: colors.success }}>₹{customer.renewalAmount.toLocaleString()}</span>
        </div>

        <button 
          onClick={() => alert(`Initiated renewal for ${customer.policyNumber}`)}
          style={{ width: '100%', backgroundColor: colors.primary, color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
        >
          Renew Policy Now
        </button>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyCenter: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: colors.card, padding: '24px', borderRadius: '20px', textAlign: 'center', maxWidth: '300px', margin: 'auto' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Customer QR Badge</h3>
            <p style={{ fontSize: '12px', color: colors.textMuted, margin: '0 0 16px 0' }}>Scan to immediately open {customer.name}'s profile</p>
            
            <div style={{ backgroundColor: '#FFF', padding: '16px', borderRadius: '12px', display: 'inline-block', marginBottom: '16px' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=SHIELD_CRM_CUSTOMER_${customer.id}`} 
                alt="Customer QR Code"
                style={{ width: '180px', height: '180px' }} 
              />
            </div>

            <button 
              onClick={() => setShowQR(false)}
              style={{ width: '100%', backgroundColor: colors.border, color: colors.textPrimary, border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
