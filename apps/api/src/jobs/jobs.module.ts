import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivitiesModule } from '../activities/activities.module';
import { AlertsModule } from '../alerts/alerts.module';
import { Athlete, AthleteSchema } from '../athletes/athlete.schema';
import { Checkin, CheckinSchema } from '../checkins/checkin.schema';
import { HealthMetric, HealthMetricSchema } from '../checkins/health-metric.schema';
import { PlannedSession, PlannedSessionSchema } from '../planning/planned-session.schema';
import { Team, TeamSchema } from '../teams/team.schema';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlannedSession.name, schema: PlannedSessionSchema },
      { name: Athlete.name, schema: AthleteSchema },
      { name: Checkin.name, schema: CheckinSchema },
      { name: HealthMetric.name, schema: HealthMetricSchema },
      { name: Team.name, schema: TeamSchema },
    ]),
    AlertsModule,
    ActivitiesModule,
  ],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
