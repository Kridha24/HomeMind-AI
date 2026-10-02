import React from 'react';

interface SettingsInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
  icon?: React.ElementType;
}

export const SettingsInput: React.FC<SettingsInputProps> = ({
  label,
  error,
  helpText,
  icon: Icon,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-1.5 w-full">
      <label
        htmlFor={inputId}
        className="block text-xs font-bold text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <div className="relative rounded-xl shadow-2xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-slate-50 dark:bg-slate-800/80 border rounded-xl py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all duration-150 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
            Icon ? 'pl-9 pr-3' : 'px-3'
          } ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200/80 dark:border-slate-700/80'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
      {helpText && !error && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">{helpText}</p>
      )}
    </div>
  );
};
