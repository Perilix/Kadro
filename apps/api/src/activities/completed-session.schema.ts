import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { ActivitySource, ActivitySport } from '@kadro/shared';

export interface Lap {
  idx: number;
  kind: 'warmup' | 'work' | 'recovery' | 'cooldown' | 'lap';
  durationSec: number;
  distanceM: number | null;
  avgPaceSecPerKm: number | null;
  avgHrBpm: number | null;
  endHrBpm: number | null;
  targetDeltaSec: number | null;
}

export interface KmSplit {
  km: number;
  paceSecPerKm: number;
  gapPaceSecPerKm: number | null;
  elevDeltaM: number | null;
  avgHrBpm: number | null;
}

export interface BestEffort {
  label: string;
  valueSec: number;
  isRecord: boolean;
  note: string | null;
}

export interface StrengthSetDone {
  reps: number | null;
  kg: number | null;
  durationSec: number | null;
  rpe: number | null;
  done: boolean;
}

export interface StrengthDone {
  exercises: {
    exerciseId: Types.ObjectId;
    name: string;
    prescribed: { sets: number; reps: number | null; kg: number | null } | null;
    sets: StrengthSetDone[];
    note: string | null;
  }[];
  tonnageKg: number;
}

export interface ActivityFeedback {
  rpe: number | null;
  feeling: number | null;
  comment: string | null;
  submittedAt: Date;
}

@Schema({ collection: 'completed_sessions', timestamps: { createdAt: true, updatedAt: false } })
export class CompletedSession {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Team' })
  teamId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Athlete' })
  athleteId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null })
  plannedSessionId!: Types.ObjectId | null;

  @Prop({ required: true })
  source!: ActivitySource;

  @Prop({ type: String, default: null })
  externalId!: string | null;

  @Prop({ type: String, default: null })
  deviceName!: string | null;

  @Prop({ required: true, enum: ['run', 'trail', 'strength', 'bike', 'other'] })
  sport!: ActivitySport;

  @Prop({ type: Date, required: true })
  startedAt!: Date;

  @Prop({ default: 'Europe/Paris' })
  timezone!: string;

  @Prop({ required: true })
  durationSec!: number;

  @Prop({ type: Number, default: null })
  distanceM!: number | null;

  @Prop({ type: Number, default: null })
  elevGainM!: number | null;

  @Prop({ type: Number, default: null })
  elevLossM!: number | null;

  @Prop({ type: Number, default: null })
  avgPaceSecPerKm!: number | null;

  @Prop({ type: Number, default: null })
  gapAvgPaceSecPerKm!: number | null;

  @Prop({ type: Number, default: null })
  avgHrBpm!: number | null;

  @Prop({ type: Number, default: null })
  maxHrBpm!: number | null;

  @Prop({ type: Number, default: null })
  avgCadenceSpm!: number | null;

  @Prop({ type: Number, default: null })
  ascentSpeedMPerH!: number | null;

  @Prop({ type: [Number], default: null })
  hrZonesSec!: [number, number, number, number, number] | null;

  @Prop({ type: [Object], default: null })
  laps!: Lap[] | null;

  @Prop({ type: [Object], default: null })
  kmSplits!: KmSplit[] | null;

  @Prop({ type: [Object], default: [] })
  bestEfforts!: BestEffort[];

  @Prop({ type: Object, default: null })
  strength!: StrengthDone | null;

  @Prop({ type: Number, default: null })
  loadUa!: number | null;

  @Prop({ type: Object, default: null })
  feedback!: ActivityFeedback | null;

  @Prop({ default: false })
  hasStreams!: boolean;

  @Prop({ type: Date, required: true })
  syncedAt!: Date;
}

export type CompletedSessionDocument = HydratedDocument<CompletedSession>;
export const CompletedSessionSchema = SchemaFactory.createForClass(CompletedSession);
CompletedSessionSchema.index({ athleteId: 1, startedAt: -1 });
CompletedSessionSchema.index({ teamId: 1, startedAt: -1 });
CompletedSessionSchema.index({ plannedSessionId: 1 });
CompletedSessionSchema.index(
  { source: 1, externalId: 1 },
  { unique: true, partialFilterExpression: { externalId: { $type: 'string' } } },
);
