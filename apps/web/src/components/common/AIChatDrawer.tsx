import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw, Trash2, ArrowRight, ShieldAlert } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';
import { ActionCard, ActionCardData } from '../assistant/ActionCard';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  cards?: ActionCardData[];
  toolCalls?: Array<{ tool: string; success: boolean; message: string }>;
  pendingConfirmation?: {
    tool: string;
    args: any;
    prompt: string;
    confirmationId?: string;
  };
  clarificationRequired?: {
    question: string;
    options: Array<{ label: string; actionPayload: string }>;
  };
  suggestions?: string[];
  timestamp: string;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const text = queryText || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    const idempotencyKey = `copilot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await apiClient.post('/copilot/action', {
        message: text.trim(),
        threadId,
        idempotencyKey,
      });

      if (res.data.threadId) {
        setThreadId(res.data.threadId);
      }

      // Live React Query cache invalidation across affected domains
      if (res.data.invalidatedDomains && Array.isArray(res.data.invalidatedDomains)) {
        for (const domain of res.data.invalidatedDomains) {
          queryClient.invalidateQueries({ queryKey: [domain] });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardIncomes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardGroceries'] });

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.data.answer || 'I evaluated your request against your live household database.',
        cards: res.data.cards || [],
        toolCalls: res.data.actionsExecuted || [],
        pendingConfirmation: res.data.pendingConfirmation,
        clarificationRequired: res.data.clarificationRequired,
        suggestions: res.data.suggestions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('[AIChatDrawer] Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: err.response?.data?.error || 'AI Copilot is temporarily unavailable. Please check your connection and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (tool: string, args: any, confirmationId?: string) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/copilot/confirm', { tool, args, confirmationId });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['groceries'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardIncomes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardGroceries'] });

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: res.data.message || 'Action executed successfully.',
          toolCalls: [{ tool, success: res.data.success, message: res.data.message }],
          cards: res.data.card ? [res.data.card] : [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: e.response?.data?.error || 'Could not complete the confirmed action.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setThreadId(undefined);
  };

  const formatMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-xs font-extrabold text-primary mt-1.5 mb-0.5">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
        const itemText = line.trim().replace(/^[•\-]\s*/, '');
        return (
          <li key={idx} className="ml-3.5 list-disc text-primary my-0.5 leading-relaxed">
            {renderBold(itemText)}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1" />;
      }
      return (
        <p key={idx} className="my-0.5 leading-relaxed">
          {renderBold(line)}
        </p>
      );
    });
  };

  const renderBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-primary">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-blue-600 dark:text-blue-300">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const quickStarters = [
    '4000 income me add kar do, bhaiya se liya tha',
    '450 mess me kharch hua',
    'kal cylinder lene ka task bana do',
    'milk aur bread grocery me add kar do',
    'is month kitna kharcha hua?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/70 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-background border-l border-primary shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-primary bg-panel/60 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-primary">HomeMind.AI Copilot</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[10px] text-muted">Action-Aware Autonomous Assistant</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-secondary transition-colors"
                title="Clear Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {/* Welcome Screen & Quick Starters */}
          {messages.length === 0 && (
            <div className="space-y-4 py-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-panel/70 border border-primary text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-500">
                  <Bot className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-primary">Namaste! Main aapka HomeMind.AI Action Copilot hoon.</h4>
                <p className="text-[11px] text-muted leading-relaxed">
                  Aap natural language mein bol kar directly income, expense, task, bills ya groceries add ya manage kar sakte hain.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block px-1">
                  Try Action Commands
                </span>
                <div className="space-y-1.5">
                  {quickStarters.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      disabled={loading}
                      className="w-full p-2.5 rounded-xl bg-panel hover:bg-secondary border border-primary text-left text-xs font-medium text-secondary hover:text-primary transition-all flex items-center justify-between group disabled:opacity-50"
                    >
                      <span className="truncate">{q}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-blue-400 transition-colors shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages Stream */}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
            >
              {m.sender === 'bot' && (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 text-white shadow-sm mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div className="max-w-[88%] space-y-2">
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                      : 'bg-panel border border-primary text-primary rounded-tl-none shadow-sm'
                  }`}
                >
                  <div>{formatMarkdown(m.text)}</div>
                  <span className="block text-[9px] opacity-50 text-right mt-1">
                    {m.timestamp}
                  </span>
                </div>

                {/* Action Cards (Income, Expense, Task, Grocery, Bill) */}
                {m.cards && m.cards.length > 0 && (
                  <div className="space-y-2">
                    {m.cards.map((card, cIdx) => (
                      <ActionCard
                        key={cIdx}
                        card={card}
                        onSelectOption={(payload) => handleSend(payload)}
                      />
                    ))}
                  </div>
                )}

                {/* Clarification Required Pill Options */}
                {m.clarificationRequired && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 text-xs space-y-2 mt-2">
                    <p className="text-primary text-xs font-semibold">
                      {m.clarificationRequired.question}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.clarificationRequired.options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={() => handleSend(opt.actionPayload || opt.label)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-600/30 hover:bg-indigo-200 dark:hover:bg-indigo-600/50 border border-indigo-300 dark:border-indigo-500/40 text-indigo-800 dark:text-indigo-200 font-bold text-[11px] transition-all active:scale-95 shadow-sm"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* High-Risk Pending Confirmation Banner */}
                {m.pendingConfirmation && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-xs space-y-2.5 mt-2">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <span>Confirmation Required</span>
                    </div>
                    <p className="text-primary text-xs leading-relaxed font-medium">
                      {m.pendingConfirmation.prompt}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() =>
                          handleConfirmAction(
                            m.pendingConfirmation!.tool,
                            m.pendingConfirmation!.args,
                            m.pendingConfirmation!.confirmationId
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-all shadow-sm active:scale-95"
                      >
                        Confirm Action
                      </button>
                    </div>
                  </div>
                )}

                {/* Follow up suggestions */}
                {m.sender === 'bot' && m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {m.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSend(sug)}
                        className="text-[10px] bg-panel hover:bg-blue-600/10 border border-primary hover:border-blue-500/40 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-lg text-left transition-all"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-secondary border border-secondary flex items-center justify-center shrink-0 text-secondary mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium py-1.5 px-3 rounded-xl bg-blue-500/10 border border-blue-500/20 max-w-max animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Executing action across household database...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 border-t border-primary bg-panel/90 backdrop-blur"
        >
          <div className="flex items-center gap-2 bg-surface-input border border-input focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-xl p-1.5 transition-all shadow-inner">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="e.g. 4000 income me add kar do, bhaiya se liya tha"
              className="flex-1 bg-transparent text-xs text-primary placeholder:text-muted focus:outline-none px-2 py-1 font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-1.5 rounded-lg transition-all shadow shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIChatDrawer;
