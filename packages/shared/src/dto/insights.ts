import { z } from 'zod';
import { zAlert } from './alert';
import { zActivityListItem } from './activity';
import { zCheckin } from './checkin';
import { zDateYmd, zObjectId } from './common';
import { zPlannedSession } from './planning';
import { zAlertThresholds } from './team';

export const zWeekLoad = z.object({
  week: z.string(),
  loadUa: z.number(),
  volumeKm: z.number(),
});
export type WeekLoad = z.infer<typeof zWeekLoad>;

export const zAthleteOverview = z.object({
  loadByWeek: z.array(zWeekLoad),
  acuteChronicRatio: z.number().nullable(),
  week: z.array(zPlannedSession),
  recentSessions: z.array(zActivityListItem),
  checkins7d: z.array(zCheckin),
  currentAlert: zAlert.nullable(),
});
export type AthleteOverview = z.infer<typeof zAthleteOverview>;

export const zMonitoringDay = z.object({
  date: zDateYmd,
  sleepMin: z.number().nullable(),
  restingHrBpm: z.number().nullable(),
  hrvRmssdMs: z.number().nullable(),
  weightKg: z.number().nullable(),
  checkinLevel: z.enum(['good', 'warn', 'bad']).nullable(),
});

export const zMonitoring = z.object({
  days: z.array(zMonitoringDay),
  summary7d: z.object({
    sleepAvgMin: z.number().nullable(),
    restingHrAvgBpm: z.number().nullable(),
    hrvAvgMs: z.number().nullable(),
    weightKg: z.number().nullable(),
  }),
  thresholds: zAlertThresholds,
});
export type Monitoring = z.infer<typeof zMonitoring>;

export const zExerciseStats = z.object({
  exerciseId: zObjectId,
  name: z.string(),
  est1RmKg: z.number().nullable(),
  est1RmAt: zDateYmd.nullable(),
  lastWorkingKg: z.number().nullable(),
  weeklyMaxKg: z.array(z.object({ week: z.string(), kg: z.number() })),
});
export type ExerciseStats = z.infer<typeof zExerciseStats>;
