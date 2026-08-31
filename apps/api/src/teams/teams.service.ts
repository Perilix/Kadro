import { randomInt } from 'node:crypto';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { INVITE_CODE_ALPHABET } from '@kadro/shared';
import { Team, TeamDocument } from './team.schema';

const TRIAL_DAYS = 14;
const TRIAL_ATHLETE_LIMIT = 25;

@Injectable()
export class TeamsService {
  constructor(@InjectModel(Team.name) private readonly model: Model<Team>) {}

  findById(id: string | Types.ObjectId): Promise<TeamDocument | null> {
    return this.model.findById(id).exec();
  }

  findByInviteCode(code: string): Promise<TeamDocument | null> {
    return this.model.findOne({ inviteCode: code.toUpperCase() }).exec();
  }

  /** Équipe d'un coach (v1 : une seule par coach). */
  findByCoachId(coachId: Types.ObjectId): Promise<TeamDocument | null> {
    return this.model.findOne({ coachIds: coachId }).exec();
  }

  async createForCoach(ownerId: Types.ObjectId, name: string): Promise<TeamDocument> {
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 3600 * 1000);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.model.create({
          name,
          ownerId,
          coachIds: [ownerId],
          inviteCode: generateInviteCode(),
          subscription: {
            plan: 'trial',
            status: 'trialing',
            athleteLimit: TRIAL_ATHLETE_LIMIT,
            coachLimit: 1,
            interval: null,
            trialEndsAt,
            currentPeriodEnd: null,
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            extraAthletes: 0,
          },
        });
      } catch (err) {
        if (!isDuplicateKeyError(err)) throw err; // collision de code : on retente
      }
    }
    throw new ConflictException({ code: 'team.invite_code_collision' });
  }

  async rotateInviteCode(teamId: Types.ObjectId): Promise<TeamDocument> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const updated = await this.model
          .findByIdAndUpdate(teamId, { $set: { inviteCode: generateInviteCode() } }, { new: true })
          .exec();
        if (!updated) throw new ConflictException({ code: 'team.not_found' });
        return updated;
      } catch (err) {
        if (!isDuplicateKeyError(err)) throw err;
      }
    }
    throw new ConflictException({ code: 'team.invite_code_collision' });
  }
}

/** 'KDR-' + 4 caractères sans ambiguïté (pas de O/0/I/1) — ex. KDR-7K2M. */
export function generateInviteCode(): string {
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)];
  }
  return `KDR-${suffix}`;
}

export function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}
