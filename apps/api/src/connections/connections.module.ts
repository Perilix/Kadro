import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivitiesModule } from '../activities/activities.module';
import { Athlete, AthleteSchema } from '../athletes/athlete.schema';
import { UsersModule } from '../users/users.module';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { DeviceConnection, DeviceConnectionSchema } from './device-connection.schema';
import { PolarService } from './polar.service';
import { StravaService } from './strava.service';
import { WebhookEvent, WebhookEventSchema } from './webhook-event.schema';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeviceConnection.name, schema: DeviceConnectionSchema },
      { name: WebhookEvent.name, schema: WebhookEventSchema },
      { name: Athlete.name, schema: AthleteSchema },
    ]),
    ActivitiesModule,
    UsersModule,
  ],
  controllers: [ConnectionsController, WebhooksController],
  providers: [ConnectionsService, StravaService, PolarService],
})
export class ConnectionsModule {}
