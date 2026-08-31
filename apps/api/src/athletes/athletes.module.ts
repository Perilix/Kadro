import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Athlete, AthleteSchema } from './athlete.schema';
import { AthletesService } from './athletes.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Athlete.name, schema: AthleteSchema }])],
  providers: [AthletesService],
  exports: [AthletesService],
})
export class AthletesModule {}
