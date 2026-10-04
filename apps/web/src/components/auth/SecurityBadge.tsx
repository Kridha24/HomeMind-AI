import React from 'react';
import { Lock } from 'lucide-react';

export const SecurityBadge: React.FC = () => {
  return (
    <div className="pt-3 text-center space-y-0.5 border-t border-white/[0.08]">
      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300">
        <Lock className="w-3.5 h-3.5 text-emerald-400" />
        <span>Secure authentication</span>
      </div>
      <p className="text-[11px] text-slate-400">
        Your household stays private and protected.
      </p>
    </div>
  );
};
