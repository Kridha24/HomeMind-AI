import React from 'react';
import { Search, X } from 'lucide-react';

interface GrocerySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const GrocerySearch: React.FC<GrocerySearchProps> = ({
  value,
  onChange,
  placeholder = 'Search by item name, category, or unit...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute left-3 text-secondary pointer-events-none">
        <Search className="w-4 h-4 text-secondary" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 text-xs bg-secondary/50 dark:bg-slate-900/60 border border-primary/70 rounded-xl text-primary placeholder:text-muted focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 p-1 text-secondary hover:text-primary rounded-md hover:bg-secondary/60 transition-colors"
          title="Clear search"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
