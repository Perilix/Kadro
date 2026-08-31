import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  zGroupCreate,
  zGroupUpdate,
  type Group,
  type GroupCreate,
  type GroupUpdate,
} from '@kadro/shared';
import { CoachGuard } from '../auth/coach.guard';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { CurrentUser } from '../common/current-user.decorator';
import { parseObjectId } from '../common/object-id';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { GroupsService } from './groups.service';

@Controller('groups')
@UseGuards(JwtAccessGuard, CoachGuard)
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload): Promise<Group[]> {
    return this.groups.list(teamIdOf(user));
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(zGroupCreate)) dto: GroupCreate,
  ): Promise<Group> {
    return this.groups.create(teamIdOf(user), dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(zGroupUpdate)) dto: GroupUpdate,
  ): Promise<Group> {
    return this.groups.update(teamIdOf(user), parseObjectId(id), dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.groups.remove(teamIdOf(user), parseObjectId(id));
  }
}

export function teamIdOf(user: JwtPayload): Types.ObjectId {
  if (!user.teamId) throw new ForbiddenException({ code: 'team.not_found' });
  return new Types.ObjectId(user.teamId);
}
