import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FilterSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FilterSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: FilterSelectOption[];
  icon?: React.ReactNode;
}

export const FilterSelect = forwardRef<HTMLSelectElement, FilterSelectProps>(
  ({ className = '', icon, options, children, disabled, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        {icon && (
          <span className="absolute left-3 pointer-events-none text-slate-400 dark:text-slate-500 flex items-center">
            {icon}
          </span>
        )}
        <select
          ref={ref}
          disabled={disabled}
          className={`
            appearance-none
            bg-slate-50 dark:bg-slate-800/80
            hover:bg-slate-100/70 dark:hover:bg-slate-800
            border border-slate-200/80 dark:border-slate-700/80
            rounded-2xl
            ${icon ? 'pl-8' : 'pl-3'}
            pr-8 py-2
            text-xs font-bold text-slate-800 dark:text-slate-100
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            transition-all duration-150
            cursor-pointer shadow-2xs
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1"
                >
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
      </div>
    );
  }
);

FilterSelect.displayName = 'FilterSelect';
