import React, { useState } from 'react';
import { ThemeMode, COLORS } from '../theme/colors';

interface Props {
  theme: ThemeMode;
  onBack: () => void;
  onCustomerFound: (customerId: string) => void;
}

export const QRScannerScreen: React.FC<Props> = ({ theme, onBack, onCustomerFound }) => {
  const colors = COLORS[theme];
  const [isScanning, setIsScanning] = useState(false);

  const handleSimulatedQRScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      onCustomerFound('c1');
    }, 1000);
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
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>QR Code Scanner</h1>
      </div>

      {/* QR Scanner Frame */}
      <div style={{
        height: '280px',
        backgroundColor: '#000',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: '20px',
      }}>
        <div style={{
          width: '180px',
          height: '180px',
          border: `3px solid ${colors.primary}`,
          borderRadius: '20px',
          boxShadow: `0 0 25px ${colors.primary}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <p style={{ color: '#FFF', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>
            Point camera at Customer QR Code
          </p>
        </div>
      </div>

      <button 
        onClick={handleSimulatedQRScan}
        disabled={isScanning}
        style={{
          width: '100%',
          backgroundColor: colors.primary,
          color: '#FFF',
          border: 'none',
          padding: '14px',
          borderRadius: '12px',
          fontWeight: 'bold',
          fontSize: '15px',
          cursor: 'pointer',
        }}
      >
        {isScanning ? '🔍 Scanning QR Badge...' : '📷 Scan Customer QR Badge'}
      </button>

    </div>
  );
};
