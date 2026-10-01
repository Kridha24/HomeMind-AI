import React from 'react';
import { ShieldCheck, MessageSquare, Lock, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onEnable: () => void;
  loading?: boolean;
}

export const SmsTrackingPermissionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onEnable,
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-surface border border-primary/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-elevated"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-primary">
              Automatic Transaction Tracking
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Powered by Native On-Device SMS Intelligence
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3 text-sm text-secondary leading-relaxed">
          <p>
            HomeMind can detect bank and UPI transaction SMS messages to automatically
            update your household expenses and income in real time.
          </p>

          <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 space-y-2">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                <strong>100% Local Device Processing:</strong> Financial messages are analyzed
                locally on your phone. Only sanitized transaction details (amount, merchant, date)
                are synced to your HomeMind account.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <span className="text-xs text-secondary font-medium">
                HomeMind never reads personal messages, OTPs, or complete card/bank account numbers.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-primary/20 text-secondary hover:text-primary hover:bg-surface-elevated text-sm font-semibold transition-all"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={onEnable}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold px-6 py-3 rounded-2xl shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Enable Transaction Tracking</span>
          </button>
        </div>
      </div>
    </div>
  );
};
