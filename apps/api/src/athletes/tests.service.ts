import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Test as TestDto, TestCreate, TestKind } from '@kadro/shared';
import { AthletesService } from './athletes.service';
import { Test, TestDocument } from './test.schema';

@Injectable()
export class TestsService {
  constructor(
    @InjectModel(Test.name) private readonly model: Model<Test>,
    private readonly athletes: AthletesService,
  ) {}

  async list(athleteId: Types.ObjectId, kind?: TestKind): Promise<TestDto[]> {
    const docs = await this.model
      .find({ athleteId, ...(kind ? { kind } : {}) })
      .sort({ date: -1, _id: -1 })
      .exec();
    return docs.map(toTestDto);
  }

  async create(teamId: Types.ObjectId, athleteId: Types.ObjectId, dto: TestCreate): Promise<TestDto> {
    const doc = await this.model.create({
      athleteId,
      teamId,
      kind: dto.kind,
      date: dto.date,
      vmaKmh: dto.kind === 'vma' ? dto.vmaKmh : null,
      oneRm: dto.kind === 'one_rm' ? { ...dto.oneRm, exerciseId: new Types.ObjectId(dto.oneRm.exerciseId) } : null,
      race: dto.kind === 'race_reference' ? dto.race : null,
      source: 'manual',
      note: dto.note,
    });
    if (dto.kind === 'vma') {
      await this.athletes.applyVmaTest(athleteId, dto.vmaKmh, dto.date);
    }
    return toTestDto(doc);
  }
}

function toTestDto(doc: TestDocument): TestDto {
  return {
    id: doc._id.toString(),
    kind: doc.kind,
    date: doc.date,
    vmaKmh: doc.vmaKmh,
    oneRm: doc.oneRm
      ? { exerciseId: doc.oneRm.exerciseId.toString(), kg: doc.oneRm.kg, method: doc.oneRm.method }
      : null,
    race: doc.race,
    source: doc.source,
    note: doc.note,
    createdAt: (doc as unknown as { createdAt: Date }).createdAt.toISOString(),
  };
}
