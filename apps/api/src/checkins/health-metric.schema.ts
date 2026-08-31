import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { Provider } from '@kadro/shared';

export interface HealthMetricSources {
  sleep?: Provider;
  restingHr?: Provider;
  hrv?: Provider;
  weight?: Provider | 'manual';
}

@Schema({ collection: 'health_metrics' })
export class HealthMetric {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Athlete' })
  athleteId!: Types.ObjectId;

  @Prop({ required: true })
  date!: string;

  @Prop({ type: Number, default: null })
  sleepMin!: number | null;

  @Prop({ type: Number, default: null })
  restingHrBpm!: number | null;

  @Prop({ type: Number, default: null })
  hrvRmssdMs!: number | null;

  @Prop({ type: Number, default: null })
  weightKg!: number | null;

  @Prop({ type: Object, default: {} })
  sources!: HealthMetricSources;

  @Prop({ type: Date, required: true })
  syncedAt!: Date;
}

export type HealthMetricDocument = HydratedDocument<HealthMetric>;
export const HealthMetricSchema = SchemaFactory.createForClass(HealthMetric);
HealthMetricSchema.index({ athleteId: 1, date: 1 }, { unique: true });
