import React, { useEffect, useState, useCallback } from 'react';
import { Conversation, Message, User } from '@/types';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { getConversationName, getInitial } from '@/lib/utils';

interface ChatPanelProps {
  activeConversation: Conversation;
  currentUser: User | null;
  onOpenGroupInfo?: () => void;
  onConversationUpdated?: (updated: Conversation) => void;
  onMessageNew?: (message: Message) => void;
  onBack?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  activeConversation,
  currentUser,
  onOpenGroupInfo,
  onConversationUpdated,
  onMessageNew,
  onBack,
}) => {
  const { socket, isConnected, isReconnecting } = useSocket();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Fetch message history for selected conversation
  const fetchMessages = useCallback(async () => {
    if (!activeConversation?._id) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await api.getMessages(activeConversation._id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error('Error fetching messages:', err);
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(errorMsg || 'Failed to load messages.');
    } finally {
      setIsLoading(false);
    }
  }, [activeConversation?._id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Helper to reconcile optimistic temp message with real message from server
  const reconcileMessage = useCallback((tempId: string, realMsg: Message) => {
    setMessages((prev) => {
      const existsIndex = prev.findIndex((m) => m._id === realMsg._id);
      if (existsIndex !== -1) {
        return prev.filter((m) => m._id !== tempId);
      }
      return prev.map((m) => (m._id === tempId ? realMsg : m));
    });
  }, []);

  // Handle incoming real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: Message) => {
      if (onMessageNew) {
        onMessageNew(newMsg);
      }

      if (newMsg.conversationId === activeConversation._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) {
            return prev;
          }

          const pendingOptIndex = prev.findIndex(
            (m) =>
              m._id.startsWith('temp-') &&
              m.text === newMsg.text &&
              (m.senderId === newMsg.senderId ||
                (typeof newMsg.sender === 'object' &&
                  newMsg.sender?._id === currentUser?._id))
          );

          if (pendingOptIndex !== -1) {
            const updated = [...prev];
            updated[pendingOptIndex] = newMsg;
            return updated;
          }

          return [...prev, newMsg];
        });
      }
    };

    const handleConvUpdated = (updatedConv: Conversation) => {
      if (onConversationUpdated) {
        onConversationUpdated(updatedConv);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('conversation:updated', handleConvUpdated);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('conversation:updated', handleConvUpdated);
    };
  }, [socket, activeConversation._id, currentUser?._id, onMessageNew, onConversationUpdated]);

  // Send message handler (socket with REST fallback + optimistic UI)
  const handleSendMessage = async (text: string, ephemeralDuration?: number) => {
    if (!activeConversation || !currentUser) return;

    const createdAt = new Date().toISOString();
    const expiresAt = ephemeralDuration
      ? new Date(Date.now() + ephemeralDuration * 1000).toISOString()
      : undefined;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const optimisticMessage: Message = {
      _id: tempId,
      conversationId: activeConversation._id,
      senderId: currentUser._id,
      sender: currentUser,
      text,
      createdAt,
      ephemeralDuration,
      expiresAt,
    };

    // Optimistically update UI
    setMessages((prev) => [...prev, optimisticMessage]);

    if (onMessageNew) {
      onMessageNew(optimisticMessage);
    }

    const payload = {
      conversationId: activeConversation._id,
      text,
      ephemeralDuration,
      expiresAt,
    };

    if (socket && socket.connected) {
      socket.emit(
        'message:send',
        payload,
        (response: Message | { data?: Message; message?: Message } | null) => {
          let realMsg: Message | null = null;
          if (response && '_id' in response && response._id) {
            realMsg = response as Message;
          } else if (response && 'data' in response && response.data && response.data._id) {
            realMsg = response.data;
          } else if (response && 'message' in response && response.message && response.message._id) {
            realMsg = response.message;
          }

          if (realMsg) {
            const mergedRealMsg: Message = {
              ...realMsg,
              ephemeralDuration: realMsg.ephemeralDuration || ephemeralDuration,
              expiresAt: realMsg.expiresAt || expiresAt,
            };
            reconcileMessage(tempId, mergedRealMsg);
            if (onMessageNew) onMessageNew(mergedRealMsg);
          }
        }
      );
    } else {
      try {
        const realMsg = await api.sendMessage(payload);
        const mergedRealMsg: Message = {
          ...realMsg,
          ephemeralDuration: realMsg.ephemeralDuration || ephemeralDuration,
          expiresAt: realMsg.expiresAt || expiresAt,
        };
        reconcileMessage(tempId, mergedRealMsg);
        if (onMessageNew) onMessageNew(mergedRealMsg);
      } catch (err: unknown) {
        console.error('Failed to send message via REST fallback:', err);
      }
    }
  };

  const handleExpireMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
  }, []);

  const conversationName = getConversationName(activeConversation, currentUser);
  const isGroup = activeConversation.type === 'group';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070A12] overflow-hidden relative">
      {/* Reconnecting / Offline Banner */}
      {!isConnected && (
        <div className="bg-amber-500/20 text-amber-300 border-b border-amber-500/40 text-xs px-4 py-2 text-center flex items-center justify-center gap-2 font-mono font-medium z-20 backdrop-blur-md animate-fade-in">
          <svg className="animate-spin h-3.5 w-3.5 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{isReconnecting ? 'RECONNECTING SOCKET...' : 'OFFLINE MODE — REST FALLBACK ACTIVE'}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#070A12]/80 backdrop-blur-xl z-10 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back to conversation list"
              className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              title="Back to conversations"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400/30 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            {getInitial(conversationName)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base sm:text-lg text-white truncate max-w-[180px] sm:max-w-md">
                {conversationName}
              </h2>
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
                }`}
                title={isConnected ? 'Socket Connected' : 'Connecting Socket...'}
              />
            </div>
            {isGroup && (
              <p className="text-xs font-mono text-cyan-400">
                {activeConversation.participants?.length || 0} MEMBERS
              </p>
            )}
          </div>
        </div>

        {isGroup && onOpenGroupInfo && (
          <button
            onClick={onOpenGroupInfo}
            aria-label="Group Information"
            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 border border-transparent hover:border-slate-700/60"
            title="Group Info"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Message List */}
      <MessageList
        messages={messages}
        currentUser={currentUser}
        isGroup={isGroup}
        participants={activeConversation.participants}
        isLoading={isLoading}
        error={error}
        onRetry={fetchMessages}
        conversationId={activeConversation._id}
        onExpireMessage={handleExpireMessage}
      />

      {/* Message Input */}
      <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};
