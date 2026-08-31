import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { CheckinLevel } from '@kadro/shared';

@Schema({ collection: 'checkins' })
export class Checkin {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Athlete' })
  athleteId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Team' })
  teamId!: Types.ObjectId;

  @Prop({ required: true })
  date!: string;

  @Prop({ required: true, min: 1, max: 5 })
  feeling!: number;

  @Prop({ type: Number, default: null })
  sleepMin!: number | null;

  @Prop({ type: Number, default: null })
  soreness!: number | null;

  @Prop({ type: Number, default: null })
  fatigue!: number | null;

  @Prop({ type: Number, default: null })
  mood!: number | null;

  @Prop({ type: String, default: null })
  comment!: string | null;

  @Prop({ required: true, enum: ['good', 'warn', 'bad'] })
  level!: CheckinLevel;

  @Prop({ type: Date, required: true })
  submittedAt!: Date;

  @Prop({ type: Date, default: null })
  updatedAt!: Date | null;
}

export type CheckinDocument = HydratedDocument<Checkin>;
export const CheckinSchema = SchemaFactory.createForClass(Checkin);
CheckinSchema.index({ athleteId: 1, date: 1 }, { unique: true });
CheckinSchema.index({ teamId: 1, date: 1 });
