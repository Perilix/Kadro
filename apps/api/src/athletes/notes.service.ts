import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Note as NoteDto, NoteCreate, NoteUpdate } from '@kadro/shared';
import { Note, NoteDocument } from './note.schema';

@Injectable()
export class NotesService {
  constructor(@InjectModel(Note.name) private readonly model: Model<Note>) {}

  async list(athleteId: Types.ObjectId): Promise<NoteDto[]> {
    const docs = await this.model.find({ athleteId }).sort({ date: -1, _id: -1 }).exec();
    return docs.map(toNoteDto);
  }

  async create(
    teamId: Types.ObjectId,
    athleteId: Types.ObjectId,
    authorId: Types.ObjectId,
    dto: NoteCreate,
  ): Promise<NoteDto> {
    const doc = await this.model.create({
      teamId,
      athleteId,
      authorId,
      date: dto.date ?? new Date().toISOString().slice(0, 10),
      text: dto.text,
    });
    return toNoteDto(doc);
  }

  async update(athleteId: Types.ObjectId, noteId: Types.ObjectId, dto: NoteUpdate): Promise<NoteDto> {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: noteId, athleteId },
        { $set: { text: dto.text, updatedAt: new Date() } },
        { new: true },
      )
      .exec();
    if (!doc) throw new NotFoundException({ code: 'note.not_found' });
    return toNoteDto(doc);
  }

  async remove(athleteId: Types.ObjectId, noteId: Types.ObjectId): Promise<void> {
    const result = await this.model.deleteOne({ _id: noteId, athleteId }).exec();
    if (result.deletedCount === 0) throw new NotFoundException({ code: 'note.not_found' });
  }
}

function toNoteDto(doc: NoteDocument): NoteDto {
  return {
    id: doc._id.toString(),
    athleteId: doc.athleteId.toString(),
    authorId: doc.authorId.toString(),
    date: doc.date,
    text: doc.text,
    createdAt: (doc as unknown as { createdAt: Date }).createdAt.toISOString(),
    updatedAt: doc.updatedAt?.toISOString() ?? null,
  };
}
