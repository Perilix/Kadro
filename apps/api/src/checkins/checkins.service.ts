import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type {
  Checkin as CheckinDto,
  CheckinCreate,
  CheckinToday,
  CheckinsQuery,
  Monitoring,
} from '@kadro/shared';
import { checkinLevel } from '@kadro/shared';
import { Athlete, AthleteDocument } from '../athletes/athlete.schema';
import { Team } from '../teams/team.schema';
import type { AlertThresholds } from '../teams/team.schema';
import { AlertsService } from '../alerts/alerts.service';
import { Checkin, CheckinDocument } from './checkin.schema';
import { HealthMetric } from './health-metric.schema';

@Injectable()
export class CheckinsService {
  constructor(
    @InjectModel(Checkin.name) private readonly model: Model<Checkin>,
    @InjectModel(HealthMetric.name) private readonly healthMetrics: Model<HealthMetric>,
    @InjectModel(Athlete.name) private readonly athletes: Model<Athlete>,
    @InjectModel(Team.name) private readonly teams: Model<Team>,
    private readonly alerts: AlertsService,
  ) {}

  async upsert(athleteId: Types.ObjectId, dto: CheckinCreate): Promise<CheckinDto> {
    const athlete = await this.athletes.findById(athleteId).exec();
    if (!athlete) throw new NotFoundException({ code: 'athlete.not_found' });

    const level = checkinLevel(dto.feeling as 1 | 2 | 3 | 4 | 5);
    const existing = await this.model.findOne({ athleteId, date: dto.date }).exec();
    let doc: CheckinDocument;
    if (existing) {
      existing.set({ ...dto, level, updatedAt: new Date() });
      doc = await existing.save();
    } else {
      doc = await this.model.create({
        ...dto,
        athleteId,
        teamId: athlete.teamId,
        level,
        submittedAt: new Date(),
      });
    }

    await this.updateSnapshot(athlete, dto.date, level);
    await this.evaluateRedStreak(athlete, doc);
    await this.alerts.resolveByKind(athlete._id, ['no_checkin']);
    if (level !== 'bad') await this.alerts.resolveByKind(athlete._id, ['form_red_streak']);
    return toCheckinDto(doc);
  }

  async list(teamId: Types.ObjectId, query: CheckinsQuery): Promise<CheckinDto[]> {
    const athleteId = new Types.ObjectId(query.athleteId);
    const athlete = await this.athletes.findOne({ _id: athleteId, teamId }).exec();
    if (!athlete) throw new NotFoundException({ code: 'athlete.not_found' });
    const docs = await this.model
      .find({ athleteId, date: { $gte: query.from, $lte: query.to } })
      .sort({ date: 1 })
      .exec();
    return docs.map(toCheckinDto);
  }

  async today(athleteId: Types.ObjectId): Promise<CheckinToday> {
    const date = todayYmd();
    const [checkin, metric] = await Promise.all([
      this.model.findOne({ athleteId, date }).exec(),
      this.healthMetrics.findOne({ athleteId, date }).exec(),
    ]);
    return {
      checkin: checkin ? toCheckinDto(checkin) : null,
      prefill: { sleepMin: metric?.sleepMin ?? null },
    };
  }

  async monitoring(teamId: Types.ObjectId, athleteId: Types.ObjectId, weeks: number): Promise<Monitoring> {
    const athlete = await this.athletes.findOne({ _id: athleteId, teamId }).exec();
    if (!athlete) throw new NotFoundException({ code: 'athlete.not_found' });
    const from = new Date(Date.now() - weeks * 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const [metrics, checkins] = await Promise.all([
      this.healthMetrics.find({ athleteId, date: { $gte: from } }).exec(),
      this.model.find({ athleteId, date: { $gte: from } }).exec(),
    ]);
    const metricByDate = new Map(metrics.map((m) => [m.date, m]));
    const checkinByDate = new Map(checkins.map((c) => [c.date, c]));
    const days: Monitoring['days'] = [];
    for (let i = weeks * 7 - 1; i >= 0; i -= 1) {
      const date = new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const metric = metricByDate.get(date);
      days.push({
        date,
        sleepMin: metric?.sleepMin ?? null,
        restingHrBpm: metric?.restingHrBpm ?? null,
        hrvRmssdMs: metric?.hrvRmssdMs ?? null,
        weightKg: metric?.weightKg ?? null,
        checkinLevel: checkinByDate.get(date)?.level ?? null,
      });
    }
    const last7 = days.slice(-7);
    return {
      days,
      summary7d: {
        sleepAvgMin: avgOrNull(last7.map((d) => d.sleepMin)),
        restingHrAvgBpm: avgOrNull(last7.map((d) => d.restingHrBpm)),
        hrvAvgMs: avgOrNull(last7.map((d) => d.hrvRmssdMs)),
        weightKg: [...last7].reverse().find((d) => d.weightKg != null)?.weightKg ?? null,
      },
      thresholds: await this.thresholdsFor(athlete),
    };
  }

  private async updateSnapshot(
    athlete: AthleteDocument,
    date: string,
    level: 'good' | 'warn' | 'bad',
  ): Promise<void> {
    if (date < (athlete.snapshot.formStatusSince ?? '')) return;
    const since = athlete.snapshot.formStatus === level ? athlete.snapshot.formStatusSince : date;
    await this.athletes
      .updateOne(
        { _id: athlete._id },
        {
          $set: {
            'snapshot.formStatus': level,
            'snapshot.formStatusSince': since,
            'snapshot.updatedAt': new Date(),
          },
        },
      )
      .exec();
  }

  private async evaluateRedStreak(athlete: AthleteDocument, checkin: CheckinDocument): Promise<void> {
    if (checkin.level !== 'bad') return;
    const thresholds = await this.thresholdsFor(athlete);
    const recent = await this.model
      .find({ athleteId: athlete._id, date: { $lte: checkin.date } })
      .sort({ date: -1 })
      .limit(thresholds.redFeelingStreakDays + 1)
      .exec();
    let streak = 0;
    let expected = checkin.date;
    for (const c of recent) {
      if (c.date !== expected || c.level !== 'bad') break;
      streak += 1;
      expected = previousYmd(expected);
    }
    if (streak >= thresholds.redFeelingStreakDays) {
      await this.alerts.open({
        teamId: athlete.teamId,
        athleteId: athlete._id,
        kind: 'form_red_streak',
        severity: 'critical',
        i18nKey: 'alert.form_red_streak',
        params: { days: streak },
        suggestedAction: 'adapt_session',
        refs: { checkinId: checkin._id },
      });
    }
  }

  private async thresholdsFor(athlete: AthleteDocument): Promise<AlertThresholds> {
    const team = await this.teams.findById(athlete.teamId).exec();
    if (!team) throw new NotFoundException({ code: 'team.not_found' });
    return { ...team.alertDefaults, ...(athlete.alertOverrides ?? {}) };
  }
}

function toCheckinDto(doc: CheckinDocument): CheckinDto {
  return {
    id: doc._id.toString(),
    athleteId: doc.athleteId.toString(),
    date: doc.date,
    feeling: doc.feeling,
    sleepMin: doc.sleepMin,
    soreness: doc.soreness,
    fatigue: doc.fatigue,
    mood: doc.mood,
    comment: doc.comment,
    level: doc.level,
    submittedAt: doc.submittedAt.toISOString(),
    updatedAt: doc.updatedAt?.toISOString() ?? null,
  };
}

function avgOrNull(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v != null);
  if (present.length === 0) return null;
  return Math.round(present.reduce((a, b) => a + b, 0) / present.length);
}

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function previousYmd(date: string): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
