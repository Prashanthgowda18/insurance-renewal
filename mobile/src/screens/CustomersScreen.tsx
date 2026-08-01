import React, { useState } from 'react';
import { ThemeMode, COLORS } from '../theme/colors';

interface Props {
  theme: ThemeMode;
  onSelectCustomer: (id: string) => void;
  onBack: () => void;
}

export const CustomersScreen: React.FC<Props> = ({ theme, onSelectCustomer, onBack }) => {
  const colors = COLORS[theme];
  const [search, setSearch] = useState('');

  const customers = [
    { id: 'c1', name: 'Vishnu Kumar', mobile: '9876543210', vehicle: 'KA-01-MJ-2024', status: 'active' },
    { id: 'c2', name: 'Yashwanth R', mobile: '9123456789', vehicle: 'KA-05-EV-8899', status: 'active' },
    { id: 'c3', name: 'Ananya Sharma', mobile: '9988776655', vehicle: 'KA-53-MC-1100', status: 'expired' },
  ];

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.mobile.includes(search) || 
    c.vehicle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: colors.bg, color: colors.textPrimary, minHeight: '100vh', padding: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button 
          onClick={onBack}
          style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, color: colors.textPrimary, padding: '8px 12px', borderRadius: '10px', fontWeight: 'bold' }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Customer Directory</h1>
      </div>

      {/* Search Input */}
      <input 
        type="text"
        placeholder="🔍 Search customer name, mobile or vehicle..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%',
          backgroundColor: colors.card,
          border: `1px solid ${colors.border}`,
          color: colors.textPrimary,
          padding: '12px',
          borderRadius: '12px',
          fontSize: '13px',
          marginBottom: '16px',
          boxSizing: 'border-box',
        }}
      />

      {/* Customers List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(c => (
          <div 
            key={c.id}
            onClick={() => onSelectCustomer(c.id)}
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              padding: '14px',
              borderRadius: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '15px', margin: 0 }}>{c.name}</p>
              <p style={{ fontSize: '12px', color: colors.textMuted, margin: '2px 0 0 0' }}>📱 {c.mobile} · 🚗 {c.vehicle}</p>
            </div>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 'bold', 
              color: c.status === 'active' ? colors.success : colors.danger,
              backgroundColor: (c.status === 'active' ? colors.success : colors.danger) + '15',
              padding: '4px 8px',
              borderRadius: '6px',
            }}>
              {c.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
};
