import React, { useState } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  Receipt, 
  TrendingUp, 
  ChefHat, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Cpu
} from 'lucide-react';
import { useSettingStore } from '../../../stores/useSettingStore';
import { SettingsSection } from '../primitives/SettingsSection';
import { SettingsRow } from '../primitives/SettingsRow';
import { SettingsToggle } from '../primitives/SettingsToggle';

export const AISettings: React.FC = () => {
  const { 
    aiSuggestions, 
    aiPredictions, 
    aiRecipes, 
    aiOcr, 
    updateSettings, 
    saveSettings 
  } = useSettingStore();

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = async (key: 'aiSuggestions' | 'aiPredictions' | 'aiRecipes' | 'aiOcr', current: boolean, label: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      await updateSettings({ [key]: !current });
      setFeedback({ type: 'success', text: `${label} setting updated.` });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ type: 'error', text: `Failed to update ${label}.` });
    } finally {
      setSaving(false);
    }
  };

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

      {/* AI Privacy & Architecture Disclosure */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/50 border border-indigo-500/20 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              Privacy-First Household AI Architecture
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                End-to-End Filtered
              </span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              HomeMind only sends the minimum required information to the configured AI provider for supported features.
              Bank account numbers, OTP tokens, and confidential personal identifiers are scrubbed and anonymized before processing.
            </p>
          </div>
        </div>
      </div>

      {/* Intelligence Modules */}
      <SettingsSection
        title="Copilot Capabilities"
        description="Enable or disable specific machine learning and natural language assistants"
      >
        <div className="space-y-1">
          {/* Smart Suggestions */}
          <SettingsRow
            label="Proactive AI Household Suggestions"
            description="Analyzes grocery inventory trends and recurring routines to suggest restocks and budget optimizations"
            icon={<Sparkles className="w-5 h-5 text-indigo-400" />}
          >
            <SettingsToggle
              checked={aiSuggestions}
              onChange={() => handleToggle('aiSuggestions', aiSuggestions, 'Proactive suggestions')}
              disabled={saving}
              ariaLabel="Toggle proactive AI suggestions"
            />
          </SettingsRow>

          {/* Transaction Categorization */}
          <SettingsRow
            label="Automated Transaction Categorization & Predictions"
            description="Automatically maps bank debits and UPI payments into groceries, dining, utilities, and lifestyle envelopes"
            icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          >
            <SettingsToggle
              checked={aiPredictions}
              onChange={() => handleToggle('aiPredictions', aiPredictions, 'Transaction predictions')}
              disabled={saving}
              ariaLabel="Toggle transaction categorization"
            />
          </SettingsRow>

          {/* Receipt OCR */}
          <SettingsRow
            label="Computer Vision & Receipt OCR"
            description="Extracts items, taxes, merchant names, and totals directly from photographed bills and grocery slips"
            icon={<Receipt className="w-5 h-5 text-amber-400" />}
          >
            <SettingsToggle
              checked={aiOcr}
              onChange={() => handleToggle('aiOcr', aiOcr, 'Receipt OCR')}
              disabled={saving}
              ariaLabel="Toggle receipt OCR"
            />
          </SettingsRow>

          {/* Recipe & Meal Planning */}
          <SettingsRow
            label="Smart Pantry & Recipe Generation"
            description="Synthesizes recipes using ingredients currently in stock in your pantry to minimize food waste"
            icon={<ChefHat className="w-5 h-5 text-rose-400" />}
          >
            <SettingsToggle
              checked={aiRecipes}
              onChange={() => handleToggle('aiRecipes', aiRecipes, 'Recipe assistant')}
              disabled={saving}
              ariaLabel="Toggle recipe generation"
            />
          </SettingsRow>
        </div>
      </SettingsSection>

      {/* Provider Details */}
      <SettingsSection
        title="AI Engine Information"
        description="Underlying runtime infrastructure powering HomeMind"
      >
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300 font-medium">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Runtime Model:
            </span>
            <span className="font-mono text-slate-300">Gemini 1.5 Pro / Flash & Claude 3.5 Sonnet Engine</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Training Data Protection:
            </span>
            <span className="text-emerald-400 font-medium">Zero Data Retention (ZDR) Enabled</span>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};
