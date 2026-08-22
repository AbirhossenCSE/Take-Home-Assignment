"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { User, Conversation } from '@/types';
import { useDebounce } from '@/lib/hooks';
import { getInitial, getSafeName } from '@/lib/utils';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

export function NewChatModal({ isOpen, onClose, onConversationCreated }: NewChatModalProps) {
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const debouncedQuery = useDebounce(query, 300);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode('direct');
      setQuery('');
      setResults([]);
      setSelectedUsers([]);
      setGroupName('');
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
      } catch {
        setError('Failed to search users. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }

    searchUsers();
  }, [debouncedQuery]);

  const handleSelectUser = async (user: User) => {
    if (mode === 'direct') {
      setIsCreating(true);
      setError('');
      try {
        const conversation = await api.startConversation({ userId: user._id });
        onConversationCreated(conversation);
        onClose();
      } catch {
        setError('Failed to start conversation.');
      } finally {
        setIsCreating(false);
      }
    } else {
      // Group mode: toggle selection
      if (!selectedUsers.find((u) => u._id === user._id)) {
        setSelectedUsers([...selectedUsers, user]);
      }
      setQuery(''); // clear query after selection to easily see selections
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== userId));
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length < 2) {
      setError('Please select at least 2 members for the group.');
      return;
    }
    if (!groupName.trim()) {
      setError('Group name is required.');
      return;
    }

    setIsCreating(true);
    setError('');
    try {
      const conversation = await api.createGroup({
        name: groupName.trim(),
        memberIds: selectedUsers.map((u) => u._id),
      });
      onConversationCreated(conversation);
      onClose();
    } catch {
      setError('Failed to create group.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-700 flex flex-col max-h-[80vh] animate-scale-in">
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

        {/* Mode Toggle */}
        <div className="flex p-4 border-b border-gray-700 bg-gray-900/50">
          <div className="flex bg-gray-800 p-1 rounded-lg w-full">
            <button
              onClick={() => {
                setMode('direct');
                setSelectedUsers([]);
                setGroupName('');
                setError('');
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === 'direct' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Direct Message
            </button>
            <button
              onClick={() => {
                setMode('group');
                setError('');
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === 'group' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Group Chat
            </button>
          </div>
        </div>

        {/* Group Info Input */}
        {mode === 'group' && (
          <div className="p-4 border-b border-gray-700">
            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div key={user._id} className="flex items-center bg-gray-700 px-3 py-1 rounded-full text-sm text-gray-200">
                    <span>{user.name}</span>
                    <button
                      onClick={() => handleRemoveUser(user._id)}
                      className="ml-2 text-gray-400 hover:text-red-400 focus:outline-none"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
            {results.map((user) => {
              const isSelected = selectedUsers.some(u => u._id === user._id);
              if (mode === 'group' && isSelected) return null; // hide already selected users from results

              return (
                <button
                  key={user._id}
                  disabled={isCreating}
                  onClick={() => handleSelectUser(user)}
                  className="w-full flex items-center p-3 hover:bg-gray-700 rounded-lg transition disabled:opacity-50 text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {getInitial(user.name || user.phone)}
                  </div>
                  <div className="ml-3 flex-1 overflow-hidden">
                    <p className="text-white font-medium truncate">{getSafeName(user.name, user.phone)}</p>
                    <p className="text-gray-400 text-sm truncate">{user.phone}</p>
                  </div>
                  {mode === 'group' && (
                    <div className="ml-3 text-blue-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {mode === 'group' && (
          <div className="p-4 border-t border-gray-700 bg-gray-900/50">
            <button
              onClick={handleCreateGroup}
              disabled={isCreating || selectedUsers.length < 2 || !groupName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex justify-center items-center"
            >
              {isCreating ? 'Creating Group...' : `Create Group (${selectedUsers.length + 1})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
