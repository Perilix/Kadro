import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { Locale, UserRole } from '@kadro/shared';

export interface NotificationPrefs {
  push: boolean;
  email: boolean;
  /** 'HH:mm' local (athlète) — rappel du check-in. */
  checkinReminder: string | null;
}

@Schema({ collection: 'users', timestamps: { createdAt: true, updatedAt: false } })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true, enum: ['coach', 'athlete'] })
  role!: UserRole;

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ enum: ['fr', 'de', 'en'], default: 'fr' })
  locale!: Locale;

  @Prop({ default: 'Europe/Paris' })
  timezone!: string;

  @Prop({ type: Object, default: { push: true, email: true, checkinReminder: null } })
  notificationPrefs!: NotificationPrefs;

  @Prop({ type: [Object], default: [] })
  pushTokens!: { expoToken: string; platform: 'ios' | 'android'; addedAt: Date }[];

  @Prop({ type: String, default: null })
  refreshTokenHash!: string | null;

  @Prop({ type: Date, default: null })
  lastLoginAt!: Date | null;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
