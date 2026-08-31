import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Athlete, AthleteSchema } from '../athletes/athlete.schema';
import { AlertsModule } from '../alerts/alerts.module';
import { Checkin, CheckinSchema } from '../checkins/checkin.schema';
import { PlannedSession, PlannedSessionSchema } from '../planning/planned-session.schema';
import { DashboardService } from './dashboard.service';
import { Team, TeamSchema } from './team.schema';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Team.name, schema: TeamSchema },
      { name: Athlete.name, schema: AthleteSchema },
      { name: Checkin.name, schema: CheckinSchema },
      { name: PlannedSession.name, schema: PlannedSessionSchema },
    ]),
    AlertsModule,
  ],
  controllers: [TeamsController],
  providers: [TeamsService, DashboardService],
  exports: [TeamsService],
})
export class TeamsModule {}
