import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Athlete, AthleteSchema } from '../athletes/athlete.schema';
import { Test, TestSchema } from '../athletes/test.schema';
import { LibraryModule } from '../library/library.module';
import { PlannedSession, PlannedSessionSchema } from './planned-session.schema';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlannedSession.name, schema: PlannedSessionSchema },
      { name: Athlete.name, schema: AthleteSchema },
      { name: Test.name, schema: TestSchema },
    ]),
    LibraryModule,
  ],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}
