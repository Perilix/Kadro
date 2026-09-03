import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  zNotificationsQuery,
  zNotificationsRead,
  zPushTokenCreate,
  type Notification,
  type NotificationsQuery,
  type NotificationsRead,
  type Page,
  type PushTokenCreate,
} from '@kadro/shared';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { CurrentUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { UsersService } from '../users/users.service';
import { NotificationsService } from './notifications.service';

@Controller()
@UseGuards(JwtAccessGuard)
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly users: UsersService,
  ) {}

  @Get('notifications')
  list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(zNotificationsQuery)) query: NotificationsQuery,
  ): Promise<Page<Notification>> {
    return this.notifications.list(new Types.ObjectId(user.sub), query);
  }

  @Post('notifications/read')
  @HttpCode(204)
  async markRead(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(zNotificationsRead)) dto: NotificationsRead,
  ): Promise<void> {
    await this.notifications.markRead(new Types.ObjectId(user.sub), dto.ids);
  }

  @Post('me/push-tokens')
  @HttpCode(204)
  async addPushToken(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(zPushTokenCreate)) dto: PushTokenCreate,
  ): Promise<void> {
    await this.users.addPushToken(new Types.ObjectId(user.sub), dto.expoToken, dto.platform);
  }

  @Delete('me/push-tokens/:expoToken')
  @HttpCode(204)
  async removePushToken(
    @CurrentUser() user: JwtPayload,
    @Param('expoToken') expoToken: string,
  ): Promise<void> {
    if (!expoToken || expoToken.length > 200) {
      throw new BadRequestException({ code: 'push_token.invalid' });
    }
    await this.users.removePushToken(new Types.ObjectId(user.sub), expoToken);
  }
}
