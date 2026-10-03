import React from 'react';
import {
  CreditCard,
  Wallet,
  Receipt,
  CheckSquare,
  ShoppingCart,
  ArrowUpRight,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ActionCardData {
  type: 'expense' | 'income' | 'bill' | 'task' | 'grocery' | 'analytics' | 'clarification';
  title: string;
  subtitle?: string;
  amount?: number;
  formattedAmount?: string;
  category?: string;
  date?: string;
  status?: string;
  linkUrl?: string;
  linkText?: string;
  items?: string[];
  options?: Array<{ label: string; text?: string; actionPayload?: string }>;
}

interface ActionCardProps {
  card: ActionCardData;
  onSelectOption?: (payload: string) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({ card, onSelectOption }) => {
  const navigate = useNavigate();

  switch (card.type) {
    case 'expense':
      return (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>✓ Expense Added</span>
            </div>
            {card.formattedAmount && (
              <span className="font-mono font-black text-white text-sm">
                {card.formattedAmount}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-muted text-[11px]">
            <span>{card.title} {card.category ? `• ${card.category}` : ''}</span>
            {card.date && <span>{card.date}</span>}
          </div>
          {card.linkUrl && (
            <div className="pt-1 flex justify-end">
              <button
                onClick={() => navigate(card.linkUrl!)}
                className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 flex items-center gap-1 hover:underline"
              >
                <span>{card.linkText || 'View Expense'}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      );

    case 'income':
      return (
        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span>✓ Income Recorded</span>
            </div>
            {card.formattedAmount && (
              <span className="font-mono font-black text-cyan-300 text-sm">
                {card.formattedAmount}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-muted text-[11px]">
            <span>{card.title} {card.category ? `• ${card.category}` : ''}</span>
            {card.date && <span>{card.date}</span>}
          </div>
          {card.linkUrl && (
            <div className="pt-1 flex justify-end">
              <button
                onClick={() => navigate(card.linkUrl!)}
                className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 hover:underline"
              >
                <span>{card.linkText || 'View Finance'}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      );

    case 'bill':
      return (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>{card.status === 'PAID' ? '✓ Bill Paid' : 'Bill Scheduled'}</span>
            </div>
            {card.formattedAmount && (
              <span className="font-mono font-black text-amber-300 text-sm">
                {card.formattedAmount}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-muted text-[11px]">
            <span>{card.title} {card.category ? `• ${card.category}` : ''}</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono text-[10px]">
              {card.status || 'UNPAID'}
            </span>
          </div>
          {card.linkUrl && (
            <div className="pt-1 flex justify-end">
              <button
                onClick={() => navigate(card.linkUrl!)}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 hover:underline"
              >
                <span>{card.linkText || 'View Bills'}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      );

    case 'task':
      return (
        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400 font-bold">
              <CheckSquare className="w-4 h-4 text-blue-400" />
              <span>{card.status === 'COMPLETED' ? '✓ Task Completed' : '✓ Task Scheduled'}</span>
            </div>
            {card.date && (
              <span className="text-[11px] font-mono text-muted">{card.date}</span>
            )}
          </div>
          <div className="text-white font-medium text-xs">
            {card.title}
          </div>
          {card.subtitle && (
            <div className="text-[11px] text-blue-300">
              {card.subtitle}
            </div>
          )}
          {card.linkUrl && (
            <div className="pt-1 flex justify-end">
              <button
                onClick={() => navigate(card.linkUrl!)}
                className="text-[11px] font-bold text-blue-300 hover:text-blue-200 flex items-center gap-1 hover:underline"
              >
                <span>{card.linkText || 'View Tasks'}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      );

    case 'grocery':
      return (
        <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-xs space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-400 font-bold">
              <ShoppingCart className="w-4 h-4 text-teal-400" />
              <span>✓ Groceries Added</span>
            </div>
            <span className="text-[10px] text-teal-300 font-mono">
              {card.items?.length || 1} {(card.items?.length || 1) === 1 ? 'item' : 'items'}
            </span>
          </div>
          {card.items && card.items.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {card.items.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg bg-teal-500/20 text-teal-200 text-[11px] font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
          {card.linkUrl && (
            <div className="pt-1 flex justify-end">
              <button
                onClick={() => navigate(card.linkUrl!)}
                className="text-[11px] font-bold text-teal-300 hover:text-teal-200 flex items-center gap-1 hover:underline"
              >
                <span>{card.linkText || 'View Groceries'}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      );

    case 'clarification':
      return (
        <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs space-y-2.5 mt-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <HelpCircle className="w-4 h-4 text-purple-400" />
            <span>Clarification Needed</span>
          </div>
          <p className="text-white text-xs leading-relaxed">
            {card.title}
          </p>
          {card.options && card.options.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {card.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectOption && onSelectOption(opt.actionPayload || opt.label)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 font-bold text-[11px] transition-all active:scale-95 shadow-sm"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
};
