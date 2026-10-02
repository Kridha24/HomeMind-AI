import React, { useState } from 'react';
import {
  Home,
  Check,
  ArrowRight,
  Plus,
  LogIn,
  X,
  Sparkles,
  Users,
} from 'lucide-react';
import { AvailableHouseholdItem } from '../hooks/useHousehold';

interface HouseholdSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  currentHouseholdId?: string;
  households: AvailableHouseholdItem[];
  onSwitch: (householdId: string) => Promise<void>;
  onJoin: (inviteCode: string) => Promise<void>;
}

export const HouseholdSwitcher: React.FC<HouseholdSwitcherProps> = ({
  isOpen,
  onClose,
  currentHouseholdId,
  households,
  onSwitch,
  onJoin,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isSwitchingId, setIsSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setIsJoining(true);
    setError('');
    try {
      await onJoin(joinCode.trim().toUpperCase());
      setJoinCode('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Invalid invite code or join failed.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleSelectHousehold = async (id: string) => {
    if (id === currentHouseholdId) {
      onClose();
      return;
    }
    setIsSwitchingId(id);
    setError('');
    try {
      await onSwitch(id);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to switch household.');
    } finally {
      setIsSwitchingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-panel border border-primary/80 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-secondary hover:text-primary p-1.5 rounded-xl hover:bg-secondary/60 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-primary/60 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-primary">
              Switch Household Workspace
            </h3>
            <p className="text-xs text-secondary">
              Select an active residence or enter an invite code to join a family
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Available Households List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
            Your Households
          </h4>

          <div className="space-y-2">
            {households.map((h) => {
              const isSelected = h.id === currentHouseholdId;
              const isSwitching = isSwitchingId === h.id;

              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => handleSelectHousehold(h.id)}
                  disabled={isSwitching}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-500/10 border-blue-500/40 text-primary shadow-xs'
                      : 'bg-secondary/40 border-primary/60 text-secondary hover:text-primary hover:bg-secondary/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-secondary text-secondary border-primary/60'
                      }`}
                    >
                      <Home className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary truncate block">
                          {h.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2 py-0.2 rounded-full border border-blue-500/25">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span>{h.memberCount} members</span>
                        <span>•</span>
                        <span className="uppercase font-semibold text-[10px]">{h.role}</span>
                      </div>
                    </div>
                  </div>

                  {isSelected ? (
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Join Another Household Form */}
        <div className="p-4 rounded-2xl bg-secondary/30 border border-primary/60 space-y-3">
          <div className="flex items-center gap-2">
            <LogIn className="w-4 h-4 text-emerald-500" />
            <h4 className="text-xs font-bold text-primary">Join Another Household</h4>
          </div>
          <p className="text-xs text-secondary">
            Have an invite code from family or a housemate? Enter it below:
          </p>

          <form onSubmit={handleJoinSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. HM-X82K4 or RIVERA-2026"
              className="w-full bg-secondary/80 border border-primary/80 focus:border-emerald-500 text-primary px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase font-bold outline-none"
            />
            <button
              type="submit"
              disabled={isJoining || !joinCode.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-sm transition-all active:scale-95"
            >
              {isJoining ? <Sparkles className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>Join</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
