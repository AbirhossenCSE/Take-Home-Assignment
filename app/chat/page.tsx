"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useChatStore } from '@/store';
import { api } from '@/lib/api';
import { Conversation, User } from '@/types';
import { NewChatModal } from '@/components/NewChatModal';
import { GroupInfoModal } from '@/components/GroupInfoModal';

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
      // Ensure conversations is an array
      if (Array.isArray(data)) {
        setConversations(data);
      } else {
        setConversations([]);
        console.error("API returned non-array for conversations", data);
      }
    } catch (err) {
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
      if (prev.find(c => c._id === newConv._id)) return prev;
      return [newConv, ...prev];
    });
    setActiveConversation(newConv);
  };

  const handleConversationUpdated = (updatedConv: Conversation) => {
    setConversations((prev) => {
      if (!Array.isArray(prev)) return [updatedConv];
      return prev.map(c => c._id === updatedConv._id ? updatedConv : c);
    });
    if (activeConversation?._id === updatedConv._id) {
      setActiveConversation(updatedConv);
    }
  };

  const handleLeaveGroup = () => {
    setConversations((prev) => {
      if (!Array.isArray(prev)) return [];
      return prev.filter(c => c._id !== activeConversation?._id);
    });
    setActiveConversation(null);
    setIsGroupInfoOpen(false);
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name || 'Unnamed Group';
    if (!currentUser) return 'Unknown';
    // For direct chat, backend provides it in `participant`
    if (conv.type === 'direct' && conv.participant) {
      return conv.participant.name;
    }
    // Fallback if participants array is used
    const otherUser = conv.participants?.find((p) => p._id !== currentUser._id);
    return otherUser ? otherUser.name : 'Unknown User';
  };

  if (!isMounted || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  // Double check `conversations` is an array during render in case state got corrupted
  const safeConversations = Array.isArray(conversations) ? conversations : [];

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* LEFT SIDEBAR */}
      <div className="w-80 flex flex-col border-r border-gray-800 bg-gray-900/95">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
              {currentUser?.name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="font-bold text-lg truncate">{currentUser?.name}</h2>
          </div>
          <button 
            onClick={() => setIsNewChatOpen(true)}
            className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition"
            title="New Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-4 text-center">
              <p className="text-red-400 text-sm mb-3">{error}</p>
              <button 
                onClick={fetchConversations}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && safeConversations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>No conversations yet.</p>
              <p className="text-sm mt-2">Search for someone to start chatting!</p>
            </div>
          )}

          {!isLoading && !error && safeConversations.map((conv) => {
            const isActive = activeConversation?._id === conv._id;
            const name = getConversationName(conv);
            
            return (
              <button
                key={conv._id}
                onClick={() => setActiveConversation(conv)}
                className={`w-full text-left p-4 border-b border-gray-800/50 hover:bg-gray-800 transition flex items-center ${isActive ? 'bg-gray-800' : ''}`}
              >
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center font-bold flex-shrink-0">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4 flex-1 overflow-hidden">
                  <h3 className="font-semibold text-white truncate">{name}</h3>
                  <p className="text-sm text-gray-400 truncate mt-1">
                    {(conv.lastMessage as any)?.text || 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col bg-gray-900 relative">
        {activeConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold">
                  {getConversationName(activeConversation).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{getConversationName(activeConversation)}</h2>
                  {activeConversation.type === 'group' && (
                    <p className="text-xs text-gray-400">{activeConversation.participants?.length || 0} members</p>
                  )}
                </div>
              </div>
              {activeConversation.type === 'group' && (
                <button 
                  onClick={() => setIsGroupInfoOpen(true)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition"
                  title="Group Info"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Messages Placeholder */}
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Messages will appear here...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Your Messages</h2>
            <p>Select a chat or start a new conversation</p>
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
