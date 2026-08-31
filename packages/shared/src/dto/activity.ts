import { z } from 'zod';
import { zIsoInstant, zObjectId } from './common';

export const zActivitySport = z.enum(['run', 'trail', 'strength', 'bike', 'other']);
export type ActivitySport = z.infer<typeof zActivitySport>;

export const zActivitySource = z.enum([
  'garmin',
  'coros',
  'polar',
  'suunto',
  'apple',
  'wahoo',
  'strava',
  'zwift',
  'manual',
]);
export type ActivitySource = z.infer<typeof zActivitySource>;

export const zLap = z.object({
  idx: z.number().int(),
  kind: z.enum(['warmup', 'work', 'recovery', 'cooldown', 'lap']),
  durationSec: z.number(),
  distanceM: z.number().nullable(),
  avgPaceSecPerKm: z.number().nullable(),
  avgHrBpm: z.number().nullable(),
  endHrBpm: z.number().nullable(),
  targetDeltaSec: z.number().nullable(),
});

export const zKmSplit = z.object({
  km: z.number().int(),
  paceSecPerKm: z.number(),
  gapPaceSecPerKm: z.number().nullable(),
  elevDeltaM: z.number().nullable(),
  avgHrBpm: z.number().nullable(),
});

export const zBestEffort = z.object({
  label: z.string(),
  valueSec: z.number(),
  isRecord: z.boolean(),
  note: z.string().nullable(),
});

export const zStrengthSetDone = z.object({
  reps: z.number().int().nullable(),
  kg: z.number().nullable(),
  durationSec: z.number().int().nullable(),
  rpe: z.number().int().nullable(),
  done: z.boolean(),
});

export const zStrengthExerciseDone = z.object({
  exerciseId: zObjectId,
  name: z.string(),
  prescribed: z
    .object({ sets: z.number().int(), reps: z.number().int().nullable(), kg: z.number().nullable() })
    .nullable(),
  sets: z.array(zStrengthSetDone),
  note: z.string().nullable(),
});

export const zActivityFeedback = z.object({
  rpe: z.number().nullable(),
  feeling: z.number().nullable(),
  comment: z.string().nullable(),
  submittedAt: zIsoInstant,
});

export const zActivityListItem = z.object({
  id: zObjectId,
  athleteId: zObjectId,
  plannedSessionId: zObjectId.nullable(),
  name: z.string().nullable(),
  sport: zActivitySport,
  source: zActivitySource,
  startedAt: zIsoInstant,
  durationSec: z.number(),
  distanceM: z.number().nullable(),
  avgPaceSecPerKm: z.number().nullable(),
  avgHrBpm: z.number().nullable(),
  elevGainM: z.number().nullable(),
  loadUa: z.number().nullable(),
  hasStreams: z.boolean(),
  feedbackRpe: z.number().nullable(),
});
export type ActivityListItem = z.infer<typeof zActivityListItem>;

export const zActivityComparison = z.object({
  activityId: zObjectId,
  startedAt: zIsoInstant,
  durationSec: z.number(),
  distanceM: z.number().nullable(),
  avgPaceSecPerKm: z.number().nullable(),
  avgHrBpm: z.number().nullable(),
});

export const zActivityDetail = zActivityListItem.omit({ feedbackRpe: true }).extend({
  deviceName: z.string().nullable(),
  timezone: z.string(),
  elevLossM: z.number().nullable(),
  gapAvgPaceSecPerKm: z.number().nullable(),
  maxHrBpm: z.number().nullable(),
  avgCadenceSpm: z.number().nullable(),
  ascentSpeedMPerH: z.number().nullable(),
  hrZonesSec: z.tuple([z.number(), z.number(), z.number(), z.number(), z.number()]).nullable(),
  laps: z.array(zLap).nullable(),
  kmSplits: z.array(zKmSplit).nullable(),
  bestEfforts: z.array(zBestEffort),
  strength: z
    .object({ exercises: z.array(zStrengthExerciseDone), tonnageKg: z.number() })
    .nullable(),
  feedback: zActivityFeedback.nullable(),
  expectedDifficulty: z.number().nullable(),
  comparison: zActivityComparison.nullable(),
});
export type ActivityDetail = z.infer<typeof zActivityDetail>;

export const zActivitiesQuery = z.object({
  athleteId: zObjectId.optional(),
  sport: zActivitySport.optional(),
  from: zIsoInstant.optional(),
  to: zIsoInstant.optional(),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type ActivitiesQuery = z.infer<typeof zActivitiesQuery>;

export const zFeedbackCreate = z.object({
  rpe: z.number().int().min(1).max(10),
  feeling: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).nullable().default(null),
});
export type FeedbackCreate = z.infer<typeof zFeedbackCreate>;

export const zManualComplete = z.object({
  startedAt: zIsoInstant.optional(),
  durationSec: z.number().int().min(60).max(24 * 3600),
  distanceM: z.number().int().min(0).max(400_000).nullable().default(null),
  avgHrBpm: z.number().int().min(40).max(230).nullable().default(null),
  strength: z
    .array(
      z.object({
        exerciseId: zObjectId,
        sets: z.array(zStrengthSetDone).min(1).max(20),
        note: z.string().trim().max(300).nullable().default(null),
      }),
    )
    .nullable()
    .default(null),
  rpe: z.number().int().min(1).max(10).nullable().default(null),
  feeling: z.number().int().min(1).max(5).nullable().default(null),
  comment: z.string().trim().max(1000).nullable().default(null),
});
export type ManualComplete = z.infer<typeof zManualComplete>;

export const zLinkActivity = z.object({ plannedSessionId: zObjectId });
export type LinkActivity = z.infer<typeof zLinkActivity>;

export const zStreamsQuery = z.object({
  points: z.coerce.number().int().min(50).max(20_000).default(600),
  series: z.string().max(100).optional(),
});
export type StreamsQuery = z.infer<typeof zStreamsQuery>;

export const zStreams = z.object({
  activityId: zObjectId,
  sampleCount: z.number().int(),
  tSec: z.array(z.number()),
  hrBpm: z.array(z.number().nullable()).nullable(),
  speedMps: z.array(z.number().nullable()).nullable(),
  gapSpeedMps: z.array(z.number().nullable()).nullable(),
  altM: z.array(z.number().nullable()).nullable(),
  cadenceSpm: z.array(z.number().nullable()).nullable(),
});
export type Streams = z.infer<typeof zStreams>;
