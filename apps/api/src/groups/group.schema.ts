import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'groups', timestamps: { createdAt: true, updatedAt: false } })
export class Group {
  @Prop({ type: Types.ObjectId, required: true, index: true, ref: 'Team' })
  teamId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true })
  order!: number;
}

export type GroupDocument = HydratedDocument<Group>;
export const GroupSchema = SchemaFactory.createForClass(Group);
