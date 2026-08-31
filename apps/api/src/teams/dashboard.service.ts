import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { CoachDashboard, TodayItem } from '@kadro/shared';
import { CompletedSession } from '../activities/completed-session.schema';
import { Athlete } from '../athletes/athlete.schema';
import { AlertsService } from '../alerts/alerts.service';
import { Checkin } from '../checkins/checkin.schema';
import { PlannedSession } from '../planning/planned-session.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Athlete.name) private readonly athletes: Model<Athlete>,
    @InjectModel(PlannedSession.name) private readonly sessions: Model<PlannedSession>,
    @InjectModel(Checkin.name) private readonly checkins: Model<Checkin>,
    @InjectModel(CompletedSession.name) private readonly completed: Model<CompletedSession>,
    private readonly alerts: AlertsService,
  ) {}

  async dashboard(teamId: Types.ObjectId): Promise<CoachDashboard> {
    const today = new Date().toISOString().slice(0, 10);
    const { weekStart, weekEnd } = currentWeek(today);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    const [
      athleteCount,
      activeThisWeek,
      sessionsPlanned,
      sessionsDone,
      openAlerts,
      adherenceAgg,
      roster,
      todaySessions,
      todayCheckins,
    ] = await Promise.all([
      this.athletes.countDocuments({ teamId, status: 'active' }).exec(),
      this.athletes
        .countDocuments({ teamId, status: 'active', 'snapshot.lastActivityAt': { $gte: sevenDaysAgo } })
        .exec(),
      this.sessions.countDocuments({ teamId, date: { $gte: weekStart, $lte: weekEnd } }).exec(),
      this.sessions
        .countDocuments({ teamId, date: { $gte: weekStart, $lte: weekEnd }, status: 'completed' })
        .exec(),
      this.alerts.countOpen(teamId),
      this.athletes
        .aggregate<{ _id: null; avg: number | null }>([
          { $match: { teamId, status: 'active', 'snapshot.adherence7d': { $ne: null } } },
          { $group: { _id: null, avg: { $avg: '$snapshot.adherence7d' } } },
        ])
        .exec(),
      this.athletes
        .aggregate<{
          _id: Types.ObjectId;
          formStatus: TodayItem['formStatus'];
          user: { firstName: string; lastName: string };
        }>([
          { $match: { teamId, status: 'active' } },
          { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
          { $unwind: '$user' },
          { $sort: { 'user.firstName': 1, _id: 1 } },
          {
            $project: {
              formStatus: '$snapshot.formStatus',
              user: { firstName: '$user.firstName', lastName: '$user.lastName' },
            },
          },
        ])
        .exec(),
      this.sessions.find({ teamId, date: today }).exec(),
      this.checkins.find({ teamId, date: today }).exec(),
    ]);

    const sessionByAthlete = new Map(todaySessions.map((s) => [s.athleteId.toString(), s]));
    const checkinByAthlete = new Map(todayCheckins.map((c) => [c.athleteId.toString(), c]));

    const todayItems: TodayItem[] = roster.map((a) => {
      const session = sessionByAthlete.get(a._id.toString());
      return {
        athleteId: a._id.toString(),
        firstName: a.user.firstName,
        lastName: a.user.lastName,
        formStatus: a.formStatus,
        checkinLevel: checkinByAthlete.get(a._id.toString())?.level ?? null,
        session: session
          ? { id: session._id.toString(), name: session.name, type: session.type, status: session.status }
          : null,
      };
    });

    return {
      kpis: {
        athleteCount,
        activeThisWeek,
        sessionsDone,
        sessionsPlanned,
        adherence7d: adherenceAgg[0]?.avg ?? null,
        adherenceDelta: null,
        openAlerts,
      },
      today: todayItems,
      weeklyVolumeKm: await this.teamWeeklyVolume(teamId),
    };
  }

  private async teamWeeklyVolume(teamId: Types.ObjectId): Promise<{ week: string; km: number }[]> {
    const since = new Date(Date.now() - 8 * 7 * 24 * 3600 * 1000);
    const docs = await this.completed
      .find({ teamId, startedAt: { $gte: since }, sport: { $in: ['run', 'trail'] } }, { startedAt: 1, distanceM: 1 })
      .exec();
    const byWeek = new Map<string, number>();
    for (const doc of docs) {
      const week = isoWeek(doc.startedAt);
      byWeek.set(week, (byWeek.get(week) ?? 0) + (doc.distanceM ?? 0));
    }
    const result: { week: string; km: number }[] = [];
    for (let i = 7; i >= 0; i -= 1) {
      const week = isoWeek(new Date(Date.now() - i * 7 * 24 * 3600 * 1000));
      result.push({ week, km: Math.round((byWeek.get(week) ?? 0) / 1000) });
    }
    return result;
  }
}

function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `S${String(week).padStart(2, '0')}`;
}

function currentWeek(today: string): { weekStart: string; weekEnd: string } {
  const d = new Date(`${today}T00:00:00.000Z`);
  const day = (d.getUTCDay() + 6) % 7;
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() - day);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { weekStart: start.toISOString().slice(0, 10), weekEnd: end.toISOString().slice(0, 10) };
}
