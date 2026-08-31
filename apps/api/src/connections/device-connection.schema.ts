import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { Provider } from '@kadro/shared';

export interface ConnectionCapabilities {
  pushWorkout: boolean;
  pullActivities: boolean;
  pullSleep: boolean;
  pullHrv: boolean;
  pullWeight: boolean;
}

@Schema({ collection: 'device_connections', timestamps: { createdAt: 'connectedAt', updatedAt: false } })
export class DeviceConnection {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Athlete' })
  athleteId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Team' })
  teamId!: Types.ObjectId;

  @Prop({ required: true })
  provider!: Provider;

  @Prop({ enum: ['connected', 'error', 'revoked'], default: 'connected' })
  status!: 'connected' | 'error' | 'revoked';

  @Prop({ required: true })
  externalUserId!: string;

  @Prop({ required: true })
  accessTokenEnc!: string;

  @Prop({ type: String, default: null })
  refreshTokenEnc!: string | null;

  @Prop({ type: Date, default: null })
  tokenExpiresAt!: Date | null;

  @Prop({ type: [String], default: [] })
  scopes!: string[];

  @Prop({ type: Object, required: true })
  capabilities!: ConnectionCapabilities;

  @Prop({ default: false })
  isPrimaryPush!: boolean;

  @Prop({ type: String, default: null })
  deviceName!: string | null;

  @Prop({ type: Date, default: null })
  lastSyncAt!: Date | null;

  @Prop({ type: Object, default: null })
  lastError!: { at: Date; i18nKey: string } | null;
}

export type DeviceConnectionDocument = HydratedDocument<DeviceConnection>;
export const DeviceConnectionSchema = SchemaFactory.createForClass(DeviceConnection);
DeviceConnectionSchema.index({ athleteId: 1, provider: 1 }, { unique: true });
DeviceConnectionSchema.index({ teamId: 1, status: 1 });
DeviceConnectionSchema.index(
  { athleteId: 1, isPrimaryPush: 1 },
  { unique: true, partialFilterExpression: { isPrimaryPush: true } },
);
