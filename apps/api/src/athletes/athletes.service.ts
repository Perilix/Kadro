import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { AthleteProfileSetup, Goal } from '@kadro/shared';
import { Athlete, AthleteDocument } from './athlete.schema';

@Injectable()
export class AthletesService {
  constructor(@InjectModel(Athlete.name) private readonly model: Model<Athlete>) {}

  findByUserId(userId: Types.ObjectId): Promise<AthleteDocument | null> {
    return this.model.findOne({ userId }).exec();
  }

  countActive(teamId: Types.ObjectId): Promise<number> {
    return this.model.countDocuments({ teamId, status: 'active' }).exec();
  }

  createFromJoin(params: {
    userId: Types.ObjectId;
    teamId: Types.ObjectId;
    coachId: Types.ObjectId;
    profile: AthleteProfileSetup;
    goal: Goal | null;
  }): Promise<AthleteDocument> {
    const { userId, teamId, coachId, profile, goal } = params;
    return this.model.create({
      userId,
      teamId,
      coachId,
      profile: {
        vmaKmh: profile.vmaKmh,
        vmaSource: profile.vmaKmh != null ? 'declared' : null,
        vmaUpdatedAt: profile.vmaKmh != null ? new Date() : null,
        hrMaxBpm: profile.hrMaxBpm,
        hrRestBpm: null,
        weightKg: profile.weightKg,
        availableDays: profile.availableDays,
        sports: profile.sports,
        injuriesNote: profile.injuriesNote,
      },
      goal: goal
        ? {
            label: goal.label,
            date: goal.date,
            targetTime: goal.targetTime,
            referenceTime: goal.referenceTime,
            planWeeks: null,
            currentPhase: null,
          }
        : null,
    });
  }
}
