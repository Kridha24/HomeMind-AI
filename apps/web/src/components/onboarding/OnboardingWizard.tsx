import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Home,
  Users,
  Bot,
  CheckSquare,
  DollarSign,
  ShoppingBag,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';

interface OnboardingWizardProps {
  isOpen: boolean;
  initialName?: string;
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  initialName = '',
  onComplete,
}) => {
  const [step, setStep] = useState<number>(0); // 0: Welcome, 1: Name, 2: Household, 3: Members, 4: Modules, 5: Ready
  const [name, setName] = useState(initialName);
  const [householdName, setHouseholdName] = useState(
    initialName ? `The ${initialName.split(' ')[0]}'s Home` : 'My Home'
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['Me']);
  const [selectedModules, setSelectedModules] = useState<string[]>([
    'ai',
    'tasks',
    'family',
    'shopping',
    'finance',
    'calendar',
  ]);
  const [saving, setSaving] = useState(false);

  const { user, updateUser, household, updateHousehold } = useAuthStore();

  if (!isOpen) return null;

  const memberOptions = [
    { id: 'Me', label: 'Me (Primary Owner)', icon: User },
    { id: 'Partner', label: 'Partner / Spouse', icon: Users },
    { id: 'Parents', label: 'Parents / Elders', icon: Users },
    { id: 'Children', label: 'Children / Kids', icon: Users },
    { id: 'Other', label: 'Roommates / Guests', icon: Users },
  ];

  const moduleOptions = [
    { id: 'ai', name: 'AI Assistant', icon: Bot, desc: 'Everyday companion' },
    { id: 'tasks', name: 'Tasks & Chores', icon: CheckSquare, desc: 'Track routines' },
    { id: 'family', name: 'Family Workspace', icon: Users, desc: 'Shared sync' },
    { id: 'shopping', name: 'Shopping & Pantry', icon: ShoppingBag, desc: 'Smart grocery list' },
    { id: 'finance', name: 'Finance & Bills', icon: DollarSign, desc: 'Multi-currency budget' },
    { id: 'calendar', name: 'Calendar Sync', icon: Calendar, desc: 'Schedule & events' },
  ];

  const toggleMember = (mId: string) => {
    if (mId === 'Me') return; // Primary owner always selected
    if (selectedMembers.includes(mId)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== mId));
    } else {
      setSelectedMembers([...selectedMembers, mId]);
    }
  };

  const toggleModule = (modId: string) => {
    if (selectedModules.includes(modId)) {
      if (selectedModules.length > 1) {
        setSelectedModules(selectedModules.filter((m) => m !== modId));
      }
    } else {
      setSelectedModules([...selectedModules, modId]);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      if (user) {
        await apiClient.put('/user/profile', {
          name: name.trim() || user.name,
        });
        updateUser({ name: name.trim() || user.name });
      }

      if (household) {
        await apiClient.put('/households/current', {
          name: householdName.trim() || household.name,
        });
        updateHousehold({ name: householdName.trim() || household.name });
      }
    } catch (e) {
      console.warn('Onboarding profile sync:', e);
    } finally {
      setSaving(false);
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#030712]/90 backdrop-blur-2xl flex items-center justify-center p-4 select-none">
      <div className="bg-panel/90 border border-white/[0.12] rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* Progress Bar (When inside steps 1-4) */}
        {step > 0 && step < 5 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-muted">
              <span>Step {step} of 4</span>
              <span>{Math.round((step / 4) * 100)}% Completed</span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 0: WELCOME SCREEN */}
        {/* ========================================================================= */}
        {step === 0 && (
          <div className="text-center space-y-5 py-4">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/30 border border-white/20 animate-bounce">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome to HomeMind 👋
              </h2>
              <p className="text-sm text-secondary max-w-sm mx-auto">
                Let's build your intelligent home. We'll set up your personalized household in less than 30 seconds.
              </p>
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full bg-white hover:bg-slate-100 text-slate-950 font-bold py-3.5 px-6 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all"
            >
              <span>Let's Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: YOUR NAME */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Step 1 — Profile</span>
              <h3 className="text-xl font-bold text-white tracking-tight">What should we call you?</h3>
              <p className="text-xs text-muted">Your name across HomeMind AI and family updates.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full bg-background border border-primary rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(0)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-white flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: HOUSEHOLD NAME */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Step 2 — Household</span>
              <h3 className="text-xl font-bold text-white tracking-tight">What should we call your home?</h3>
              <p className="text-xs text-muted">Give your private smart household a name.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-2">Household Name</label>
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="e.g. The Rivera Home / The Sharma Residence"
                className="w-full bg-background border border-primary rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-white flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!householdName.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: HOUSEHOLD MEMBERS */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Step 3 — Family</span>
              <h3 className="text-xl font-bold text-white tracking-tight">Who lives in your household?</h3>
              <p className="text-xs text-muted">Select all who will be part of this home workspace.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {memberOptions.map((m) => {
                const isSelected = selectedMembers.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-blue-500/15 border-blue-500/50 text-white'
                        : 'bg-background/60 border-primary/80 text-muted hover:border-secondary'
                    }`}
                  >
                    <span className="text-xs font-bold">{m.label}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-500 border-blue-400 text-white'
                          : 'border-secondary bg-panel text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-white flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: WHAT SHOULD HOMEMIND HELP WITH? */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Step 4 — Intelligence</span>
              <h3 className="text-xl font-bold text-white tracking-tight">What should HomeMind help with?</h3>
              <p className="text-xs text-muted">Select modules to activate in your workspace.</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moduleOptions.map((mod) => {
                const isSelected = selectedModules.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => toggleModule(mod.id)}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                      isSelected
                        ? 'bg-blue-500/15 border-blue-500/50 text-white'
                        : 'bg-background/60 border-primary/80 text-muted hover:border-secondary'
                    }`}
                  >
                    <mod.icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isSelected ? 'text-blue-400' : 'text-muted'}`} />
                    <div className="truncate">
                      <span className="text-xs font-bold block truncate">{mod.name}</span>
                      <span className="text-[10px] text-muted block truncate">{mod.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-white flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(5)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
              >
                Complete Setup <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FINAL SCREEN: YOUR HOMEMIND IS READY */}
        {/* ========================================================================= */}
        {step === 5 && (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-500/30 border border-white/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Your HomeMind is ready.
              </h2>
              <p className="text-sm text-secondary max-w-sm mx-auto">
                Everything is connected. Your intelligent operating system is ready for <strong className="text-white">{householdName}</strong>.
              </p>
            </div>

            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full bg-white hover:bg-slate-100 text-slate-950 font-bold py-3.5 px-6 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
            >
              <span>{saving ? 'Finalizing Setup...' : 'Enter HomeMind'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
