import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'conversations' })
export class Conversation {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Team' })
  teamId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  coachId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Athlete' })
  athleteId!: Types.ObjectId;

  @Prop({ type: Date, default: null })
  lastMessageAt!: Date | null;

  @Prop({ default: '' })
  lastMessagePreview!: string;

  @Prop({ default: 0 })
  unreadByCoach!: number;

  @Prop({ default: 0 })
  unreadByAthlete!: number;
}

export type ConversationDocument = HydratedDocument<Conversation>;
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ coachId: 1, lastMessageAt: -1 });
ConversationSchema.index({ athleteId: 1 });
ConversationSchema.index({ teamId: 1, athleteId: 1, coachId: 1 }, { unique: true });
