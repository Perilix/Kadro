import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  zInvitationCreate,
  type Invitation,
  type InvitationCreate,
  type InviteCodeInfo,
} from '@kadro/shared';
import { CoachGuard } from '../auth/coach.guard';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { CurrentUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { TeamsService } from '../teams/teams.service';
import { InviteService } from './invite.service';

/** Routes coach : code d'équipe et invitations e-mail. */
@Controller('team')
@UseGuards(JwtAccessGuard, CoachGuard)
export class TeamInvitationsController {
  constructor(
    private readonly invite: InviteService,
    private readonly teams: TeamsService,
  ) {}

  @Get('invite-code')
  async inviteCode(@CurrentUser() user: JwtPayload): Promise<InviteCodeInfo> {
    return this.invite.codeInfo(await this.requireTeam(user));
  }

  @Post('invite-code/rotate')
  async rotate(@CurrentUser() user: JwtPayload): Promise<InviteCodeInfo> {
    const team = await this.requireTeam(user);
    return this.invite.codeInfo(await this.teams.rotateInviteCode(team._id));
  }

  @Get('invitations')
  async list(@CurrentUser() user: JwtPayload): Promise<Invitation[]> {
    const team = await this.requireTeam(user);
    return this.invite.listInvitations(team._id);
  }

  @Post('invitations')
  async create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(zInvitationCreate)) dto: InvitationCreate,
  ): Promise<Invitation> {
    const team = await this.requireTeam(user);
    return this.invite.createInvitation(team._id, dto);
  }

  @Post('invitations/:id/remind')
  async remind(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<Invitation> {
    const team = await this.requireTeam(user);
    return this.invite.remind(team._id, id);
  }

  @Delete('invitations/:id')
  @HttpCode(204)
  async revoke(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    const team = await this.requireTeam(user);
    await this.invite.revoke(team._id, id);
  }

  private async requireTeam(user: JwtPayload) {
    if (!user.teamId) throw new ForbiddenException({ code: 'team.not_found' });
    const team = await this.teams.findById(new Types.ObjectId(user.teamId));
    if (!team) throw new ForbiddenException({ code: 'team.not_found' });
    return team;
  }
}
