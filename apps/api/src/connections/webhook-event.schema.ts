import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'webhook_events' })
export class WebhookEvent {
  @Prop({ required: true })
  provider!: string;

  @Prop({ required: true })
  externalEventId!: string;

  @Prop({ type: Date, required: true })
  receivedAt!: Date;

  @Prop({ type: Date, default: null })
  processedAt!: Date | null;

  @Prop({ enum: ['received', 'processed', 'failed'], default: 'received' })
  status!: 'received' | 'processed' | 'failed';

  @Prop({ type: String, default: null })
  error!: string | null;
}

export type WebhookEventDocument = HydratedDocument<WebhookEvent>;
export const WebhookEventSchema = SchemaFactory.createForClass(WebhookEvent);
WebhookEventSchema.index({ provider: 1, externalEventId: 1 }, { unique: true });
WebhookEventSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });
