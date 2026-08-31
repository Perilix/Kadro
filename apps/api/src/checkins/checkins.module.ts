import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Athlete, AthleteSchema } from '../athletes/athlete.schema';
import { AlertsModule } from '../alerts/alerts.module';
import { Team, TeamSchema } from '../teams/team.schema';
import { Checkin, CheckinSchema } from './checkin.schema';
import { CheckinsController } from './checkins.controller';
import { CheckinsService } from './checkins.service';
import { HealthMetric, HealthMetricSchema } from './health-metric.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Checkin.name, schema: CheckinSchema },
      { name: HealthMetric.name, schema: HealthMetricSchema },
      { name: Athlete.name, schema: AthleteSchema },
      { name: Team.name, schema: TeamSchema },
    ]),
    AlertsModule,
  ],
  controllers: [CheckinsController],
  providers: [CheckinsService],
  exports: [CheckinsService],
})
export class CheckinsModule {}
