import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import type {
  Assign,
  PlannedSession as PlannedSessionDto,
  PlannedSessionDetail,
  PlannedSessionUpdate,
  PreviewRequest,
  ResolvedPreview,
  RunBlock,
  SessionsQuery,
  SessionTemplateCreate,
  StrengthItem,
} from '@kadro/shared';
import {
  estimateRunDurationSec,
  estimateStrengthDurationSec,
  loadFromPctRm,
  resolveRunPaces,
  sessionLoadUa,
} from '@kadro/shared';
import { Athlete, AthleteDocument } from '../athletes/athlete.schema';
import { Test } from '../athletes/test.schema';
import { TemplatesService } from '../library/templates.service';
import { ExercisesService } from '../library/exercises.service';
import {
  PlannedSession,
  PlannedSessionDocument,
  ResolvedSnapshot,
} from './planned-session.schema';

interface SessionContent {
  type: SessionTemplateCreate['type'];
  name: string;
  category: SessionTemplateCreate['category'];
  expectedDifficulty: number;
  instructions: string | null;
  estDurationMin: number | null;
  blocks: RunBlock[] | null;
  exercises: StrengthItem[] | null;
  templateId: Types.ObjectId | null;
}

@Injectable()
export class PlanningService {
  constructor(
    @InjectModel(PlannedSession.name) private readonly model: Model<PlannedSession>,
    @InjectModel(Athlete.name) private readonly athletes: Model<Athlete>,
    @InjectModel(Test.name) private readonly tests: Model<Test>,
    private readonly templates: TemplatesService,
    private readonly exercises: ExercisesService,
  ) {}

  async assign(
    teamId: Types.ObjectId,
    coachId: Types.ObjectId,
    dto: Assign,
  ): Promise<PlannedSessionDto[]> {
    const content = await this.resolveContent(teamId, coachId, dto);
    const athleteIds = dto.athleteIds.map((id) => new Types.ObjectId(id));
    const athletes = await this.athletes
      .find({ _id: { $in: athleteIds }, teamId, status: 'active' })
      .exec();
    if (athletes.length !== athleteIds.length) {
      throw new BadRequestException({ code: 'athlete.not_found' });
    }

    const assignmentId = new Types.ObjectId();
    const docs = await Promise.all(
      athletes.map(async (athlete) =>
        this.model.create({
          teamId,
          athleteId: athlete._id,
          coachId,
          assignmentId,
          templateId: content.templateId,
          date: dto.date,
          type: content.type,
          name: content.name,
          category: content.category,
          expectedDifficulty: content.expectedDifficulty,
          instructions: content.instructions,
          blocks: content.blocks,
          exercises: content.exercises,
          resolved: await this.resolveFor(athlete, content),
        }),
      ),
    );
    return docs.map(toSessionDto);
  }

  async preview(teamId: Types.ObjectId, dto: PreviewRequest): Promise<ResolvedPreview> {
    const athlete = await this.athletes
      .findOne({ _id: new Types.ObjectId(dto.athleteId), teamId })
      .exec();
    if (!athlete) throw new NotFoundException({ code: 'athlete.not_found' });
    const resolved = await this.resolveFor(athlete, {
      type: dto.blocks ? 'run' : 'strength',
      expectedDifficulty: dto.expectedDifficulty,
      estDurationMin: dto.estDurationMin,
      blocks: dto.blocks,
      exercises: dto.exercises,
    });
    return {
      vmaKmh: resolved.vmaKmh,
      hrMaxBpm: resolved.hrMaxBpm,
      paces: resolved.paces,
      loads: resolved.loads?.map((l) => ({ ...l, exerciseId: l.exerciseId.toString() })) ?? null,
      estDurationMin: this.estimateDurationMin(athlete, dto),
      estLoadUa: resolved.estLoadUa,
    };
  }

  async list(teamId: Types.ObjectId, query: SessionsQuery): Promise<PlannedSessionDto[]> {
    const filter: FilterQuery<PlannedSession> = {
      teamId,
      date: { $gte: query.from, $lte: query.to },
    };
    if (query.athleteId) filter.athleteId = new Types.ObjectId(query.athleteId);
    else if (query.groupId) {
      const members = await this.athletes
        .find({ teamId, groupIds: new Types.ObjectId(query.groupId) }, { _id: 1 })
        .exec();
      filter.athleteId = { $in: members.map((m) => m._id) };
    }
    const docs = await this.model.find(filter).sort({ date: 1, _id: 1 }).exec();
    return docs.map(toSessionDto);
  }

