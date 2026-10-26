import React from 'react';
import { X, LogOut, AlertTriangle } from 'lucide-react';

interface LeaveRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  householdName?: string;
  canLeave: boolean;
  leaveReason?: string;
  isLeaving?: boolean;
}

export const LeaveRoomModal: React.FC<LeaveRoomModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  householdName = 'Household',
  canLeave,
  leaveReason,
  isLeaving = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-xs">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Leave Household</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exit this shared family room
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

        {/* Content */}
        {canLeave ? (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/15 text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-600 dark:text-rose-400 mb-1">
                  Are you sure you want to leave {householdName}?
                </p>
                <p>
                  You will lose access to shared family expenses, chat, groceries, and tasks. You will automatically return to your private personal residence.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 space-y-1">
            <p className="font-bold">Cannot leave household at this time</p>
            <p>{leaveReason || 'Please transfer household ownership before leaving.'}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLeaving}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          {canLeave && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLeaving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-md shadow-rose-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLeaving ? 'Leaving...' : 'Leave Room'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
