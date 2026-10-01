import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Smile,
  Phone,
  Video,
  Users,
  ShieldCheck,
  CheckCheck,
  Sparkles,
  Paperclip,
  MoreVertical,
  Circle,
  MessageSquare,
} from 'lucide-react';
import { socketService } from '../../services/socketService';
import { useAuthStore } from '../../stores/useAuthStore';

interface Member {
  id: string;
  name: string;
  email?: string;
  role: string;
  avatar?: string;
  isOnline?: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  recipientId?: string | null;
  createdAt: string;
  reactions?: Record<string, string[]>;
}

interface FamilyChatProps {
  members: Member[];
  onlineUserIds: string[];
  onStartCall: (member: Member, callType: 'audio' | 'video') => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '🙌'];

export const FamilyChat: React.FC<FamilyChatProps> = ({
  members,
  onlineUserIds = [],
  onStartCall,
}) => {
  const { user } = useAuthStore();
  const [activeChannel, setActiveChannel] = useState<'group' | string>('group');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket listener for incoming family chat messages
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('family_new_message', handleNewMessage);

    return () => {
      socket.off('family_new_message', handleNewMessage);
    };
  }, []);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  // Filter messages based on active channel
  const displayedMessages = messages.filter((m) => {
    if (activeChannel === 'group') {
      return !m.recipientId;
    } else {
      // 1-on-1 chat with active member
      return (
        (m.senderId === user?.id && m.recipientId === activeChannel) ||
        (m.senderId === activeChannel && m.recipientId === user?.id)
      );
    }
  });

  const activeMember = members.find((m) => m.id === activeChannel);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    socket.emit('family_send_message', {
      text: inputText.trim(),
      senderName: user?.name || 'Family Member',
      senderAvatar: user?.avatar,
      recipientId: activeChannel === 'group' ? undefined : activeChannel,
    });

    setInputText('');
    setShowEmojiBar(false);
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  return (
    <div className="glass-panel border-primary/80 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[650px]">
      {/* Sidebar: Channel & Family Member List */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-primary/80 bg-secondary/30 flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 border-b border-primary/80">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-primary flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Family Channels
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {onlineUserIds.length} Online
            </span>
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {/* Main Household Group Channel */}
          <button
            onClick={() => setActiveChannel('group')}
            className={`w-full p-3 rounded-2xl text-left flex items-center justify-between transition-all ${
              activeChannel === 'group'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'hover:bg-secondary/60 text-primary'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                  activeChannel === 'group'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xs block">Household Group</span>
                <span
                  className={`text-[10px] block ${
                    activeChannel === 'group' ? 'text-white/80' : 'text-muted'
                  }`}
                >
                  All Family Members
                </span>
              </div>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                activeChannel === 'group' ? 'bg-white' : 'bg-emerald-500'
              }`}
            />
          </button>

          <div className="pt-3 pb-1.5 px-2">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Direct Messages (1-on-1)
            </span>
          </div>

          {/* Members 1-on-1 List */}
          {members
            .filter((m) => m.id !== user?.id)
            .map((member) => {
              const isOnline = onlineUserIds.includes(member.id);
              const isSelected = activeChannel === member.id;

              return (
                <button
                  key={member.id}
                  onClick={() => setActiveChannel(member.id)}
                  className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'hover:bg-secondary/60 text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-secondary border border-primary/80 text-primary'
                        }`}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
                          isSelected ? 'border-blue-600' : 'border-panel'
                        } ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}
                      />
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs truncate block">{member.name}</span>
                      </div>
                      <span
                        className={`text-[10px] block truncate ${
                          isSelected ? 'text-white/80' : 'text-muted'
                        }`}
                      >
                        {isOnline ? 'Online' : 'Offline'} • {member.role}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>

        {/* E2EE Info Footer */}
        <div className="p-3 border-t border-primary/60 text-center">
          <span className="text-[10px] text-muted font-medium flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            End-to-End Encrypted Workspace
          </span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col justify-between bg-panel/50">
        {/* Chat Header with Direct Audio & Video Call Buttons */}
        <div className="p-4 border-b border-primary/80 flex items-center justify-between bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              {activeChannel === 'group' ? <Users className="w-5 h-5" /> : activeMember?.name.charAt(0)}
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-primary">
                {activeChannel === 'group' ? 'Household Group Lounge' : activeMember?.name}
              </h4>
              <p className="text-[11px] text-muted">
                {activeChannel === 'group'
                  ? `${members.length} Household Members Connected`
                  : onlineUserIds.includes(activeMember?.id || '')
                  ? 'Active now'
                  : 'Away'}
              </p>
            </div>
          </div>

          {/* Quick Call Action Buttons */}
          {activeMember && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onStartCall(activeMember, 'audio')}
                className="p-2.5 rounded-xl bg-secondary/80 hover:bg-emerald-500/15 hover:border-emerald-500/30 text-secondary hover:text-emerald-600 dark:hover:text-emerald-400 border border-primary/80 transition-all shadow-xs active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                title="Start Audio Call (End-to-End Encrypted)"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Audio Call</span>
              </button>

              <button
                onClick={() => onStartCall(activeMember, 'video')}
                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-blue-600/25 active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                title="Start Video Call (End-to-End Encrypted)"
              >
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Video Call</span>
              </button>
            </div>
          )}
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {displayedMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted space-y-2 p-6">
              <div className="w-12 h-12 rounded-2xl bg-secondary border border-primary/80 flex items-center justify-center text-primary">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <h4 className="font-bold text-sm text-primary">No messages in this channel yet</h4>
              <p className="text-xs max-w-xs text-secondary">
                Say hello, share household updates, or start a quick encrypted audio/video call.
              </p>
            </div>
          ) : (
            displayedMessages.map((msg) => {
              const isMe = msg.senderId === user?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <div className="w-7 h-7 rounded-xl bg-secondary border border-primary/80 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                      {msg.senderName.charAt(0)}
                    </div>
                  )}

                  <div className={`space-y-1 max-w-[80%] sm:max-w-[70%]`}>
                    {!isMe && activeChannel === 'group' && (
                      <span className="text-[10px] font-bold text-secondary block pl-1">
                        {msg.senderName}
                      </span>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl text-xs font-medium break-words shadow-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-panel border border-primary/80 text-primary rounded-bl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>

                    <span
                      className={`text-[9px] text-muted block ${
                        isMe ? 'text-right pr-1' : 'text-left pl-1'
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-primary/80 bg-secondary/30 relative">
          {/* Quick Emoji Bar Popup */}
          {showEmojiBar && (
            <div className="absolute bottom-16 left-4 bg-panel border border-primary/80 rounded-2xl p-2 shadow-xl flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleAddEmoji(emoji)}
                  className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center text-base transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiBar(!showEmojiBar)}
              className="p-2.5 rounded-xl text-secondary hover:text-primary hover:bg-secondary/60 transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${
                activeChannel === 'group' ? 'Household Group' : activeMember?.name || 'member'
              }...`}
              className="flex-1 bg-panel border border-primary/80 rounded-2xl px-4 py-2.5 text-xs text-primary placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FamilyChat;
