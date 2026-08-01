import React, { useState } from 'react';
import { ThemeMode, COLORS } from './src/theme/colors';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { CustomerProfileScreen } from './src/screens/CustomerProfileScreen';
import { CameraScannerScreen } from './src/screens/CameraScannerScreen';
import { QRScannerScreen } from './src/screens/QRScannerScreen';
import { CustomersScreen } from './src/screens/CustomersScreen';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState('c1');

  const colors = COLORS[theme];

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Biometric / PIN Lock Screen
  if (!isUnlocked) {
    return (
      <div style={{ backgroundColor: colors.bg, color: colors.textPrimary, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', backgroundColor: colors.primary + '20', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '32px', marginBottom: '16px' }}>
          🛡️
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>Shield Insurance CRM</h1>
        <p style={{ fontSize: '13px', color: colors.textMuted, margin: '0 0 24px 0' }}>Biometric & PIN Authentication Required</p>

        <button 
          onClick={() => setIsUnlocked(true)}
          style={{ width: '100%', maxWidth: '280px', backgroundColor: colors.primary, color: '#FFF', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginBottom: '12px' }}
        >
          🔐 Unlock with Face ID / Fingerprint
        </button>

        <button 
          onClick={() => setIsUnlocked(true)}
          style={{ backgroundColor: 'transparent', color: colors.textMuted, border: 'none', fontSize: '12px', cursor: 'pointer' }}
        >
          Enter Security PIN
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* Mobile Top Status Bar */}
      <div style={{ backgroundColor: colors.card, borderBottom: `1px solid ${colors.border}`, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: colors.primary }}>🛡️ Shield CRM Mobile</span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Theme Switcher */}
          <button 
            onClick={toggleTheme}
            style={{ backgroundColor: colors.border, color: colors.textPrimary, border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          
          <button 
            onClick={() => setIsUnlocked(false)}
            style={{ backgroundColor: colors.danger + '20', color: colors.danger, border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🔒 Lock
          </button>
        </div>
      </div>

      {/* Screen Router */}
      {currentScreen === 'dashboard' && (
        <DashboardScreen 
          theme={theme} 
          onNavigate={(screen, params) => {
            if (params?.customerId) setSelectedCustomerId(params.customerId);
            setCurrentScreen(screen);
          }} 
        />
      )}

      {currentScreen === 'customers' && (
        <CustomersScreen 
          theme={theme} 
          onSelectCustomer={(id) => {
            setSelectedCustomerId(id);
            setCurrentScreen('customer_profile');
          }}
          onBack={() => setCurrentScreen('dashboard')}
        />
      )}

      {currentScreen === 'customer_profile' && (
        <CustomerProfileScreen 
          theme={theme} 
          customerId={selectedCustomerId}
          onBack={() => setCurrentScreen('dashboard')}
        />
      )}

      {currentScreen === 'camera_scanner' && (
        <CameraScannerScreen 
          theme={theme} 
          onBack={() => setCurrentScreen('dashboard')}
        />
      )}

      {currentScreen === 'qr_scanner' && (
        <QRScannerScreen 
          theme={theme} 
          onBack={() => setCurrentScreen('dashboard')}
          onCustomerFound={(id) => {
            setSelectedCustomerId(id);
            setCurrentScreen('customer_profile');
          }}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.card,
        borderTop: `1px solid ${colors.border}`,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 0',
        zIndex: 100,
      }}>
        <button 
          onClick={() => setCurrentScreen('dashboard')}
          style={{ background: 'none', border: 'none', color: currentScreen === 'dashboard' ? colors.primary : colors.textMuted, fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🏠 Home
        </button>
        <button 
          onClick={() => setCurrentScreen('customers')}
          style={{ background: 'none', border: 'none', color: currentScreen === 'customers' ? colors.primary : colors.textMuted, fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          👥 Directory
        </button>
        <button 
          onClick={() => setCurrentScreen('camera_scanner')}
          style={{ background: 'none', border: 'none', color: currentScreen === 'camera_scanner' ? colors.primary : colors.textMuted, fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📷 Scan
        </button>
        <button 
          onClick={() => setCurrentScreen('qr_scanner')}
          style={{ background: 'none', border: 'none', color: currentScreen === 'qr_scanner' ? colors.primary : colors.textMuted, fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🔍 QR
        </button>
      </div>

    </div>
  );
}
