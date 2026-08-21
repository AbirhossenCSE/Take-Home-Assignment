"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { User, Conversation } from '@/types';
import { useDebounce } from '@/lib/hooks';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

export function NewChatModal({ isOpen, onClose, onConversationCreated }: NewChatModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    async function searchUsers() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      setError('');
      try {
        const users = await api.searchUsers(debouncedQuery.trim());
        setResults(users);
      } catch (err) {
        setError('Failed to search users. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }

    searchUsers();
  }, [debouncedQuery]);

  const handleStartChat = async (user: User) => {
    setIsCreating(true);
    setError('');
    try {
      const conversation = await api.startConversation({ userId: user.id });
      onConversationCreated(conversation);
      onClose();
    } catch (err) {
      setError('Failed to start conversation.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-700 flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">New Chat</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-gray-700 bg-gray-900/50">
          <input
            type="text"
            placeholder="Search users by name or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-[200px]">
          {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
          
          {isSearching && (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}

          {!isSearching && query.trim() && results.length === 0 && !error && (
            <p className="text-gray-400 text-center py-8">No users found.</p>
          )}

          {!isSearching && !query.trim() && results.length === 0 && !error && (
            <p className="text-gray-500 text-center py-8 text-sm">Type a name or phone number to search.</p>
          )}

          <div className="space-y-2">
            {results.map((user) => (
              <button
                key={user.id}
                disabled={isCreating}
                onClick={() => handleStartChat(user)}
                className="w-full flex items-center p-3 hover:bg-gray-700 rounded-lg transition disabled:opacity-50 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 flex-1 overflow-hidden">
                  <p className="text-white font-medium truncate">{user.name}</p>
                  <p className="text-gray-400 text-sm truncate">{user.phone}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
