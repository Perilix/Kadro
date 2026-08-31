import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Athlete, AthleteSchema } from '../athletes/athlete.schema';
import { Group, GroupSchema } from './group.schema';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },
      { name: Athlete.name, schema: AthleteSchema },
    ]),
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
