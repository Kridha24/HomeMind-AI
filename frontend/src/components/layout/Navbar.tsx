import React from 'react';
import { Bell, Bot, CloudSun, Search, Sparkles } from 'lucide-react';
import { ProfileMenu } from '../common/ProfileMenu';

interface NavbarProps {
  onOpenAIChat: () => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAIChat,
  onOpenNotifications,
  unreadCount = 0,
}) => {
  return (
    <header className="h-16 bg-slate-900/40 backdrop-blur-xl border-b border-slate-800/60 sticky top-0 z-30 ml-64 flex items-center justify-between px-6">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search household expenses, groceries, tasks..."
            className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-4">
        {/* Live Weather Widget */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950/40 border border-slate-800/60 px-3 py-1.5 rounded-xl text-xs text-slate-300">
          <CloudSun className="w-4 h-4 text-amber-400" />
          <span>74°F Sunny • San Francisco</span>
        </div>

        {/* AI Assistant Quick Trigger */}
        <button
          onClick={onOpenAIChat}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all hover:scale-105 active:scale-95"
        >
          <Bot className="w-4 h-4" />
          <span>Ask HomeMind AI</span>
          <Sparkles className="w-3 h-3 text-blue-200" />
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Menu & Logout Dropdown */}
        <ProfileMenu />
      </div>
    </header>
  );
};
