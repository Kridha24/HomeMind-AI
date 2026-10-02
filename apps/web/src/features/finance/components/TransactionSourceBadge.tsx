import React from 'react';
import { Smartphone, Building2, User, Camera, Sparkles, MessageSquareText, Layers } from 'lucide-react';

interface TransactionSourceBadgeProps {
  source?: string | null;
  paymentMethod?: string | null;
  bankName?: string | null;
  isAiCategorized?: boolean;
  className?: string;
}

export const TransactionSourceBadge: React.FC<TransactionSourceBadgeProps> = ({
  source,
  paymentMethod,
  bankName,
  isAiCategorized,
  className = '',
}) => {
  const normSource = (source || 'MANUAL').toUpperCase();
  const normMethod = (paymentMethod || '').toUpperCase();

  let label = 'Manual';
  let Icon: React.ElementType = User;
  let badgeStyle = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';

  if (normSource === 'SMS') {
    if (normMethod === 'UPI') {
      label = bankName ? `UPI • ${bankName}` : 'UPI';
      Icon = Smartphone;
      badgeStyle = 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25';
    } else {
      label = bankName ? `SMS • ${bankName}` : 'Bank SMS';
      Icon = MessageSquareText;
      badgeStyle = 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25';
    }
  } else if (normSource === 'OCR') {
    label = 'Receipt OCR';
    Icon = Camera;
    badgeStyle = 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/25';
  } else if (normSource === 'IMPORTED') {
    label = 'Imported';
    Icon = Layers;
    badgeStyle = 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/25';
  } else if (normMethod === 'UPI') {
    label = 'UPI Manual';
    Icon = Smartphone;
    badgeStyle = 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight border ${badgeStyle}`}
      >
        <Icon className="w-3 h-3 shrink-0" />
        <span className="truncate max-w-[120px]">{label}</span>
      </span>

      {isAiCategorized && (
        <span
          title="AI Categorized"
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30"
        >
          <Sparkles className="w-2.5 h-2.5" />
          <span>AI</span>
        </span>
      )}
    </div>
  );
};
