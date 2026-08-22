import React, { useRef, useEffect, useState } from 'react';
import { Message, User } from '@/types';
import { MessageItem, getDateLabel } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
  isGroup: boolean;
  participants?: User[];
  isLoading: boolean;
  error: string;
  onRetry: () => void;
  conversationId: string;
  onExpireMessage?: (messageId: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  isGroup,
  participants,
  isLoading,
  error,
  onRetry,
  conversationId,
  onExpireMessage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  
  const prevConvIdRef = useRef<string>(conversationId);
  const prevMessagesCountRef = useRef<number>(messages.length);

  const scrollToBottom = (smooth = true) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
      setShowScrollBottom(false);
      setHasNewMessage(false);
    }
  };

  const checkIfNearBottom = () => {
    if (!containerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    return distanceToBottom < 150;
  };

  const handleScroll = () => {
    const isNearBottom = checkIfNearBottom();
    if (isNearBottom) {
      setShowScrollBottom(false);
      setHasNewMessage(false);
    } else {
      setShowScrollBottom(true);
    }
  };

  // Scroll logic when conversation changes or messages update
  useEffect(() => {
    const convChanged = prevConvIdRef.current !== conversationId;
    const newMsgAdded = messages.length > prevMessagesCountRef.current;

    if (convChanged) {
      prevConvIdRef.current = conversationId;
      prevMessagesCountRef.current = messages.length;
      // Scroll to bottom immediately on chat change
      setTimeout(() => scrollToBottom(false), 50);
      return;
    }

    if (newMsgAdded) {
      const lastMessage = messages[messages.length - 1];
      const isMyMessage =
        lastMessage &&
        (lastMessage.senderId === currentUser?._id ||
          (typeof lastMessage.sender === 'object' &&
            lastMessage.sender?._id === currentUser?._id) ||
          lastMessage._id.startsWith('temp-'));

      const isNearBottom = checkIfNearBottom();

      if (isMyMessage || isNearBottom) {
        scrollToBottom(true);
      } else {
        setShowScrollBottom(true);
        setHasNewMessage(true);
      }
    }

    prevMessagesCountRef.current = messages.length;
  }, [messages, conversationId, currentUser?._id]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-y-auto animate-pulse">
        <div className="flex justify-start">
          <div className="w-48 h-12 bg-gray-800 rounded-2xl rounded-bl-none"></div>
        </div>
        <div className="flex justify-end">
          <div className="w-56 h-10 bg-blue-950/60 rounded-2xl rounded-br-none"></div>
        </div>
        <div className="flex justify-start">
          <div className="w-64 h-16 bg-gray-800 rounded-2xl rounded-bl-none"></div>
        </div>
        <div className="flex justify-end">
          <div className="w-40 h-10 bg-blue-950/60 rounded-2xl rounded-br-none"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-900/30 text-red-400 flex items-center justify-center mb-3">
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-gray-300 font-medium mb-1">Failed to load messages</p>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500">
        <div className="w-16 h-16 rounded-full bg-gray-800/60 flex items-center justify-center mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <p className="font-semibold text-gray-300">No messages yet — say hi!</p>
        <p className="text-xs text-gray-500 mt-1">Start the conversation below.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth"
      >
        {messages.map((message, index) => {
          const isCurrentUser =
            message.senderId === currentUser?._id ||
            (typeof message.sender === 'object' &&
              message.sender?._id === currentUser?._id) ||
            message._id.startsWith('temp-');

          const currentDateLabel = getDateLabel(message.createdAt);
          const prevDateLabel =
            index > 0 ? getDateLabel(messages[index - 1].createdAt) : null;
          const showDateHeader = currentDateLabel && currentDateLabel !== prevDateLabel;

          return (
            <React.Fragment key={message._id}>
              {showDateHeader && (
                <div className="flex items-center justify-center my-4">
                  <div className="bg-gray-800/80 backdrop-blur text-gray-400 text-xs px-3 py-1 rounded-full border border-gray-700/50 shadow-sm font-medium">
                    {currentDateLabel}
                  </div>
                </div>
              )}
              <MessageItem
                message={message}
                isCurrentUser={isCurrentUser}
                isGroup={isGroup}
                participants={participants}
                onExpire={onExpireMessage}
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* Floating Scroll to Bottom / New Message Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className={`absolute bottom-4 right-6 px-4 py-2 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 ${
            hasNewMessage
              ? 'bg-blue-600 hover:bg-blue-500 text-white animate-bounce'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
          }`}
        >
          <span>{hasNewMessage ? 'New message' : 'Scroll to bottom'}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
