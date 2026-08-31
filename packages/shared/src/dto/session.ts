import { z } from 'zod';
import { zIsoInstant, zObjectId } from './common';

export const zRunTarget = z.union([
  z
    .object({ type: z.literal('vmaPct'), minPct: z.number().min(30).max(130), maxPct: z.number().min(30).max(130) })
    .refine((t) => t.minPct <= t.maxPct, { message: 'minPct > maxPct' }),
  z.object({ type: z.literal('zone'), zone: z.number().int().min(1).max(5) }),
  z
    .object({
      type: z.literal('pace'),
      minSecPerKm: z.number().min(100).max(1200),
      maxSecPerKm: z.number().min(100).max(1200),
    })
    .refine((t) => t.minSecPerKm <= t.maxSecPerKm, { message: 'minSecPerKm > maxSecPerKm' }),
  z.object({ type: z.literal('racePace'), race: z.enum(['10k', 'half', 'marathon']) }),
  z.object({ type: z.literal('free') }),
]);
export type RunTarget = z.infer<typeof zRunTarget>;

export const zRunStep = z
  .object({
    kind: z.enum(['warmup', 'work', 'recovery', 'cooldown']),
    durationSec: z.number().int().min(10).max(4 * 3600).nullable().default(null),
    distanceM: z.number().int().min(50).max(100_000).nullable().default(null),
    target: zRunTarget,
    note: z.string().trim().max(200).nullable().default(null),
  })
  .refine((s) => s.durationSec != null || s.distanceM != null, {
    message: 'durationSec ou distanceM requis',
  });
export type RunStep = z.infer<typeof zRunStep>;

export const zRunRepeat = z.object({
  kind: z.literal('repeat'),
  count: z.number().int().min(2).max(50),
  children: z.array(zRunStep).min(1).max(10),
});
export type RunRepeat = z.infer<typeof zRunRepeat>;

export const zRunBlock = z.union([zRunStep, zRunRepeat]);
export type RunBlock = z.infer<typeof zRunBlock>;

export const zStrengthLoad = z.discriminatedUnion('type', [
  z.object({ type: z.literal('pctRm'), pct: z.number().min(10).max(120) }),
  z.object({ type: z.literal('absolute'), kg: z.number().min(0.5).max(500) }),
  z.object({ type: z.literal('bodyweight') }),
]);
export type StrengthLoad = z.infer<typeof zStrengthLoad>;

export const zStrengthItem = z
  .object({
    exerciseId: zObjectId,
    order: z.number().int().min(0),
    sets: z.number().int().min(1).max(20),
    reps: z.number().int().min(1).max(100).nullable().default(null),
    durationSec: z.number().int().min(5).max(600).nullable().default(null),
    perSide: z.boolean().default(false),
    load: zStrengthLoad,
    restSec: z.number().int().min(0).max(600).default(90),
    supersetGroup: z.number().int().min(0).nullable().default(null),
    note: z.string().trim().max(200).nullable().default(null),
  })
  .refine((i) => i.reps != null || i.durationSec != null, { message: 'reps ou durationSec requis' });
export type StrengthItem = z.infer<typeof zStrengthItem>;

export const zSessionType = z.enum(['run', 'strength']);
export type SessionType = z.infer<typeof zSessionType>;

export const zSessionCategory = z.enum([
  'endurance',
  'vma',
  'threshold',
  'race_pace',
  'hills',
  'strength',
  'other',
]);
export type SessionCategory = z.infer<typeof zSessionCategory>;

const zTemplateBase = z.object({
  type: zSessionType,
  name: z.string().trim().min(1).max(80),
  category: zSessionCategory,
  expectedDifficulty: z.number().int().min(1).max(10),
  instructions: z.string().trim().max(500).nullable().default(null),
  estDurationMin: z.number().int().min(1).max(600).nullable().default(null),
  estDistanceKm: z.number().min(0.1).max(200).nullable().default(null),
  blocks: z.array(zRunBlock).min(1).max(30).nullable().default(null),
  exercises: z.array(zStrengthItem).min(1).max(30).nullable().default(null),
});

const contentMatchesType = (t: { type: SessionType; blocks: unknown[] | null; exercises: unknown[] | null }) =>
  t.type === 'run' ? t.blocks != null && t.exercises == null : t.exercises != null && t.blocks == null;

export const zSessionTemplateCreate = zTemplateBase.refine(contentMatchesType, {
  message: 'run → blocks, strength → exercises',
});
export type SessionTemplateCreate = z.infer<typeof zSessionTemplateCreate>;

export const zSessionTemplateUpdate = zTemplateBase
  .omit({ type: true })
  .partial()
  .extend({ archived: z.boolean().optional() });
export type SessionTemplateUpdate = z.infer<typeof zSessionTemplateUpdate>;

export const zSessionTemplate = zTemplateBase.extend({
  id: zObjectId,
  usageCount: z.number().int(),
  lastUsedAt: zIsoInstant.nullable(),
  archived: z.boolean(),
  createdAt: zIsoInstant,
  updatedAt: zIsoInstant,
});
export type SessionTemplate = z.infer<typeof zSessionTemplate>;

export const zSessionTemplateQuery = z.object({
  type: zSessionType.optional(),
  category: zSessionCategory.optional(),
  q: z.string().trim().max(60).optional(),
  archived: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});
export type SessionTemplateQuery = z.infer<typeof zSessionTemplateQuery>;
