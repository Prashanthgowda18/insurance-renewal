import React, { useState } from 'react';
import { ThemeMode, COLORS } from '../theme/colors';

interface Props {
  theme: ThemeMode;
  onNavigate: (screen: string, params?: any) => void;
}

export const DashboardScreen: React.FC<Props> = ({ theme, onNavigate }) => {
  const colors = COLORS[theme];

  const [metrics] = useState({
    todayExpiry: 2,
    next7Days: 5,
    next30Days: 14,
    totalCustomers: 128,
    activePolicies: 154,
  });

  const recentActivities = [
    { id: '1', title: 'Policy Renewed', time: '10m ago', desc: 'HDFC ERGO policy renewed for Vishnu Kumar' },
    { id: '2', title: 'WhatsApp Sent', time: '45m ago', desc: 'Expiry reminder sent to Yashwanth R' },
    { id: '3', title: 'Customer Added', time: '2h ago', desc: 'New customer Ananya Sharma registered' },
  ];

  return (
    <div style={{ backgroundColor: colors.bg, color: colors.textPrimary, minHeight: '100vh', padding: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>Shield CRM Mobile</h1>
          <p style={{ fontSize: '13px', color: colors.textMuted, margin: '2px 0 0 0' }}>Field Agent Workspace</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => onNavigate('qr_scanner')}
            style={{ backgroundColor: colors.primary + '20', color: colors.primary, border: 'none', padding: '8px 12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px' }}
          >
            📷 Scan QR
          </button>
        </div>
      </div>

      {/* Expiry Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.danger}40`, padding: '12px', borderRadius: '12px' }}>
          <p style={{ fontSize: '11px', color: colors.danger, fontWeight: 'bold', margin: 0 }}>TODAY EXPIRY</p>
          <p style={{ fontSize: '22px', fontWeight: 'bold', color: colors.danger, margin: '4px 0 0 0' }}>{metrics.todayExpiry}</p>
        </div>
        <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.warning}40`, padding: '12px', borderRadius: '12px' }}>
          <p style={{ fontSize: '11px', color: colors.warning, fontWeight: 'bold', margin: 0 }}>NEXT 7 DAYS</p>
          <p style={{ fontSize: '22px', fontWeight: 'bold', color: colors.warning, margin: '4px 0 0 0' }}>{metrics.next7Days}</p>
        </div>
        <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.primary}40`, padding: '12px', borderRadius: '12px' }}>
          <p style={{ fontSize: '11px', color: colors.primary, fontWeight: 'bold', margin: 0 }}>NEXT 30 DAYS</p>
          <p style={{ fontSize: '22px', fontWeight: 'bold', color: colors.primary, margin: '4px 0 0 0' }}>{metrics.next30Days}</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, padding: '14px', borderRadius: '12px' }}>
          <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>Total Customers</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0 0 0' }}>{metrics.totalCustomers}</p>
        </div>
        <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, padding: '14px', borderRadius: '12px' }}>
          <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>Active Policies</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0 0 0' }}>{metrics.activePolicies}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <button 
            onClick={() => onNavigate('camera_scanner')}
            style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, padding: '12px 8px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '20px', display: 'block' }}>📄</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: colors.textPrimary }}>Scan Policy</span>
          </button>
          <button 
            onClick={() => onNavigate('customers')}
            style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, padding: '12px 8px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '20px', display: 'block' }}>👤</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: colors.textPrimary }}>Add Customer</span>
          </button>
          <button 
            onClick={() => window.open('https://wa.me/919876543210?text=Hi,%20your%20vehicle%20insurance%20policy%20is%20due%20for%20renewal.')}
            style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, padding: '12px 8px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '20px', display: 'block' }}>💬</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: colors.textPrimary }}>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Recent Activities */}
      <div>
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>Recent Activities</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recentActivities.map(act => (
            <div key={act.id} style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, padding: '12px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{act.title}</span>
                <span style={{ fontSize: '11px', color: colors.textSubtle }}>{act.time}</span>
              </div>
              <p style={{ fontSize: '12px', color: colors.textMuted, margin: '4px 0 0 0' }}>{act.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
