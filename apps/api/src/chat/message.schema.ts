import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { MessageType } from '@kadro/shared';

export interface MessageRef {
  plannedSessionId?: Types.ObjectId;
  completedSessionId?: Types.ObjectId;
  templateId?: Types.ObjectId;
}

@Schema({ collection: 'messages' })
export class Message {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Conversation' })
  conversationId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  senderId!: Types.ObjectId;

  @Prop({ required: true, enum: ['text', 'session_card', 'template_card', 'note_card'] })
  type!: MessageType;

  @Prop({ type: String, default: null })
  text!: string | null;

  @Prop({ type: Object, default: null })
  ref!: MessageRef | null;

  @Prop({ type: Date, required: true })
  sentAt!: Date;

  @Prop({ type: Date, default: null })
  readAt!: Date | null;
}

export type MessageDocument = HydratedDocument<Message>;
export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversationId: 1, sentAt: -1 });
