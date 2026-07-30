import React, { useState } from 'react';
import { X, Send, Bot, Sparkles, User, RefreshCw } from 'lucide-react';
import apiClient from '../../services/apiClient';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  suggestions?: string[];
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Hello! I am HomeMind AI, your intelligent household operating assistant. How can I help optimize your household today?',
      suggestions: [
        'How much did I spend this month?',
        'Which bill is due next?',
        'Suggest dinner based on inventory',
        'Which appliance needs servicing?'
      ]
    }
  ]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await apiClient.post('/ai/chat', { query });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.data.answer || 'I parsed your query against your household database context.',
          suggestions: res.data.suggestions
        }
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Unable to reach real-time database context. Please verify your connection or try asking again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                HomeMind AI Assistant
                <Sparkles className="w-3 h-3 text-blue-400" />
              </h3>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Grounded on Live Database
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-tl-none'
              }`}>
                {m.text}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-700/50 space-y-1.5">
                    <p className="text-[10px] font-semibold text-slate-400">Suggested Questions:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(sug)}
                          className="text-[10px] bg-slate-900 hover:bg-blue-600/20 border border-slate-700/80 hover:border-blue-500/40 text-blue-300 px-2 py-1 rounded-lg text-left transition-colors"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 text-slate-300 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 text-xs text-blue-400 items-center animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>HomeMind AI is parsing your household database...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about expenses, bills, pantry..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
