"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useChatStore } from '@/store';
import { api } from '@/lib/api';
import { Conversation, Message } from '@/types';
import { NewChatModal } from '@/components/NewChatModal';
import { GroupInfoModal } from '@/components/GroupInfoModal';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { getConversationName, getInitial, getSafeName } from '@/lib/utils';

export default function ChatPage() {
  const router = useRouter();
  const { token, currentUser, logout } = useAuthStore();
  const { activeConversation, setActiveConversation } = useChatStore();

  const [isMounted, setIsMounted] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !token) {
      router.push('/login');
    }
  }, [token, isMounted, router]);

  const fetchConversations = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.getConversations();
      if (Array.isArray(data)) {
        setConversations(data);
      } else {
        setConversations([]);
        console.error('API returned non-array for conversations', data);
      }
    } catch {
      setError('Failed to load conversations.');
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted && token) {
      fetchConversations();
    }
  }, [isMounted, token]);

  const handleConversationCreated = (newConv: Conversation) => {
    setConversations((prev) => {
      if (!Array.isArray(prev)) return [newConv];
      if (prev.find((c) => c._id === newConv._id)) return prev;
      return [newConv, ...prev];
    });
    setActiveConversation(newConv);
  };

  const handleConversationUpdated = useCallback(
    (updatedConv: Conversation) => {
      setConversations((prev) => {
        if (!Array.isArray(prev)) return [updatedConv];
        return prev.map((c) => (c._id === updatedConv._id ? updatedConv : c));
      });
      if (activeConversation?._id === updatedConv._id) {
        setActiveConversation(updatedConv);
      }
    },
    [activeConversation?._id, setActiveConversation]
  );

  const handleNewMessage = useCallback((msg: Message) => {
    setConversations((prev) => {
      if (!Array.isArray(prev)) return prev;
      const index = prev.findIndex((c) => c._id === msg.conversationId);
      if (index === -1) return prev;

      const targetConv = {
        ...prev[index],
        lastMessage: { text: msg.text, createdAt: msg.createdAt },
        updatedAt: msg.createdAt,
      };

      const remaining = prev.filter((_, i) => i !== index);
      return [targetConv, ...remaining];
    });
  }, []);

  const handleLeaveGroup = () => {
    setConversations((prev) => {
      if (!Array.isArray(prev)) return [];
      return prev.filter((c) => c._id !== activeConversation?._id);
    });
    setActiveConversation(null);
    setIsGroupInfoOpen(false);
  };

  const formatConvName = (conv: Conversation) => {
    const derivedName = getConversationName(conv, currentUser);
    if (derivedName === 'Unknown User') {
      console.warn('Conversation missing display name details:', conv);
    }
    return derivedName;
  };

  if (!isMounted || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070A12]">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-cyan-400"
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
          <span className="text-xs font-mono text-cyan-400 tracking-wider">LOADING CYBERCHAT...</span>
        </div>
      </div>
    );
  }

  const safeConversations = Array.isArray(conversations) ? conversations : [];

  return (
    <div className="flex h-screen bg-[#070A12] text-slate-100 overflow-hidden relative selection:bg-cyan-500 selection:text-slate-950">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      {/* LEFT SIDEBAR */}
      <div
        className={`w-full md:w-80 flex flex-col border-r border-slate-800/80 bg-[#070A12]/90 backdrop-blur-xl flex-shrink-0 z-10 ${
          activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* User Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400/30 text-white flex items-center justify-center font-bold shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              {getInitial(currentUser?.name)}
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-white truncate max-w-[140px]">
                {getSafeName(currentUser?.name)}
              </h2>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsNewChatOpen(true)}
            aria-label="New Chat"
            className="p-2 rounded-xl hover:bg-slate-800/80 text-slate-400 hover:text-cyan-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 border border-transparent hover:border-slate-700/60"
            title="New Chat"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="p-4 space-y-3 animate-pulse">
              <div className="h-16 bg-slate-900/60 rounded-xl border border-slate-800/60"></div>
              <div className="h-16 bg-slate-900/60 rounded-xl border border-slate-800/60"></div>
              <div className="h-16 bg-slate-900/60 rounded-xl border border-slate-800/60"></div>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-6 text-center">
              <p className="text-rose-400 text-xs font-mono mb-3">{error}</p>
              <button
                onClick={fetchConversations}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-mono transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                RETRY FETCH
              </button>
            </div>
          )}

          {!isLoading && !error && safeConversations.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-cyan-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-300">No conversations yet.</p>
              <p className="text-xs text-slate-500 mt-1">Start a new chat to begin messaging.</p>
            </div>
          )}

          {!isLoading &&
            !error &&
            safeConversations.map((conv) => {
              const isActive = activeConversation?._id === conv._id;
              const name = formatConvName(conv);

              return (
                <button
                  key={conv._id}
                  onClick={() => setActiveConversation(conv)}
                  className={`w-full text-left p-4 border-b border-slate-800/40 transition-all flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                    isActive
                      ? 'border-l-4 border-l-cyan-400 bg-cyan-950/30 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                      : 'hover:bg-slate-800/50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm flex-shrink-0 transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400/40 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900 border border-slate-800 text-cyan-400'
                    }`}
                  >
                    {getInitial(name)}
                  </div>
                  <div className="ml-3 flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                        {name}
                      </h3>
                      {conv.type === 'group' && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                          GROUP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-1">
                      {(conv.lastMessage as { text?: string })?.text || 'No messages yet'}
                    </p>
                  </div>
                </button>
              );
            })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 backdrop-blur-md">
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full py-2.5 px-4 text-xs font-mono text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/40 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>LOG OUT SESSION</span>
          </button>
        </div>
      </div>

      {/* RIGHT CHAT PANEL */}
      <div
        className={`flex-1 flex flex-col bg-[#070A12] relative ${
          activeConversation ? 'flex' : 'hidden md:flex'
        }`}
      >
        {activeConversation ? (
          <ChatPanel
            activeConversation={activeConversation}
            currentUser={currentUser}
            onOpenGroupInfo={() => setIsGroupInfoOpen(true)}
            onConversationUpdated={handleConversationUpdated}
            onMessageNew={handleNewMessage}
            onBack={() => setActiveConversation(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 relative p-6">
            <div className="w-20 h-20 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-center mb-4 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-cyan-400"
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
            <h2 className="text-2xl font-bold text-white font-mono tracking-tight mb-2">CYBERCHAT APPARATUS</h2>
            <p className="text-slate-400 text-sm max-w-sm text-center">
              Select a conversation from the sidebar or start a new direct/group chat to begin instant messaging.
            </p>
          </div>
        )}
      </div>

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onConversationCreated={handleConversationCreated}
      />

      {activeConversation && activeConversation.type === 'group' && (
        <GroupInfoModal
          conversation={activeConversation}
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          onConversationUpdated={handleConversationUpdated}
          onLeave={handleLeaveGroup}
        />
      )}
    </div>
  );
}
