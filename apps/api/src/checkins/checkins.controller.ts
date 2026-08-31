import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  zCheckinCreate,
  zCheckinsQuery,
  type Checkin,
  type CheckinCreate,
  type CheckinToday,
  type CheckinsQuery,
} from '@kadro/shared';
import { AthleteGuard } from '../auth/athlete.guard';
import { CoachGuard } from '../auth/coach.guard';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { CurrentUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { teamIdOf } from '../groups/groups.controller';
import { CheckinsService } from './checkins.service';

@Controller()
@UseGuards(JwtAccessGuard)
export class CheckinsController {
  constructor(private readonly checkins: CheckinsService) {}

  @Post('checkins')
  @UseGuards(AthleteGuard)
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(zCheckinCreate)) dto: CheckinCreate,
  ): Promise<Checkin> {
    return this.checkins.upsert(new Types.ObjectId(user.athleteId), dto);
  }

  @Get('checkins')
  @UseGuards(CoachGuard)
  list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(zCheckinsQuery)) query: CheckinsQuery,
  ): Promise<Checkin[]> {
    return this.checkins.list(teamIdOf(user), query);
  }

  @Get('me/checkin-today')
  @UseGuards(AthleteGuard)
  today(@CurrentUser() user: JwtPayload): Promise<CheckinToday> {
    return this.checkins.today(new Types.ObjectId(user.athleteId));
  }
}
