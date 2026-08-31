import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { validateEnv } from './config/env';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { InviteModule } from './invite/invite.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { AthletesModule } from './athletes/athletes.module';
import { GroupsModule } from './groups/groups.module';
import { LibraryModule } from './library/library.module';
import { PlanningModule } from './planning/planning.module';
import { AlertsModule } from './alerts/alerts.module';
import { CheckinsModule } from './checkins/checkins.module';
import { RealtimeModule } from './realtime/realtime.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { ActivitiesModule } from './activities/activities.module';
import { JobsModule } from './jobs/jobs.module';
import { ConnectionsModule } from './connections/connections.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    UsersModule,
    TeamsModule,
    AthletesModule,
    GroupsModule,
    LibraryModule,
    PlanningModule,
    AlertsModule,
    CheckinsModule,
    RealtimeModule,
    NotificationsModule,
    ChatModule,
    ActivitiesModule,
    JobsModule,
    ConnectionsModule,
    AuthModule,
    InviteModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
