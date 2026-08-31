import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  zActivitiesQuery,
  zFeedbackCreate,
  zLinkActivity,
  zManualComplete,
  zStreamsQuery,
  type ActivitiesQuery,
  type ActivityDetail,
  type ActivityListItem,
  type FeedbackCreate,
  type LinkActivity,
  type ManualComplete,
  type Page,
  type Streams,
  type StreamsQuery,
} from '@kadro/shared';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { CurrentUser } from '../common/current-user.decorator';
import { parseObjectId } from '../common/object-id';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ActivitiesService } from './activities.service';

@Controller()
@UseGuards(JwtAccessGuard)
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Post('sessions/:id/complete-manual')
  completeManual(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(zManualComplete)) dto: ManualComplete,
  ): Promise<ActivityDetail> {
    return this.activities.completeManual(user, parseObjectId(id), dto);
  }

  @Get('activities')
  list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(zActivitiesQuery)) query: ActivitiesQuery,
  ): Promise<Page<ActivityListItem>> {
    return this.activities.list(user, query);
  }

  @Get('activities/:id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<ActivityDetail> {
    return this.activities.detail(user, parseObjectId(id));
  }

  @Get('activities/:id/streams')
  streams(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query(new ZodValidationPipe(zStreamsQuery)) query: StreamsQuery,
  ): Promise<Streams> {
    return this.activities.getStreams(user, parseObjectId(id), query);
  }

  @Post('activities/:id/feedback')
  feedback(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(zFeedbackCreate)) dto: FeedbackCreate,
  ): Promise<ActivityDetail> {
    return this.activities.feedback(user, parseObjectId(id), dto);
  }

  @Post('activities/:id/link')
  link(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(zLinkActivity)) dto: LinkActivity,
  ): Promise<ActivityDetail> {
    return this.activities.link(user, parseObjectId(id), dto);
  }

  @Post('activities/:id/unlink')
  unlink(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<ActivityDetail> {
    return this.activities.unlink(user, parseObjectId(id));
  }
}
