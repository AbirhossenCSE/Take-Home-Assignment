import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Message, User } from '@/types';

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  isGroup: boolean;
  participants?: User[];
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isCurrentUser,
  isGroup,
  participants,
}) => {
  // Format timestamp (e.g., "2:45 PM")
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return format(date, 'h:mm a');
    } catch {
      return '';
    }
  };

  // Determine sender name for received messages in group chats
  const getSenderName = () => {
    if (!isGroup || isCurrentUser) return null;

    if (typeof message.sender === 'object' && message.sender?.name) {
      return message.sender.name;
    }

    const senderId = message.senderId || (typeof message.sender === 'string' ? message.sender : null);
    if (senderId && participants) {
      const found = participants.find((p) => p._id === senderId);
      if (found) return found.name;
    }

    return 'Member';
  };

  const senderName = getSenderName();
  const isOptimistic = message._id.startsWith('temp-');

  return (
    <div
      className={`flex flex-col my-1 select-text ${
        isCurrentUser ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className={`max-w-[75%] sm:max-w-[65%] px-4 py-2.5 rounded-2xl transition-all ${
          isCurrentUser
            ? 'bg-blue-600 text-white rounded-br-xs shadow-md'
            : 'bg-gray-800 text-gray-100 rounded-bl-xs border border-gray-700/50 shadow-sm'
        } ${isOptimistic ? 'opacity-70' : 'opacity-100'}`}
      >
        {/* Group Sender Name */}
        {!isCurrentUser && isGroup && senderName && (
          <p className="text-xs font-semibold text-blue-400 mb-1">
            {senderName}
          </p>
        )}

        {/* Message Text */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.text}
        </p>

        {/* Footer: Time + Sending Status */}
        <div
          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
            isCurrentUser ? 'text-blue-200' : 'text-gray-400'
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isCurrentUser && isOptimistic && (
            <svg
              className="w-3 h-3 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export function getDateLabel(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  } catch {
    return '';
  }
}
