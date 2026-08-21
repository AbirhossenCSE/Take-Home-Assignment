import axios from 'axios';
import { useAuthStore } from '../store';
import {
  User,
  Conversation,
  Message,
  LoginRequest,
  LoginResponse,
  CreateConversationRequest,
  CreateGroupRequest,
  AddParticipantsRequest,
  AddAdminRequest,
  UpdateConversationRequest,
  SendMessageRequest
} from '../types';

const API_BASE_URL = 'https://frontend-task-chatapp.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  login: async (data: LoginRequest) => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  // Users
  searchUsers: async (query: string) => {
    const response = await apiClient.get<User[]>(`/users/search`, { params: { q: query } });
    return response.data;
  },

  // Conversations
  getConversations: async () => {
    const response = await apiClient.get<Conversation[]>('/conversations');
    return response.data;
  },
  startConversation: async (data: CreateConversationRequest) => {
    const response = await apiClient.post<Conversation>('/conversations', data);
    return response.data;
  },
  getMessages: async (conversationId: string) => {
    const response = await apiClient.get<Message[]>(`/conversations/${conversationId}/messages`);
    return response.data;
  },
  createGroup: async (data: CreateGroupRequest) => {
    const response = await apiClient.post<Conversation>('/conversations/group', data);
    return response.data;
  },
  addParticipants: async (conversationId: string, data: AddParticipantsRequest) => {
    const response = await apiClient.post<Conversation>(`/conversations/${conversationId}/participants`, data);
    return response.data;
  },
  removeParticipant: async (conversationId: string, userId: string) => {
    const response = await apiClient.delete<Conversation>(`/conversations/${conversationId}/participants/${userId}`);
    return response.data;
  },
  promoteAdmin: async (conversationId: string, data: AddAdminRequest) => {
    const response = await apiClient.post<Conversation>(`/conversations/${conversationId}/admins`, data);
    return response.data;
  },
  renameGroup: async (conversationId: string, data: UpdateConversationRequest) => {
    const response = await apiClient.patch<Conversation>(`/conversations/${conversationId}`, data);
    return response.data;
  },

  // Messages
  sendMessage: async (data: SendMessageRequest) => {
    const response = await apiClient.post<Message>('/messages', data);
    return response.data;
  }
};
