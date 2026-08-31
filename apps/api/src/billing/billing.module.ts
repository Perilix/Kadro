import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Athlete, AthleteSchema } from '../athletes/athlete.schema';
import { WebhookEvent, WebhookEventSchema } from '../connections/webhook-event.schema';
import { Team, TeamSchema } from '../teams/team.schema';
import { TeamsModule } from '../teams/teams.module';
import { UsersModule } from '../users/users.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Team.name, schema: TeamSchema },
      { name: Athlete.name, schema: AthleteSchema },
      { name: WebhookEvent.name, schema: WebhookEventSchema },
    ]),
    TeamsModule,
    UsersModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
