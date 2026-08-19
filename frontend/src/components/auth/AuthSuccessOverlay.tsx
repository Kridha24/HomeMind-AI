import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthSuccessOverlayProps {
  userName?: string;
  onFinish: () => void;
}

export const AuthSuccessOverlay: React.FC<AuthSuccessOverlayProps> = ({
  userName,
  onFinish,
}) => {
  const [phase, setPhase] = useState<'activating' | 'connecting' | 'ready'>('activating');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('connecting'), 250);
    const t2 = setTimeout(() => setPhase('ready'), 500);
    const t3 = setTimeout(() => onFinish(), 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 bg-[#030712]/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="text-center space-y-4 max-w-sm">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-2xl shadow-blue-500/50 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#030712] flex items-center justify-center text-white">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            {phase === 'activating' && 'Activating HomeMind AI...'}
            {phase === 'connecting' && 'Connecting Ecosystem...'}
            {phase === 'ready' && `Welcome Home${userName ? `, ${userName}` : ''}`}
          </h3>
          <p className="text-xs text-blue-400 font-medium">
            Synchronizing your intelligent household
          </p>
        </div>
      </div>
    </div>
  );
};
