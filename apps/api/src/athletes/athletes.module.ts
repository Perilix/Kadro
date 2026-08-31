import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from '../groups/group.schema';
import { TeamsModule } from '../teams/teams.module';
import { UsersModule } from '../users/users.module';
import { Athlete, AthleteSchema } from './athlete.schema';
import { AthletesController } from './athletes.controller';
import { AthletesService } from './athletes.service';
import { Note, NoteSchema } from './note.schema';
import { NotesService } from './notes.service';
import { Test, TestSchema } from './test.schema';
import { TestsService } from './tests.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Athlete.name, schema: AthleteSchema },
      { name: Test.name, schema: TestSchema },
      { name: Note.name, schema: NoteSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
    UsersModule,
    TeamsModule,
  ],
  controllers: [AthletesController],
  providers: [AthletesService, TestsService, NotesService],
  exports: [AthletesService],
})
export class AthletesModule {}
