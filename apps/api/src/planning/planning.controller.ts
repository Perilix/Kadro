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
  zAssign,
  zDeleteSessionQuery,
  zPlannedSessionUpdate,
  zPreviewRequest,
  zSessionsQuery,
  type Assign,
  type DeleteSessionQuery,
  type PlannedSession,
  type PlannedSessionDetail,
  type PlannedSessionUpdate,
  type PreviewRequest,
  type ResolvedPreview,
  type SessionsQuery,
} from '@kadro/shared';
import { CoachGuard } from '../auth/coach.guard';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { CurrentUser } from '../common/current-user.decorator';
import { parseObjectId } from '../common/object-id';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { teamIdOf } from '../groups/groups.controller';
import { PlanningService } from './planning.service';

@Controller('sessions')
@UseGuards(JwtAccessGuard, CoachGuard)
export class PlanningController {
  constructor(private readonly planning: PlanningService) {}

  @Post('assign')
  assign(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(zAssign)) dto: Assign,
  ): Promise<PlannedSession[]> {
    return this.planning.assign(teamIdOf(user), new Types.ObjectId(user.sub), dto);
  }

  @Post('preview')
  preview(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(zPreviewRequest)) dto: PreviewRequest,
  ): Promise<ResolvedPreview> {
    return this.planning.preview(teamIdOf(user), dto);
  }

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(zSessionsQuery)) query: SessionsQuery,
  ): Promise<PlannedSession[]> {
    return this.planning.list(teamIdOf(user), query);
  }

  @Get(':id')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<PlannedSessionDetail> {
    return this.planning.getDetail(teamIdOf(user), parseObjectId(id));
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(zPlannedSessionUpdate)) dto: PlannedSessionUpdate,
  ): Promise<PlannedSessionDetail> {
    return this.planning.update(teamIdOf(user), parseObjectId(id), dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query(new ZodValidationPipe(zDeleteSessionQuery)) query: DeleteSessionQuery,
  ): Promise<void> {
    await this.planning.remove(teamIdOf(user), parseObjectId(id), query.scope);
  }
}
