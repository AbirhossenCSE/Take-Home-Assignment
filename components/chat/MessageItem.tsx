import React, { useState, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Message, User } from '@/types';
import { getSafeName } from '@/lib/utils';

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  isGroup: boolean;
  participants?: User[];
  onExpire?: (messageId: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isCurrentUser,
  isGroup,
  participants,
  onExpire,
}) => {
  // Calculate remaining seconds for self-destructing messages
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() => {
    if (message.expiresAt) {
      const expTime = new Date(message.expiresAt).getTime();
      return Math.max(0, Math.ceil((expTime - Date.now()) / 1000));
    }
    if (message.ephemeralDuration && message.ephemeralDuration > 0) {
      const createTime = new Date(message.createdAt).getTime();
      const expTime = createTime + message.ephemeralDuration * 1000;
      return Math.max(0, Math.ceil((expTime - Date.now()) / 1000));
    }
    return null;
  });

  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (secondsLeft === null) return;

    if (secondsLeft <= 0) {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        if (onExpire) onExpire(message._id);
      }, 300);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, message._id, onExpire]);

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

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Determine sender name for received messages in group chats
  const getSenderName = () => {
    if (!isGroup || isCurrentUser) return null;

    if (typeof message.sender === 'object' && message.sender) {
      if (message.sender.name?.trim()) return message.sender.name.trim();
      if (message.sender.phone?.trim()) return message.sender.phone.trim();
    }

    const senderId =
      message.senderId ||
      (typeof message.sender === 'string' ? message.sender : null);

    if (senderId && participants) {
      const found = participants.find((p) => p && p._id === senderId);
      if (found) {
        return getSafeName(found.name, found.phone || 'Member');
      }
    }

    return 'Member';
  };

  const senderName = getSenderName();
  const isOptimistic = message._id.startsWith('temp-');

  return (
    <div
      className={`flex flex-col my-1.5 select-text transition-all duration-300 ${
        isFadingOut ? 'opacity-0 scale-95 -translate-y-2' : 'animate-fade-in'
      } ${isCurrentUser ? 'items-end' : 'items-start'}`}
    >
      <div
        className={`max-w-[78%] sm:max-w-[65%] px-4 py-3 rounded-2xl transition-all ${
          isCurrentUser
            ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 text-white rounded-br-xs shadow-[0_0_20px_rgba(6,182,212,0.25)] border border-cyan-400/30'
            : 'bg-slate-900/80 backdrop-blur-md text-slate-100 rounded-bl-xs border border-slate-800 shadow-md'
        } ${isOptimistic ? 'opacity-70' : 'opacity-100'}`}
      >
        {/* Group Sender Name */}
        {!isCurrentUser && isGroup && senderName && (
          <p className="text-xs font-semibold text-cyan-400 mb-1 font-mono">
            {senderName}
          </p>
        )}

        {/* Message Text */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.text}
        </p>

        {/* Footer: Time + Self-destruct Countdown + Sending Status */}
        <div
          className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] ${
            isCurrentUser ? 'text-cyan-200 font-medium' : 'text-slate-400 font-medium'
          }`}
        >
          {secondsLeft !== null && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              title="Self-destruct countdown"
            >
              <svg
                className="w-2.5 h-2.5 text-amber-400 animate-spin"
                style={{ animationDuration: '3s' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formatCountdown(secondsLeft)}</span>
            </span>
          )}
          <span>{formatTime(message.createdAt)}</span>
          {isCurrentUser && isOptimistic && (
            <svg
              className="w-3 h-3 animate-spin text-cyan-200"
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
