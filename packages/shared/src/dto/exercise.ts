import { z } from 'zod';
import { zObjectId } from './common';

export const zLoadType = z.enum(['weight', 'bodyweight', 'duration']);
export type LoadType = z.infer<typeof zLoadType>;

export const zExercise = z.object({
  id: zObjectId,
  name: z.string(),
  nameKey: z.string().nullable(),
  muscleGroups: z.array(z.string()),
  equipment: z.array(z.string()),
  loadType: zLoadType,
  unilateral: z.boolean(),
  archived: z.boolean(),
  custom: z.boolean(),
});
export type Exercise = z.infer<typeof zExercise>;

export const zExerciseCreate = z.object({
  name: z.string().trim().min(1).max(80),
  muscleGroups: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  equipment: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  loadType: zLoadType.default('weight'),
  unilateral: z.boolean().default(false),
});
export type ExerciseCreate = z.infer<typeof zExerciseCreate>;

export const zExerciseUpdate = zExerciseCreate.partial().extend({
  archived: z.boolean().optional(),
});
export type ExerciseUpdate = z.infer<typeof zExerciseUpdate>;

export const zExerciseQuery = z.object({
  q: z.string().trim().max(60).optional(),
  muscleGroup: z.string().trim().max(40).optional(),
  equipment: z.string().trim().max(40).optional(),
});
export type ExerciseQuery = z.infer<typeof zExerciseQuery>;
