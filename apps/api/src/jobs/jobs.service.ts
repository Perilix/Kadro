import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivitiesService } from '../activities/activities.service';
import { AlertsService } from '../alerts/alerts.service';
import { Athlete, AthleteDocument } from '../athletes/athlete.schema';
import { Checkin } from '../checkins/checkin.schema';
import { HealthMetric } from '../checkins/health-metric.schema';
import { PlannedSession } from '../planning/planned-session.schema';
import { Team } from '../teams/team.schema';
import type { AlertThresholds } from '../teams/team.schema';

const DAY_MS = 24 * 3600 * 1000;

export interface JobsReport {
  missed: number;
  alertsEvaluated: number;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectModel(PlannedSession.name) private readonly planned: Model<PlannedSession>,
    @InjectModel(Athlete.name) private readonly athletes: Model<Athlete>,
    @InjectModel(Checkin.name) private readonly checkins: Model<Checkin>,
    @InjectModel(HealthMetric.name) private readonly metrics: Model<HealthMetric>,
    @InjectModel(Team.name) private readonly teams: Model<Team>,
    private readonly alerts: AlertsService,
    private readonly activities: ActivitiesService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async hourly(): Promise<JobsReport> {
    const missed = await this.markMissedSessions();
    const alertsEvaluated = await this.evaluateAthleteAlerts();
    await this.expireTrials();
    this.logger.log(`jobs: ${missed} séances manquées, ${alertsEvaluated} athlètes évalués`);
    return { missed, alertsEvaluated };
  }

  async expireTrials(): Promise<void> {
    await this.teams
      .updateMany(
        {
          'subscription.plan': 'trial',
          'subscription.status': 'trialing',
          'subscription.trialEndsAt': { $lt: new Date() },
        },
        { $set: { 'subscription.status': 'past_due' } },
      )
      .exec();
  }

  async markMissedSessions(): Promise<number> {
    const today = ymd(new Date());
    const stale = await this.planned.find({ status: 'planned', date: { $lt: today } }).exec();
    if (stale.length === 0) return 0;

    const thresholdsByAthlete = await this.thresholdsFor([
      ...new Set(stale.map((s) => s.athleteId.toString())),
    ]);
    await this.planned
      .updateMany(
        { _id: { $in: stale.map((s) => s._id) } },
        { $set: { status: 'missed' } },
      )
      .exec();

    const touched = new Set<string>();
    for (const session of stale) {
      const key = session.athleteId.toString();
      const thresholds = thresholdsByAthlete.get(key);
      if (thresholds?.missedSessionAlert) {
        await this.alerts.open({
          teamId: session.teamId,
          athleteId: session.athleteId,
          kind: 'missed_session',
          severity: 'warn',
          i18nKey: 'alert.missed_session',
          params: { name: session.name, date: session.date },
          suggestedAction: 'message',
          refs: { plannedSessionId: session._id },
        });
      }
      touched.add(key);
    }
    for (const athleteId of touched) {
      await this.activities.recomputeSnapshot(new Types.ObjectId(athleteId));
    }
    return stale.length;
  }

  async evaluateAthleteAlerts(): Promise<number> {
    const roster = await this.athletes.find({ status: 'active' }).exec();
    if (roster.length === 0) return 0;
    const thresholdsByAthlete = await this.thresholdsFor(roster.map((a) => a._id.toString()));
    const lastCheckins = await this.checkins
      .aggregate<{ _id: Types.ObjectId; lastDate: string }>([
        { $group: { _id: '$athleteId', lastDate: { $max: '$date' } } },
      ])
      .exec();
    const lastCheckinByAthlete = new Map(lastCheckins.map((c) => [c._id.toString(), c.lastDate]));

    const now = Date.now();
    const today = ymd(new Date());
    for (const athlete of roster) {
      const thresholds = thresholdsByAthlete.get(athlete._id.toString());
      if (!thresholds) continue;

      const lastActivity = athlete.snapshot.lastActivityAt;
      if (lastActivity && now - lastActivity.getTime() > thresholds.noActivityDays * DAY_MS) {
        await this.openFor(athlete, 'no_activity', 'warn', {
          days: Math.floor((now - lastActivity.getTime()) / DAY_MS),
        }, 'message');
      }

      const lastCheckin = lastCheckinByAthlete.get(athlete._id.toString());
      if (lastCheckin && daysBetween(lastCheckin, today) > thresholds.noCheckinDays) {
        await this.openFor(athlete, 'no_checkin', 'info', { days: daysBetween(lastCheckin, today) }, 'remind');
      }

      if (athlete.goal?.date) {
        const untilRace = daysBetween(today, athlete.goal.date);
        if (untilRace >= 0 && untilRace <= 7) {
          await this.openFor(athlete, 'race_soon', 'info', { label: athlete.goal.label, days: untilRace }, 'validate_week');
        }
      }

      await this.evaluateHealth(athlete, thresholds);
    }
    return roster.length;
  }

