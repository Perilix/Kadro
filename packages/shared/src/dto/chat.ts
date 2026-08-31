import { z } from 'zod';
import { zIsoInstant, zObjectId } from './common';

export const zConversation = z.object({
  id: zObjectId,
  athleteId: zObjectId,
  name: z.string(),
  lastMessageAt: zIsoInstant.nullable(),
  lastMessagePreview: z.string(),
  unread: z.number().int(),
});
export type Conversation = z.infer<typeof zConversation>;

export const zMessageType = z.enum(['text', 'session_card', 'template_card', 'note_card']);
export type MessageType = z.infer<typeof zMessageType>;

export const zMessageRef = z.object({
  plannedSessionId: zObjectId.optional(),
  completedSessionId: zObjectId.optional(),
  templateId: zObjectId.optional(),
});

export const zMessage = z.object({
  id: zObjectId,
  conversationId: zObjectId,
  senderId: zObjectId,
  type: zMessageType,
  text: z.string().nullable(),
  ref: zMessageRef.nullable(),
  sentAt: zIsoInstant,
  readAt: zIsoInstant.nullable(),
});
export type Message = z.infer<typeof zMessage>;

export const zMessageCreate = z
  .object({
    type: zMessageType.default('text'),
    text: z.string().trim().min(1).max(2000).nullable().default(null),
    ref: zMessageRef.nullable().default(null),
  })
  .refine((m) => (m.type === 'text' ? m.text != null : m.ref != null), {
    message: 'text requis pour type text, ref pour les cartes',
  });
export type MessageCreate = z.infer<typeof zMessageCreate>;

export const zMessagesQuery = z.object({
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type MessagesQuery = z.infer<typeof zMessagesQuery>;
