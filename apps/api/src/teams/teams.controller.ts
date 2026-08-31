import { Body, Controller, ForbiddenException, Get, Patch, UseGuards } from '@nestjs/common';
import {
  zTeamUpdate,
  type CoachDashboard,
  type Team as TeamDto,
  type TeamUpdate,
} from '@kadro/shared';
import { CoachGuard } from '../auth/coach.guard';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { CurrentUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { teamIdOf } from '../groups/groups.controller';
import { DashboardService } from './dashboard.service';
import type { TeamDocument } from './team.schema';
import { TeamsService } from './teams.service';

@Controller('team')
@UseGuards(JwtAccessGuard, CoachGuard)
export class TeamsController {
  constructor(
    private readonly teams: TeamsService,
    private readonly dashboard: DashboardService,
  ) {}

  @Get()
  async get(@CurrentUser() user: JwtPayload): Promise<TeamDto> {
    return toTeamDto(await this.requireTeam(user));
  }

  @Patch()
  async update(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(zTeamUpdate)) dto: TeamUpdate,
  ): Promise<TeamDto> {
    const team = await this.requireTeam(user);
    return toTeamDto(await this.teams.updateSettings(team._id, dto));
  }

  @Get('dashboard')
  getDashboard(@CurrentUser() user: JwtPayload): Promise<CoachDashboard> {
    return this.dashboard.dashboard(teamIdOf(user));
  }

  private async requireTeam(user: JwtPayload): Promise<TeamDocument> {
    const team = await this.teams.findById(teamIdOf(user));
    if (!team) throw new ForbiddenException({ code: 'team.not_found' });
    return team;
  }
}

function toTeamDto(team: TeamDocument): TeamDto {
  const s = team.subscription;
  return {
    id: team._id.toString(),
    name: team.name,
    inviteCode: team.inviteCode,
    alertDefaults: team.alertDefaults,
    watchPush: team.watchPush,
    subscription: {
      plan: s.plan,
      status: s.status,
      athleteLimit: s.athleteLimit,
      coachLimit: s.coachLimit,
      interval: s.interval,
      trialEndsAt: s.trialEndsAt?.toISOString() ?? null,
      currentPeriodEnd: s.currentPeriodEnd?.toISOString() ?? null,
      extraAthletes: s.extraAthletes,
    },
  };
}
