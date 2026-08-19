import React from 'react';
import { Lock } from 'lucide-react';

export const SecurityBadge: React.FC = () => {
  return (
    <div className="pt-4 text-center space-y-1 border-t border-white/[0.08]">
      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300">
        <Lock className="w-3.5 h-3.5 text-emerald-400" />
        <span>Secure authentication</span>
      </div>
      <p className="text-[11px] text-slate-500">
        Sign in securely with your Google Account.
      </p>
    </div>
  );
};
