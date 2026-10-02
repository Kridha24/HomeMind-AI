import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error = false, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={`
          w-full
          bg-slate-50 dark:bg-slate-800/80
          hover:bg-slate-100/70 dark:hover:bg-slate-800
          border ${error ? 'border-red-500/80 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200/80 dark:border-slate-700/80 focus:border-blue-500 focus:ring-blue-500/20'}
          rounded-xl
          px-3.5 py-2.5
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
    );
  }
);

Textarea.displayName = 'Textarea';
