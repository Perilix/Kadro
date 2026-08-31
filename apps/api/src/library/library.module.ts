import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Exercise, ExerciseSchema } from './exercise.schema';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { SessionTemplate, SessionTemplateSchema } from './session-template.schema';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exercise.name, schema: ExerciseSchema },
      { name: SessionTemplate.name, schema: SessionTemplateSchema },
    ]),
  ],
  controllers: [TemplatesController, ExercisesController],
  providers: [TemplatesService, ExercisesService],
  exports: [TemplatesService, ExercisesService],
})
export class LibraryModule {}
