import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  zAthleteListQuery,
  zAthleteUpdate,
  zNoteCreate,
  zNoteUpdate,
  zTestCreate,
  zTestKind,
  type Athlete,
  type AthleteListItem,
  type AthleteListQuery,
  type AthleteUpdate,
  type Note,
  type NoteCreate,
  type NoteUpdate,
  type PaceTable,
  type Page,
  type Test,
  type TestCreate,
} from '@kadro/shared';
import { z } from 'zod';
import { CoachGuard } from '../auth/coach.guard';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { CurrentUser } from '../common/current-user.decorator';
import { parseObjectId } from '../common/object-id';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { teamIdOf } from '../groups/groups.controller';
import { TeamsService } from '../teams/teams.service';
import { AthletesService } from './athletes.service';
import { NotesService } from './notes.service';
import { TestsService } from './tests.service';

const zTestListQuery = z.object({ kind: zTestKind.optional() });

@Controller('athletes')
@UseGuards(JwtAccessGuard, CoachGuard)
export class AthletesController {
  constructor(
    private readonly athletes: AthletesService,
    private readonly tests: TestsService,
    private readonly notes: NotesService,
    private readonly teams: TeamsService,
  ) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(zAthleteListQuery)) query: AthleteListQuery,
  ): Promise<Page<AthleteListItem>> {
    return this.athletes.list(teamIdOf(user), query);
  }

  @Get(':id')
  async get(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<Athlete> {
    const doc = await this.athletes.getInTeam(teamIdOf(user), parseObjectId(id));
    return this.athletes.toDto(doc);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(zAthleteUpdate)) dto: AthleteUpdate,
  ): Promise<Athlete> {
    const teamId = teamIdOf(user);
    const team = await this.teams.findById(teamId);
    if (!team) throw new ForbiddenException({ code: 'team.not_found' });
    const doc = await this.athletes.getInTeam(teamId, parseObjectId(id));
    return this.athletes.update(team, doc, dto);
  }

  @Post(':id/archive')
  async archive(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<Athlete> {
    const doc = await this.athletes.getInTeam(teamIdOf(user), parseObjectId(id));
    return this.athletes.setStatus(doc, 'archived');
  }

  @Post(':id/unarchive')
  async unarchive(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<Athlete> {
    const doc = await this.athletes.getInTeam(teamIdOf(user), parseObjectId(id));
    return this.athletes.setStatus(doc, 'active');
  }

  @Get(':id/paces')
  async paces(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<PaceTable> {
    const doc = await this.athletes.getInTeam(teamIdOf(user), parseObjectId(id));
    return this.athletes.paceTableFor(doc);
  }

  @Get(':id/tests')
  async listTests(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query(new ZodValidationPipe(zTestListQuery)) query: z.infer<typeof zTestListQuery>,
  ): Promise<Test[]> {
    const doc = await this.athletes.getInTeam(teamIdOf(user), parseObjectId(id));
    return this.tests.list(doc._id, query.kind);
  }

  @Post(':id/tests')
  async createTest(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(zTestCreate)) dto: TestCreate,
  ): Promise<Test> {
    const doc = await this.athletes.getInTeam(teamIdOf(user), parseObjectId(id));
    return this.tests.create(doc.teamId, doc._id, dto);
  }

  @Get(':id/notes')
  async listNotes(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<Note[]> {
    const doc = await this.athletes.getInTeam(teamIdOf(user), parseObjectId(id));
    return this.notes.list(doc._id);
  }

  @Post(':id/notes')
  async createNote(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(zNoteCreate)) dto: NoteCreate,
  ): Promise<Note> {
    const doc = await this.athletes.getInTeam(teamIdOf(user), parseObjectId(id));
    return this.notes.create(doc.teamId, doc._id, new Types.ObjectId(user.sub), dto);
  }

  @Patch(':id/notes/:noteId')
  async updateNote(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @Body(new ZodValidationPipe(zNoteUpdate)) dto: NoteUpdate,
  ): Promise<Note> {
    const doc = await this.athletes.getInTeam(teamIdOf(user), parseObjectId(id));
    return this.notes.update(doc._id, parseObjectId(noteId), dto);
  }

  @Delete(':id/notes/:noteId')
  @HttpCode(204)
  async removeNote(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('noteId') noteId: string,
  ): Promise<void> {
    const doc = await this.athletes.getInTeam(teamIdOf(user), parseObjectId(id));
    await this.notes.remove(doc._id, parseObjectId(noteId));
  }
}
