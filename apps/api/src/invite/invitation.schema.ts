import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/** Invitations e-mail nominatives. Le code d'équipe seul suffit pour rejoindre. */
@Schema({ collection: 'invitations' })
export class Invitation {
  @Prop({ type: Types.ObjectId, required: true, index: true, ref: 'Team' })
  teamId!: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: String, default: null })
  name!: string | null;

  @Prop({ enum: ['pending', 'accepted', 'revoked'], default: 'pending' })
  status!: 'pending' | 'accepted' | 'revoked';

  @Prop({ type: Date, default: () => new Date() })
  sentAt!: Date;

  @Prop({ type: Date, default: null })
  remindedAt!: Date | null;

  @Prop({ type: Types.ObjectId, default: null, ref: 'Athlete' })
  acceptedByAthleteId!: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  acceptedAt!: Date | null;
}

export type InvitationDocument = HydratedDocument<Invitation>;
export const InvitationSchema = SchemaFactory.createForClass(Invitation);
InvitationSchema.index({ teamId: 1, email: 1 }, { unique: true });
