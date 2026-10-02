import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error = false, icon, rightIcon, disabled, type = 'text', ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <span className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-slate-500 flex items-center">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={`
            w-full
            bg-slate-50 dark:bg-slate-800/80
            hover:bg-slate-100/70 dark:hover:bg-slate-800
            border ${error ? 'border-red-500/80 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200/80 dark:border-slate-700/80 focus:border-blue-500 focus:ring-blue-500/20'}
            rounded-xl
            ${icon ? 'pl-10' : 'px-3.5'}
            ${rightIcon ? 'pr-10' : 'px-3.5'}
            py-2
            text-xs text-slate-800 dark:text-slate-100
            placeholder-slate-400 dark:placeholder-slate-500
            focus:outline-none focus:ring-2
            transition-all duration-150
            shadow-2xs
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 pointer-events-none text-slate-400 dark:text-slate-500 flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
