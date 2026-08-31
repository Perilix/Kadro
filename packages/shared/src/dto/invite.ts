import { z } from 'zod';
import { zEmail, zPassword } from './auth';
import { zDateYmd, zInviteCode, zLocale, zObjectId, zSport, zTimezone } from './common';

/** Carte coach affichée quand le code est reconnu (public). */
export const zInvitePreview = z.object({
  coachName: z.string(),
  teamName: z.string(),
  athleteCount: z.number().int(),
  sports: z.array(zSport),
});
export type InvitePreview = z.infer<typeof zInvitePreview>;

export const zGoal = z.object({
  label: z.string().trim().min(1).max(120),
  date: zDateYmd.nullable().default(null),
  targetTime: z.string().max(20).nullable().default(null),
  referenceTime: z.string().max(60).nullable().default(null),
});
export type Goal = z.infer<typeof zGoal>;

/** Profil déclaré à l'inscription (étape 2 de l'onboarding athlète). */
export const zAthleteProfileSetup = z.object({
  vmaKmh: z.number().min(8).max(26).nullable().default(null),
  hrMaxBpm: z.number().int().min(120).max(230).nullable().default(null),
  weightKg: z.number().min(30).max(200).nullable().default(null),
  availableDays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  sports: z.array(zSport).min(1).default(['run']),
  injuriesNote: z.string().trim().max(500).nullable().default(null),
});
export type AthleteProfileSetup = z.infer<typeof zAthleteProfileSetup>;

const zName = z.string().trim().min(1).max(60);

export const zJoin = z.object({
  code: zInviteCode,
  account: z.object({
    email: zEmail,
    password: zPassword,
    firstName: zName,
    lastName: zName,
    locale: zLocale.default('fr'),
    timezone: zTimezone.default('Europe/Paris'),
  }),
  profile: zAthleteProfileSetup,
  goal: zGoal.nullable().optional(),
});
export type Join = z.infer<typeof zJoin>;

export const zInvitationStatus = z.enum(['pending', 'accepted', 'revoked']);

export const zInvitation = z.object({
  id: zObjectId,
  email: z.string(),
  name: z.string().nullable(),
  status: zInvitationStatus,
  sentAt: z.string().datetime(),
  remindedAt: z.string().datetime().nullable(),
});
export type Invitation = z.infer<typeof zInvitation>;

export const zInvitationCreate = z.object({
  email: zEmail,
  name: z.string().trim().max(60).optional(),
});
export type InvitationCreate = z.infer<typeof zInvitationCreate>;

export const zInviteCodeInfo = z.object({ code: zInviteCode, joinUrl: z.string().url() });
export type InviteCodeInfo = z.infer<typeof zInviteCodeInfo>;
