import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import type {
  SessionTemplate as SessionTemplateDto,
  SessionTemplateCreate,
  SessionTemplateQuery,
  SessionTemplateUpdate,
  StrengthItem,
} from '@kadro/shared';
import { ExercisesService } from './exercises.service';
import { SessionTemplate, SessionTemplateDocument } from './session-template.schema';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(SessionTemplate.name) private readonly model: Model<SessionTemplate>,
    private readonly exercises: ExercisesService,
  ) {}

  async list(teamId: Types.ObjectId, query: SessionTemplateQuery): Promise<SessionTemplateDto[]> {
    const filter: FilterQuery<SessionTemplate> = { teamId, archived: query.archived ?? false };
    if (query.type) filter.type = query.type;
    if (query.category) filter.category = query.category;
    if (query.q) filter.name = { $regex: escapeRegex(query.q), $options: 'i' };
    const docs = await this.model.find(filter).sort({ name: 1 }).exec();
    return docs.map(toTemplateDto);
  }

  async get(teamId: Types.ObjectId, id: Types.ObjectId): Promise<SessionTemplateDocument> {
    const doc = await this.model.findOne({ _id: id, teamId }).exec();
    if (!doc) throw new NotFoundException({ code: 'template.not_found' });
    return doc;
  }

  async getDto(teamId: Types.ObjectId, id: Types.ObjectId): Promise<SessionTemplateDto> {
    return toTemplateDto(await this.get(teamId, id));
  }

  async create(
    teamId: Types.ObjectId,
    createdById: Types.ObjectId,
    dto: SessionTemplateCreate,
  ): Promise<SessionTemplateDto> {
    await this.assertExercisesUsable(teamId, dto.exercises);
    const doc = await this.model.create({ ...dto, teamId, createdById });
    return toTemplateDto(doc);
  }

  async update(
    teamId: Types.ObjectId,
    id: Types.ObjectId,
    dto: SessionTemplateUpdate,
  ): Promise<SessionTemplateDto> {
    const doc = await this.get(teamId, id);
    if (dto.blocks !== undefined && doc.type !== 'run' && dto.blocks !== null) {
      throw new BadRequestException({ code: 'template.content_type_mismatch' });
    }
    if (dto.exercises !== undefined && doc.type !== 'strength' && dto.exercises !== null) {
      throw new BadRequestException({ code: 'template.content_type_mismatch' });
    }
    if (dto.exercises) await this.assertExercisesUsable(teamId, dto.exercises);
    const updated = await this.model
      .findOneAndUpdate({ _id: id, teamId }, { $set: dto }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException({ code: 'template.not_found' });
    return toTemplateDto(updated);
  }

  async remove(teamId: Types.ObjectId, id: Types.ObjectId): Promise<void> {
    const result = await this.model.deleteOne({ _id: id, teamId }).exec();
    if (result.deletedCount === 0) throw new NotFoundException({ code: 'template.not_found' });
  }

  async duplicate(
    teamId: Types.ObjectId,
    createdById: Types.ObjectId,
    id: Types.ObjectId,
  ): Promise<SessionTemplateDto> {
    const doc = await this.get(teamId, id);
    const copy = await this.model.create({
      teamId,
      createdById,
      type: doc.type,
      name: `${doc.name} (copie)`.slice(0, 80),
      category: doc.category,
      expectedDifficulty: doc.expectedDifficulty,
      instructions: doc.instructions,
      estDurationMin: doc.estDurationMin,
      estDistanceKm: doc.estDistanceKm,
      blocks: doc.blocks,
      exercises: doc.exercises,
    });
    return toTemplateDto(copy);
  }

  private async assertExercisesUsable(
    teamId: Types.ObjectId,
    items: StrengthItem[] | null | undefined,
  ): Promise<void> {
    if (!items?.length) return;
    const ids = [...new Set(items.map((i) => i.exerciseId))].map((id) => new Types.ObjectId(id));
    const found = await this.exercises.countUsable(teamId, ids);
    if (found !== ids.length) throw new BadRequestException({ code: 'exercise.not_found' });
  }
}

function toTemplateDto(doc: SessionTemplateDocument): SessionTemplateDto {
  const timestamps = doc as unknown as { createdAt: Date; updatedAt: Date };
  return {
    id: doc._id.toString(),
    type: doc.type,
    name: doc.name,
    category: doc.category,
    expectedDifficulty: doc.expectedDifficulty,
    instructions: doc.instructions,
    estDurationMin: doc.estDurationMin,
    estDistanceKm: doc.estDistanceKm,
    blocks: doc.blocks,
    exercises: doc.exercises,
    usageCount: doc.usageCount,
    lastUsedAt: doc.lastUsedAt?.toISOString() ?? null,
    archived: doc.archived,
    createdAt: timestamps.createdAt.toISOString(),
    updatedAt: timestamps.updatedAt.toISOString(),
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
