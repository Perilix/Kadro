import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export interface Subscription {
  plan: 'trial' | 'solo' | 'coach' | 'structure';
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  athleteLimit: number;
  coachLimit: number;
  interval: 'month' | 'year' | null;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  extraAthletes: number;
}

/** Seuils d'alerte — défauts d'équipe, surchargés par athlète (docs/SCHEMA.md §10). */
export interface AlertThresholds {
  redFeelingStreakDays: number;
  missedSessionAlert: boolean;
  noActivityDays: number;
  noCheckinDays: number;
  sleepLowMin: number;
  sleepLowDays: number;
  restingHrDeltaBpm: number;
  hrvDropPct: number;
  acuteChronicMax: number;
}

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  redFeelingStreakDays: 2,
  missedSessionAlert: true,
  noActivityDays: 3,
  noCheckinDays: 7,
  sleepLowMin: 360,
  sleepLowDays: 3,
  restingHrDeltaBpm: 5,
  hrvDropPct: 20,
  acuteChronicMax: 1.3,
};

export interface WatchPushSettings {
  enabled: boolean;
  /** 'HH:mm' — la veille, heure locale de l'athlète. */
  sendLocalTime: string;
  resendOnUpdate: boolean;
  autoImportCompleted: boolean;
}

@Schema({ collection: 'teams', timestamps: { createdAt: true, updatedAt: false } })
export class Team {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  ownerId!: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], required: true, ref: 'User', index: true })
  coachIds!: Types.ObjectId[];

  @Prop({ required: true, unique: true })
  inviteCode!: string;

  @Prop({ type: Object, required: true })
  subscription!: Subscription;

  @Prop({ type: Object, default: DEFAULT_ALERT_THRESHOLDS })
  alertDefaults!: AlertThresholds;

  @Prop({
    type: Object,
    default: { enabled: true, sendLocalTime: '20:00', resendOnUpdate: true, autoImportCompleted: true },
  })
  watchPush!: WatchPushSettings;
}

export type TeamDocument = HydratedDocument<Team>;
export const TeamSchema = SchemaFactory.createForClass(Team);
