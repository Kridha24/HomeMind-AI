import React from 'react';
import { X, Bell, AlertTriangle, AlertCircle, ShoppingBag, Tv, Pill, CheckCircle2 } from 'lucide-react';
import { NotificationItem } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'BILL_DUE': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'GROCERY_EXPIRING': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'LOW_STOCK': return <ShoppingBag className="w-4 h-4 text-purple-400" />;
      case 'MEDICINE_REMINDER': return <Pill className="w-4 h-4 text-pink-400" />;
      case 'MAINTENANCE_DUE': return <Tv className="w-4 h-4 text-blue-400" />;
      default: return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-sm text-slate-100">Household Notifications</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-xl border transition-all ${
                n.isRead
                  ? 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                  : 'bg-slate-800/70 border-slate-700/80 text-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-200">{n.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{n.message}</p>
                  <span className="text-[9px] text-slate-500 mt-2 block">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
