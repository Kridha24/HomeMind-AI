import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

export const LiveClockPill: React.FC = () => {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setDate(
        now.toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      );
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:border-blue-500/30 transition-colors"
      aria-label="Current Household Time"
    >
      <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
      <div className="text-right">
        <span className="font-mono text-[12px] sm:text-[13px] font-bold text-slate-800 dark:text-slate-100 block leading-none tracking-tight">
          {time || '00:00:00'}
        </span>
        <span className="text-[9px] font-medium text-slate-400 dark:text-slate-400 flex items-center justify-end gap-1 mt-0.5">
          <Calendar className="w-2.5 h-2.5 text-indigo-400 flex-shrink-0" />
          <span>{date || '---'}</span>
        </span>
      </div>
    </div>
  );
};
