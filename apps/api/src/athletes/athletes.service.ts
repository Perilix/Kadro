import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PipelineStage, Types } from 'mongoose';
import type {
  Athlete as AthleteDto,
  AthleteListItem,
  AthleteListQuery,
  AthleteProfileSetup,
  AthleteUpdate,
  Goal,
  PaceTable,
  Page,
} from '@kadro/shared';
import { hrZonesFromMax, paceTable } from '@kadro/shared';
import { decodeCursor, encodeCursor, escapeRegex } from '../common/cursor';
import { Group } from '../groups/group.schema';
import type { TeamDocument } from '../teams/team.schema';
import type { UserDocument } from '../users/user.schema';
import { UsersService } from '../users/users.service';
import { Athlete, AthleteDocument } from './athlete.schema';

const FORM_ORDER = ['bad', 'warn', 'good', 'none'];

@Injectable()
export class AthletesService {
  constructor(
    @InjectModel(Athlete.name) private readonly model: Model<Athlete>,
    @InjectModel(Group.name) private readonly groups: Model<Group>,
    private readonly users: UsersService,
  ) {}

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

  async list(teamId: Types.ObjectId, query: AthleteListQuery): Promise<Page<AthleteListItem>> {
    const filter: FilterQuery<Athlete> = { teamId, status: 'active' };
    if (query.groupId) filter.groupIds = new Types.ObjectId(query.groupId);
    if (query.formStatus) filter['snapshot.formStatus'] = query.formStatus;
    else if (query.needsAttention) filter['snapshot.formStatus'] = { $in: ['warn', 'bad'] };

    const offset = decodeCursor(query.cursor);
    const pipeline: PipelineStage[] = [
      { $match: filter },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
    ];
    if (query.q) {
      pipeline.push({
        $match: {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
              regex: escapeRegex(query.q),
              options: 'i',
            },
          },
        },
      });
    }
    pipeline.push(...sortStages(query.sort), { $skip: offset }, { $limit: query.limit + 1 });

    const rows = await this.model.aggregate<RosterRow>(pipeline).exec();
    const hasMore = rows.length > query.limit;
    return {
      items: rows.slice(0, query.limit).map(toListItem),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }

  async getInTeam(teamId: Types.ObjectId, id: Types.ObjectId): Promise<AthleteDocument> {
    const doc = await this.model.findOne({ _id: id, teamId }).exec();
    if (!doc) throw new NotFoundException({ code: 'athlete.not_found' });
    return doc;
  }

  async toDto(doc: AthleteDocument): Promise<AthleteDto> {
    const user = await this.users.findById(doc.userId);
    if (!user) throw new NotFoundException({ code: 'athlete.not_found' });
    return toAthleteDto(doc, user);
  }

  async update(team: TeamDocument, doc: AthleteDocument, dto: AthleteUpdate): Promise<AthleteDto> {
    const set: Record<string, unknown> = {};

    if (dto.profile) {
      for (const [key, value] of Object.entries(dto.profile)) {
        set[`profile.${key}`] = value;
      }
      if ('vmaKmh' in dto.profile) {
        set['profile.vmaSource'] = dto.profile.vmaKmh != null ? 'declared' : null;
        set['profile.vmaUpdatedAt'] = dto.profile.vmaKmh != null ? new Date() : null;
      }
    }
    if (dto.goal !== undefined) set.goal = dto.goal;
    if (dto.personalRecords !== undefined) set.personalRecords = dto.personalRecords;
    if (dto.alertOverrides !== undefined) set.alertOverrides = dto.alertOverrides;

    if (dto.groupIds !== undefined) {
      const ids = dto.groupIds.map((id) => new Types.ObjectId(id));
      const found = await this.groups.countDocuments({ _id: { $in: ids }, teamId: team._id }).exec();
      if (found !== ids.length) throw new BadRequestException({ code: 'group.not_found' });
      set.groupIds = ids;
    }
    if (dto.coachId !== undefined) {
      const coachId = new Types.ObjectId(dto.coachId);
      if (!team.coachIds.some((c) => c.equals(coachId))) {
        throw new BadRequestException({ code: 'team.coach_not_found' });
      }
      set.coachId = coachId;
    }

    const updated = await this.model
      .findOneAndUpdate({ _id: doc._id }, { $set: set }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException({ code: 'athlete.not_found' });
    return this.toDto(updated);
  }

  async setStatus(doc: AthleteDocument, status: 'active' | 'archived'): Promise<AthleteDto> {
    doc.status = status;
    await doc.save();
    return this.toDto(doc);
  }

  paceTableFor(doc: AthleteDocument): PaceTable {
    const { vmaKmh, vmaSource, vmaUpdatedAt, hrMaxBpm } = doc.profile;
    return {
      vmaKmh,
      vmaSource,
      vmaUpdatedAt: vmaUpdatedAt?.toISOString() ?? null,
      rows: vmaKmh != null ? paceTable(vmaKmh) : [],
      hrZones: hrMaxBpm != null ? hrZonesFromMax(hrMaxBpm) : [],
    };
  }

  async applyVmaTest(athleteId: Types.ObjectId, vmaKmh: number, date: string): Promise<void> {
    await this.model
      .updateOne(
        { _id: athleteId },
        {
          $set: {
            'profile.vmaKmh': vmaKmh,
            'profile.vmaSource': 'test',
            'profile.vmaUpdatedAt': new Date(`${date}T00:00:00.000Z`),
          },
        },
      )
      .exec();
  }
}

