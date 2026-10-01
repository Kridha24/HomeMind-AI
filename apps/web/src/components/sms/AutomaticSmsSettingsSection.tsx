import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Terminal,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { SmsPluginBridge } from '../../services/sms/smsPluginBridge';
import { SmsSyncManager } from '../../services/sms/smsSyncManager';
import { SmsTrackingPermissionModal } from './SmsTrackingPermissionModal';
import { SmsDebugModal } from './SmsDebugModal';

export const AutomaticSmsSettingsSection: React.FC = () => {
  const navigate = useNavigate();

  const [enabled, setEnabled] = useState(SmsSyncManager.isTrackingEnabled());
  const [autoImport, setAutoImport] = useState(SmsSyncManager.isAutoImportEnabled());
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<number>(SmsSyncManager.getLastScanTimestamp());
  const [detectedCount, setDetectedCount] = useState<number>(0);
  const [needsReviewCount, setNeedsReviewCount] = useState<number>(0);

  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(null);

  const checkPermissionAndStats = async () => {
    try {
      const perm = await SmsPluginBridge.getPermissionStatus();
      setPermissionGranted(perm.granted);

      const res = await apiClient.get('/transactions/stats');
      if (res.data?.stats) {
        setDetectedCount(res.data.stats.totalDetected || 0);
        setNeedsReviewCount(res.data.stats.needsReview || 0);
      }
    } catch (e) {
      console.error('Failed to load SMS stats:', e);
    }
  };

  useEffect(() => {
    checkPermissionAndStats();
  }, []);

  const handleToggleTracking = async () => {
    if (!enabled) {
      // Prompt with explanatory permission modal
      setIsPermissionModalOpen(true);
    } else {
      SmsSyncManager.setTrackingEnabled(false);
      setEnabled(false);
    }
  };

  const handleConfirmEnablePermission = async () => {
    try {
      const perm = await SmsPluginBridge.requestPermissions();
      setPermissionGranted(perm.granted);
      if (perm.granted) {
        SmsSyncManager.setTrackingEnabled(true);
        setEnabled(true);
        setIsPermissionModalOpen(false);
        // Automatically perform initial scan
        triggerScan();
      } else {
        alert('SMS permissions are required to automatically track transactions.');
        setIsPermissionModalOpen(false);
      }
    } catch (e) {
      console.error(e);
      setIsPermissionModalOpen(false);
    }
  };

  const handleToggleAutoImport = (val: boolean) => {
    setAutoImport(val);
    SmsSyncManager.setAutoImportEnabled(val);
  };

  const triggerScan = async () => {
    setScanning(true);
    setScanStatusMessage(null);
    try {
      const result = await SmsSyncManager.scanAndSync();
      setLastScanTime(Date.now());
      await checkPermissionAndStats();
      setScanStatusMessage(
        `Scan complete! Detected: ${result.detected}, Imported: ${result.imported}, Duplicates skipped: ${result.duplicates}, Needs review: ${result.reviewRequired}`
      );
      setTimeout(() => setScanStatusMessage(null), 6000);
    } catch (e: any) {
      setScanStatusMessage(`Scan failed: ${e.message || 'Error scanning inbox'}`);
    } finally {
      setScanning(false);
    }
  };

  const formatLastScan = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="glass-panel p-6 space-y-5 border-primary/80 shadow-sm col-span-1 md:col-span-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-500 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-primary">
                Automatic UPI & Bank Transaction Tracking
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30">
                Native Engine
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Automatically track debit and credit SMS from Indian banks & UPI handles (HDFC, SBI, ICICI, Axis, Zomato, etc.)
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggleTracking}
            className="sr-only peer"
          />
          <div className="w-12 h-6 bg-secondary/80 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ml-3 text-xs font-bold text-primary">
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-surface-elevated border border-primary/10">
          <span className="text-[10px] uppercase font-bold text-muted block">Status</span>
          <div className="flex items-center gap-1.5 mt-1 font-bold text-xs text-primary">
            <span
              className={`w-2 h-2 rounded-full ${
                enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{enabled ? 'Active Tracking' : 'Disabled'}</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-surface-elevated border border-primary/10">
          <span className="text-[10px] uppercase font-bold text-muted block">SMS Permission</span>
          <div className="flex items-center gap-1.5 mt-1 font-bold text-xs text-primary">
            {permissionGranted ? (
              <span className="text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Granted
              </span>
            ) : (
              <span className="text-amber-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Not Granted
              </span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-surface-elevated border border-primary/10">
          <span className="text-[10px] uppercase font-bold text-muted block">Last Inbox Scan</span>
          <span className="font-bold text-xs text-primary mt-1 block">
            {formatLastScan(lastScanTime)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-surface-elevated border border-primary/10">
          <span className="text-[10px] uppercase font-bold text-muted block">Total Detected</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono font-extrabold text-sm text-primary">
              {detectedCount}
            </span>
            {needsReviewCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500">
                {needsReviewCount} review
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Auto-Import Toggle */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-elevated border border-primary/10">
        <div>
          <h4 className="text-xs font-bold text-primary">
            Auto-import high-confidence transactions
          </h4>
          <p className="text-[11px] text-secondary mt-0.5">
            Transactions with ≥ 85% parser confidence automatically create household Expense/Income entries.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={autoImport}
            disabled={!enabled}
            onChange={(e) => handleToggleAutoImport(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-5 bg-secondary/80 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
        </label>
      </div>

      {/* Feedback status banner */}
      {scanStatusMessage && (
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium animate-in fade-in duration-150">
          {scanStatusMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          disabled={!enabled || scanning}
          onClick={triggerScan}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-md active:scale-95 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Scanning Inbox...' : 'Scan Recent Transactions'}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/expenses?tab=sms')}
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border border-primary/20 text-primary hover:bg-surface-elevated transition-colors"
        >
          <span>Review Detected Transactions</span>
          <ExternalLink className="w-3.5 h-3.5 text-secondary" />
        </button>

        <button
          type="button"
          onClick={() => setIsDebugModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2.5 rounded-xl border border-dashed border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/5 transition-colors"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>SMS Parser Debugger</span>
        </button>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex items-start gap-3">
        <Lock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-secondary leading-relaxed">
          <strong className="text-primary font-semibold">Privacy Guarantee:</strong> Financial
          SMS messages are processed directly on your Android device. HomeMind only sends extracted
          transaction details (amount, merchant, date, last 4 digits) to your account. Personal
          messages, OTPs, and card security codes are never read or stored.
        </p>
      </div>

      {/* Modals */}
      <SmsTrackingPermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        onEnable={handleConfirmEnablePermission}
      />

      <SmsDebugModal
        isOpen={isDebugModalOpen}
        onClose={() => setIsDebugModalOpen(false)}
        onTransactionImported={() => {
          checkPermissionAndStats();
        }}
      />
    </div>
  );
};
