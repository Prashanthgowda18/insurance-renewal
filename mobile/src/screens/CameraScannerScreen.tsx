import React, { useState } from 'react';
import { ThemeMode, COLORS } from '../theme/colors';

interface Props {
  theme: ThemeMode;
  onBack: () => void;
}

export const CameraScannerScreen: React.FC<Props> = ({ theme, onBack }) => {
  const colors = COLORS[theme];
  const [docType, setDocType] = useState<'policy' | 'rc' | 'dl'>('policy');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<any | null>(null);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      if (docType === 'policy') {
        setScannedResult({
          type: 'Insurance Policy',
          policyNumber: 'POL-HDFC-9921',
          insurer: 'HDFC ERGO General Insurance',
          insuredName: 'Vishnu Kumar',
          vehicleNumber: 'KA-01-MJ-2024',
          expiryDate: '2026-08-15',
          premium: 4850,
          confidence: '98.5%',
        });
      } else if (docType === 'rc') {
        setScannedResult({
          type: 'RC Book (Registration Certificate)',
          vehicleNumber: 'KA-01-MJ-2024',
          ownerName: 'Vishnu Kumar',
          makeModel: 'Hyundai Creta 1.5 SX',
          fuelType: 'Petrol',
          mfgYear: 2022,
          chassisNo: 'MBJXXXXXXXX1204',
          confidence: '97.2%',
        });
      } else {
        setScannedResult({
          type: 'Driving License',
          dlNumber: 'KA01 20180049210',
          holderName: 'Vishnu Kumar',
          dob: '1992-05-14',
          validUntil: '2038-05-13',
          confidence: '99.0%',
        });
      }
    }, 1500);
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
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>AI Camera Document Scanner</h1>
      </div>

      {/* Doc Type Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['policy', 'rc', 'dl'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setDocType(t); setScannedResult(null); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: `1px solid ${docType === t ? colors.primary : colors.border}`,
              backgroundColor: docType === t ? colors.primary + '20' : colors.card,
              color: docType === t ? colors.primary : colors.textMuted,
              fontWeight: 'bold',
              fontSize: '12px',
              textTransform: 'uppercase',
            }}
          >
            {t === 'policy' ? 'Policy Document' : t === 'rc' ? 'RC Book' : 'Driving License'}
          </button>
        ))}
      </div>

      {/* Camera View Finder Simulation */}
      <div style={{
        position: 'relative',
        height: '240px',
        backgroundColor: '#000',
        borderRadius: '20px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: `2px dashed ${colors.primary}`,
        marginBottom: '20px',
      }}>
        {/* Scanner Guideline Box */}
        <div style={{
          width: '80%',
          height: '70%',
          border: `2px solid ${colors.primary}`,
          borderRadius: '12px',
          boxShadow: `0 0 20px ${colors.primary}60`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <p style={{ color: '#FFF', fontSize: '12px', fontWeight: 'bold', opacity: 0.8 }}>
            Align {docType.toUpperCase()} within frame
          </p>
        </div>

        <span style={{ color: colors.textMuted, fontSize: '11px', marginTop: '12px' }}>
          Auto-crop & quality enhancement enabled
        </span>
      </div>

      {/* Trigger Scan Button */}
      <button 
        onClick={handleScan}
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
          marginBottom: '20px',
        }}
      >
        {isScanning ? '⏳ Running AI OCR Extraction...' : '📷 Scan & Extract Details'}
      </button>

      {/* AI OCR Result Card */}
      {scannedResult && (
        <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.success}60`, padding: '16px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: colors.success }}>✓ AI Extraction Complete</span>
            <span style={{ fontSize: '11px', color: colors.textSubtle }}>Confidence: {scannedResult.confidence}</span>
          </div>

          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(scannedResult).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${colors.border}`, paddingBottom: '4px' }}>
                <span style={{ color: colors.textMuted, textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}:</span>
                <span style={{ fontWeight: 'bold' }}>{String(v)}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => alert(`Extracted ${scannedResult.type} attached to customer record!`)}
            style={{ width: '100%', backgroundColor: colors.success, color: '#FFF', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold', marginTop: '14px' }}
          >
            Save Extracted Document
          </button>
        </div>
      )}

    </div>
  );
};
