import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Conversation } from '../types';

interface AuthState {
  token: string | null;
  currentUser: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      currentUser: null,
      setAuth: (token, user) => set({ token, currentUser: user }),
      logout: () => set({ token: null, currentUser: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface ChatState {
  activeConversation: Conversation | null;
  setActiveConversation: (conversation: Conversation | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversation: null,
  setActiveConversation: (conversation) => set({ activeConversation: conversation }),
}));
