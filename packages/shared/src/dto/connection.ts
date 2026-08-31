import { z } from 'zod';
import { zIsoInstant, zObjectId } from './common';
import { zProvider } from './planning';

export const zConnectionStatus = z.enum(['connected', 'error', 'revoked']);

export const zConnectionCapabilities = z.object({
  pushWorkout: z.boolean(),
  pullActivities: z.boolean(),
  pullSleep: z.boolean(),
  pullHrv: z.boolean(),
  pullWeight: z.boolean(),
});

export const zConnection = z.object({
  provider: zProvider,
  status: zConnectionStatus,
  deviceName: z.string().nullable(),
  isPrimaryPush: z.boolean(),
  capabilities: zConnectionCapabilities,
  lastSyncAt: zIsoInstant.nullable(),
  lastError: z.object({ at: zIsoInstant, i18nKey: z.string() }).nullable(),
  connectedAt: zIsoInstant,
});
export type Connection = z.infer<typeof zConnection>;

export const zConnectionIssue = z.object({
  athleteId: zObjectId,
  athleteName: z.string(),
  provider: zProvider,
  i18nKey: z.string(),
  at: zIsoInstant,
});

export const zTeamConnections = z.object({
  kpis: z.object({
    athletesConnected: z.number().int(),
    athletesTotal: z.number().int(),
    issues: z.number().int(),
  }),
  providers: z.array(
    z.object({ provider: zProvider, athleteCount: z.number().int(), status: z.enum(['ok', 'error']) }),
  ),
  issues: z.array(zConnectionIssue),
});
export type TeamConnections = z.infer<typeof zTeamConnections>;

export const zAuthorizeUrl = z.object({ url: z.string().url() });
export type AuthorizeUrl = z.infer<typeof zAuthorizeUrl>;
