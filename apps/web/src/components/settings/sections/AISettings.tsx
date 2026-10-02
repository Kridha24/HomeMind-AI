import React, { useState } from 'react';
import {
  Sparkles,
  Receipt,
  TrendingUp,
  ChefHat,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  BrainCircuit,
  ExternalLink,
} from 'lucide-react';
import { useSettingStore } from '../../../stores/useSettingStore';
import { SettingsCard } from '../primitives/SettingsCard';
import { SettingsRow } from '../primitives/SettingsRow';
import { SettingsToggle } from '../primitives/SettingsToggle';
import { SettingsStatusBadge } from '../primitives/SettingsStatusBadge';

export const AISettings: React.FC = () => {
  const {
    aiSuggestions,
    aiPredictions,
    aiRecipes,
    aiOcr,
    updateSettings,
  } = useSettingStore();

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = async (
    key: 'aiSuggestions' | 'aiPredictions' | 'aiRecipes' | 'aiOcr',
    current: boolean,
    label: string
  ) => {
    setSaving(true);
    setFeedback(null);
    try {
      await updateSettings({ [key]: !current });
      setFeedback({ type: 'success', text: `${label} preference updated.` });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ type: 'error', text: `Failed to update ${label}.` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
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

      {/* 1. Subtle Distinct AI Identity Banner */}
      <section
        aria-label="AI Privacy Architecture"
        className="rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-blue-600/10 via-indigo-600/10 to-violet-600/10 border border-blue-500/25 dark:border-blue-500/20 p-5 sm:p-6 relative overflow-hidden"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                How HomeMind.AI uses AI
              </h3>
              <SettingsStatusBadge label="Privacy Guarded" variant="active" icon={ShieldCheck} />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Only the minimum information required for supported AI features is sent to configured AI services.
              Bank account numbers, OTP tokens, and confidential personal identifiers are scrubbed and anonymized before processing.
            </p>
          </div>
        </div>
      </section>

      {/* 2. AI Intelligence Capabilities */}
      <SettingsCard
        id="copilot-capabilities"
        title="Copilot Intelligence Modules"
        description="Toggle predictive insights, machine learning categorization, and proactive suggestions."
      >
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <SettingsRow
            label="Proactive AI Household Suggestions"
            description="Analyzes grocery inventory trends and routines to suggest restocks and budget optimizations"
            icon={<Sparkles className="w-4 h-4 text-blue-500" />}
          >
            <SettingsToggle
              checked={aiSuggestions}
              onChange={() =>
                handleToggle('aiSuggestions', aiSuggestions, 'Household suggestions')
              }
              disabled={saving}
              ariaLabel="Enable proactive household suggestions"
            />
          </SettingsRow>

          <SettingsRow
            label="Automated Financial Categorization"
            description="Intelligently categorizes bank, UPI, and receipt items into household budgeting envelopes"
            icon={<BrainCircuit className="w-4 h-4 text-indigo-500" />}
          >
            <SettingsToggle
              checked={aiPredictions}
              onChange={() =>
                handleToggle('aiPredictions', aiPredictions, 'Financial categorization')
              }
              disabled={saving}
              ariaLabel="Enable automated financial categorization"
            />
          </SettingsRow>

          <SettingsRow
            label="Pantry Inventory Smart Recipes"
            description="Recommends nutritious meal ideas based on perishable ingredients approaching expiry"
            icon={<ChefHat className="w-4 h-4 text-amber-500" />}
          >
            <SettingsToggle
              checked={aiRecipes}
              onChange={() => handleToggle('aiRecipes', aiRecipes, 'Smart recipes')}
              disabled={saving}
              ariaLabel="Enable smart recipes"
            />
          </SettingsRow>

          <SettingsRow
            label="Smart Receipt OCR Digitization"
            description="Extracts merchant, items, and tax amounts directly from uploaded bill photos"
            icon={<Receipt className="w-4 h-4 text-emerald-500" />}
          >
            <SettingsToggle
              checked={aiOcr}
              onChange={() => handleToggle('aiOcr', aiOcr, 'Receipt OCR')}
              disabled={saving}
              ariaLabel="Enable receipt OCR digitization"
            />
          </SettingsRow>
        </div>
      </SettingsCard>

      {/* 3. Runtime Model Infrastructure */}
      <SettingsCard
        id="ai-infrastructure"
        title="AI Runtime Architecture"
        description="Underlying enterprise model infrastructure powering HomeMind.AI natural language features."
      >
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Google Gemini 2.5 Flash
                </span>
                <SettingsStatusBadge label="Enterprise Cloud" variant="admin" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Sub-300ms latency reasoning with zero training retention on customer data.
              </p>
            </div>
          </div>
          <div>
            <SettingsStatusBadge label="Active Runtime" variant="active" icon={CheckCircle2} />
          </div>
        </div>
      </SettingsCard>
    </div>
  );
};

export default AISettings;
