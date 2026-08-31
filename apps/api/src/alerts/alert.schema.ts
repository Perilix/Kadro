import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { AlertKind, AlertSeverity, AlertStatus } from '@kadro/shared';

export interface AlertRefs {
  plannedSessionId?: Types.ObjectId;
  checkinId?: Types.ObjectId;
}

@Schema({ collection: 'alerts', timestamps: { createdAt: true, updatedAt: false } })
export class Alert {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Team' })
  teamId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Athlete' })
  athleteId!: Types.ObjectId;

  @Prop({ required: true })
  kind!: AlertKind;

  @Prop({ required: true, enum: ['info', 'warn', 'critical'] })
  severity!: AlertSeverity;

  @Prop({ required: true })
  i18nKey!: string;

  @Prop({ type: Object, default: {} })
  params!: Record<string, string | number>;

  @Prop({ type: String, default: null })
  suggestedAction!: string | null;

  @Prop({ type: Object, default: {} })
  refs!: AlertRefs;

  @Prop({ enum: ['open', 'resolved', 'dismissed'], default: 'open' })
  status!: AlertStatus;

  @Prop({ type: Date, default: null })
  resolvedAt!: Date | null;

  @Prop({ type: Types.ObjectId, default: null })
  resolvedById!: Types.ObjectId | null;
}

export type AlertDocument = HydratedDocument<Alert>;
export const AlertSchema = SchemaFactory.createForClass(Alert);
AlertSchema.index({ teamId: 1, status: 1, createdAt: -1 });
AlertSchema.index(
  { athleteId: 1, kind: 1 },
  { unique: true, partialFilterExpression: { status: 'open' } },
);
