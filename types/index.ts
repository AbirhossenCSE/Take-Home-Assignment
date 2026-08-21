export interface User {
  _id: string;
  name: string;
  phone: string;
  avatar?: string;
  createdAt?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId?: string;
  sender?: string | User;
  text: string;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  name?: string | null;
  participant?: User; // For direct chats
  participants?: User[]; // For group chats
  admins?: string[];
  createdBy?: string;
  lastMessage?: Partial<Message>;
  createdAt?: string;
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
