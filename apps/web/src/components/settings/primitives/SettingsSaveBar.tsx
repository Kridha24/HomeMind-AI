import React from 'react';
import { Check, Save, RotateCcw } from 'lucide-react';

interface SettingsSaveBarProps {
  isDirty: boolean;
  saving?: boolean;
  saved?: boolean;
  onSave: () => void | Promise<void>;
  onCancel: () => void;
  saveText?: string;
  cancelText?: string;
}

export const SettingsSaveBar: React.FC<SettingsSaveBarProps> = ({
  isDirty,
  saving = false,
  saved = false,
  onSave,
  onCancel,
  saveText = 'Save Changes',
  cancelText = 'Cancel',
}) => {
  if (!isDirty && !saved) return null;

  return (
    <div
      role="region"
      aria-label="Unsaved settings notification"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl animate-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-2xl backdrop-blur-md border border-slate-700/80">
        <div className="flex items-center gap-2.5 min-w-0">
          {saved ? (
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 animate-in zoom-in-75 duration-200">
              <Check className="w-3.5 h-3.5" />
            </div>
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold truncate">
            {saved ? 'Changes saved successfully' : 'Careful — you have unsaved changes!'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!saved && (
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onSave}
            disabled={saving || saved}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              saved
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-blue-600 hover:bg-blue-500 active:scale-98 text-white shadow-blue-500/25'
            } disabled:opacity-75`}
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : saveText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsSaveBar;
