import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Send,
  Square,
  RefreshCw,
  CheckCircle2,
  Calendar,
  CheckSquare,
  ShoppingBag,
  DollarSign,
  Trash2,
  Brain,
  Check,
  Copy,
  ShieldAlert,
} from 'lucide-react';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../stores/useAuthStore';
import { MemoryModal } from '../components/assistant/MemoryModal';

interface ToolCall {
  tool: string;
  success: boolean;
  message: string;
}

interface PendingConfirmation {
  tool: string;
  args: any;
  prompt: string;
}

interface Message {
  id?: string;
  sender: 'user' | 'assistant';
  text: string;
  toolCalls?: ToolCall[];
  pendingConfirmation?: PendingConfirmation;
  suggestions?: string[];
  createdAt?: string;
}

export const Assistant: React.FC = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Dynamic Time-Based Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const timeGreeting =
      hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const userName = user?.name ? user.name.split(' ')[0] : 'there';
    return `${timeGreeting}, ${userName}.`;
  };

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMessage: Message = {
      sender: 'user',
      text: query.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await apiClient.post('/assistant/chat', {
        message: query.trim(),
        threadId,
      });

      if (res.data.threadId) {
        setThreadId(res.data.threadId);
      }

      const assistantMessage: Message = {
        sender: 'assistant',
        text: res.data.answer || 'I evaluated your request against your live household database.',
        toolCalls: res.data.toolCallsExecuted || [],
        pendingConfirmation: res.data.pendingConfirmation,
        suggestions: res.data.suggestions || [],
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'HomeMind is temporarily unable to connect to its AI service. Please verify your connection and try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Stop Generation Handler
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
  };

  // Execute Confirmed High-Risk Action
  const handleConfirmAction = async (tool: string, args: any) => {
    try {
      const res = await apiClient.post('/assistant/actions/execute', { tool, args });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: res.data.message || 'Action executed successfully.',
          toolCalls: [{ tool, success: res.data.success, message: res.data.message }],
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: 'I was unable to complete the confirmed action.' },
      ]);
    }
  };

  // Clear Thread
  const handleClearThread = async () => {
    if (threadId) {
      try {
        await apiClient.delete(`/assistant/threads/${threadId}`);
      } catch (e) {}
    }
    setThreadId(undefined);
    setMessages([]);
  };

  // Copy Message Text
  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && input.trim()) {
        handleSendMessage();
      }
    }
  };

  // Helper Markdown Formatter
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-extrabold text-white mt-2 mb-1 tracking-tight">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
        const itemText = line.trim().replace(/^[•\-]\s*/, '');
        return (
          <li key={idx} className="ml-4 list-disc text-slate-200 my-0.5 leading-relaxed">
            {parseInline(itemText)}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="my-0.5 leading-relaxed">
          {parseInline(line)}
        </p>
      );
    });
  };

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-blue-300">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const quickActions = [
    { label: 'Plan my day', icon: Calendar, prompt: 'Plan my day with upcoming tasks and schedule' },
    { label: 'Show my tasks', icon: CheckSquare, prompt: 'What are my pending tasks?' },
    { label: "What's on my calendar?", icon: Calendar, prompt: 'What is on my calendar and schedule today?' },
    { label: 'Check my spending', icon: DollarSign, prompt: 'How much did I spend this month?' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full max-w-4xl mx-auto select-none font-sans">
      
      {/* ========================================================================= */}
      {/* 1. MINIMAL TOP HEADER */}
      {/* ========================================================================= */}
      <header className="py-3 px-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl flex items-center justify-between rounded-t-3xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm text-white tracking-tight leading-none">
                HomeMind AI
              </h1>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Household Operating Agent
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMemoryOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-colors"
            title="AI Household Memories"
          >
            <Brain className="w-4 h-4" />
          </button>

          {messages.length > 0 && (
            <button
              onClick={handleClearThread}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. CONVERSATION AREA (ONE SCREEN) */}
      {/* ========================================================================= */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        
        {/* Clean Empty State: Dynamic Real User Greeting & 4 Quick Actions */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[380px] text-center space-y-6 animate-in fade-in duration-200 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/25">
              <Bot className="w-6 h-6" />
            </div>

            <div className="space-y-1.5 max-w-md">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {getGreeting()}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                I am connected to your live household database. What would you like to manage or inspect today?
              </p>
            </div>

            {/* Contextual Quick Actions (Disappear once conversation starts) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md pt-2">
              {quickActions.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => handleSendMessage(qa.prompt)}
                  disabled={loading}
                  className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/[0.08] hover:border-blue-500/40 text-left flex items-center gap-3 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-md active:scale-95 disabled:opacity-50 group"
                >
                  <div className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform flex-shrink-0">
                    <qa.icon className="w-3.5 h-3.5" />
                  </div>
                  <span>{qa.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Messages Stream */}
        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'} group animate-in fade-in duration-150`}
              >
                {/* Assistant Avatar */}
                {m.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 text-white shadow-md shadow-blue-500/20 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-[85%] sm:max-w-[80%] space-y-2">
                  
                  {/* Tool Execution Badges */}
                  {m.sender === 'assistant' && m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.toolCalls.map((tc, tIdx) => (
                        <div
                          key={tIdx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{tc.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-3xl p-4 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-lg shadow-blue-600/20'
                        : 'bg-slate-900/85 border border-white/[0.08] text-slate-200 rounded-tl-none shadow-md backdrop-blur-xl'
                    }`}
                  >
                    <div className="space-y-1">{renderMarkdown(m.text)}</div>

                    {/* Action Confirmation Card (For High-Risk Actions) */}
                    {m.sender === 'assistant' && m.pendingConfirmation && (
                      <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Action Confirmation</span>
                        </div>
                        <p className="text-[11px] text-amber-200/90">
                          {m.pendingConfirmation.prompt}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() =>
                              handleConfirmAction(
                                m.pendingConfirmation!.tool,
                                m.pendingConfirmation!.args
                              )
                            }
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-xl text-[11px] flex items-center gap-1 transition-all"
                          >
                            <Check className="w-3 h-3" /> Confirm
                          </button>
                          <button
                            onClick={() => {
                              setMessages((prev) => [
                                ...prev,
                                { sender: 'assistant', text: 'Action cancelled.' },
                              ]);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-xl text-[11px] transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Copy Response Footer */}
                    {m.sender === 'assistant' && (
                      <div className="flex items-center justify-end pt-2 mt-2 border-t border-white/[0.06] text-[10px] text-slate-400">
                        <button
                          onClick={() => handleCopy(m.text, idx)}
                          className="hover:text-white flex items-center gap-1 transition-colors p-0.5 rounded"
                          title="Copy response"
                        >
                          {copiedId === idx ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === idx ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Contextual Suggestion Pills */}
                  {m.sender === 'assistant' && m.suggestions && m.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {m.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSendMessage(sug)}
                          className="text-[11px] bg-slate-900/80 hover:bg-blue-600/15 border border-slate-800 hover:border-blue-500/40 text-blue-300 px-2.5 py-1 rounded-xl text-left transition-all"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Subtle Live Tool Status */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-blue-400 font-medium py-1.5 px-3 rounded-xl bg-blue-500/10 border border-blue-500/20 max-w-max animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>◌ Orchestrating live household context...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* ========================================================================= */}
      {/* 3. SINGLE FIXED COMPOSER (BOTTOM) */}
      {/* ========================================================================= */}
      <footer className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-xl rounded-b-3xl">
        <div className="relative flex items-end gap-2 bg-slate-900/90 border border-white/[0.08] focus-within:border-blue-500/50 rounded-2xl p-2 transition-colors shadow-lg">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask HomeMind anything..."
            className="flex-1 bg-transparent border-0 resize-none text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none px-2 py-1 max-h-[120px] scrollbar-thin"
          />

          {loading ? (
            <button
              type="button"
              onClick={handleStop}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl transition-all shadow shrink-0"
              title="Stop generation"
            >
              <Square className="w-4 h-4 text-rose-400 fill-rose-400" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-2 rounded-xl transition-all shadow-lg shadow-blue-600/25 active:scale-95 shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] text-slate-500">
          <span>Enter to send · Shift+Enter for new line</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-500" /> Real-time Live Household Data
          </span>
        </div>
      </footer>

      {/* Memory Manager Modal */}
      <MemoryModal isOpen={isMemoryOpen} onClose={() => setIsMemoryOpen(false)} />
    </div>
  );
};

export default Assistant;
