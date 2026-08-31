import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

export function parseObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new BadRequestException({ code: 'validation.invalid_id' });
  }
  return new Types.ObjectId(value);
}
