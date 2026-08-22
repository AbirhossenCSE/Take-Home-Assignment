import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSendMessage: (text: string, ephemeralDuration?: number) => void;
  disabled?: boolean;
}

const TIMER_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '1 min', value: 60 },
  { label: '5 min', value: 300 },
];

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [ephemeralDuration, setEphemeralDuration] = useState<number>(0);
  const [isTimerMenuOpen, setIsTimerMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed, ephemeralDuration > 0 ? ephemeralDuration : undefined);
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Close timer menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsTimerMenuOpen(false);
      }
    };
    if (isTimerMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTimerMenuOpen]);

  const isSendDisabled = disabled || !text.trim();
  const activeOption = TIMER_OPTIONS.find((opt) => opt.value === ephemeralDuration) || TIMER_OPTIONS[0];

  return (
    <div className="p-3 sm:p-4 bg-[#070A12] border-t border-slate-800/80">
      <div className="flex items-end gap-2 bg-slate-900/80 rounded-2xl p-2 border border-slate-800 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/40 backdrop-blur-md transition-all">
        {/* Timer Selector Popover */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsTimerMenuOpen((prev) => !prev)}
            disabled={disabled}
            aria-label="Self-destruct timer settings"
            title={
              ephemeralDuration > 0
                ? `Self-destruct after ${activeOption.label}`
                : 'Set self-destruct timer'
            }
            className={`p-2 rounded-xl transition-all flex items-center gap-1 font-mono font-medium text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
              ephemeralDuration > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 ${ephemeralDuration > 0 ? 'text-amber-400 animate-pulse' : ''}`}
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
            {ephemeralDuration > 0 && <span>{activeOption.label}</span>}
          </button>

          {isTimerMenuOpen && (
            <div className="absolute bottom-12 left-0 mb-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-30 animate-scale-in backdrop-blur-xl">
              <div className="px-2 py-1 text-[10px] font-mono font-semibold text-cyan-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                SELF-DESTRUCT TIMER
              </div>
              {TIMER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setEphemeralDuration(option.value);
                    setIsTimerMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-mono rounded-lg flex items-center justify-between transition ${
                    ephemeralDuration === option.value
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <span>{option.label}</span>
                  {ephemeralDuration === option.value && (
                    <span className="text-amber-400 text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Input */}
        <textarea
          id="chat-message-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            ephemeralDuration > 0
              ? `Self-destruct message (${activeOption.label})...`
              : 'Type a message...'
          }
          disabled={disabled}
          aria-label="Message text"
          rows={1}
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none max-h-32 min-h-[40px] py-2 px-3 leading-relaxed"
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={isSendDisabled}
          aria-label="Send message"
          className={`p-2.5 rounded-xl transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
            isSendDisabled
              ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-slate-800/50'
              : ephemeralDuration > 0
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] text-slate-950 font-bold active:scale-95'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] text-white font-bold active:scale-95'
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
