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
import type { AthleteOverview, ExerciseStats, Monitoring } from '@kadro/shared';
import { z } from 'zod';
import { ActivitiesService } from '../activities/activities.service';
import { AlertsService } from '../alerts/alerts.service';
import { CheckinsService } from '../checkins/checkins.service';
import { PlanningService } from '../planning/planning.service';
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
const zWeeksQuery = z.object({ weeks: z.coerce.number().int().min(1).max(26).default(8) });

@Controller('athletes')
@UseGuards(JwtAccessGuard, CoachGuard)
export class AthletesController {
  constructor(
    private readonly athletes: AthletesService,
    private readonly tests: TestsService,
    private readonly notes: NotesService,
    private readonly teams: TeamsService,
    private readonly activities: ActivitiesService,
    private readonly planning: PlanningService,
    private readonly checkins: CheckinsService,
    private readonly alerts: AlertsService,
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

  @Get(':id/overview')
  async overview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query(new ZodValidationPipe(zWeeksQuery)) query: z.infer<typeof zWeeksQuery>,
  ): Promise<AthleteOverview> {
    const teamId = teamIdOf(user);
    const doc = await this.athletes.getInTeam(teamId, parseObjectId(id));
    const today = new Date();
    const monday = new Date(today);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const [loadByWeek, week, recentSessions, checkins7d, openAlerts] = await Promise.all([
      this.activities.weeklyLoads(doc._id, query.weeks),
      this.planning.list(teamId, {
        from: monday.toISOString().slice(0, 10),
        to: sunday.toISOString().slice(0, 10),
        athleteId: doc._id.toString(),
      }),
      this.activities.recent(teamId, doc._id, 5),
      this.checkins.list(teamId, {
        athleteId: doc._id.toString(),
        from: weekAgo,
        to: today.toISOString().slice(0, 10),
      }),
      this.alerts.list(teamId, { status: 'open', athleteId: doc._id.toString(), limit: 1 }),
    ]);
    return {
      loadByWeek,
      acuteChronicRatio: doc.snapshot.acuteChronicRatio,
      week,
      recentSessions,
      checkins7d,
      currentAlert: openAlerts.items[0] ?? null,
    };
  }

  @Get(':id/monitoring')
  async monitoring(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query(new ZodValidationPipe(zWeeksQuery)) query: z.infer<typeof zWeeksQuery>,
  ): Promise<Monitoring> {
    const doc = await this.athletes.getInTeam(teamIdOf(user), parseObjectId(id));
    return this.checkins.monitoring(doc.teamId, doc._id, query.weeks);
  }

  @Get(':id/strength-stats')
  async strengthStats(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<ExerciseStats[]> {
    const doc = await this.athletes.getInTeam(teamIdOf(user), parseObjectId(id));
    return this.activities.strengthStats(doc._id);
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
