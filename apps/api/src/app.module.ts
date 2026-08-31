import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { validateEnv } from './config/env';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { InviteModule } from './invite/invite.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { AthletesModule } from './athletes/athletes.module';
import { GroupsModule } from './groups/groups.module';
import { LibraryModule } from './library/library.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
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
    AuthModule,
    InviteModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
