import { z } from 'zod';
import { zObjectId } from './common';

export const zAlertThresholds = z.object({
  redFeelingStreakDays: z.number().int().min(1).max(14),
  missedSessionAlert: z.boolean(),
  noActivityDays: z.number().int().min(1).max(30),
  noCheckinDays: z.number().int().min(1).max(30),
  sleepLowMin: z.number().int().min(0).max(720),
  sleepLowDays: z.number().int().min(1).max(14),
  restingHrDeltaBpm: z.number().int().min(1).max(30),
  hrvDropPct: z.number().int().min(1).max(80),
  acuteChronicMax: z.number().min(0.8).max(2.5),
});
export type AlertThresholds = z.infer<typeof zAlertThresholds>;

export const zGroup = z.object({
  id: zObjectId,
  name: z.string(),
  order: z.number().int(),
});
export type Group = z.infer<typeof zGroup>;

export const zGroupCreate = z.object({ name: z.string().trim().min(1).max(60) });
export type GroupCreate = z.infer<typeof zGroupCreate>;

export const zGroupUpdate = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  order: z.number().int().min(0).optional(),
});
export type GroupUpdate = z.infer<typeof zGroupUpdate>;

export const zWatchPushSettings = z.object({
  enabled: z.boolean(),
  sendLocalTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  resendOnUpdate: z.boolean(),
  autoImportCompleted: z.boolean(),
});
export type WatchPushSettings = z.infer<typeof zWatchPushSettings>;

export const zTeam = z.object({
  id: zObjectId,
  name: z.string(),
  inviteCode: z.string(),
  alertDefaults: zAlertThresholds,
  watchPush: zWatchPushSettings,
  subscription: z.object({
    plan: z.enum(['trial', 'solo', 'coach', 'structure']),
    status: z.enum(['trialing', 'active', 'past_due', 'canceled']),
    athleteLimit: z.number().int(),
    coachLimit: z.number().int(),
    interval: z.enum(['month', 'year']).nullable(),
    trialEndsAt: z.string().datetime().nullable(),
    currentPeriodEnd: z.string().datetime().nullable(),
    extraAthletes: z.number().int(),
  }),
});
export type Team = z.infer<typeof zTeam>;

export const zTeamUpdate = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  alertDefaults: zAlertThresholds.partial().optional(),
  watchPush: zWatchPushSettings.partial().optional(),
});
export type TeamUpdate = z.infer<typeof zTeamUpdate>;

export const zTodayItem = z.object({
  athleteId: zObjectId,
  firstName: z.string(),
  lastName: z.string(),
  formStatus: z.enum(['good', 'warn', 'bad', 'none']),
  checkinLevel: z.enum(['good', 'warn', 'bad']).nullable(),
  session: z
    .object({
      id: zObjectId,
      name: z.string(),
      type: z.enum(['run', 'strength']),
      status: z.enum(['planned', 'completed', 'missed', 'canceled']),
    })
    .nullable(),
});
export type TodayItem = z.infer<typeof zTodayItem>;

export const zCoachDashboard = z.object({
  kpis: z.object({
    athleteCount: z.number().int(),
    activeThisWeek: z.number().int(),
    sessionsDone: z.number().int(),
    sessionsPlanned: z.number().int(),
    adherence7d: z.number().nullable(),
    adherenceDelta: z.number().nullable(),
    openAlerts: z.number().int(),
  }),
  today: z.array(zTodayItem),
  weeklyVolumeKm: z.array(z.object({ week: z.string(), km: z.number() })),
});
export type CoachDashboard = z.infer<typeof zCoachDashboard>;
