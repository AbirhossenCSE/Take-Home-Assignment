export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender?: User;
}

export interface Conversation {
  id: string;
  name?: string | null;
  isGroup: boolean;
  participantIds: string[];
  participants?: User[];
  adminIds?: string[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

// Request & Response types

export interface LoginRequest {
  phone: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateConversationRequest {
  userId: string;
}

export interface CreateGroupRequest {
  name: string;
  memberIds: string[];
}

export interface AddParticipantsRequest {
  userIds: string[];
}

export interface AddAdminRequest {
  userId: string;
}

export interface UpdateConversationRequest {
  name: string;
}

export interface SendMessageRequest {
  conversationId: string;
  text: string;
}
