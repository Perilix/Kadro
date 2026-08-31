import { z } from 'zod';
import { zDateYmd, zIsoInstant, zObjectId } from './common';
import {
  zRunBlock,
  zSessionCategory,
  zSessionTemplateCreate,
  zSessionType,
  zStrengthItem,
} from './session';

export const zProvider = z.enum([
  'garmin',
  'coros',
  'polar',
  'suunto',
  'apple',
  'wahoo',
  'strava',
  'zwift',
  'withings',
]);
export type Provider = z.infer<typeof zProvider>;

export const zPlannedSessionStatus = z.enum(['planned', 'completed', 'missed', 'canceled']);
export type PlannedSessionStatus = z.infer<typeof zPlannedSessionStatus>;

export const zWatchPushSummary = z.object({
  state: z.enum(['none', 'scheduled', 'sent', 'failed']),
  provider: zProvider.nullable(),
  sentAt: zIsoInstant.nullable(),
});
export type WatchPushSummary = z.infer<typeof zWatchPushSummary>;

export const zResolvedPace = z.object({
  blockPath: z.string(),
  minSecPerKm: z.number(),
  maxSecPerKm: z.number(),
});

export const zResolvedLoad = z.object({
  exerciseId: zObjectId,
  kg: z.number(),
  rmSourceKg: z.number(),
});

export const zResolved = z.object({
  vmaKmh: z.number().nullable(),
  hrMaxBpm: z.number().nullable(),
  paces: z.array(zResolvedPace).nullable(),
  loads: z.array(zResolvedLoad).nullable(),
  estLoadUa: z.number().nullable(),
  resolvedAt: zIsoInstant,
});
export type Resolved = z.infer<typeof zResolved>;

export const zModification = z.object({
  modifiedAt: zIsoInstant,
  fromName: z.string(),
});

export const zPlannedSession = z.object({
  id: zObjectId,
  athleteId: zObjectId,
  coachId: zObjectId,
  assignmentId: zObjectId.nullable(),
  templateId: zObjectId.nullable(),
  date: zDateYmd,
  type: zSessionType,
  name: z.string(),
  category: zSessionCategory,
  expectedDifficulty: z.number().int(),
  status: zPlannedSessionStatus,
  watchPush: zWatchPushSummary,
  modification: zModification.nullable(),
  createdAt: zIsoInstant,
  updatedAt: zIsoInstant,
});
export type PlannedSession = z.infer<typeof zPlannedSession>;

export const zPlannedSessionDetail = zPlannedSession.extend({
  instructions: z.string().nullable(),
  blocks: z.array(zRunBlock).nullable(),
  exercises: z.array(zStrengthItem).nullable(),
  resolved: zResolved.nullable(),
  completedSessionId: zObjectId.nullable(),
});
export type PlannedSessionDetail = z.infer<typeof zPlannedSessionDetail>;

export const zAssign = z.object({
  session: z.union([z.object({ templateId: zObjectId }), zSessionTemplateCreate]),
  athleteIds: z.array(zObjectId).min(1).max(50),
  date: zDateYmd,
  saveAsTemplate: z.boolean().default(false),
});
export type Assign = z.infer<typeof zAssign>;

export const zPlannedSessionUpdate = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  date: zDateYmd.optional(),
  expectedDifficulty: z.number().int().min(1).max(10).optional(),
  instructions: z.string().trim().max(500).nullable().optional(),
  blocks: z.array(zRunBlock).min(1).max(30).optional(),
  exercises: z.array(zStrengthItem).min(1).max(30).optional(),
  applyToAssignment: z.boolean().default(false),
});
export type PlannedSessionUpdate = z.infer<typeof zPlannedSessionUpdate>;

export const zSessionsQuery = z.object({
  athleteId: zObjectId.optional(),
  groupId: zObjectId.optional(),
  from: zDateYmd,
  to: zDateYmd,
});
export type SessionsQuery = z.infer<typeof zSessionsQuery>;

export const zDeleteSessionQuery = z.object({
  scope: z.enum(['one', 'assignment']).default('one'),
});
export type DeleteSessionQuery = z.infer<typeof zDeleteSessionQuery>;

export const zPreviewRequest = z
  .object({
    athleteId: zObjectId,
    expectedDifficulty: z.number().int().min(1).max(10).default(5),
    estDurationMin: z.number().int().min(1).max(600).nullable().default(null),
    blocks: z.array(zRunBlock).min(1).max(30).nullable().default(null),
    exercises: z.array(zStrengthItem).min(1).max(30).nullable().default(null),
  })
  .refine((p) => (p.blocks != null) !== (p.exercises != null), {
    message: 'blocks ou exercises requis',
  });
export type PreviewRequest = z.infer<typeof zPreviewRequest>;

export const zResolvedPreview = z.object({
  vmaKmh: z.number().nullable(),
  hrMaxBpm: z.number().nullable(),
  paces: z.array(zResolvedPace).nullable(),
  loads: z.array(zResolvedLoad).nullable(),
  estDurationMin: z.number().nullable(),
  estLoadUa: z.number().nullable(),
});
export type ResolvedPreview = z.infer<typeof zResolvedPreview>;
