import React, { forwardRef, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  enableSlashKey?: boolean;
  shortcutBadge?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Search...',
      className = '',
      inputClassName = '',
      enableSlashKey = false,
      shortcutBadge,
      disabled,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLInputElement | null>(null);

    // Sync external ref if provided
    const setRefs = (node: HTMLInputElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    };

    // Keyboard shortcut '/' to focus search
    useEffect(() => {
      if (!enableSlashKey) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          e.key === '/' &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          e.preventDefault();
          internalRef.current?.focus();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enableSlashKey]);

    return (
      <div className={`relative flex items-center w-full ${className}`}>
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
        <input
          ref={setRefs}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full
            pl-10 pr-14 py-2
            bg-slate-50 dark:bg-slate-800/80
            hover:bg-slate-100/70 dark:hover:bg-slate-800
            border border-slate-200/80 dark:border-slate-700/80
            rounded-xl
            text-xs font-medium text-slate-800 dark:text-slate-100
            placeholder-slate-400 dark:placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            transition-all duration-150
            shadow-2xs
            disabled:opacity-50 disabled:cursor-not-allowed
            ${inputClassName}
          `}
          {...props}
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {value ? (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded-md transition-colors"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : shortcutBadge ? (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-2xs">
              {shortcutBadge}
            </kbd>
          ) : null}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
