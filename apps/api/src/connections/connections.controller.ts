import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Types } from 'mongoose';
import type { AuthorizeUrl, Connection, TeamConnections } from '@kadro/shared';
import { AthleteGuard } from '../auth/athlete.guard';
import { CoachGuard } from '../auth/coach.guard';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { CurrentUser } from '../common/current-user.decorator';
import { teamIdOf } from '../groups/groups.controller';
import { ConnectionsService } from './connections.service';

@Controller()
export class ConnectionsController {
  constructor(private readonly connections: ConnectionsService) {}

  @Get('me/connections')
  @UseGuards(JwtAccessGuard, AthleteGuard)
  list(@CurrentUser() user: JwtPayload): Promise<Connection[]> {
    return this.connections.listMine(new Types.ObjectId(user.athleteId));
  }

  @Get('connections/:provider/authorize')
  @UseGuards(JwtAccessGuard, AthleteGuard)
  authorize(
    @CurrentUser() user: JwtPayload,
    @Param('provider') provider: string,
    @Query('platform') platform: string | undefined,
  ): AuthorizeUrl {
    return this.connections.authorize(
      new Types.ObjectId(user.athleteId),
      provider,
      platform === 'web' ? 'web' : 'mobile',
    );
  }

  @Get('connections/:provider/callback')
  async callback(
    @Param('provider') provider: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    res.redirect(await this.connections.handleCallback(provider, code, state));
  }

  @Delete('me/connections/:provider')
  @UseGuards(JwtAccessGuard, AthleteGuard)
  @HttpCode(204)
  async disconnect(@CurrentUser() user: JwtPayload, @Param('provider') provider: string): Promise<void> {
    await this.connections.disconnect(new Types.ObjectId(user.athleteId), provider);
  }

  @Post('me/connections/:provider/sync')
  @UseGuards(JwtAccessGuard, AthleteGuard)
  @HttpCode(202)
  async sync(@CurrentUser() user: JwtPayload, @Param('provider') provider: string): Promise<void> {
    await this.connections.requestSync(new Types.ObjectId(user.athleteId), provider);
  }

  @Get('team/connections')
  @UseGuards(JwtAccessGuard, CoachGuard)
  teamOverview(@CurrentUser() user: JwtPayload): Promise<TeamConnections> {
    return this.connections.teamOverview(teamIdOf(user));
  }
}