  async getDetail(teamId: Types.ObjectId, id: Types.ObjectId): Promise<PlannedSessionDetail> {
    return toDetailDto(await this.get(teamId, id));
  }

  async update(
    teamId: Types.ObjectId,
    id: Types.ObjectId,
    dto: PlannedSessionUpdate,
  ): Promise<PlannedSessionDetail> {
    const doc = await this.get(teamId, id);
    if (dto.blocks && doc.type !== 'run') {
      throw new BadRequestException({ code: 'template.content_type_mismatch' });
    }
    if (dto.exercises && doc.type !== 'strength') {
      throw new BadRequestException({ code: 'template.content_type_mismatch' });
    }
    const targets =
      dto.applyToAssignment && doc.assignmentId
        ? await this.model.find({ assignmentId: doc.assignmentId, teamId }).exec()
        : [doc];

    const contentChanged =
      dto.blocks !== undefined || dto.exercises !== undefined || dto.expectedDifficulty !== undefined;

    for (const target of targets) {
      if (dto.name !== undefined && dto.name !== target.name && !target.modification) {
        target.modification = { modifiedAt: new Date(), fromName: target.name };
      }
      if (dto.name !== undefined) target.name = dto.name;
      if (dto.date !== undefined) target.date = dto.date;
      if (dto.expectedDifficulty !== undefined) target.expectedDifficulty = dto.expectedDifficulty;
      if (dto.instructions !== undefined) target.instructions = dto.instructions;
      if (dto.blocks !== undefined) target.blocks = dto.blocks;
      if (dto.exercises !== undefined) target.exercises = dto.exercises;
      if (contentChanged) {
        const athlete = await this.athletes.findById(target.athleteId).exec();
        if (athlete) {
          target.resolved = await this.resolveFor(athlete, {
            type: target.type,
            expectedDifficulty: target.expectedDifficulty,
            estDurationMin: null,
            blocks: target.blocks,
            exercises: target.exercises,
          });
        }
      }
      await target.save();
    }
    return toDetailDto(await this.get(teamId, id));
  }

  async remove(teamId: Types.ObjectId, id: Types.ObjectId, scope: 'one' | 'assignment'): Promise<void> {
    const doc = await this.get(teamId, id);
    if (scope === 'assignment' && doc.assignmentId) {
      await this.model.deleteMany({ assignmentId: doc.assignmentId, teamId }).exec();
    } else {
      await this.model.deleteOne({ _id: doc._id }).exec();
    }
  }

  private async get(teamId: Types.ObjectId, id: Types.ObjectId): Promise<PlannedSessionDocument> {
    const doc = await this.model.findOne({ _id: id, teamId }).exec();
    if (!doc) throw new NotFoundException({ code: 'session.not_found' });
    return doc;
  }

  private async resolveContent(
    teamId: Types.ObjectId,
    coachId: Types.ObjectId,
    dto: Assign,
  ): Promise<SessionContent> {
    if ('templateId' in dto.session) {
      const template = await this.templates.get(teamId, new Types.ObjectId(dto.session.templateId));
      template.usageCount += 1;
      template.lastUsedAt = new Date();
      await template.save();
      return {
        type: template.type,
        name: template.name,
        category: template.category,
        expectedDifficulty: template.expectedDifficulty,
        instructions: template.instructions,
        estDurationMin: template.estDurationMin,
        blocks: template.blocks,
        exercises: template.exercises,
        templateId: template._id,
      };
    }
    const session = dto.session;
    let templateId: Types.ObjectId | null = null;
    if (dto.saveAsTemplate) {
      const created = await this.templates.create(teamId, coachId, session);
      templateId = new Types.ObjectId(created.id);
    } else if (session.exercises?.length) {
      const ids = [...new Set(session.exercises.map((i) => i.exerciseId))].map(
        (id) => new Types.ObjectId(id),
      );
      if ((await this.exercises.countUsable(teamId, ids)) !== ids.length) {
        throw new BadRequestException({ code: 'exercise.not_found' });
      }
    }
    return {
      type: session.type,
      name: session.name,
      category: session.category,
      expectedDifficulty: session.expectedDifficulty,
      instructions: session.instructions,
      estDurationMin: session.estDurationMin,
      blocks: session.blocks,
      exercises: session.exercises,
      templateId,
    };
  }

