import React, { useState } from 'react';
import { X, Copy, Check, Share2, RefreshCw, Key, ShieldCheck, Info } from 'lucide-react';
import { toast } from '../utils/toast';
import { canRegenerateInviteCode } from '../utils/householdPermissions';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode?: string;
  householdName?: string;
  currentUserRole?: string;
  onRegenerateCode?: () => Promise<void>;
  isRegenerating?: boolean;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  inviteCode = '',
  householdName = 'Household',
  currentUserRole,
  onRegenerateCode,
  isRegenerating = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  if (!isOpen) return null;

  const canRegen = canRegenerateInviteCode(currentUserRole);

  const handleCopy = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      toast.success('Invite code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code to clipboard');
    }
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    const shareData = {
      title: `Join ${householdName} on HomeMind.AI`,
      text: `Join our household "${householdName}" on HomeMind.AI using invite code: ${inviteCode}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerateCode) return;
    try {
      await onRegenerateCode();
      setConfirmRegenerate(false);
      toast.success('Generated new household invite code');
    } catch {
      toast.error('Failed to regenerate invite code');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scaleIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 id="invite-modal-title" className="text-lg font-semibold text-foreground">
                Invite to Household
              </h2>
              <p className="text-xs text-muted-foreground">
                Share this secure code with family or roommates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Target Household Notice */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="text-xs">
              <span className="font-medium text-foreground">Target Household: </span>
              <span className="text-muted-foreground font-semibold">{householdName}</span>
            </div>
          </div>

          {/* Invite Code Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Household Invite Code
            </label>
            <div className="flex items-center justify-between p-3.5 bg-muted/30 dark:bg-muted/15 border border-border rounded-xl">
              <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-primary select-all">
                {inviteCode || 'GENERATING...'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                  aria-label="Copy invite code"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                  <button
                    onClick={handleShare}
                    className="p-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
                    title="Share via device"
                    aria-label="Share via device"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">How members join:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Open HomeMind.AI and go to Family Workspace.</li>
                  <li>Click <strong>Switch Household</strong> &gt; <strong>Join with Invite Code</strong>.</li>
                  <li>Paste this code to immediately gain access as a Member.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Regenerate Section for Admins/Owners */}
          {canRegen && (
            <div className="pt-2 border-t border-border">
              {!confirmRegenerate ? (
                <button
                  type="button"
                  onClick={() => setConfirmRegenerate(true)}
                  disabled={isRegenerating}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate invite code</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Regenerating will immediately invalidate the current code ({inviteCode}). Anyone with the old code won't be able to join.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                    >
                      {isRegenerating ? 'Regenerating...' : 'Confirm New Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRegenerate(false)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted/20 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl border border-border bg-background hover:bg-muted transition-colors text-foreground"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
