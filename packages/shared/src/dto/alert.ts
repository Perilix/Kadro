import { z } from 'zod';
import { zIsoInstant, zObjectId } from './common';

export const zAlertKind = z.enum([
  'form_red_streak',
  'missed_session',
  'no_activity',
  'no_checkin',
  'sleep_low',
  'resting_hr_up',
  'hrv_drop',
  'acr_high',
  'race_soon',
  'no_watch',
  'watch_disconnected',
  'watch_push_failed',
]);
export type AlertKind = z.infer<typeof zAlertKind>;

export const zAlertSeverity = z.enum(['info', 'warn', 'critical']);
export type AlertSeverity = z.infer<typeof zAlertSeverity>;

export const zSuggestedAction = z.enum([
  'adapt_session',
  'message',
  'validate_week',
  'resend_push',
  'remind',
]);

export const zAlertStatus = z.enum(['open', 'resolved', 'dismissed']);
export type AlertStatus = z.infer<typeof zAlertStatus>;

export const zAlert = z.object({
  id: zObjectId,
  athleteId: zObjectId,
  kind: zAlertKind,
  severity: zAlertSeverity,
  i18nKey: z.string(),
  params: z.record(z.union([z.string(), z.number()])),
  suggestedAction: zSuggestedAction.nullable(),
  refs: z.object({
    plannedSessionId: zObjectId.optional(),
    checkinId: zObjectId.optional(),
  }),
  status: zAlertStatus,
  createdAt: zIsoInstant,
  resolvedAt: zIsoInstant.nullable(),
  resolvedById: zObjectId.nullable(),
});
export type Alert = z.infer<typeof zAlert>;

export const zAlertsQuery = z.object({
  status: zAlertStatus.default('open'),
  athleteId: zObjectId.optional(),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type AlertsQuery = z.infer<typeof zAlertsQuery>;
