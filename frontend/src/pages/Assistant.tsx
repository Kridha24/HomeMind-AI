import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, RefreshCw } from 'lucide-react';
import apiClient from '../services/apiClient';
import { AssistantHeader, AssistantMode } from '../components/assistant/AssistantHeader';
import { DailyHomeSummary } from '../components/assistant/DailyHomeSummary';
import { QuickActions } from '../components/assistant/QuickActions';
import { ChatMessage, ChatMessageItem } from '../components/assistant/ChatMessage';
import { ChatComposer } from '../components/assistant/ChatComposer';
import { MemoryModal } from '../components/assistant/MemoryModal';

export const Assistant: React.FC = () => {
  const [mode, setMode] = useState<AssistantMode>('chat');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle Mode Change & Smart Prompts
  const handleModeChange = (newMode: AssistantMode) => {
    setMode(newMode);
    if (newMode === 'plan') {
      handleSendMessage('Plan my day and coordinate my schedule with pending household chores');
    } else if (newMode === 'action') {
      handleSendMessage('Show all actionable household tasks and pending bill dues');
    } else if (newMode === 'insights') {
      handleSendMessage('Analyze my monthly spending breakdown and pantry status');
    }
  };

  // Main Send Function
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMessage: ChatMessageItem = {
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

      const assistantMessage: ChatMessageItem = {
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
          text: 'I could not process your request right now. Please check your connection and try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Stop Generation Handler
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
  };

  // Action Confirmation Execution
  const handleConfirmAction = async (tool: string, args: any) => {
    try {
      const res = await apiClient.post('/assistant/actions/execute', { tool, args });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: res.data.message || 'Action executed successfully.',
          toolCalls: [
            {
              tool,
              success: res.data.success,
              message: res.data.message,
            },
          ],
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Failed to complete the confirmed action.',
        },
      ]);
    }
  };

  // Clear Conversation Thread
  const handleClearThread = async () => {
    if (threadId) {
      try {
        await apiClient.delete(`/assistant/threads/${threadId}`);
      } catch (e) {}
    }
    setThreadId(undefined);
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-5xl mx-auto rounded-3xl bg-slate-950/80 border border-slate-800/80 shadow-2xl overflow-hidden backdrop-blur-2xl">
      {/* Header */}
      <AssistantHeader
        mode={mode}
        onModeChange={handleModeChange}
        onOpenMemories={() => setIsMemoryOpen(true)}
        onClearThread={handleClearThread}
        isStreaming={loading}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        {/* If no conversation yet: Show Welcome State + Daily Summary + Quick Actions */}
        {messages.length === 0 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <DailyHomeSummary />
            <QuickActions onSelectAction={handleSendMessage} disabled={loading} />
          </div>
        )}

        {/* Chat Conversation Thread */}
        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((m, idx) => (
              <ChatMessage
                key={idx}
                message={m}
                onSelectSuggestion={handleSendMessage}
                onConfirmAction={handleConfirmAction}
                onCancelAction={() => {
                  setMessages((prev) => [
                    ...prev,
                    { sender: 'assistant', text: 'Action cancelled.' },
                  ]);
                }}
              />
            ))}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-2.5 text-xs text-blue-400 font-medium py-2 px-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 max-w-max animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>HomeMind is analyzing context & orchestrating tools...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <ChatComposer
        input={input}
        onInputChange={setInput}
        onSend={() => handleSendMessage()}
        onStop={handleStopGeneration}
        loading={loading}
      />

      {/* Memory Manager Modal */}
      <MemoryModal isOpen={isMemoryOpen} onClose={() => setIsMemoryOpen(false)} />
    </div>
  );
};

export default Assistant;
