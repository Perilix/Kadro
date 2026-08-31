import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TeamsModule } from '../teams/teams.module';
import { AthletesModule } from '../athletes/athletes.module';
import { Invitation, InvitationSchema } from './invitation.schema';
import { MailModule } from '../mail/mail.module';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { TeamInvitationsController } from './team-invitations.controller';

@Module({
  imports: [
    MailModule,
    MongooseModule.forFeature([{ name: Invitation.name, schema: InvitationSchema }]),
    AuthModule,
    UsersModule,
    TeamsModule,
    AthletesModule,
  ],
  controllers: [InviteController, TeamInvitationsController],
  providers: [InviteService],
})
export class InviteModule {}
