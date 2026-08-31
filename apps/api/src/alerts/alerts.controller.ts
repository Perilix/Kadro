import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import { zAlertsQuery, type Alert, type AlertsQuery, type Page } from '@kadro/shared';
import { CoachGuard } from '../auth/coach.guard';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { CurrentUser } from '../common/current-user.decorator';
import { parseObjectId } from '../common/object-id';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { teamIdOf } from '../groups/groups.controller';
import { AlertsService } from './alerts.service';

@Controller('alerts')
@UseGuards(JwtAccessGuard, CoachGuard)
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(zAlertsQuery)) query: AlertsQuery,
  ): Promise<Page<Alert>> {
    return this.alerts.list(teamIdOf(user), query);
  }

  @Post(':id/resolve')
  resolve(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<Alert> {
    return this.alerts.close(teamIdOf(user), parseObjectId(id), 'resolved', new Types.ObjectId(user.sub));
  }

  @Post(':id/dismiss')
  dismiss(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<Alert> {
    return this.alerts.close(teamIdOf(user), parseObjectId(id), 'dismissed', new Types.ObjectId(user.sub));
  }
}
