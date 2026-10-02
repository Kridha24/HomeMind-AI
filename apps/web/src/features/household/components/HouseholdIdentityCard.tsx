import React, { useState } from 'react';
import {
  Home,
  Crown,
  Key,
  Copy,
  Check,
  RotateCw,
  Settings,
  Edit2,
  Users,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Household, HouseholdMember } from '../../../types';
import { MemberRoleBadge } from './MemberRoleBadge';
import { canRenameHousehold, canRegenerateInviteCode } from '../utils/householdPermissions';

interface HouseholdIdentityCardProps {
  household?: Household | null;
  members: HouseholdMember[];
  currentUserRole?: string;
  onRename: (newName: string) => Promise<void>;
  onRegenerateCode: () => Promise<void>;
  isRegenerating?: boolean;
}

export const HouseholdIdentityCard: React.FC<HouseholdIdentityCardProps> = ({
  household,
  members,
  currentUserRole,
  onRename,
  onRegenerateCode,
  isRegenerating = false,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(household?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  // Find owner member
  const ownerMember = members.find((m) => m.role === 'OWNER');
  const allowRename = canRenameHousehold(currentUserRole);
  const allowRegenerate = canRegenerateInviteCode(currentUserRole);

  const handleCopyCode = () => {
    if (household?.inviteCode) {
      navigator.clipboard.writeText(household.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || nameInput.trim() === household?.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      await onRename(nameInput.trim());
      setIsEditingName(false);
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-panel border border-primary/80 shadow-xs space-y-5">
      {/* Top: Name, Role & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/50 pb-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Household
            </span>
            {household?.createdAt && (
              <span className="text-[11px] text-muted flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3" />
                Est. {new Date(household.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>

          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
                className="bg-secondary/70 border border-blue-500 text-primary text-base font-extrabold px-3 py-1.5 rounded-xl outline-none"
              />
              <button
                type="submit"
                disabled={isSavingName || !nameInput.trim()}
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 disabled:opacity-50"
              >
                {isSavingName ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNameInput(household?.name || '');
                  setIsEditingName(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-secondary border border-primary/60 text-secondary text-xs font-semibold"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-primary truncate">
                {household?.name || 'Household'}
              </h2>
              {allowRename && (
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(household?.name || '');
                    setIsEditingName(true);
                  }}
                  className="p-1 rounded-lg text-secondary hover:text-primary hover:bg-secondary/70 transition-colors"
                  title="Rename household"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <p className="text-xs text-secondary">
            Primary Owner:{' '}
            <strong className="text-primary font-semibold">
              {ownerMember ? ownerMember.name : 'Household Admin'}
            </strong>
          </p>
        </div>

        {/* Current User Role Pill */}
        <div className="flex sm:flex-col sm:items-end justify-between items-center gap-1.5 flex-shrink-0">
          <span className="text-[11px] text-muted font-medium">Your Role</span>
          <div className="flex items-center gap-1.5">
            <MemberRoleBadge role={currentUserRole} />
            <span className="text-xs font-bold text-secondary">(You)</span>
          </div>
        </div>
      </div>

      {/* Bottom: Invite Code & Settings Link */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        {/* Invite Code Box */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-secondary flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-blue-500" />
            <span>Household Invitation Code</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-xl bg-secondary/80 border border-primary/80 font-mono text-sm font-extrabold text-blue-600 dark:text-blue-400 tracking-wider">
              {household?.inviteCode || 'HM-INVITE'}
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-primary/80 text-secondary hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-bold shadow-2xs"
              title="Copy code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {allowRegenerate && (
              <button
                type="button"
                onClick={onRegenerateCode}
                disabled={isRegenerating}
                className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-primary/80 text-secondary hover:text-primary transition-colors disabled:opacity-50"
                title="Regenerate invite code"
              >
                <RotateCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted">
            Share this secure code with housemates or family to join this workspace.
          </p>
        </div>

        {/* Shortcut to Settings */}
        <div className="self-start md:self-end">
          <button
            type="button"
            onClick={() => navigate('/settings?tab=household')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-secondary hover:bg-secondary/80 text-primary text-xs font-bold border border-primary/80 shadow-2xs transition-all active:scale-95"
          >
            <Settings className="w-4 h-4 text-blue-500" />
            <span>Manage Household Settings →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
