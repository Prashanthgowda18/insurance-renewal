import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Shield } from 'lucide-react';
import api from '../services/api';

interface PolicyDay {
  id: string;
  policyNumber: string;
  customerName?: string;
  vehicleNumber?: string;
  insuranceCompany?: string;
  daysRemaining: number;
  renewalStatus: string;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export const Calendar: React.FC = () => {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [policies, setPolicies] = useState<PolicyDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPolicies = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/policies');
        setPolicies(Array.isArray(res.data) ? res.data : (res.data?.policies || []));
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    };
    fetchPolicies();
  }, []);

  const getPoliciesForDate = (date: Date): PolicyDay[] => {
    return policies.filter(p => {
      // Find policies whose expiryDate matches this date
      try {
        const pol = p as any;
        if (!pol.expiryDate) return false;
        const exp = new Date(pol.expiryDate);
        return exp.getDate() === date.getDate() &&
               exp.getMonth() === date.getMonth() &&
               exp.getFullYear() === date.getFullYear();
      } catch { return false; }
    });
  };

  const prevMonth = () => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const nextMonth = () => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1));

  const year  = current.getFullYear();
  const month = current.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth     = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const selectedPolicies = selectedDate ? getPoliciesForDate(selectedDate) : [];

  // Build calendar cells
  const cells: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(year, month + 1, cells.length - daysInMonth - firstDayOfMonth + 1), isCurrentMonth: false });
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Reminder Calendar</h1>
        <p className="text-text-muted text-sm mt-1">Click a date to see expiring policies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="glass-card p-6 lg:col-span-2">
          {/* Nav */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/[0.05] text-text-muted hover:text-text-primary transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold text-text-primary">{MONTH_NAMES[month]} {year}</h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/[0.05] text-text-muted hover:text-text-primary transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-2xs font-bold uppercase tracking-widest text-text-subtle py-1">{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map(({ date, isCurrentMonth }, i) => {
              const dayPolicies = getPoliciesForDate(date);
              const isToday = date.toDateString() === today.toDateString();
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              const hasUrgent = dayPolicies.some(p => p.daysRemaining <= 3);
              const hasSome   = dayPolicies.length > 0;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(isCurrentMonth ? date : null)}
                  className={`
                    calendar-day p-1 min-h-[52px] flex flex-col gap-0.5 rounded-xl transition-all
                    ${!isCurrentMonth ? 'opacity-25 cursor-default' : 'cursor-pointer hover:bg-white/[0.04]'}
                    ${isToday ? 'bg-brand-600/15 border border-brand-600/30' : ''}
                    ${isSelected ? 'bg-brand-600/25 border border-brand-500/50' : ''}
                  `}
                >
                  <span className={`text-xs font-semibold ${isToday ? 'text-brand-400' : isCurrentMonth ? 'text-text-primary' : 'text-text-subtle'}`}>
                    {date.getDate()}
                  </span>
                  {hasSome && isCurrentMonth && (
                    <div className="flex flex-wrap gap-0.5 justify-center">
                      {dayPolicies.slice(0,3).map((_, pi) => (
                        <span key={pi} className={`w-1.5 h-1.5 rounded-full ${hasUrgent ? 'bg-danger' : 'bg-warning'}`} />
                      ))}
                      {dayPolicies.length > 3 && <span className="text-[8px] text-text-subtle">+{dayPolicies.length-3}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.05] text-xs text-text-subtle">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-danger" /> Urgent (≤3 days)</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warning" /> Upcoming</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-600/50 border border-brand-500/50" /> Today</div>
          </div>
        </div>

        {/* Side panel: selected day */}
        <div className="glass-card p-6">
          {selectedDate ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-semibold text-text-primary">
                  {selectedDate.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
                </h3>
              </div>
              {selectedPolicies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-text-subtle">
                  <Shield className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No policies expiring on this date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedPolicies.map(p => (
                    <div key={p.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-text-primary">{p.policyNumber}</span>
                        <span className={`text-xs font-bold ${p.daysRemaining <= 3 ? 'text-danger' : p.daysRemaining <= 7 ? 'text-warning' : 'text-brand-400'}`}>
                          {p.daysRemaining === 0 ? 'Today' : `${p.daysRemaining}d`}
                        </span>
                      </div>
                      {p.customerName && <p className="text-xs text-text-muted">{p.customerName}</p>}
                      {p.vehicleNumber && <p className="text-xs text-text-subtle font-mono">{p.vehicleNumber}</p>}
                      {p.insuranceCompany && <p className="text-xs text-text-subtle">{p.insuranceCompany}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-text-subtle">
              <CalendarIcon className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">Select a date</p>
              <p className="text-xs mt-1">Click any date to see expiring policies</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
