"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Conversation, User } from '@/types';
import { useAuthStore } from '@/store';
import { useDebounce } from '@/lib/hooks';
import { getInitial, getSafeName } from '@/lib/utils';

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
      } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      showStatus('Failed to leave group');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>GROUP CHANNEL DETAILS</span>
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="px-4 py-2 bg-cyan-950/80 text-cyan-300 text-xs font-mono text-center border-b border-cyan-500/30">
            {statusMessage}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Group Name Section */}
          <div>
            <label className="block text-xs font-mono text-cyan-400 mb-1.5 uppercase">Channel Name</label>
            {isEditingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
                <button onClick={handleRename} disabled={isProcessing} className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs font-mono disabled:opacity-50 transition">
                  Save
                </button>
                <button onClick={() => { setIsEditingName(false); setNewName(conversation.name || ''); }} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-base text-white font-semibold">{conversation.name || 'Unnamed Group'}</span>
                {isAdmin && (
                  <button onClick={() => setIsEditingName(true)} className="text-cyan-400 hover:text-cyan-300 text-xs font-mono">
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Members List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-mono text-cyan-400 uppercase">Members ({conversation.participants?.length || 0})</label>
              {isAdmin && !isAddingMembers && (
                <button onClick={() => setIsAddingMembers(true)} className="text-cyan-400 hover:text-cyan-300 text-xs font-mono flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Member
                </button>
              )}
            </div>

            {/* Add Member UI */}
            {isAddingMembers && (
              <div className="mb-4 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-300">SEARCH MEMBER TO ADD</span>
                  <button onClick={() => { setIsAddingMembers(false); setSearchQuery(''); }} className="text-slate-500 hover:text-slate-300 text-xs">Cancel</button>
                </div>
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500 mb-2"
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
                          className="w-full flex items-center p-2 hover:bg-slate-800/80 rounded-lg transition text-left"
                        >
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400/30 flex items-center justify-center text-xs text-white font-bold mr-2">
                            {getInitial(user.name || user.phone)}
                          </div>
                          <span className="text-xs text-slate-200">{getSafeName(user.name, user.phone)}</span>
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
                  <div key={user._id} className="flex items-center justify-between p-2.5 hover:bg-slate-800/50 rounded-xl transition group border border-transparent hover:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-cyan-400">
                        {getInitial(user.name || user.phone)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {getSafeName(user.name, user.phone)} {isMe && <span className="text-slate-500 text-xs font-mono">(You)</span>}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isUserAdmin && (
                        <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 text-[10px] font-mono rounded border border-cyan-500/30">ADMIN</span>
                      )}
                      
                      {isAdmin && !isMe && (
                        <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                          {!isUserAdmin && (
                            <button onClick={() => handlePromoteAdmin(user._id)} disabled={isProcessing} className="p-1 text-slate-400 hover:text-cyan-400" title="Promote to Admin">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                            </button>
                          )}
                          <button onClick={() => handleRemoveMember(user._id)} disabled={isProcessing} className="p-1 text-slate-400 hover:text-rose-400" title="Remove Member">
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
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          {!isAdmin && (
            <button
              onClick={handleLeaveGroup}
              disabled={isProcessing}
              className="w-full px-4 py-2.5 bg-rose-950/20 text-rose-400 hover:bg-rose-900/40 border border-rose-900/40 rounded-xl transition text-xs font-mono disabled:opacity-50"
            >
              LEAVE GROUP CHANNEL
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
