import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly model: Model<User>) {}

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.model.findOne({ email: email.toLowerCase() }).exec();
  }

  findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.model.findById(id).exec();
  }

  create(data: Partial<User>): Promise<UserDocument> {
    return this.model.create(data);
  }

  async setRefreshTokenHash(userId: Types.ObjectId, hash: string | null): Promise<void> {
    await this.model.updateOne({ _id: userId }, { $set: { refreshTokenHash: hash } }).exec();
  }

  async addPushToken(
    userId: Types.ObjectId,
    expoToken: string,
    platform: 'ios' | 'android',
  ): Promise<void> {
    await this.model
      .updateOne({ _id: userId }, { $pull: { pushTokens: { expoToken } } })
      .exec();
    await this.model
      .updateOne({ _id: userId }, { $push: { pushTokens: { expoToken, platform, addedAt: new Date() } } })
      .exec();
  }

  async removePushToken(userId: Types.ObjectId, expoToken: string): Promise<void> {
    await this.model.updateOne({ _id: userId }, { $pull: { pushTokens: { expoToken } } }).exec();
  }

  async touchLogin(userId: Types.ObjectId): Promise<void> {
    await this.model.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } }).exec();
  }
}
