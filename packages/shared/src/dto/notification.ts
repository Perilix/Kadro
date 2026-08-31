import { z } from 'zod';
import { zIsoInstant, zObjectId } from './common';

export const zNotificationKind = z.enum(['form', 'session', 'message', 'team', 'billing']);
export type NotificationKind = z.infer<typeof zNotificationKind>;

export const zNotification = z.object({
  id: zObjectId,
  kind: zNotificationKind,
  i18nKey: z.string(),
  params: z.record(z.union([z.string(), z.number()])),
  refs: z.object({
    athleteId: zObjectId.optional(),
    completedSessionId: zObjectId.optional(),
    conversationId: zObjectId.optional(),
    alertId: zObjectId.optional(),
  }),
  readAt: zIsoInstant.nullable(),
  createdAt: zIsoInstant,
});
export type Notification = z.infer<typeof zNotification>;

export const zNotificationsQuery = z.object({
  kind: zNotificationKind.optional(),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type NotificationsQuery = z.infer<typeof zNotificationsQuery>;

export const zNotificationsRead = z.object({
  ids: z.array(zObjectId).max(200).optional(),
});
export type NotificationsRead = z.infer<typeof zNotificationsRead>;

export const zPushTokenCreate = z.object({
  expoToken: z.string().trim().min(1).max(200),
  platform: z.enum(['ios', 'android']),
});
export type PushTokenCreate = z.infer<typeof zPushTokenCreate>;
