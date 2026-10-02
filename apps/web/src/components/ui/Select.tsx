import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  error?: boolean;
  icon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error = false, icon, options, children, disabled, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <span className="absolute left-3 pointer-events-none text-slate-400 dark:text-slate-500 flex items-center">
            {icon}
          </span>
        )}
        <select
          ref={ref}
          disabled={disabled}
          className={`
            w-full appearance-none
            bg-slate-50 dark:bg-slate-800/80
            hover:bg-slate-100/70 dark:hover:bg-slate-800
            border ${error ? 'border-red-500/80 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200/80 dark:border-slate-700/80 focus:border-blue-500 focus:ring-blue-500/20'}
            rounded-xl
            ${icon ? 'pl-8' : 'pl-3.5'}
            pr-8 py-2
            text-xs font-medium text-slate-800 dark:text-slate-100
            focus:outline-none focus:ring-2
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

Select.displayName = 'Select';
