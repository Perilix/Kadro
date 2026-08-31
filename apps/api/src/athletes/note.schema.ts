import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'notes', timestamps: { createdAt: true, updatedAt: false } })
export class Note {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Team' })
  teamId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Athlete' })
  athleteId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  authorId!: Types.ObjectId;

  @Prop({ required: true })
  date!: string;

  @Prop({ required: true })
  text!: string;

  @Prop({ type: Date, default: null })
  updatedAt!: Date | null;
}

export type NoteDocument = HydratedDocument<Note>;
export const NoteSchema = SchemaFactory.createForClass(Note);
NoteSchema.index({ athleteId: 1, date: -1 });
