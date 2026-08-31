import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { TeamsModule } from '../teams/teams.module';
import { AthletesModule } from '../athletes/athletes.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessGuard } from './jwt-access.guard';
import { CoachGuard } from './coach.guard';

@Module({
  imports: [JwtModule.register({ global: true }), UsersModule, TeamsModule, AthletesModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessGuard, CoachGuard],
  exports: [AuthService],
})
export class AuthModule {}
