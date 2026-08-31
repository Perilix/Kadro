import { Controller, Get, NotFoundException, Query, UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import type { Athlete, AthleteOverview, ExerciseStats, Monitoring, PaceTable } from '@kadro/shared';
import { z } from 'zod';
import { ActivitiesService } from '../activities/activities.service';
import { AlertsService } from '../alerts/alerts.service';
import { AthleteGuard } from '../auth/athlete.guard';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { CheckinsService } from '../checkins/checkins.service';
import { CurrentUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { PlanningService } from '../planning/planning.service';
import { AthletesService } from './athletes.service';

const zWeeksQuery = z.object({ weeks: z.coerce.number().int().min(1).max(26).default(8) });

@Controller('me')
@UseGuards(JwtAccessGuard, AthleteGuard)
export class MeController {
  constructor(
    private readonly athletes: AthletesService,
    private readonly activities: ActivitiesService,
    private readonly planning: PlanningService,
    private readonly checkins: CheckinsService,
    private readonly alerts: AlertsService,
  ) {}

  @Get('profile')
  async profile(@CurrentUser() user: JwtPayload): Promise<Athlete> {
    return this.athletes.toDto(await this.requireAthlete(user));
  }

  @Get('overview')
  async overview(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(zWeeksQuery)) query: z.infer<typeof zWeeksQuery>,
  ): Promise<AthleteOverview> {
    const doc = await this.requireAthlete(user);
    const today = new Date();
    const monday = new Date(today);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const [loadByWeek, week, recentSessions, checkins7d, openAlerts] = await Promise.all([
      this.activities.weeklyLoads(doc._id, query.weeks),
      this.planning.list(
        doc.teamId,
        {
          from: monday.toISOString().slice(0, 10),
          to: sunday.toISOString().slice(0, 10),
          athleteId: doc._id.toString(),
        },
        doc._id,
      ),
      this.activities.recent(doc.teamId, doc._id, 5),
      this.checkins.list(doc.teamId, {
        athleteId: doc._id.toString(),
        from: weekAgo,
        to: today.toISOString().slice(0, 10),
      }),
      this.alerts.list(doc.teamId, { status: 'open', athleteId: doc._id.toString(), limit: 1 }),
    ]);
    return {
      loadByWeek,
      acuteChronicRatio: doc.snapshot.acuteChronicRatio,
      week,
      recentSessions,
      checkins7d,
      currentAlert: openAlerts.items[0] ?? null,
    };
  }

  @Get('monitoring')
  async monitoring(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(zWeeksQuery)) query: z.infer<typeof zWeeksQuery>,
  ): Promise<Monitoring> {
    const doc = await this.requireAthlete(user);
    return this.checkins.monitoring(doc.teamId, doc._id, query.weeks);
  }

  @Get('paces')
  async paces(@CurrentUser() user: JwtPayload): Promise<PaceTable> {
    return this.athletes.paceTableFor(await this.requireAthlete(user));
  }

  @Get('strength-stats')
  async strengthStats(@CurrentUser() user: JwtPayload): Promise<ExerciseStats[]> {
    const doc = await this.requireAthlete(user);
    return this.activities.strengthStats(doc._id);
  }

  private async requireAthlete(user: JwtPayload) {
    const doc = await this.athletes
      .findByUserId(new Types.ObjectId(user.sub))
      .then((a) => a ?? null);
    if (!doc || doc._id.toString() !== user.athleteId) {
      throw new NotFoundException({ code: 'athlete.not_found' });
    }
    return doc;
  }
}
