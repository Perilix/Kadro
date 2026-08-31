import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type {
  PlannedSessionStatus,
  Provider,
  RunBlock,
  SessionCategory,
  SessionType,
  StrengthItem,
} from '@kadro/shared';

export interface ResolvedSnapshot {
  vmaKmh: number | null;
  hrMaxBpm: number | null;
  paces: { blockPath: string; minSecPerKm: number; maxSecPerKm: number }[] | null;
  loads: { exerciseId: Types.ObjectId; kg: number; rmSourceKg: number }[] | null;
  estLoadUa: number | null;
  resolvedAt: Date;
}

export interface WatchPushSnapshot {
  state: 'none' | 'scheduled' | 'sent' | 'failed';
  provider: Provider | null;
  sentAt: Date | null;
}

export interface ModificationInfo {
  modifiedAt: Date;
  fromName: string;
}

@Schema({ collection: 'planned_sessions', timestamps: true })
export class PlannedSession {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Team' })
  teamId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Athlete' })
  athleteId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  coachId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null })
  assignmentId!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, default: null, ref: 'SessionTemplate' })
  templateId!: Types.ObjectId | null;

  @Prop({ required: true })
  date!: string;

  @Prop({ required: true, enum: ['run', 'strength'] })
  type!: SessionType;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, enum: ['endurance', 'vma', 'threshold', 'race_pace', 'hills', 'strength', 'other'] })
  category!: SessionCategory;

  @Prop({ required: true, min: 1, max: 10 })
  expectedDifficulty!: number;

  @Prop({ type: String, default: null })
  instructions!: string | null;

  @Prop({ type: [Object], default: null })
  blocks!: RunBlock[] | null;

  @Prop({ type: [Object], default: null })
  exercises!: StrengthItem[] | null;

  @Prop({ type: Object, default: null })
  resolved!: ResolvedSnapshot | null;

  @Prop({ enum: ['planned', 'completed', 'missed', 'canceled'], default: 'planned' })
  status!: PlannedSessionStatus;

  @Prop({ type: Object, default: null })
  modification!: ModificationInfo | null;

  @Prop({ type: Object, default: { state: 'none', provider: null, sentAt: null } })
  watchPush!: WatchPushSnapshot;

  @Prop({ type: Types.ObjectId, default: null })
  completedSessionId!: Types.ObjectId | null;
}

export type PlannedSessionDocument = HydratedDocument<PlannedSession>;
export const PlannedSessionSchema = SchemaFactory.createForClass(PlannedSession);
PlannedSessionSchema.index({ athleteId: 1, date: 1 });
PlannedSessionSchema.index({ teamId: 1, date: 1 });
PlannedSessionSchema.index({ assignmentId: 1 });
PlannedSessionSchema.index({ status: 1, date: 1 });
