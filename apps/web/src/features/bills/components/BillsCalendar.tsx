import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { Bill } from '../../../types';
import { formatINR, getCategoryVisuals } from '../utils/billFormatters';
import { deriveBillDisplayStatus } from '../utils/billStatus';

interface BillsCalendarProps {
  bills: Bill[];
  onSelectBill: (bill: Bill) => void;
  onMarkPaid: (bill: Bill) => void;
}

export const BillsCalendar: React.FC<BillsCalendarProps> = ({
  bills,
  onSelectBill,
  onMarkPaid,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Map bills by day of current month
  const billsByDay: Record<number, Bill[]> = {};
  for (const b of bills) {
    const due = new Date(b.dueDate);
    if (due.getFullYear() === year && due.getMonth() === month) {
      const day = due.getDate();
      if (!billsByDay[day]) billsByDay[day] = [];
      billsByDay[day].push(b);
    }
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Agenda list of bills this month for mobile / quick scan
  const thisMonthBills = bills
    .filter((b) => {
      const d = new Date(b.dueDate);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-6">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-4 rounded-2xl border-primary/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-primary">
              {monthName} {year}
            </h2>
            <p className="text-[11px] text-secondary">
              {thisMonthBills.length} bill{thisMonthBills.length === 1 ? '' : 's'} scheduled this month
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl border border-primary/80 text-xs font-semibold text-secondary hover:text-primary hover:bg-secondary/40 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center rounded-xl border border-primary/80 bg-secondary/30">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-secondary hover:text-primary rounded-l-xl hover:bg-secondary/60 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-primary/40" />
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-secondary hover:text-primary rounded-r-xl hover:bg-secondary/60 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop & Tablet Month Grid */}
      <div className="hidden sm:block glass-panel p-4 rounded-2xl border-primary/80 overflow-hidden shadow-xs">
        {/* Days of week */}
        <div className="grid grid-cols-7 gap-px mb-2 text-center">
          {weekDayLabels.map((day) => (
            <div key={day} className="py-1 text-xs font-bold text-secondary uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Previous month filler days */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => {
            const prevDay = daysInPrevMonth - firstDayOfMonth + i + 1;
            return (
              <div
                key={`prev-${i}`}
                className="min-h-[90px] p-1.5 rounded-xl bg-secondary/15 opacity-40 border border-transparent"
              >
                <span className="text-xs text-muted font-medium">{prevDay}</span>
              </div>
            );
          })}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayBills = billsByDay[dayNum] || [];
            const isToday = isCurrentMonth && dayNum === todayDate;

            return (
              <div
                key={`day-${dayNum}`}
                className={`min-h-[90px] p-2 rounded-xl border transition-all flex flex-col justify-between ${
                  isToday
                    ? 'border-amber-500/80 bg-amber-500/5 shadow-2xs'
                    : 'border-primary/60 bg-panel hover:border-primary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                      isToday
                        ? 'bg-amber-600 text-white font-extrabold'
                        : 'text-primary'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayBills.length > 0 && (
                    <span className="text-[10px] font-semibold text-secondary">
                      {dayBills.length}
                    </span>
                  )}
                </div>

                {/* Bill chips on this day */}
                <div className="space-y-1 mt-1.5 overflow-hidden">
                  {dayBills.slice(0, 2).map((bill) => {
                    const status = deriveBillDisplayStatus(bill);
                    return (
                      <div
                        key={bill.id}
                        onClick={() => onSelectBill(bill)}
                        className={`px-1.5 py-1 rounded-lg text-[10px] font-semibold truncate border cursor-pointer transition-transform hover:scale-[1.02] ${status.pillClass}`}
                        title={`${bill.title} - ${formatINR(bill.amount)} (${status.label})`}
                      >
                        <span className="truncate">{bill.title}</span>
                      </div>
                    );
                  })}
                  {dayBills.length > 2 && (
                    <span className="text-[9px] font-bold text-secondary block pl-1">
                      +{dayBills.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Agenda View */}
      <div className="block sm:hidden space-y-3">
        <h3 className="text-xs font-bold text-secondary uppercase tracking-wider px-1">
          {monthName} Agenda ({thisMonthBills.length} Bills)
        </h3>

        {thisMonthBills.length === 0 ? (
          <div className="glass-panel p-6 text-center rounded-2xl border-primary/80 text-secondary text-xs">
            No bills scheduled for {monthName} {year}.
          </div>
        ) : (
          <div className="space-y-2">
            {thisMonthBills.map((bill) => {
              const status = deriveBillDisplayStatus(bill);
              const visuals = getCategoryVisuals(bill.category);
              const Icon = visuals.icon;
              const isPaid = bill.status === 'PAID';

              return (
                <div
                  key={bill.id}
                  onClick={() => onSelectBill(bill)}
                  className="glass-panel p-3.5 rounded-xl border border-primary/80 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${visuals.bgClass} ${visuals.textClass} ${visuals.borderClass}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-primary truncate">{bill.title}</h4>
                      <p className="text-[10px] text-secondary flex items-center gap-1 mt-0.5">
                        <span className="font-semibold text-primary">
                          {new Date(bill.dueDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span>•</span>
                        <span className={status.label.includes('Overdue') ? 'text-rose-500 font-bold' : ''}>
                          {status.label}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-extrabold text-primary font-mono">
                      {formatINR(bill.amount)}
                    </span>
                    {!isPaid && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkPaid(bill);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
                      >
                        Pay
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
