import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertsModule } from '../alerts/alerts.module';
import { Athlete, AthleteSchema } from '../athletes/athlete.schema';
import { Exercise, ExerciseSchema } from '../library/exercise.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlannedSession, PlannedSessionSchema } from '../planning/planned-session.schema';
import { UsersModule } from '../users/users.module';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { ActivityStream, ActivityStreamSchema } from './activity-stream.schema';
import { CompletedSession, CompletedSessionSchema } from './completed-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CompletedSession.name, schema: CompletedSessionSchema },
      { name: ActivityStream.name, schema: ActivityStreamSchema },
      { name: PlannedSession.name, schema: PlannedSessionSchema },
      { name: Athlete.name, schema: AthleteSchema },
      { name: Exercise.name, schema: ExerciseSchema },
    ]),
    UsersModule,
    NotificationsModule,
    AlertsModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
