import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SettingsSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'icon'> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: React.ElementType | React.ReactNode;
  options?: SelectOption[];
  ariaLabel?: string;
  onChange?: ((value: string) => void) | React.ChangeEventHandler<HTMLSelectElement>;
}

export const SettingsSelect: React.FC<SettingsSelectProps> = ({
  label,
  error,
  helpText,
  icon,
  options,
  ariaLabel,
  onChange,
  id,
  children,
  className = '',
  ...props
}) => {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onChange) return;
    // Check if handler expects string or event
    if (onChange.length === 1) {
      (onChange as (val: string) => void)(e.target.value);
    } else {
      (onChange as React.ChangeEventHandler<HTMLSelectElement>)(e);
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          {icon}
        </div>
      );
    }
    const IconComp = icon as React.ElementType;
    return (
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <IconComp className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-bold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-2xs">
        {renderIcon()}
        <select
          id={selectId}
          aria-label={ariaLabel || label}
          onChange={handleChange}
          className={`w-full appearance-none bg-slate-50 dark:bg-slate-800/80 border rounded-xl py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 transition-all duration-150 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer ${
            icon ? 'pl-9 pr-8' : 'pl-3 pr-8'
          } ${
            error
              ? 'border-rose-500 focus:border-rose-500'
              : 'border-slate-200 dark:border-slate-700'
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {helpText && !error && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{helpText}</p>
      )}
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
};

export default SettingsSelect;
