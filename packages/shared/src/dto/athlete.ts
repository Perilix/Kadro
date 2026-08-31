import { z } from 'zod';
import { zDateYmd, zFormStatus, zIsoInstant, zObjectId, zSport } from './common';
import { zGoal } from './invite';
import { zAlertThresholds } from './team';

export const zVmaSource = z.enum(['declared', 'test']);

export const zAthleteProfile = z.object({
  vmaKmh: z.number().nullable(),
  vmaSource: zVmaSource.nullable(),
  vmaUpdatedAt: zIsoInstant.nullable(),
  hrMaxBpm: z.number().int().nullable(),
  hrRestBpm: z.number().int().nullable(),
  weightKg: z.number().nullable(),
  availableDays: z.array(z.number().int().min(0).max(6)),
  sports: z.array(zSport),
  injuriesNote: z.string().nullable(),
});
export type AthleteProfile = z.infer<typeof zAthleteProfile>;

export const zAthleteGoal = zGoal.extend({
  planWeeks: z.number().int().min(1).max(52).nullable().default(null),
  currentPhase: z.enum(['general', 'specific', 'race', 'taper']).nullable().default(null),
});
export type AthleteGoal = z.infer<typeof zAthleteGoal>;

export const zPersonalRecord = z.object({
  distance: z.string().trim().min(1).max(30),
  time: z.string().trim().min(1).max(20),
  when: z.string().trim().min(1).max(30),
});
export type PersonalRecord = z.infer<typeof zPersonalRecord>;

export const zAthleteSnapshot = z.object({
  formStatus: zFormStatus,
  formStatusSince: zDateYmd.nullable(),
  adherence7d: z.number().nullable(),
  adherence28d: z.number().nullable(),
  load7dUa: z.number().nullable(),
  acuteChronicRatio: z.number().nullable(),
  volume7dKm: z.number().nullable(),
  sleepAvg7dMin: z.number().nullable(),
  lastActivityAt: zIsoInstant.nullable(),
  nextSessionDate: zDateYmd.nullable(),
});
export type AthleteSnapshot = z.infer<typeof zAthleteSnapshot>;

export const zAthlete = z.object({
  id: zObjectId,
  userId: zObjectId,
  coachId: zObjectId,
  groupIds: z.array(zObjectId),
  status: z.enum(['active', 'archived']),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  profile: zAthleteProfile,
  goal: zAthleteGoal.nullable(),
  personalRecords: z.array(zPersonalRecord),
  alertOverrides: zAlertThresholds.partial().nullable(),
  snapshot: zAthleteSnapshot,
  joinedAt: zIsoInstant,
});
export type Athlete = z.infer<typeof zAthlete>;

export const zAthleteListItem = z.object({
  id: zObjectId,
  firstName: z.string(),
  lastName: z.string(),
  groupIds: z.array(zObjectId),
  goalLabel: z.string().nullable(),
  formStatus: zFormStatus,
  formStatusSince: zDateYmd.nullable(),
  adherence7d: z.number().nullable(),
  acuteChronicRatio: z.number().nullable(),
  volume7dKm: z.number().nullable(),
  sleepAvg7dMin: z.number().nullable(),
  lastActivityAt: zIsoInstant.nullable(),
  nextSessionDate: zDateYmd.nullable(),
});
export type AthleteListItem = z.infer<typeof zAthleteListItem>;

export const zAthleteListQuery = z.object({
  groupId: zObjectId.optional(),
  formStatus: zFormStatus.optional(),
  needsAttention: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  q: z.string().trim().max(60).optional(),
  sort: z.enum(['name', 'form', 'lastActivity']).default('name'),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type AthleteListQuery = z.infer<typeof zAthleteListQuery>;

export const zAthleteUpdate = z.object({
  profile: z
    .object({
      vmaKmh: z.number().min(8).max(26).nullable(),
      hrMaxBpm: z.number().int().min(120).max(230).nullable(),
      hrRestBpm: z.number().int().min(25).max(120).nullable(),
      weightKg: z.number().min(30).max(200).nullable(),
      availableDays: z.array(z.number().int().min(0).max(6)).max(7),
      sports: z.array(zSport).min(1),
      injuriesNote: z.string().trim().max(500).nullable(),
    })
    .partial()
    .optional(),
  goal: zAthleteGoal.nullable().optional(),
  personalRecords: z.array(zPersonalRecord).max(20).optional(),
  groupIds: z.array(zObjectId).max(20).optional(),
  coachId: zObjectId.optional(),
  alertOverrides: zAlertThresholds.partial().nullable().optional(),
});
export type AthleteUpdate = z.infer<typeof zAthleteUpdate>;

export const zTestKind = z.enum(['vma', 'one_rm', 'race_reference']);
export type TestKind = z.infer<typeof zTestKind>;

export const zOneRmResult = z.object({
  exerciseId: zObjectId,
  kg: z.number().min(1).max(500),
  method: z.enum(['measured', 'epley_estimated']),
});

export const zRaceReference = z.object({
  distance: z.string().trim().min(1).max(30),
  time: z.string().trim().min(1).max(20),
  label: z.string().trim().min(1).max(80),
});

export const zTest = z.object({
  id: zObjectId,
  kind: zTestKind,
  date: zDateYmd,
  vmaKmh: z.number().nullable(),
  oneRm: zOneRmResult.nullable(),
  race: zRaceReference.nullable(),
  source: z.enum(['manual', 'session']),
  note: z.string().nullable(),
  createdAt: zIsoInstant,
});
export type Test = z.infer<typeof zTest>;

const zTestNote = z.string().trim().max(300).nullable().default(null);

export const zTestCreate = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('vma'), date: zDateYmd, vmaKmh: z.number().min(8).max(26), note: zTestNote }),
  z.object({
    kind: z.literal('one_rm'),
    date: zDateYmd,
    oneRm: zOneRmResult.extend({ method: zOneRmResult.shape.method.default('measured') }),
    note: zTestNote,
  }),
  z.object({ kind: z.literal('race_reference'), date: zDateYmd, race: zRaceReference, note: zTestNote }),
]);
export type TestCreate = z.infer<typeof zTestCreate>;

export const zNote = z.object({
  id: zObjectId,
  athleteId: zObjectId,
  authorId: zObjectId,
  date: zDateYmd,
  text: z.string(),
  createdAt: zIsoInstant,
  updatedAt: zIsoInstant.nullable(),
});
export type Note = z.infer<typeof zNote>;

export const zNoteCreate = z.object({
  date: zDateYmd.optional(),
  text: z.string().trim().min(1).max(2000),
});
export type NoteCreate = z.infer<typeof zNoteCreate>;

export const zNoteUpdate = z.object({ text: z.string().trim().min(1).max(2000) });
export type NoteUpdate = z.infer<typeof zNoteUpdate>;

export const zPaceZoneKey = z.enum(['recovery', 'easy', 'marathon', 'threshold', 'vma']);

export const zPaceTableRow = z.object({
  key: zPaceZoneKey,
  minPct: z.number(),
  maxPct: z.number(),
  fastSecPerKm: z.number(),
  slowSecPerKm: z.number(),
});

export const zHrZone = z.object({
  zone: z.number().int().min(1).max(5),
  minBpm: z.number().int(),
  maxBpm: z.number().int(),
});

export const zPaceTable = z.object({
  vmaKmh: z.number().nullable(),
  vmaSource: zVmaSource.nullable(),
  vmaUpdatedAt: zIsoInstant.nullable(),
  rows: z.array(zPaceTableRow),
  hrZones: z.array(zHrZone),
});
export type PaceTable = z.infer<typeof zPaceTable>;
