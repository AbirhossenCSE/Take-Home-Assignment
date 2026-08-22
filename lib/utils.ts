import { Conversation, User } from '@/types';

/**
 * Returns a non-empty string for any display name, falling back to a default label.
 */
export function getSafeName(name?: string | null, fallback = 'Unknown'): string {
  if (typeof name === 'string' && name.trim().length > 0) {
    return name.trim();
  }
  return fallback;
}

/**
 * Returns a guaranteed single uppercase character for avatar initials.
 */
export function getInitial(name?: string | null, fallback = '?'): string {
  const safeName = getSafeName(name, fallback);
  return safeName.charAt(0).toUpperCase();
}

/**
 * Safely derives a display name for a conversation (direct or group) across all API data shapes.
 */
export function getConversationName(
  conv: Conversation | null | undefined,
  currentUser: User | null | undefined
): string {
  if (!conv) return 'Unknown';

  if (conv.type === 'group') {
    return getSafeName(conv.name, 'Unnamed Group');
  }

  // Direct chat: check single participant object
  if (conv.type === 'direct' && conv.participant) {
    if (conv.participant.name?.trim()) return conv.participant.name.trim();
    if (conv.participant.phone?.trim()) return conv.participant.phone.trim();
  }

  // Fallback to participants array
  if (Array.isArray(conv.participants) && currentUser?._id) {
    const otherUser = conv.participants.find((p) => p && p._id !== currentUser._id);
    if (otherUser) {
      if (otherUser.name?.trim()) return otherUser.name.trim();
      if (otherUser.phone?.trim()) return otherUser.phone.trim();
    }
  }

  // Fallback to conv.name if defined
  if (conv.name?.trim()) return conv.name.trim();

  return 'Unknown User';
}
