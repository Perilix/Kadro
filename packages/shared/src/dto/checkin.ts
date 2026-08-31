import { z } from 'zod';
import { zDateYmd, zIsoInstant, zObjectId } from './common';

const zScale5 = z.number().int().min(1).max(5);

export const zCheckinLevel = z.enum(['good', 'warn', 'bad']);

export const zCheckinCreate = z.object({
  date: zDateYmd,
  feeling: zScale5,
  sleepMin: z.number().int().min(0).max(960).nullable().default(null),
  soreness: zScale5.nullable().default(null),
  fatigue: zScale5.nullable().default(null),
  mood: zScale5.nullable().default(null),
  comment: z.string().trim().max(500).nullable().default(null),
});
export type CheckinCreate = z.infer<typeof zCheckinCreate>;

export const zCheckin = z.object({
  id: zObjectId,
  athleteId: zObjectId,
  date: zDateYmd,
  feeling: zScale5,
  sleepMin: z.number().nullable(),
  soreness: z.number().nullable(),
  fatigue: z.number().nullable(),
  mood: z.number().nullable(),
  comment: z.string().nullable(),
  level: zCheckinLevel,
  submittedAt: zIsoInstant,
  updatedAt: zIsoInstant.nullable(),
});
export type Checkin = z.infer<typeof zCheckin>;

export const zCheckinToday = z.object({
  checkin: zCheckin.nullable(),
  prefill: z.object({ sleepMin: z.number().nullable() }),
});
export type CheckinToday = z.infer<typeof zCheckinToday>;

export const zCheckinsQuery = z.object({
  athleteId: zObjectId,
  from: zDateYmd,
  to: zDateYmd,
});
export type CheckinsQuery = z.infer<typeof zCheckinsQuery>;
