import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Group as GroupDto, GroupCreate, GroupUpdate } from '@kadro/shared';
import { Athlete } from '../athletes/athlete.schema';
import { Group, GroupDocument } from './group.schema';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private readonly model: Model<Group>,
    @InjectModel(Athlete.name) private readonly athletes: Model<Athlete>,
  ) {}

  async list(teamId: Types.ObjectId): Promise<GroupDto[]> {
    const docs = await this.model.find({ teamId }).sort({ order: 1, _id: 1 }).exec();
    return docs.map(toGroupDto);
  }

  async create(teamId: Types.ObjectId, dto: GroupCreate): Promise<GroupDto> {
    const last = await this.model.findOne({ teamId }).sort({ order: -1 }).exec();
    const doc = await this.model.create({ teamId, name: dto.name, order: (last?.order ?? -1) + 1 });
    return toGroupDto(doc);
  }

  async update(teamId: Types.ObjectId, id: Types.ObjectId, dto: GroupUpdate): Promise<GroupDto> {
    const doc = await this.model
      .findOneAndUpdate({ _id: id, teamId }, { $set: dto }, { new: true })
      .exec();
    if (!doc) throw new NotFoundException({ code: 'group.not_found' });
    return toGroupDto(doc);
  }

  async remove(teamId: Types.ObjectId, id: Types.ObjectId): Promise<void> {
    const result = await this.model.deleteOne({ _id: id, teamId }).exec();
    if (result.deletedCount === 0) throw new NotFoundException({ code: 'group.not_found' });
    await this.athletes.updateMany({ teamId }, { $pull: { groupIds: id } }).exec();
  }
}

function toGroupDto(doc: GroupDocument): GroupDto {
  return { id: doc._id.toString(), name: doc.name, order: doc.order };
}
