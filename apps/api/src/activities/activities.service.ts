import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import type {
  ActivitiesQuery,
  ActivityDetail,
  ActivityListItem,
  FeedbackCreate,
  LinkActivity,
  ManualComplete,
  Page,
  Streams,
  StreamsQuery,
} from '@kadro/shared';
import { acuteChronicRatio, epley1Rm, sessionLoadUa, tonnageKg } from '@kadro/shared';
import type { ExerciseStats, WeekLoad } from '@kadro/shared';
import { Athlete } from '../athletes/athlete.schema';
import type { JwtPayload } from '../auth/jwt-payload';
import { decodeCursor, encodeCursor } from '../common/cursor';
import { AlertsService } from '../alerts/alerts.service';
import { Exercise } from '../library/exercise.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { PlannedSession, PlannedSessionDocument } from '../planning/planned-session.schema';
import { UsersService } from '../users/users.service';
import { ActivityStream } from './activity-stream.schema';
import { CompletedSession, CompletedSessionDocument } from './completed-session.schema';

interface Viewer {
  teamId: Types.ObjectId;
  athleteId: Types.ObjectId | null;
  userId: Types.ObjectId;
}

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(CompletedSession.name) private readonly model: Model<CompletedSession>,
    @InjectModel(ActivityStream.name) private readonly streams: Model<ActivityStream>,
    @InjectModel(PlannedSession.name) private readonly planned: Model<PlannedSession>,
    @InjectModel(Athlete.name) private readonly athletes: Model<Athlete>,
    @InjectModel(Exercise.name) private readonly exercises: Model<Exercise>,
    private readonly users: UsersService,
    private readonly notifications: NotificationsService,
    private readonly alerts: AlertsService,
  ) {}

  viewerOf(user: JwtPayload): Viewer {
    if (!user.teamId) throw new ForbiddenException({ code: 'team.not_found' });
    return {
      teamId: new Types.ObjectId(user.teamId),
      athleteId: user.role === 'athlete' ? new Types.ObjectId(user.athleteId) : null,
      userId: new Types.ObjectId(user.sub),
    };
  }

  async completeManual(
    user: JwtPayload,
    plannedSessionId: Types.ObjectId,
    dto: ManualComplete,
  ): Promise<ActivityDetail> {
    const viewer = this.viewerOf(user);
    const planned = await this.planned
      .findOne({ _id: plannedSessionId, teamId: viewer.teamId })
      .exec();
    if (!planned) throw new NotFoundException({ code: 'session.not_found' });
    if (viewer.athleteId && !planned.athleteId.equals(viewer.athleteId)) {
      throw new ForbiddenException({ code: 'session.forbidden' });
    }
    if (planned.completedSessionId) {
      throw new ConflictException({ code: 'session.already_completed' });
    }

    const strength = dto.strength ? await this.buildStrength(planned, dto.strength) : null;
    const rpe = dto.rpe ?? null;
    const doc = await this.model.create({
      teamId: planned.teamId,
      athleteId: planned.athleteId,
      plannedSessionId: planned._id,
      source: 'manual',
      sport: planned.type === 'strength' ? 'strength' : 'run',
      startedAt: dto.startedAt ? new Date(dto.startedAt) : new Date(`${planned.date}T12:00:00.000Z`),
      durationSec: dto.durationSec,
      distanceM: dto.distanceM,
      avgPaceSecPerKm:
        dto.distanceM && dto.distanceM > 0 ? (dto.durationSec / dto.distanceM) * 1000 : null,
      avgHrBpm: dto.avgHrBpm,
      strength,
      loadUa: sessionLoadUa(dto.durationSec / 60, rpe ?? planned.expectedDifficulty),
      feedback:
        rpe != null || dto.feeling != null || dto.comment != null
          ? { rpe, feeling: dto.feeling, comment: dto.comment, submittedAt: new Date() }
          : null,
      syncedAt: new Date(),
    });

    planned.status = 'completed';
    planned.completedSessionId = doc._id;
    await planned.save();
    await this.recomputeSnapshot(planned.athleteId);
    await this.alerts.resolveByKind(planned.athleteId, ['no_activity', 'missed_session']);
    return this.toDetail(doc);
  }

  async list(user: JwtPayload, query: ActivitiesQuery): Promise<Page<ActivityListItem>> {
    const viewer = this.viewerOf(user);
    const filter: FilterQuery<CompletedSession> = { teamId: viewer.teamId };
    filter.athleteId = viewer.athleteId ?? (query.athleteId ? new Types.ObjectId(query.athleteId) : undefined);
    if (!filter.athleteId) delete filter.athleteId;
    if (query.sport) filter.sport = query.sport;
    if (query.from || query.to) {
      filter.startedAt = {
        ...(query.from ? { $gte: new Date(query.from) } : {}),
        ...(query.to ? { $lte: new Date(query.to) } : {}),
      };
    }
    const offset = decodeCursor(query.cursor);
    const docs = await this.model
      .find(filter)
      .sort({ startedAt: -1, _id: -1 })
      .skip(offset)
      .limit(query.limit + 1)
      .exec();
    const hasMore = docs.length > query.limit;
    const page = docs.slice(0, query.limit);
    const names = await this.plannedNames(page);
    return {
      items: page.map((doc) => toListItem(doc, names.get(doc.plannedSessionId?.toString() ?? '') ?? null)),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }

  async detail(user: JwtPayload, id: Types.ObjectId): Promise<ActivityDetail> {
    return this.toDetail(await this.getAccessible(user, id));
  }

  async getStreams(user: JwtPayload, id: Types.ObjectId, query: StreamsQuery): Promise<Streams> {
    const activity = await this.getAccessible(user, id);
    const doc = await this.streams.findById(activity._id).exec();
    if (!doc) throw new NotFoundException({ code: 'streams.not_found' });
    const wanted = new Set((query.series ?? 'hr,pace,gap,alt,cadence').split(','));
    const stride = Math.max(1, Math.ceil(doc.sampleCount / query.points));
    const pick = <T>(arr: T[] | null): T[] | null =>
      arr ? arr.filter((_, i) => i % stride === 0) : null;
    return {
      activityId: activity._id.toString(),
      sampleCount: doc.sampleCount,
      tSec: pick(doc.tSec) ?? [],
      hrBpm: wanted.has('hr') ? pick(doc.hrBpm) : null,
      speedMps: wanted.has('pace') ? pick(doc.speedMps) : null,
      gapSpeedMps: wanted.has('gap') ? pick(doc.gapSpeedMps) : null,
      altM: wanted.has('alt') ? pick(doc.altM) : null,
      cadenceSpm: wanted.has('cadence') ? pick(doc.cadenceSpm) : null,
    };
  }

  async feedback(user: JwtPayload, id: Types.ObjectId, dto: FeedbackCreate): Promise<ActivityDetail> {
    const viewer = this.viewerOf(user);
    if (!viewer.athleteId) throw new ForbiddenException({ code: 'auth.athlete_only' });
    const doc = await this.getAccessible(user, id);
    doc.feedback = { rpe: dto.rpe, feeling: dto.feeling, comment: dto.comment, submittedAt: new Date() };
    doc.loadUa = sessionLoadUa(doc.durationSec / 60, dto.rpe);
    await doc.save();
    await this.recomputeSnapshot(doc.athleteId);

    const athlete = await this.athletes.findById(doc.athleteId).exec();
    const sender = await this.users.findById(viewer.userId);
    if (athlete) {
      await this.notifications.notify(
        athlete.coachId,
        'session',
        'notification.session_feedback',
        { from: sender ? `${sender.firstName} ${sender.lastName}` : '', rpe: dto.rpe },
        { completedSessionId: doc._id, athleteId: doc.athleteId },
      );
    }
    return this.toDetail(doc);
  }

  async link(user: JwtPayload, id: Types.ObjectId, dto: LinkActivity): Promise<ActivityDetail> {
    const doc = await this.getAccessible(user, id);
    const planned = await this.planned
      .findOne({ _id: new Types.ObjectId(dto.plannedSessionId), athleteId: doc.athleteId })
      .exec();
    if (!planned) throw new NotFoundException({ code: 'session.not_found' });
    if (planned.completedSessionId && !planned.completedSessionId.equals(doc._id)) {
      throw new ConflictException({ code: 'session.already_completed' });
    }
    await this.unlinkPlanned(doc);
    doc.plannedSessionId = planned._id;
    await doc.save();
    planned.status = 'completed';
    planned.completedSessionId = doc._id;
    await planned.save();
    await this.recomputeSnapshot(doc.athleteId);
    return this.toDetail(doc);
  }

  async unlink(user: JwtPayload, id: Types.ObjectId): Promise<ActivityDetail> {
    const doc = await this.getAccessible(user, id);
    await this.unlinkPlanned(doc);
    doc.plannedSessionId = null;
    await doc.save();
    await this.recomputeSnapshot(doc.athleteId);
    return this.toDetail(doc);
  }

  async recent(teamId: Types.ObjectId, athleteId: Types.ObjectId, limit: number): Promise<ActivityListItem[]> {
    const docs = await this.model
      .find({ teamId, athleteId })
      .sort({ startedAt: -1, _id: -1 })
      .limit(limit)
      .exec();
    const names = await this.plannedNames(docs);
    return docs.map((doc) => toListItem(doc, names.get(doc.plannedSessionId?.toString() ?? '') ?? null));
  }

  async weeklyLoads(athleteId: Types.ObjectId, weeks: number): Promise<WeekLoad[]> {
    const since = new Date(Date.now() - weeks * 7 * 24 * 3600 * 1000);
    const docs = await this.model.find({ athleteId, startedAt: { $gte: since } }).exec();
    const byWeek = new Map<string, { loadUa: number; volumeM: number }>();
    for (const doc of docs) {
      const week = isoWeek(doc.startedAt);
      const entry = byWeek.get(week) ?? { loadUa: 0, volumeM: 0 };
      entry.loadUa += doc.loadUa ?? 0;
      if (doc.sport === 'run' || doc.sport === 'trail') entry.volumeM += doc.distanceM ?? 0;
      byWeek.set(week, entry);
    }
    const result: WeekLoad[] = [];
    for (let i = weeks - 1; i >= 0; i -= 1) {
      const week = isoWeek(new Date(Date.now() - i * 7 * 24 * 3600 * 1000));
      const entry = byWeek.get(week);
      result.push({
        week,
        loadUa: Math.round(entry?.loadUa ?? 0),
        volumeKm: Math.round((entry?.volumeM ?? 0) / 100) / 10,
      });
    }
    return result;
  }

  async strengthStats(athleteId: Types.ObjectId): Promise<ExerciseStats[]> {
    const since = new Date(Date.now() - 16 * 7 * 24 * 3600 * 1000);
    const docs = await this.model
      .find({ athleteId, sport: 'strength', startedAt: { $gte: since }, strength: { $ne: null } })
      .sort({ startedAt: 1 })
      .exec();
    const stats = new Map<string, ExerciseStats>();
    for (const doc of docs) {
      const week = isoWeek(doc.startedAt);
      const date = doc.startedAt.toISOString().slice(0, 10);
      for (const exercise of doc.strength?.exercises ?? []) {
        const key = exercise.exerciseId.toString();
        const entry =
          stats.get(key) ??
          ({ exerciseId: key, name: exercise.name, est1RmKg: null, est1RmAt: null, lastWorkingKg: null, weeklyMaxKg: [] } as ExerciseStats);
        let weekMax = 0;
        for (const set of exercise.sets) {
          if (!set.done || set.kg == null) continue;
          entry.lastWorkingKg = set.kg;
          weekMax = Math.max(weekMax, set.kg);
          if (set.reps != null && set.reps >= 1) {
            const rm = Math.round(epley1Rm(set.kg, set.reps) * 2) / 2;
            if (entry.est1RmKg == null || rm >= entry.est1RmKg) {
              entry.est1RmKg = rm;
              entry.est1RmAt = date;
            }
          }
        }
        if (weekMax > 0) {
          const existing = entry.weeklyMaxKg.find((w) => w.week === week);
          if (existing) existing.kg = Math.max(existing.kg, weekMax);
          else entry.weeklyMaxKg.push({ week, kg: weekMax });
        }
        stats.set(key, entry);
      }
    }
    return [...stats.values()];
  }

  async recomputeSnapshot(athleteId: Types.ObjectId): Promise<void> {
    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const d28 = new Date(now.getTime() - 28 * 24 * 3600 * 1000);
    const ymd7 = d7.toISOString().slice(0, 10);
    const ymd28 = d28.toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);

    const [completed, planned7, planned28] = await Promise.all([
      this.model.find({ athleteId, startedAt: { $gte: d28 } }).exec(),
      this.planned
        .find({ athleteId, date: { $gte: ymd7, $lte: today }, status: { $ne: 'canceled' } })
        .exec(),
      this.planned
        .find({ athleteId, date: { $gte: ymd28, $lte: today }, status: { $ne: 'canceled' } })
        .exec(),
    ]);

    const in7 = completed.filter((c) => c.startedAt >= d7);
    const load7 = sum(in7.map((c) => c.loadUa ?? 0));
    const load28 = sum(completed.map((c) => c.loadUa ?? 0));
    const volume7 = sum(
      in7.filter((c) => c.sport === 'run' || c.sport === 'trail').map((c) => c.distanceM ?? 0),
    );
    const lastActivityAt = completed.length
      ? new Date(Math.max(...completed.map((c) => c.startedAt.getTime())))
      : null;

    await this.athletes
      .updateOne(
        { _id: athleteId },
        {
          $set: {
            'snapshot.load7dUa': load7 || null,
            'snapshot.acuteChronicRatio': roundOrNull(acuteChronicRatio(load7, load28), 2),
            'snapshot.volume7dKm': volume7 ? Math.round(volume7 / 100) / 10 : null,
            'snapshot.adherence7d': adherence(planned7),
            'snapshot.adherence28d': adherence(planned28),
            'snapshot.lastActivityAt': lastActivityAt,
            'snapshot.updatedAt': new Date(),
          },
        },
      )
      .exec();
  }

  private async getAccessible(user: JwtPayload, id: Types.ObjectId): Promise<CompletedSessionDocument> {
    const viewer = this.viewerOf(user);
    const doc = await this.model.findOne({ _id: id, teamId: viewer.teamId }).exec();
    if (!doc) throw new NotFoundException({ code: 'activity.not_found' });
    if (viewer.athleteId && !doc.athleteId.equals(viewer.athleteId)) {
      throw new ForbiddenException({ code: 'activity.forbidden' });
    }
    return doc;
  }

  private async unlinkPlanned(doc: CompletedSessionDocument): Promise<void> {
    if (!doc.plannedSessionId) return;
    await this.planned
      .updateOne(
        { _id: doc.plannedSessionId },
        { $set: { status: 'planned', completedSessionId: null } },
      )
      .exec();
  }

  private async buildStrength(
    planned: PlannedSessionDocument,
    items: NonNullable<ManualComplete['strength']>,
  ) {
    const ids = items.map((i) => new Types.ObjectId(i.exerciseId));
    const docs = await this.exercises.find({ _id: { $in: ids } }).exec();
    const nameById = new Map(docs.map((e) => [e._id.toString(), e.name]));
    const loadByExercise = new Map(
      (planned.resolved?.loads ?? []).map((l) => [l.exerciseId.toString(), l.kg]),
    );
    const prescribedByExercise = new Map(
      (planned.exercises ?? []).map((e) => [e.exerciseId, e]),
    );
    const exercises = items.map((item) => {
      const prescribed = prescribedByExercise.get(item.exerciseId);
      return {
        exerciseId: new Types.ObjectId(item.exerciseId),
        name: nameById.get(item.exerciseId) ?? '',
        prescribed: prescribed
          ? {
              sets: prescribed.sets,
              reps: prescribed.reps,
              kg: loadByExercise.get(item.exerciseId) ?? null,
            }
          : null,
        sets: item.sets,
        note: item.note,
      };
    });
    return {
      exercises,
      tonnageKg: tonnageKg(exercises.flatMap((e) => e.sets)),
    };
  }

  private async plannedNames(docs: CompletedSessionDocument[]): Promise<Map<string, string>> {
    const ids = docs.map((d) => d.plannedSessionId).filter((id): id is Types.ObjectId => id != null);
    if (ids.length === 0) return new Map();
    const sessions = await this.planned.find({ _id: { $in: ids } }, { name: 1 }).exec();
    return new Map(sessions.map((s) => [s._id.toString(), s.name]));
  }

  private async toDetail(doc: CompletedSessionDocument): Promise<ActivityDetail> {
    const planned = doc.plannedSessionId
      ? await this.planned.findById(doc.plannedSessionId).exec()
      : null;
    const comparison = await this.findComparison(doc, planned);
    return {
      ...toListItem(doc, planned?.name ?? null),
      deviceName: doc.deviceName,
      timezone: doc.timezone,
      elevLossM: doc.elevLossM,
      gapAvgPaceSecPerKm: doc.gapAvgPaceSecPerKm,
      maxHrBpm: doc.maxHrBpm,
      avgCadenceSpm: doc.avgCadenceSpm,
      ascentSpeedMPerH: doc.ascentSpeedMPerH,
      hrZonesSec: doc.hrZonesSec,
      laps: doc.laps,
      kmSplits: doc.kmSplits,
      bestEfforts: doc.bestEfforts,
      strength: doc.strength
        ? {
            exercises: doc.strength.exercises.map((e) => ({
              ...e,
              exerciseId: e.exerciseId.toString(),
            })),
            tonnageKg: doc.strength.tonnageKg,
          }
        : null,
      feedback: doc.feedback
        ? { ...doc.feedback, submittedAt: doc.feedback.submittedAt.toISOString() }
        : null,
      expectedDifficulty: planned?.expectedDifficulty ?? null,
      comparison,
    };
  }

  private async findComparison(
    doc: CompletedSessionDocument,
    planned: PlannedSessionDocument | null,
  ): Promise<ActivityDetail['comparison']> {
    let previous: CompletedSessionDocument | null = null;
    if (planned?.templateId) {
      const siblings = await this.planned
        .find({ athleteId: doc.athleteId, templateId: planned.templateId }, { _id: 1 })
        .exec();
      previous = await this.model
        .findOne({
          athleteId: doc.athleteId,
          plannedSessionId: { $in: siblings.map((s) => s._id) },
          startedAt: { $lt: doc.startedAt },
        })
        .sort({ startedAt: -1 })
        .exec();
    }
    if (!previous) {
      previous = await this.model
        .findOne({ athleteId: doc.athleteId, sport: doc.sport, startedAt: { $lt: doc.startedAt } })
        .sort({ startedAt: -1 })
        .exec();
    }
    if (!previous) return null;
    return {
      activityId: previous._id.toString(),
      startedAt: previous.startedAt.toISOString(),
      durationSec: previous.durationSec,
      distanceM: previous.distanceM,
      avgPaceSecPerKm: previous.avgPaceSecPerKm,
      avgHrBpm: previous.avgHrBpm,
    };
  }
}

function toListItem(doc: CompletedSessionDocument, name: string | null): ActivityListItem {
  return {
    id: doc._id.toString(),
    athleteId: doc.athleteId.toString(),
    plannedSessionId: doc.plannedSessionId?.toString() ?? null,
    name,
    sport: doc.sport,
    source: doc.source,
    startedAt: doc.startedAt.toISOString(),
    durationSec: doc.durationSec,
    distanceM: doc.distanceM,
    avgPaceSecPerKm: doc.avgPaceSecPerKm,
    avgHrBpm: doc.avgHrBpm,
    elevGainM: doc.elevGainM,
    loadUa: doc.loadUa,
    hasStreams: doc.hasStreams,
    feedbackRpe: doc.feedback?.rpe ?? null,
  };
}

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function adherence(sessions: { status: string }[]): number | null {
  if (sessions.length === 0) return null;
  const done = sessions.filter((s) => s.status === 'completed').length;
  return Math.round((done / sessions.length) * 100);
}

function roundOrNull(value: number | null, decimals: number): number | null {
  if (value == null) return null;
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
