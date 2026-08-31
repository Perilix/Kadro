import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  zSessionTemplateCreate,
  zSessionTemplateQuery,
  zSessionTemplateUpdate,
  type SessionTemplate,
  type SessionTemplateCreate,
  type SessionTemplateQuery,
  type SessionTemplateUpdate,
} from '@kadro/shared';
import { CoachGuard } from '../auth/coach.guard';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { CurrentUser } from '../common/current-user.decorator';
import { parseObjectId } from '../common/object-id';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { teamIdOf } from '../groups/groups.controller';
import { TemplatesService } from './templates.service';

@Controller('templates')
@UseGuards(JwtAccessGuard, CoachGuard)
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(zSessionTemplateQuery)) query: SessionTemplateQuery,
  ): Promise<SessionTemplate[]> {
    return this.templates.list(teamIdOf(user), query);
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(zSessionTemplateCreate)) dto: SessionTemplateCreate,
  ): Promise<SessionTemplate> {
    return this.templates.create(teamIdOf(user), new Types.ObjectId(user.sub), dto);
  }

  @Get(':id')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<SessionTemplate> {
    return this.templates.getDto(teamIdOf(user), parseObjectId(id));
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(zSessionTemplateUpdate)) dto: SessionTemplateUpdate,
  ): Promise<SessionTemplate> {
    return this.templates.update(teamIdOf(user), parseObjectId(id), dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.templates.remove(teamIdOf(user), parseObjectId(id));
  }

  @Post(':id/duplicate')
  duplicate(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<SessionTemplate> {
    return this.templates.duplicate(teamIdOf(user), new Types.ObjectId(user.sub), parseObjectId(id));
  }
}
