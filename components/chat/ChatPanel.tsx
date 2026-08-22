import React, { useEffect, useState, useCallback } from 'react';
import { Conversation, Message, User } from '@/types';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatPanelProps {
  activeConversation: Conversation;
  currentUser: User | null;
  onOpenGroupInfo?: () => void;
  onConversationUpdated?: (updated: Conversation) => void;
  onMessageNew?: (message: Message) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  activeConversation,
  currentUser,
  onOpenGroupInfo,
  onConversationUpdated,
  onMessageNew,
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
      // Check if real message was already added (e.g., via socket event)
      const existsIndex = prev.findIndex((m) => m._id === realMsg._id);
      if (existsIndex !== -1) {
        return prev.filter((m) => m._id !== tempId);
      }
      // Replace optimistic message with real message
      return prev.map((m) => (m._id === tempId ? realMsg : m));
    });
  }, []);

  // Handle incoming real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: Message) => {
      // Notify parent for sidebar updates
      if (onMessageNew) {
        onMessageNew(newMsg);
      }

      // If message is for current conversation
      if (newMsg.conversationId === activeConversation._id) {
        setMessages((prev) => {
          // Prevent duplicates if already present
          if (prev.some((m) => m._id === newMsg._id)) {
            return prev;
          }

          // Check if there is a pending optimistic message matching text and sender
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
  const handleSendMessage = async (text: string) => {
    if (!activeConversation || !currentUser) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const optimisticMessage: Message = {
      _id: tempId,
      conversationId: activeConversation._id,
      senderId: currentUser._id,
      sender: currentUser,
      text,
      createdAt: new Date().toISOString(),
    };

    // Optimistically update UI
    setMessages((prev) => [...prev, optimisticMessage]);

    // Also update parent sidebar preview optimistically
    if (onMessageNew) {
      onMessageNew(optimisticMessage);
    }

    // Attempt Socket.io send if connected
    if (socket && socket.connected) {
      socket.emit(
        'message:send',
        { conversationId: activeConversation._id, text },
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
            reconcileMessage(tempId, realMsg);
            if (onMessageNew) onMessageNew(realMsg);
          }
        }
      );
    } else {
      // REST API fallback if socket is disconnected
      try {
        const realMsg = await api.sendMessage({
          conversationId: activeConversation._id,
          text,
        });
        reconcileMessage(tempId, realMsg);
        if (onMessageNew) onMessageNew(realMsg);
      } catch (err: unknown) {
        console.error('Failed to send message via REST fallback:', err);
      }
    }
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name || 'Unnamed Group';
    if (!currentUser) return 'Unknown';
    if (conv.type === 'direct' && conv.participant) {
      return conv.participant.name;
    }
    const otherUser = conv.participants?.find((p) => p._id !== currentUser._id);
    return otherUser ? otherUser.name : 'Unknown User';
  };

  const conversationName = getConversationName(activeConversation);
  const isGroup = activeConversation.type === 'group';

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-900 overflow-hidden relative">
      {/* Reconnecting / Offline Banner */}
      {!isConnected && (
        <div className="bg-amber-600/90 text-white text-xs px-4 py-1.5 text-center flex items-center justify-center gap-2 font-medium z-10 transition-all">
          <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{isReconnecting ? 'Reconnecting to server...' : 'Connection offline — messages will send via fallback.'}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
            {conversationName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-lg text-white truncate max-w-[200px] sm:max-w-md">
              {conversationName}
            </h2>
            {isGroup && (
              <p className="text-xs text-gray-400">
                {activeConversation.participants?.length || 0} members
              </p>
            )}
          </div>
        </div>

        {isGroup && onOpenGroupInfo && (
          <button
            onClick={onOpenGroupInfo}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition"
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
      />

      {/* Message Input */}
      <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};
