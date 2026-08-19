import React, { useRef, useEffect } from 'react';
import { Send, Square, Mic, Sparkles } from 'lucide-react';

interface ChatComposerProps {
  input: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onStop?: () => void;
  loading: boolean;
  disabled?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  input,
  onInputChange,
  onSend,
  onStop,
  loading,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on input content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="p-3 sm:p-4 border-t border-primary/80 bg-background/80 backdrop-blur-xl">
      <div className="relative flex items-end gap-2 bg-panel/90 border border-white/[0.08] focus-within:border-blue-500/50 rounded-2xl p-2 transition-colors shadow-lg">
        {/* Text Area */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask HomeMind anything... (e.g. Plan my day, Remind me to buy milk tomorrow, How much did we spend?)"
          className="flex-1 bg-transparent border-0 resize-none text-xs sm:text-sm text-primary placeholder-slate-500 focus:outline-none px-2 py-1 max-h-[120px] scrollbar-thin"
        />

        {/* Voice Trigger (Voice-ready Architecture Placeholder) */}
        <button
          type="button"
          onClick={() => {
            onInputChange('Plan my day and summarize upcoming expenses');
          }}
          className="p-2 rounded-xl text-muted hover:text-blue-400 hover:bg-secondary/60 transition-colors shrink-0"
          title="Voice Command Mode"
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Send / Stop Button */}
        {loading ? (
          <button
            type="button"
            onClick={onStop}
            className="bg-secondary hover:bg-slate-700 text-primary p-2 rounded-xl transition-all shadow shrink-0"
            title="Stop generation"
          >
            <Square className="w-4 h-4 text-rose-400 fill-rose-400" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!input.trim() || disabled}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white p-2 rounded-xl transition-all shadow-lg shadow-blue-600/25 active:scale-95 shrink-0"
            title="Send request"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] text-muted">
        <span>Enter to send · Shift+Enter for new line</span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-500" /> Grounded on Live Household Data
        </span>
      </div>
    </div>
  );
};
