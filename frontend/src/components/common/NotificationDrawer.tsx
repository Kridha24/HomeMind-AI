import React from 'react';
import { X, Bell, AlertTriangle, AlertCircle, ShoppingBag, Tv, Pill, CheckCircle2 } from 'lucide-react';
import { NotificationItem } from '../../types';
import { EmptyState } from './EmptyState';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications = [],
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
    <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-panel border-l border-primary h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-primary pb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" />
              <h2 className="font-extrabold text-base text-primary">Household Notifications</h2>
            </div>
            <button onClick={onClose} className="text-muted hover:text-white p-1 rounded-lg hover:bg-secondary">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
            {notifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No notifications"
                description="Your household notification feed is empty. Automated alerts for due bills, low pantry stock, and medicine reminders will appear here."
                secondaryText="Smart household alerts sync in real-time."
              />
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-4 rounded-2xl bg-background/60 border border-primary/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-bold text-xs text-primary">
                      {getIcon(n.type)}
                      {n.title}
                    </span>
                    <span className="text-[10px] text-muted font-mono">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted pl-6 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
