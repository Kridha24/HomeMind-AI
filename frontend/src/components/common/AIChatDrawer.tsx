import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw, Trash2, ArrowRight } from 'lucide-react';
import apiClient from '../../services/apiClient';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  suggestions?: string[];
  timestamp: string;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
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

    try {
      const res = await apiClient.post('/ai/chat', { query: text.trim() });
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.data.answer || 'I could not process your query at this moment.',
        suggestions: res.data.suggestions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'HomeMind AI is temporarily unable to retrieve your data. Please check your connection and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  const formatMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-xs font-extrabold text-white mt-1.5 mb-0.5">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
        const itemText = line.trim().replace(/^[•\-]\s*/, '');
        return (
          <li key={idx} className="ml-3.5 list-disc text-slate-200 my-0.5 leading-relaxed">
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
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-blue-300">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const quickStarters = [
    'Mera total monthly expense kitna hai?',
    'Mera room rent & mess bill kitna baki hai?',
    'Pantry mein konse grocery items kam hain?',
    'Pending household tasks kya hain?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">HomeMind AI Chatbot</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[10px] text-slate-400">Live Household Database Assistant</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Clear Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                  <Bot className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-xs text-white">Namaste! Main aapka HomeMind AI assistant hoon.</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Aapke household expenses, bills, tasks, aur pantry ka live data dekh kar main turant answer kar sakta hoon.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                  Suggested Queries
                </span>
                <div className="space-y-1.5">
                  {quickStarters.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      disabled={loading}
                      className="w-full p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-left text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center justify-between group disabled:opacity-50"
                    >
                      <span className="truncate">{q}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0 ml-2" />
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

              <div className="max-w-[85%] space-y-1.5">
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <div>{formatMarkdown(m.text)}</div>
                  <span className="block text-[9px] opacity-50 text-right mt-1">
                    {m.timestamp}
                  </span>
                </div>

                {/* Follow up suggestions */}
                {m.sender === 'bot' && m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {m.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSend(sug)}
                        className="text-[10px] bg-slate-900/80 hover:bg-blue-600/15 border border-slate-800 hover:border-blue-500/30 text-blue-300 px-2 py-1 rounded-lg text-left transition-all"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-blue-400 font-medium py-1.5 px-3 rounded-xl bg-blue-500/10 border border-blue-500/20 max-w-max animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Fetching live household data...</span>
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
          className="p-3 border-t border-slate-800 bg-slate-900/60"
        >
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 focus-within:border-blue-500/50 rounded-xl p-1.5 transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask anything about expenses, bills, tasks..."
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none px-2 py-1"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-1.5 rounded-lg transition-all shadow"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
