import React from 'react';
import { BookOpen, ShieldCheck, Camera, Bot, Users, LayoutDashboard, Wallet, HeartPulse, Sparkles } from 'lucide-react';

export const UserManual: React.FC = () => {
  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
          HomeMind User Manual
          <BookOpen className="w-6 h-6 text-indigo-400" />
        </h1>
        <p className="text-sm text-muted mt-2">Welcome to HomeMind AI! This guide will help you understand how to use the platform to manage your household easily.</p>
      </div>

      <div className="space-y-6">
        {/* 1. Dashboard & Navigation */}
        <div className="glass-panel p-6 border-indigo-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-primary">1. Dashboard & Overview</h2>
          </div>
          <p className="text-sm text-secondary leading-relaxed">
            The Dashboard is your main control center. It shows you a quick summary of your household's financial health, pending bills, and upcoming tasks. Use the sidebar on the left to navigate to different sections like Finances, Inventory, and Settings.
          </p>
        </div>

        {/* 2. Privacy & Family Workspace */}
        <div className="glass-panel p-6 border-emerald-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-primary">2. Privacy & Family Workspace</h2>
          </div>
          <div className="space-y-3 text-sm text-secondary leading-relaxed">
            <p><strong>Strict Privacy:</strong> HomeMind respects your privacy. If you are a <span className="text-emerald-400 font-bold">MEMBER</span>, you will only see your own personal Income, Expenses, and Bills. You cannot see other members' personal financial data.</p>
            <p><strong>Roles:</strong> The <span className="text-indigo-400 font-bold">OWNER</span> and <span className="text-indigo-400 font-bold">CO-OWNER</span> can see all data in the household. The OWNER can go to the <strong>Family Workspace</strong> page to promote any member to a CO-OWNER.</p>
            <p><strong>Aggregate View:</strong> Even if you are a MEMBER, you can visit the Family Workspace to see the "Total Family Financial Overview" which shows the combined household totals without revealing personal details.</p>
            <p><strong>Joining/Inviting:</strong> In the Family Workspace, you can copy your Invite Code to share with family, or you can enter another family's Invite Code to join their household.</p>
          </div>
        </div>

        {/* 3. Financial Tracking */}
        <div className="glass-panel p-6 border-rose-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-rose-400" />
            </div>
            <h2 className="text-lg font-bold text-primary">3. Income, Expenses & Bills</h2>
          </div>
          <p className="text-sm text-secondary leading-relaxed">
            Track your personal and family finances easily. Go to the <strong>Income</strong> or <strong>Expenses</strong> pages to add records manually. Use the <strong>Bills</strong> page to track upcoming payments. When you mark a bill as "PAID", it automatically records it as an expense for you!
          </p>
        </div>

        {/* 4. Pantry Vision (AI OCR) */}
        <div className="glass-panel p-6 border-amber-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-primary">4. Pantry Vision (AI Scanning)</h2>
          </div>
          <p className="text-sm text-secondary leading-relaxed">
            Hate typing? Use <strong>Pantry Vision</strong>! You can upload an image of a grocery receipt or a picture of your pantry shelves. The built-in AI will scan the image, extract the items, categories, and amounts, and automatically log them into your Inventory or Expenses.
          </p>
        </div>

        {/* 5. AI Assistant */}
        <div className="glass-panel p-6 border-blue-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-primary">5. HomeMind AI Assistant</h2>
          </div>
          <p className="text-sm text-secondary leading-relaxed">
            Click the <span className="bg-blue-600 px-2 py-0.5 rounded text-white text-xs inline-flex items-center gap-1"><Bot className="w-3 h-3"/> Ask HomeMind AI</span> button in the bottom right corner at any time. The AI can answer questions about your spending, summarize your tasks, or even automatically add an expense if you ask it to!
          </p>
        </div>
      </div>
      
      <div className="text-center mt-10">
        <p className="text-xs text-muted flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          Thank you for choosing HomeMind AI to manage your home.
        </p>
      </div>
    </div>
  );
};
