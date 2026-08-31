import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'activity_streams', timestamps: { createdAt: true, updatedAt: false } })
export class ActivityStream {
  @Prop({ type: Types.ObjectId, required: true })
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Athlete' })
  athleteId!: Types.ObjectId;

  @Prop({ required: true })
  sampleCount!: number;

  @Prop({ type: [Number], required: true })
  tSec!: number[];

  @Prop({ type: [Number], default: [] })
  hrBpm!: (number | null)[];

  @Prop({ type: [Number], default: [] })
  speedMps!: (number | null)[];

  @Prop({ type: [Number], default: null })
  gapSpeedMps!: (number | null)[] | null;

  @Prop({ type: [Number], default: null })
  altM!: (number | null)[] | null;

  @Prop({ type: [Number], default: null })
  cadenceSpm!: (number | null)[] | null;

  @Prop({ type: [[Number]], default: null })
  latLng!: [number, number][] | null;
}

export type ActivityStreamDocument = HydratedDocument<ActivityStream>;
export const ActivityStreamSchema = SchemaFactory.createForClass(ActivityStream);