  private async resolveFor(
    athlete: AthleteDocument,
    content: Pick<SessionContent, 'type' | 'expectedDifficulty' | 'estDurationMin' | 'blocks' | 'exercises'>,
  ): Promise<ResolvedSnapshot> {
    const vmaKmh = athlete.profile.vmaKmh;
    const paces = content.blocks ? resolveRunPaces(content.blocks, vmaKmh) : null;
    const loads = content.exercises ? await this.resolveLoads(athlete._id, content.exercises) : null;
    const durationSec = this.estimateDurationSec(vmaKmh, content);
    return {
      vmaKmh,
      hrMaxBpm: athlete.profile.hrMaxBpm,
      paces,
      loads,
      estLoadUa: durationSec ? sessionLoadUa(durationSec / 60, content.expectedDifficulty) : null,
      resolvedAt: new Date(),
    };
  }

  private async resolveLoads(
    athleteId: Types.ObjectId,
    items: StrengthItem[],
  ): Promise<ResolvedSnapshot['loads']> {
    const pctItems = items.filter((i) => i.load.type === 'pctRm');
    if (pctItems.length === 0) return [];
    const ids = [...new Set(pctItems.map((i) => i.exerciseId))].map((id) => new Types.ObjectId(id));
    const rms = await this.tests
      .aggregate<{ _id: Types.ObjectId; kg: number }>([
        { $match: { athleteId, kind: 'one_rm', 'oneRm.exerciseId': { $in: ids } } },
        { $sort: { date: -1 } },
        { $group: { _id: '$oneRm.exerciseId', kg: { $first: '$oneRm.kg' } } },
      ])
      .exec();
    const rmByExercise = new Map(rms.map((r) => [r._id.toString(), r.kg]));
    const loads: NonNullable<ResolvedSnapshot['loads']> = [];
    for (const item of pctItems) {
      const rm = rmByExercise.get(item.exerciseId);
      if (rm != null && item.load.type === 'pctRm') {
        loads.push({
          exerciseId: new Types.ObjectId(item.exerciseId),
          kg: loadFromPctRm(rm, item.load.pct),
          rmSourceKg: rm,
        });
      }
    }
    return loads;
  }

  private estimateDurationSec(
    vmaKmh: number | null,
    content: Pick<SessionContent, 'estDurationMin' | 'blocks' | 'exercises'>,
  ): number | null {
    if (content.estDurationMin != null) return content.estDurationMin * 60;
    if (content.blocks) return estimateRunDurationSec(content.blocks, vmaKmh);
    if (content.exercises) return estimateStrengthDurationSec(content.exercises);
    return null;
  }

  private estimateDurationMin(athlete: AthleteDocument, dto: PreviewRequest): number | null {
    const sec = this.estimateDurationSec(athlete.profile.vmaKmh, {
      estDurationMin: dto.estDurationMin,
      blocks: dto.blocks,
      exercises: dto.exercises,
    });
    return sec != null ? Math.round(sec / 60) : null;
  }
}

function toSessionDto(doc: PlannedSessionDocument): PlannedSessionDto {
  const timestamps = doc as unknown as { createdAt: Date; updatedAt: Date };
  return {
    id: doc._id.toString(),
    athleteId: doc.athleteId.toString(),
    coachId: doc.coachId.toString(),
    assignmentId: doc.assignmentId?.toString() ?? null,
    templateId: doc.templateId?.toString() ?? null,
    date: doc.date,
    type: doc.type,
    name: doc.name,
    category: doc.category,
    expectedDifficulty: doc.expectedDifficulty,
    status: doc.status,
    watchPush: {
      state: doc.watchPush.state,
      provider: doc.watchPush.provider,
      sentAt: doc.watchPush.sentAt?.toISOString() ?? null,
    },
    modification: doc.modification
      ? { modifiedAt: doc.modification.modifiedAt.toISOString(), fromName: doc.modification.fromName }
      : null,
    createdAt: timestamps.createdAt.toISOString(),
    updatedAt: timestamps.updatedAt.toISOString(),
  };
}

function toDetailDto(doc: PlannedSessionDocument): PlannedSessionDetail {
  return {
    ...toSessionDto(doc),
    instructions: doc.instructions,
    blocks: doc.blocks,
    exercises: doc.exercises,
    resolved: doc.resolved
      ? {
          vmaKmh: doc.resolved.vmaKmh,
          hrMaxBpm: doc.resolved.hrMaxBpm,
          paces: doc.resolved.paces,
          loads:
            doc.resolved.loads?.map((l) => ({
              exerciseId: l.exerciseId.toString(),
              kg: l.kg,
              rmSourceKg: l.rmSourceKg,
            })) ?? null,
          estLoadUa: doc.resolved.estLoadUa,
          resolvedAt: doc.resolved.resolvedAt.toISOString(),
        }
      : null,
    completedSessionId: doc.completedSessionId?.toString() ?? null,
  };
}
