import React from 'react';
import { Search, X } from 'lucide-react';

interface TaskSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TaskSearch: React.FC<TaskSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search tasks by title, note, or assignee...',
}) => {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 rounded-2xl bg-secondary/60 border border-primary/80 text-xs sm:text-sm text-primary placeholder-muted focus:outline-none focus:border-purple-500/80 transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-0.5 rounded-full hover:bg-secondary transition-colors"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
