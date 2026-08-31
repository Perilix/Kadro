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
