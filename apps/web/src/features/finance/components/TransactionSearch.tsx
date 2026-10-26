import React from 'react';
import { SearchInput } from '../../../components/ui';

interface TransactionSearchProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const TransactionSearch: React.FC<TransactionSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search kharcha, dukan ya hisab...',
  className = '',
}) => {
  return (
    <SearchInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      inputClassName="py-2.5 rounded-2xl min-h-[44px] text-xs font-medium"
      enableSlashKey
      shortcutBadge="/"
    />
  );
};