  private async evaluateHealth(athlete: AthleteDocument, thresholds: AlertThresholds): Promise<void> {
    const since = ymd(new Date(Date.now() - 28 * DAY_MS));
    const metrics = await this.metrics
      .find({ athleteId: athlete._id, date: { $gte: since } })
      .sort({ date: 1 })
      .exec();
    if (metrics.length === 0) return;

    const sleep7 = metrics
      .filter((m) => m.sleepMin != null && daysBetween(m.date, ymd(new Date())) < 7)
      .map((m) => m.sleepMin as number);
    if (sleep7.length > 0) {
      await this.athletes
        .updateOne(
          { _id: athlete._id },
          { $set: { 'snapshot.sleepAvg7dMin': Math.round(avg(sleep7)) } },
        )
        .exec();
    }

    const sleepWindow = metrics
      .filter((m) => m.sleepMin != null)
      .slice(-thresholds.sleepLowDays)
      .map((m) => m.sleepMin as number);
    if (
      sleepWindow.length >= thresholds.sleepLowDays &&
      sleepWindow.every((minutes) => minutes < thresholds.sleepLowMin)
    ) {
      await this.openFor(athlete, 'sleep_low', 'warn', {
        days: thresholds.sleepLowDays,
        avgMin: Math.round(avg(sleepWindow)),
      }, 'adapt_session');
    }

    const latest = metrics[metrics.length - 1];
    if (!latest) return;
    const baseline = metrics.slice(0, -1);
    const rhrBaseline = baseline.map((m) => m.restingHrBpm).filter((v): v is number => v != null);
    if (latest.restingHrBpm != null && rhrBaseline.length >= 5) {
      const delta = latest.restingHrBpm - avg(rhrBaseline);
      if (delta >= thresholds.restingHrDeltaBpm) {
        await this.openFor(athlete, 'resting_hr_up', 'warn', { deltaBpm: Math.round(delta) }, 'adapt_session');
      }
    }
    const hrvBaseline = baseline.map((m) => m.hrvRmssdMs).filter((v): v is number => v != null);
    if (latest.hrvRmssdMs != null && hrvBaseline.length >= 5) {
      const dropPct = (1 - latest.hrvRmssdMs / avg(hrvBaseline)) * 100;
      if (dropPct >= thresholds.hrvDropPct) {
        await this.openFor(athlete, 'hrv_drop', 'warn', { dropPct: Math.round(dropPct) }, 'adapt_session');
      }
    }
  }

  private async openFor(
    athlete: AthleteDocument,
    kind: 'no_activity' | 'no_checkin' | 'race_soon' | 'sleep_low' | 'resting_hr_up' | 'hrv_drop',
    severity: 'info' | 'warn' | 'critical',
    params: Record<string, string | number>,
    suggestedAction: string,
  ): Promise<void> {
    await this.alerts.open({
      teamId: athlete.teamId,
      athleteId: athlete._id,
      kind,
      severity,
      i18nKey: `alert.${kind}`,
      params,
      suggestedAction,
    });
  }

  private async thresholdsFor(athleteIds: string[]): Promise<Map<string, AlertThresholds>> {
    const ids = athleteIds.map((id) => new Types.ObjectId(id));
    const athletes = await this.athletes.find({ _id: { $in: ids } }).exec();
    const teamIds = [...new Set(athletes.map((a) => a.teamId.toString()))].map(
      (id) => new Types.ObjectId(id),
    );
    const teams = await this.teams.find({ _id: { $in: teamIds } }).exec();
    const teamDefaults = new Map(teams.map((t) => [t._id.toString(), t.alertDefaults]));
    return new Map(
      athletes.map((a) => {
        const defaults = teamDefaults.get(a.teamId.toString());
        return [a._id.toString(), { ...defaults, ...(a.alertOverrides ?? {}) } as AlertThresholds];
      }),
    );
  }
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetween(fromYmd: string, toYmd: string): number {
  return Math.round(
    (new Date(`${toYmd}T00:00:00Z`).getTime() - new Date(`${fromYmd}T00:00:00Z`).getTime()) / DAY_MS,
  );
}

function avg(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}
