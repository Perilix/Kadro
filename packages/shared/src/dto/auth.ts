import { z } from 'zod';
import { zInviteCode, zLocale, zObjectId, zTimezone } from './common';

export const zEmail = z
  .string()
  .trim()
  .email()
  .transform((v) => v.toLowerCase());
export const zPassword = z.string().min(8, 'au moins 8 caractères').max(128);
const zName = z.string().trim().min(1).max(60);

export const zUserRole = z.enum(['coach', 'athlete']);
export type UserRole = z.infer<typeof zUserRole>;

export const zRegisterCoach = z.object({
  email: zEmail,
  password: zPassword,
  firstName: zName,
  lastName: zName,
  locale: zLocale.default('fr'),
  timezone: zTimezone.default('Europe/Paris'),
  teamName: z.string().trim().min(1).max(80).optional(),
});
export type RegisterCoach = z.infer<typeof zRegisterCoach>;

export const zLogin = z.object({ email: zEmail, password: z.string().min(1) });
export type Login = z.infer<typeof zLogin>;

export const zRefresh = z.object({ refreshToken: z.string().min(1) });
export type Refresh = z.infer<typeof zRefresh>;

export const zUser = z.object({
  id: zObjectId,
  email: z.string(),
  role: zUserRole,
  firstName: z.string(),
  lastName: z.string(),
  locale: zLocale,
  timezone: zTimezone,
});
export type User = z.infer<typeof zUser>;

export const zAuthSession = z.object({
  user: zUser,
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthSession = z.infer<typeof zAuthSession>;

export const zTeamSummary = z.object({
  id: zObjectId,
  name: z.string(),
  inviteCode: zInviteCode,
  plan: z.enum(['trial', 'solo', 'coach', 'structure']),
  athleteLimit: z.number().int(),
  athleteCount: z.number().int(),
  trialEndsAt: z.string().datetime().nullable(),
});
export type TeamSummary = z.infer<typeof zTeamSummary>;

export const zAthleteSummary = z.object({
  id: zObjectId,
  teamId: zObjectId,
  coachName: z.string(),
});
export type AthleteSummary = z.infer<typeof zAthleteSummary>;

/** Contexte de démarrage des apps — GET /v1/auth/me. */
export const zMe = z.object({
  user: zUser,
  team: zTeamSummary.nullable(),
  athlete: zAthleteSummary.nullable(),
});
export type Me = z.infer<typeof zMe>;
