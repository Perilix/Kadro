import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { TestKind } from '@kadro/shared';

export interface OneRmResult {
  exerciseId: Types.ObjectId;
  kg: number;
  method: 'measured' | 'epley_estimated';
}

export interface RaceReference {
  distance: string;
  time: string;
  label: string;
}

@Schema({ collection: 'tests', timestamps: { createdAt: true, updatedAt: false } })
export class Test {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Athlete' })
  athleteId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Team' })
  teamId!: Types.ObjectId;

  @Prop({ required: true, enum: ['vma', 'one_rm', 'race_reference'] })
  kind!: TestKind;

  @Prop({ required: true })
  date!: string;

  @Prop({ type: Number, default: null })
  vmaKmh!: number | null;

  @Prop({ type: Object, default: null })
  oneRm!: OneRmResult | null;

  @Prop({ type: Object, default: null })
  race!: RaceReference | null;

  @Prop({ required: true, enum: ['manual', 'session'] })
  source!: 'manual' | 'session';

  @Prop({ type: String, default: null })
  note!: string | null;
}

export type TestDocument = HydratedDocument<Test>;
export const TestSchema = SchemaFactory.createForClass(Test);
TestSchema.index({ athleteId: 1, kind: 1, date: -1 });
