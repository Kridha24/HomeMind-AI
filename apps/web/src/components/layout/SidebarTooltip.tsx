import React from 'react';

interface SidebarTooltipProps {
  label: string;
  badge?: string;
  top: number;
}

export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({ label, badge, top }) => {
  return (
    <div
      style={{ top: `${top}px` }}
      className="fixed left-[78px] -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 bg-slate-900/95 dark:bg-slate-900/95 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-700/80 backdrop-blur-md z-[99999] pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
    >
      <span>{label}</span>
      {badge && (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
          {badge}
        </span>
      )}
      {/* Arrow pointer */}
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700/80 transform rotate-45" />
    </div>
  );
};
