import React, { useState } from 'react';
import {
  ShieldCheck,
  Download,
  MessageSquare,
  FileText,
  Database,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trash2,
  LogOut,
  Info,
} from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import apiClient from '../../../services/apiClient';
import { SettingsCard } from '../primitives/SettingsCard';
import { DangerZoneCard } from '../primitives/DangerZoneCard';
import { ConfirmationModal } from '../primitives/ConfirmationModal';
import { SettingsStatusBadge } from '../primitives/SettingsStatusBadge';
import { AutomaticSmsSettingsSection } from '../../sms/AutomaticSmsSettingsSection';

export const PrivacySettings: React.FC = () => {
  const { user, household, logout, updateHousehold } = useAuthStore();
  const [downloading, setDownloading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Danger zone dialog states
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteHouseholdModal, setShowDeleteHouseholdModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Android & Platform detection
  const isCapacitorNative =
    typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
  const isAndroid =
    typeof navigator !== 'undefined' &&
    (/Android/i.test(navigator.userAgent) ||
      (window as any).Capacitor?.getPlatform?.() === 'android');

  const handleExportData = async () => {
    setDownloading(true);
    setFeedback(null);
    try {
      const res = await apiClient.get('/reports/monthly/pdf', {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `HomeMind.AI_${household?.name || 'Household'}_Export.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setFeedback({ type: 'success', text: 'Household ledger PDF exported successfully.' });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error || 'Failed to generate export file. Please try again.',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleLeaveHousehold = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.post('/family/leave');
      if (res.data?.household) {
        updateHousehold(res.data.household);
      }
      window.location.reload();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error || 'Failed to leave household.',
      });
      setShowLeaveModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteHousehold = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.delete(`/family/${household?.id}`);
      if (res.data?.household) {
        updateHousehold(res.data.household);
      }
      window.location.reload();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error || 'Failed to delete household.',
      });
      setShowDeleteHouseholdModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setActionLoading(true);
    try {
      await apiClient.delete('/auth/account');
      logout();
      window.location.href = '/login';
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error || 'Failed to delete account.',
      });
      setShowDeleteAccountModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const isOwner = user?.role === 'OWNER';

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-2xl flex items-center justify-between border text-xs font-semibold animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. SMS Transaction Parsing & Privacy */}
      <SettingsCard
        id="sms-privacy"
        title="SMS Transaction Detection & Privacy"
        description="Local on-device financial message scanner status and confidentiality boundaries."
        badge={
          <SettingsStatusBadge
            label={
              isAndroid
                ? isCapacitorNative
                  ? 'Native Android Engine'
                  : 'Android Browser'
                : 'Web Client Mode'
            }
            variant={isAndroid ? 'active' : 'neutral'}
            icon={MessageSquare}
          />
        }
      >
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-800 dark:text-slate-200 font-bold">
                Financial Message Filter Status:
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {isAndroid ? 'Local On-Device Engine Ready' : 'Operating in Web Relay Mode'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              HomeMind.AI processes eligible financial SMS for transaction tracking. Only verified bank
              and UPI debit/credit notifications are evaluated. Personal messages, 2FA security codes,
              login OTPs, and non-financial texts are never stored, logged, or transmitted.
            </p>
          </div>

          <div className="pt-2">
            <AutomaticSmsSettingsSection />
          </div>
        </div>
      </SettingsCard>

      {/* 2. Data Export & Portable Ledger */}
      <SettingsCard
        id="data-export"
        title="Data Portability & Export"
        description="Download a comprehensive cryptographic ledger export of your household finances and activity."
      >
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                Export Household Financial Report (PDF)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Generates a clean monthly breakdown of all expenses, income, and bills for{' '}
                {household?.name || 'this household'}.
              </p>
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={handleExportData}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-all flex-shrink-0"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </SettingsCard>

      {/* 3. Danger Zone */}
      <DangerZoneCard
        title="Danger Zone"
        description="Irreversible actions that permanently modify or delete account resources."
      >
        {/* Leave Household */}
        <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Leave Household
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Revoke your access to {household?.name || 'this household'}. You will need a new invite to rejoin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowLeaveModal(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors self-start sm:self-center flex-shrink-0"
          >
            Leave Household
          </button>
        </div>

        {/* Delete Household (Owner Only) */}
        {isOwner && (
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-300">
                Delete Household Workspace
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Permanently purge {household?.name || 'this household'} along with all shared expenses, bills, and grocery data.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteHouseholdModal(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-sm shadow-rose-500/20 transition-colors self-start sm:self-center flex-shrink-0"
            >
              Delete Household
            </button>
          </div>
        )}

        {/* Delete Account */}
        <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-300">
              Delete HomeMind.AI Account
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Permanently delete your user profile, active sessions, and personal identity across HomeMind.AI.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteAccountModal(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors self-start sm:self-center flex-shrink-0"
          >
            Delete Account
          </button>
        </div>
      </DangerZoneCard>

      {/* Confirmation Modals with Typed Confirmation for destructive actions */}
      <ConfirmationModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleLeaveHousehold}
        title="Leave Household Workspace?"
        description={`Are you sure you want to leave ${household?.name || 'this household'}? You will lose access to shared family finances and tasks.`}
        confirmText="Leave Household"
        confirmVariant="danger"
        loading={actionLoading}
      />

      <ConfirmationModal
        isOpen={showDeleteHouseholdModal}
        onClose={() => setShowDeleteHouseholdModal(false)}
        onConfirm={handleDeleteHousehold}
        title="Permanently Delete Household?"
        description={`This action cannot be undone. All expense history, groceries, and tasks for ${household?.name} will be permanently destroyed.`}
        confirmText="Delete Workspace"
        confirmVariant="danger"
        requiredConfirmationText="DELETE"
        loading={actionLoading}
      />

      <ConfirmationModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onConfirm={handleDeleteAccount}
        title="Permanently Delete Your Account?"
        description="This will deactivate your identity profile across HomeMind.AI and immediately log you out on all devices."
        confirmText="Delete My Account"
        confirmVariant="danger"
        requiredConfirmationText="DELETE"
        loading={actionLoading}
      />
    </div>
  );
};

export default PrivacySettings;
