import React, { useState } from 'react';
import { X, LogIn, Sparkles, KeyRound } from 'lucide-react';
import { toast } from '../utils/toast';

interface JoinHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (inviteCode: string) => Promise<void>;
}

export const JoinHouseholdModal: React.FC<JoinHouseholdModalProps> = ({
  isOpen,
  onClose,
  onJoin,
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a valid 6-character invite code');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onJoin(cleanCode);
      toast.success('Successfully joined household!');
      setInviteCode('');
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Invalid or expired invite code.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-xs">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Join Household</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter an invite code to join a family room
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Household Invite Code
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. HM-7842"
                maxLength={12}
                autoFocus
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono tracking-wider font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 font-medium">{error}</p>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15 text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              Ask your family administrator or room owner for the 6-character household invite code.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !inviteCode.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Joining...' : 'Join Household'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
