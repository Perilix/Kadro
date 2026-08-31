import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { FormStatus, Sport } from '@kadro/shared';
import type { AlertThresholds } from '../teams/team.schema';

export interface AthleteProfile {
  vmaKmh: number | null;
  vmaSource: 'declared' | 'test' | null;
  vmaUpdatedAt: Date | null;
  hrMaxBpm: number | null;
  hrRestBpm: number | null;
  weightKg: number | null;
  /** 0 = lundi … 6 = dimanche. */
  availableDays: number[];
  sports: Sport[];
  injuriesNote: string | null;
}

export interface AthleteGoal {
  label: string;
  date: string | null;
  targetTime: string | null;
  referenceTime: string | null;
  planWeeks: number | null;
  currentPhase: 'general' | 'specific' | 'race' | 'taper' | null;
}

export interface PersonalRecord {
  distance: string;
  time: string;
  when: string;
}

/** Caches de liste — recalculés par jobs, jamais saisis (docs/SCHEMA.md §4). */
export interface AthleteSnapshot {
  formStatus: FormStatus;
  formStatusSince: string | null;
  adherence7d: number | null;
  adherence28d: number | null;
  load7dUa: number | null;
  acuteChronicRatio: number | null;
  volume7dKm: number | null;
  sleepAvg7dMin: number | null;
  lastActivityAt: Date | null;
  nextSessionDate: string | null;
  updatedAt: Date;
}

@Schema({ collection: 'athletes', timestamps: { createdAt: 'joinedAt', updatedAt: false } })
export class Athlete {
  @Prop({ type: Types.ObjectId, required: true, unique: true, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true, ref: 'Team' })
  teamId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  coachId!: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], default: [], ref: 'Group' })
  groupIds!: Types.ObjectId[];

  @Prop({ enum: ['active', 'archived'], default: 'active' })
  status!: 'active' | 'archived';

  @Prop({ type: Object, required: true })
  profile!: AthleteProfile;

  @Prop({ type: Object, default: null })
  goal!: AthleteGoal | null;

  @Prop({ type: [Object], default: [] })
  personalRecords!: PersonalRecord[];

  @Prop({ type: Object, default: null })
  alertOverrides!: Partial<AlertThresholds> | null;

  @Prop({
    type: Object,
    default: {
      formStatus: 'none',
      formStatusSince: null,
      adherence7d: null,
      adherence28d: null,
      load7dUa: null,
      acuteChronicRatio: null,
      volume7dKm: null,
      sleepAvg7dMin: null,
      lastActivityAt: null,
      nextSessionDate: null,
      updatedAt: new Date(0),
    },
  })
  snapshot!: AthleteSnapshot;
}

export type AthleteDocument = HydratedDocument<Athlete>;
export const AthleteSchema = SchemaFactory.createForClass(Athlete);
AthleteSchema.index({ teamId: 1, status: 1 });
