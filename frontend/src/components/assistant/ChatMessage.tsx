import React, { useState } from 'react';
import {
  Bot,
  User,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export interface ToolCallItem {
  tool: string;
  success: boolean;
  message: string;
}

export interface PendingConfirmationItem {
  tool: string;
  args: any;
  prompt: string;
}

export interface ChatMessageItem {
  id?: string;
  sender: 'user' | 'assistant';
  text: string;
  toolCalls?: ToolCallItem[];
  pendingConfirmation?: PendingConfirmationItem;
  suggestions?: string[];
  createdAt?: string;
}

interface ChatMessageProps {
  message: ChatMessageItem;
  onSelectSuggestion?: (sug: string) => void;
  onConfirmAction?: (tool: string, args: any) => void;
  onCancelAction?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSelectSuggestion,
  onConfirmAction,
  onCancelAction,
}) => {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);
  const [actionDone, setActionDone] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple Markdown Styler for headers, bold, bullet points
  const formatMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Heading 3: ###
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-extrabold text-white mt-2 mb-1 tracking-tight">
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Bullet list item
      if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
        const itemText = line.trim().replace(/^[•\-]\s*/, '');
        return (
          <li key={idx} className="ml-4 list-disc text-slate-200 my-0.5 leading-relaxed">
            {renderBold(itemText)}
          </li>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Normal paragraph
      return (
        <p key={idx} className="my-0.5 leading-relaxed">
          {renderBold(line)}
        </p>
      );
    });
  };

  // Helper to parse **bold** and *italic*
  const renderBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-blue-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} group animate-in fade-in duration-150`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 text-white shadow-md shadow-blue-500/20 mt-1">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[78%] space-y-2`}>
        
        {/* Tool Execution Badges (If tools were executed) */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {message.toolCalls.map((tc, idx) => (
              <div
                key={idx}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-semibold border ${
                  tc.success
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                }`}
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
            isUser
              ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-lg shadow-blue-600/20'
              : 'bg-slate-900/85 border border-white/[0.08] text-slate-200 rounded-tl-none shadow-md backdrop-blur-xl'
          }`}
        >
          <div className="space-y-1">{formatMarkdown(message.text)}</div>

          {/* Action Confirmation Card (High Risk Actions) */}
          {!isUser && message.pendingConfirmation && !actionDone && (
            <div className="mt-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <ShieldAlert className="w-4 h-4" />
                <span>Action Confirmation Required</span>
              </div>
              <p className="text-[11px] text-amber-200/90">
                {message.pendingConfirmation.prompt}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    if (onConfirmAction) {
                      onConfirmAction(
                        message.pendingConfirmation!.tool,
                        message.pendingConfirmation!.args
                      );
                      setActionDone(true);
                    }
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1 shadow transition-all"
                >
                  <Check className="w-3 h-3" /> Confirm & Execute
                </button>
                <button
                  onClick={() => {
                    if (onCancelAction) onCancelAction();
                    setActionDone(true);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-[11px] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Message Footer / Copy */}
          {!isUser && (
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/[0.06] text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" /> HomeMind Intelligence
              </span>
              <button
                onClick={handleCopy}
                className="hover:text-white flex items-center gap-1 transition-colors p-0.5 rounded"
                title="Copy response"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Contextual Follow-up Suggestions */}
        {!isUser && message.suggestions && message.suggestions.length > 0 && onSelectSuggestion && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {message.suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSuggestion(sug)}
                className="text-[11px] bg-slate-900/70 hover:bg-blue-600/15 border border-slate-800 hover:border-blue-500/40 text-blue-300 px-2.5 py-1 rounded-xl text-left transition-all flex items-center gap-1"
              >
                <span>{sug}</span>
                <ArrowRight className="w-2.5 h-2.5 opacity-60" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 mt-1">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
