import React, { useState, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isSendDisabled = disabled || !text.trim();

  return (
    <div className="p-3 sm:p-4 bg-gray-900 border-t border-gray-800">
      <div className="flex items-end gap-2 bg-gray-800/80 rounded-2xl p-2 border border-gray-700/60 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none resize-none max-h-32 min-h-[40px] py-2 px-3 leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={isSendDisabled}
          className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
            isSendDisabled
              ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95'
          }`}
          title="Send Message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 transform rotate-90"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    </div>
  );
};
