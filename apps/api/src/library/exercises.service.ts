import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import type { Exercise as ExerciseDto, ExerciseCreate, ExerciseQuery, ExerciseUpdate } from '@kadro/shared';
import { Exercise, ExerciseDocument } from './exercise.schema';

@Injectable()
export class ExercisesService {
  constructor(@InjectModel(Exercise.name) private readonly model: Model<Exercise>) {}

  async list(teamId: Types.ObjectId, query: ExerciseQuery): Promise<ExerciseDto[]> {
    const filter: FilterQuery<Exercise> = {
      teamId: { $in: [null, teamId] },
      archived: false,
    };
    if (query.q) filter.name = { $regex: escapeRegex(query.q), $options: 'i' };
    if (query.muscleGroup) filter.muscleGroups = query.muscleGroup;
    if (query.equipment) filter.equipment = query.equipment;
    const docs = await this.model.find(filter).sort({ name: 1 }).exec();
    return docs.map(toExerciseDto);
  }

  async create(teamId: Types.ObjectId, dto: ExerciseCreate): Promise<ExerciseDto> {
    const doc = await this.model.create({ ...dto, teamId, nameKey: null });
    return toExerciseDto(doc);
  }

  async update(teamId: Types.ObjectId, id: Types.ObjectId, dto: ExerciseUpdate): Promise<ExerciseDto> {
    const doc = await this.model
      .findOneAndUpdate({ _id: id, teamId }, { $set: dto }, { new: true })
      .exec();
    if (!doc) throw new NotFoundException({ code: 'exercise.not_found' });
    return toExerciseDto(doc);
  }

  async archive(teamId: Types.ObjectId, id: Types.ObjectId): Promise<void> {
    const result = await this.model
      .updateOne({ _id: id, teamId }, { $set: { archived: true } })
      .exec();
    if (result.matchedCount === 0) throw new NotFoundException({ code: 'exercise.not_found' });
  }

  countUsable(teamId: Types.ObjectId, ids: Types.ObjectId[]): Promise<number> {
    return this.model
      .countDocuments({ _id: { $in: ids }, teamId: { $in: [null, teamId] }, archived: false })
      .exec();
  }
}

function toExerciseDto(doc: ExerciseDocument): ExerciseDto {
  return {
    id: doc._id.toString(),
    name: doc.name,
    nameKey: doc.nameKey,
    muscleGroups: doc.muscleGroups,
    equipment: doc.equipment,
    loadType: doc.loadType,
    unilateral: doc.unilateral,
    archived: doc.archived,
    custom: doc.teamId != null,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
