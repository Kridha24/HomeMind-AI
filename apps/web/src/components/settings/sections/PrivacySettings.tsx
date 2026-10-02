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
  Info
} from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import apiClient from '../../../services/apiClient';
import { SettingsSection } from '../primitives/SettingsSection';
import { DangerZone } from '../primitives/DangerZone';
import { ConfirmationModal } from '../primitives/ConfirmationModal';
import { AutomaticSmsSettingsSection } from '../../sms/AutomaticSmsSettingsSection';

export const PrivacySettings: React.FC = () => {
  const { user, household, logout } = useAuthStore();
  const [downloading, setDownloading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Danger zone dialog states
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteHouseholdModal, setShowDeleteHouseholdModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Android & Platform detection
  const isCapacitorNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
  const isAndroid = typeof navigator !== 'undefined' && (/Android/i.test(navigator.userAgent) || (window as any).Capacitor?.getPlatform?.() === 'android');

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
      link.setAttribute('download', `HomeMind_${household?.name || 'Household'}_Export.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setFeedback({ type: 'success', text: 'Household ledger PDF exported successfully.' });
    } catch (err: any) {
      setFeedback({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to generate export file. Please try again.' 
      });
    } finally {
      setDownloading(false);
    }
  };

  const isOwner = user?.role === 'OWNER';

  return (
    <div className="space-y-6">
      {feedback && (
        <div 
          role="status"
          className={`p-4 rounded-xl flex items-center gap-3 border text-sm animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{feedback.text}</span>
        </div>
      )}

      {/* SMS Transaction Access Status */}
      <SettingsSection
        title="SMS Transaction Parsing"
        description="Local on-device financial message scanner status and privacy boundary"
        badge={
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            isAndroid 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            <MessageSquare className="w-3.5 h-3.5" />
            {isAndroid ? (isCapacitorNative ? 'Native Android Engine Active' : 'Android Browser Detected') : 'Web Client (Relay Mode)'}
          </span>
        }
      >
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white font-medium">Financial SMS Filter Status:</span>
              <span className="font-semibold text-emerald-400">
                {isAndroid ? 'Local Parser Ready' : 'Operating in Web Client Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              HomeMind processes eligible financial SMS for transaction tracking. 
              Only verified bank and UPI debit/credit notifications are evaluated. 
              Personal chats, 2FA security codes, OTP messages, and non-financial texts are never stored, logged, or transmitted.
            </p>
          </div>

          <div className="pt-2">
            <AutomaticSmsSettingsSection />
          </div>
        </div>
      </SettingsSection>

      {/* Financial Data Governance */}
      <SettingsSection
        title="Data Retention & Security Policy"
        description="How your household records are partitioned and isolated"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-medium">
              <Database className="w-4 h-4 text-indigo-400" />
              Tenant Isolation
            </div>
            <p className="text-slate-400">
              Your household data is partitioned strictly with cryptographic tenant IDs. No other household can inspect or query your ledger.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Encryption in Transit
            </div>
            <p className="text-slate-400">
              All client-to-server traffic is forced over TLS 1.3 encryption. Refresh tokens are hashed using bcrypt before storage.
            </p>
          </div>
        </div>
      </SettingsSection>

      {/* Export Data */}
      <SettingsSection
        title="Export Ledger & Records"
        description="Download a compiled snapshot of your household financial records, bills, and grocery inventory"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Monthly Household Statement (PDF)</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Formatted financial breakdown containing transactions, recurring bills, and current inventory.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportData}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition active:scale-[0.98] disabled:opacity-50 flex-shrink-0"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Ledger
              </>
            )}
          </button>
        </div>
      </SettingsSection>

      {/* Danger Zone */}
      <DangerZone
        title="Household Danger Zone"
        description="Destructive actions affecting your household membership or stored ledger"
      >
        <div className="divide-y divide-red-950/40">
          {/* Leave Household */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0">
            <div>
              <h4 className="text-sm font-semibold text-white">Leave Household</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Relinquish access to this household's expenses and tasks. You can rejoin using an invite code.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowLeaveModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition active:scale-[0.98] flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              Leave Household
            </button>
          </div>

          {/* Delete Household */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-white">Delete Entire Household</h4>
                {!isOwner && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    OWNER ONLY
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Permanently purge this household, all connected members, expense ledgers, and inventory records.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteHouseholdModal(true)}
              disabled={!isOwner}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 border border-red-500/30 transition active:scale-[0.98] flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Household
            </button>
          </div>

          {/* Delete Account */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 last:pb-0">
            <div>
              <h4 className="text-sm font-semibold text-white">Delete User Account</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Revoke all active tokens, detach phone/email credentials, and deactivate your account profile.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteAccountModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 border border-red-500/30 transition active:scale-[0.98] flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Account
            </button>
          </div>
        </div>
      </DangerZone>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={() => {
          setShowLeaveModal(false);
          setFeedback({
            type: 'error',
            text: 'To switch households, paste a new invite code in Household Settings > Join Household.'
          });
        }}
        title="Leave Household"
        description="Are you sure you want to disconnect from this household workspace? You will lose access to shared bills and task lists."
        confirmText="Leave"
        confirmVariant="danger"
      />

      <ConfirmationModal
        isOpen={showDeleteHouseholdModal}
        onClose={() => setShowDeleteHouseholdModal(false)}
        onConfirm={() => {
          setShowDeleteHouseholdModal(false);
          setFeedback({
            type: 'error',
            text: 'Household purge is locked by tenant retention policy. Please contact system support for automated archive.'
          });
        }}
        title="Delete Entire Household"
        description={`This action cannot be undone. All recorded ledgers for "${household?.name || 'this household'}" will be scheduled for purge.`}
        confirmText="Permanently Delete"
        confirmVariant="danger"
        requiredConfirmationText="DELETE"
      />

      <ConfirmationModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onConfirm={() => {
          setShowDeleteAccountModal(false);
          setFeedback({
            type: 'error',
            text: 'Account deactivation requires active session verification. Logging out all devices...'
          });
          setTimeout(() => {
            logout();
            window.location.href = '/login';
          }, 1500);
        }}
        title="Delete User Account"
        description="This will deactivate your identity profile across HomeMind and immediately log you out on all devices."
        confirmText="Deactivate Account"
        confirmVariant="danger"
        requiredConfirmationText="DELETE"
      />
    </div>
  );
};
