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
import {
  zExerciseCreate,
  zExerciseQuery,
  zExerciseUpdate,
  type Exercise,
  type ExerciseCreate,
  type ExerciseQuery,
  type ExerciseUpdate,
} from '@kadro/shared';
import { CoachGuard } from '../auth/coach.guard';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { CurrentUser } from '../common/current-user.decorator';
import { parseObjectId } from '../common/object-id';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { teamIdOf } from '../groups/groups.controller';
import { ExercisesService } from './exercises.service';

@Controller('exercises')
@UseGuards(JwtAccessGuard, CoachGuard)
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(zExerciseQuery)) query: ExerciseQuery,
  ): Promise<Exercise[]> {
    return this.exercises.list(teamIdOf(user), query);
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(zExerciseCreate)) dto: ExerciseCreate,
  ): Promise<Exercise> {
    return this.exercises.create(teamIdOf(user), dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(zExerciseUpdate)) dto: ExerciseUpdate,
  ): Promise<Exercise> {
    return this.exercises.update(teamIdOf(user), parseObjectId(id), dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.exercises.archive(teamIdOf(user), parseObjectId(id));
  }
}
