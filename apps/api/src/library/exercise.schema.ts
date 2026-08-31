import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { LoadType } from '@kadro/shared';

@Schema({ collection: 'exercises' })
export class Exercise {
  @Prop({ type: Types.ObjectId, default: null, ref: 'Team' })
  teamId!: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  nameKey!: string | null;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: [String], default: [] })
  muscleGroups!: string[];

  @Prop({ type: [String], default: [] })
  equipment!: string[];

  @Prop({ required: true, enum: ['weight', 'bodyweight', 'duration'] })
  loadType!: LoadType;

  @Prop({ default: false })
  unilateral!: boolean;

  @Prop({ default: false })
  archived!: boolean;
}

export type ExerciseDocument = HydratedDocument<Exercise>;
export const ExerciseSchema = SchemaFactory.createForClass(Exercise);
ExerciseSchema.index({ teamId: 1, archived: 1 });
ExerciseSchema.index({ name: 'text' });