interface RosterRow {
  _id: Types.ObjectId;
  groupIds: Types.ObjectId[];
  goal: { label: string } | null;
  snapshot: Athlete['snapshot'];
  user: { firstName: string; lastName: string };
}

function sortStages(sort: AthleteListQuery['sort']): PipelineStage[] {
  switch (sort) {
    case 'form':
      return [
        { $addFields: { formRank: { $indexOfArray: [FORM_ORDER, '$snapshot.formStatus'] } } },
        { $sort: { formRank: 1, 'user.firstName': 1, _id: 1 } },
      ];
    case 'lastActivity':
      return [{ $sort: { 'snapshot.lastActivityAt': -1, _id: 1 } }];
    default:
      return [{ $sort: { 'user.firstName': 1, 'user.lastName': 1, _id: 1 } }];
  }
}

function toListItem(row: RosterRow): AthleteListItem {
  const s = row.snapshot;
  return {
    id: row._id.toString(),
    firstName: row.user.firstName,
    lastName: row.user.lastName,
    groupIds: row.groupIds.map((id) => id.toString()),
    goalLabel: row.goal?.label ?? null,
    formStatus: s.formStatus,
    formStatusSince: s.formStatusSince,
    adherence7d: s.adherence7d,
    acuteChronicRatio: s.acuteChronicRatio,
    volume7dKm: s.volume7dKm,
    lastActivityAt: s.lastActivityAt ? new Date(s.lastActivityAt).toISOString() : null,
    nextSessionDate: s.nextSessionDate,
  };
}

function toAthleteDto(doc: AthleteDocument, user: UserDocument): AthleteDto {
  const p = doc.profile;
  const s = doc.snapshot;
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    coachId: doc.coachId.toString(),
    groupIds: doc.groupIds.map((id) => id.toString()),
    status: doc.status,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    profile: {
      vmaKmh: p.vmaKmh,
      vmaSource: p.vmaSource,
      vmaUpdatedAt: p.vmaUpdatedAt?.toISOString() ?? null,
      hrMaxBpm: p.hrMaxBpm,
      hrRestBpm: p.hrRestBpm,
      weightKg: p.weightKg,
      availableDays: p.availableDays,
      sports: p.sports,
      injuriesNote: p.injuriesNote,
    },
    goal: doc.goal,
    personalRecords: doc.personalRecords,
    alertOverrides: doc.alertOverrides,
    snapshot: {
      formStatus: s.formStatus,
      formStatusSince: s.formStatusSince,
      adherence7d: s.adherence7d,
      adherence28d: s.adherence28d,
      load7dUa: s.load7dUa,
      acuteChronicRatio: s.acuteChronicRatio,
      volume7dKm: s.volume7dKm,
      sleepAvg7dMin: s.sleepAvg7dMin,
      lastActivityAt: s.lastActivityAt ? new Date(s.lastActivityAt).toISOString() : null,
      nextSessionDate: s.nextSessionDate,
    },
    joinedAt: (doc as unknown as { joinedAt: Date }).joinedAt.toISOString(),
  };
}
