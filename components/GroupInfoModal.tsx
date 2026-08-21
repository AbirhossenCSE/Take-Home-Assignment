"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Conversation, User } from '@/types';
import { useAuthStore } from '@/store';
import { useDebounce } from '@/lib/hooks';

interface GroupInfoModalProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
  onConversationUpdated: (updatedConv: Conversation) => void;
  onLeave: () => void;
}

export function GroupInfoModal({ conversation, isOpen, onClose, onConversationUpdated, onLeave }: GroupInfoModalProps) {
  const { currentUser } = useAuthStore();
  const isAdmin = currentUser && conversation.admins?.includes(currentUser._id);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(conversation.name || '');
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  
  const [statusMessage, setStatusMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (isOpen) {
      setIsEditingName(false);
      setNewName(conversation.name || '');
      setIsAddingMembers(false);
      setSearchQuery('');
      setSearchResults([]);
      setStatusMessage('');
    }
  }, [isOpen, conversation.name]);

  // Search logic for adding members
  useEffect(() => {
    async function search() {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const users = await api.searchUsers(debouncedSearchQuery.trim());
        setSearchResults(users);
      } catch (err) {
        // quiet fail
      }
    }
    search();
  }, [debouncedSearchQuery]);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleRename = async () => {
    if (!newName.trim() || newName.trim() === conversation.name) {
      setIsEditingName(false);
      return;
    }
    setIsProcessing(true);
    try {
      const updated = await api.renameGroup(conversation._id, { name: newName.trim() });
      onConversationUpdated(updated);
      showStatus('Group renamed successfully');
      setIsEditingName(false);
    } catch (err) {
      showStatus('Failed to rename group');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddMember = async (user: User) => {
    setIsProcessing(true);
    try {
      const updated = await api.addParticipants(conversation._id, { userIds: [user._id] });
      onConversationUpdated(updated);
      showStatus(`${user.name} added to group`);
      setSearchQuery('');
    } catch (err) {
      showStatus('Failed to add member');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    setIsProcessing(true);
    try {
      const updated = await api.removeParticipant(conversation._id, userId);
      onConversationUpdated(updated);
      showStatus('Member removed');
    } catch (err) {
      showStatus('Failed to remove member');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePromoteAdmin = async (userId: string) => {
    if (!confirm('Promote this member to admin?')) return;
    setIsProcessing(true);
    try {
      const updated = await api.promoteAdmin(conversation._id, { userId });
      onConversationUpdated(updated);
      showStatus('Member promoted to admin');
    } catch (err) {
      showStatus('Failed to promote member');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentUser) return;
    if (!confirm('Are you sure you want to leave this group?')) return;
    setIsProcessing(true);
    try {
      await api.removeParticipant(conversation._id, currentUser._id);
      onLeave();
    } catch (err) {
      showStatus('Failed to leave group');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Group Info</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="px-4 py-2 bg-blue-900/50 text-blue-200 text-sm text-center border-b border-blue-800/50">
            {statusMessage}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Group Name Section */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Group Name</label>
            {isEditingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <button onClick={handleRename} disabled={isProcessing} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50">
                  Save
                </button>
                <button onClick={() => { setIsEditingName(false); setNewName(conversation.name || ''); }} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg border border-gray-700">
                <span className="text-lg text-white font-medium">{conversation.name || 'Unnamed Group'}</span>
                {isAdmin && (
                  <button onClick={() => setIsEditingName(true)} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Members List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-400">Members ({conversation.participants?.length || 0})</label>
              {isAdmin && !isAddingMembers && (
                <button onClick={() => setIsAddingMembers(true)} className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </button>
              )}
            </div>

            {/* Add Member UI */}
            {isAddingMembers && (
              <div className="mb-4 p-3 bg-gray-700/30 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Add new member</span>
                  <button onClick={() => { setIsAddingMembers(false); setSearchQuery(''); }} className="text-gray-500 hover:text-gray-300 text-sm">Cancel</button>
                </div>
                <input
                  type="text"
                  placeholder="Search to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none mb-2"
                />
                
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                    {searchResults.map(user => {
                      const isAlreadyMember = conversation.participants?.some(p => p._id === user._id);
                      if (isAlreadyMember) return null;
                      return (
                        <button
                          key={user._id}
                          onClick={() => handleAddMember(user)}
                          disabled={isProcessing}
                          className="w-full flex items-center p-2 hover:bg-gray-700 rounded transition text-left"
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold mr-2">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-200">{user.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {conversation.participants?.map(user => {
                const isUserAdmin = conversation.admins?.includes(user._id);
                const isMe = currentUser?._id === user._id;

                return (
                  <div key={user._id} className="flex items-center justify-between p-2 hover:bg-gray-700/50 rounded-lg group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {user.name} {isMe && <span className="text-gray-500">(You)</span>}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isUserAdmin && (
                        <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 text-xs rounded border border-blue-800/50">Admin</span>
                      )}
                      
                      {isAdmin && !isMe && (
                        <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                          {!isUserAdmin && (
                            <button onClick={() => handlePromoteAdmin(user._id)} disabled={isProcessing} className="p-1 text-gray-400 hover:text-blue-400" title="Promote to Admin">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                            </button>
                          )}
                          <button onClick={() => handleRemoveMember(user._id)} disabled={isProcessing} className="p-1 text-gray-400 hover:text-red-400" title="Remove Member">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-900/50 flex justify-end">
          {!isAdmin && (
            <button
              onClick={handleLeaveGroup}
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white border border-red-600/20 rounded-lg transition font-medium disabled:opacity-50"
            >
              Leave Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
