import React, { useState } from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';
import { toast } from '../utils/toast';
import { HouseholdMember } from '../../../types';
import { ROLE_CONFIGS, getRoleConfig } from '../utils/householdFormatters';

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: HouseholdMember | null;
  onConfirm: (memberId: string, newRole: string) => Promise<void>;
  isLoading?: boolean;
}

export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  isOpen,
  onClose,
  member,
  onConfirm,
  isLoading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('MEMBER');

  React.useEffect(() => {
    if (member) {
      setSelectedRole(member.role || 'MEMBER');
    }
  }, [member]);

  if (!isOpen || !member) return null;

  // Available selectable roles (Owners must be transferred via ownership transfer)
  const selectableRoles = ['ADMIN', 'MEMBER', 'GUEST'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === member.role) {
      onClose();
      return;
    }

    try {
      await onConfirm(member.id, selectedRole);
      toast.success(`Updated ${member.name}'s role to ${selectedRole}`);
      onClose();
    } catch {
      toast.error('Failed to change member role');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scaleIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-modal-title"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 id="role-modal-title" className="text-lg font-semibold text-foreground">
                Change Member Role
              </h2>
              <p className="text-xs text-muted-foreground">Adjust permissions for {member.name}</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Role
            </label>
            <div className="space-y-2">
              {selectableRoles.map((roleKey) => {
                const conf = getRoleConfig(roleKey);
                const Icon = conf.icon;
                const isSelected = selectedRole === roleKey;

                return (
                  <div
                    key={roleKey}
                    onClick={() => setSelectedRole(roleKey)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xs'
                        : 'border-border bg-card hover:bg-muted/40'
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedRole(roleKey);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg shrink-0 mt-0.5 ${conf.badgeBg} ${conf.textColor}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {conf.label}
                          </span>
                          {member.role === roleKey && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{conf.description}</p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-border bg-background hover:bg-muted transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedRole === member.role}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isLoading ? 'Updating...' : 'Save Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
