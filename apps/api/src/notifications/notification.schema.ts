import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { NotificationKind } from '@kadro/shared';

export interface NotificationRefs {
  athleteId?: Types.ObjectId;
  completedSessionId?: Types.ObjectId;
  conversationId?: Types.ObjectId;
  alertId?: Types.ObjectId;
}

@Schema({ collection: 'notifications', timestamps: { createdAt: true, updatedAt: false } })
export class Notification {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: ['form', 'session', 'message', 'team', 'billing'] })
  kind!: NotificationKind;

  @Prop({ required: true })
  i18nKey!: string;

  @Prop({ type: Object, default: {} })
  params!: Record<string, string | number>;

  @Prop({ type: Object, default: {} })
  refs!: NotificationRefs;

  @Prop({ type: Date, default: null })
  readAt!: Date | null;
}

export type NotificationDocument = HydratedDocument<Notification>;
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, readAt: 1 });
