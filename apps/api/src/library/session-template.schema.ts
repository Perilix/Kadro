import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { RunBlock, SessionCategory, SessionType, StrengthItem } from '@kadro/shared';

@Schema({ collection: 'session_templates', timestamps: true })
export class SessionTemplate {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Team' })
  teamId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  createdById!: Types.ObjectId;

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

  @Prop({ type: Number, default: null })
  estDurationMin!: number | null;

  @Prop({ type: Number, default: null })
  estDistanceKm!: number | null;

  @Prop({ type: [Object], default: null })
  blocks!: RunBlock[] | null;

  @Prop({ type: [Object], default: null })
  exercises!: StrengthItem[] | null;

  @Prop({ default: 0 })
  usageCount!: number;

  @Prop({ type: Date, default: null })
  lastUsedAt!: Date | null;

  @Prop({ default: false })
  archived!: boolean;
}

export type SessionTemplateDocument = HydratedDocument<SessionTemplate>;
export const SessionTemplateSchema = SchemaFactory.createForClass(SessionTemplate);
SessionTemplateSchema.index({ teamId: 1, type: 1, archived: 1 });
