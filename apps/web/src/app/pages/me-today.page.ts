import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { AthleteOverview, CheckinToday, Monitoring, PlannedSession, PlannedSessionDetail } from '@kadro/shared';
import { formatPace } from '@kadro/shared';
import { ApiClient } from '../core/api-client';

const FEELINGS: [number, string][] = [
  [1, 'Épuisé·e'],
  [2, 'Fatigué·e'],
  [3, 'Moyen'],
  [4, 'Bien'],
  [5, 'Au top'],
];

const LEVEL_LABELS: Record<string, string> = {
  good: 'En forme',
  warn: 'À surveiller',
  bad: 'Signal rouge',
};

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-me-today-page',
  imports: [FormsModule, RouterLink],
  template: `
    <h1 class="date">{{ dateLabel }}</h1>
    <div class="cols">
    <div class="main">
    <section class="card">
      <h2>Comment ça va ce matin ?</h2>
      @if (checkin()?.checkin; as c) {
        <div class="done-row">
          <span class="status status-{{ c.level }}">{{ levelLabel(c.level) }}</span>
          <span class="muted">Check-in envoyé · ressenti {{ c.feeling }}/5</span>
        </div>
      } @else {
        <div class="feelings">
          @for (f of feelings; track f[0]) {
            <button class="feeling" type="button" (click)="submitCheckin(f[0])">
              <span class="n">{{ f[0] }}</span>
              <span class="l muted">{{ f[1] }}</span>
            </button>
          }
        </div>
      }
    </section>

    @if (loaded()) {
      @if (session(); as s) {
        <section class="card">
          <div class="s-head">
            <h2>{{ s.name }}</h2>
            <span class="badge">difficulté {{ s.expectedDifficulty }}/10</span>
          </div>
          @if (s.instructions) {
            <p class="muted quote">« {{ s.instructions }} »</p>
          }
          @if (s.resolved?.paces?.length) {
            <div class="rows">
              @for (p of s.resolved!.paces; track p.blockPath) {
                <div class="row">
                  <span class="muted">Bloc {{ p.blockPath }}</span>
                  <strong>{{ pace(p.minSecPerKm) }} – {{ pace(p.maxSecPerKm) }}</strong>
                </div>
              }
            </div>
          }
          @if (s.resolved?.loads?.length) {
            <div class="rows">
              @for (l of s.resolved!.loads; track l.exerciseId) {
                <div class="row">
                  <span class="muted">Charge de travail</span>
                  <strong>{{ l.kg }} kg</strong>
                </div>
              }
            </div>
          }
          @if (s.status === 'completed') {
            <p class="status status-good done">Réalisée</p>
          } @else {
            <div class="complete">
              <input class="input" type="number" min="1" placeholder="Durée (min)" [(ngModel)]="durationMin" />
              <button class="btn" type="button" [disabled]="!durationMin || busy()" (click)="markDone()">
                Marquer réalisée
              </button>
            </div>
          }
        </section>
      } @else {
        <section class="card">
          <h2>Repos aujourd'hui</h2>
          <p class="muted">Aucune séance planifiée. Profitez-en.</p>
        </section>
      }
    }
    </div>
    <aside class="side">
      @if (monitoring(); as m) {
        <section class="card">
          <h2>Ma forme — 7 jours</h2>
          <div class="dots">
            @for (day of m.days.slice(-7); track day.date) {
              <span
                class="dot"
                [class.good]="day.checkinLevel === 'good'"
                [class.warn]="day.checkinLevel === 'warn'"
                [class.bad]="day.checkinLevel === 'bad'"
                [title]="day.date"
              ></span>
            }
          </div>
          <div class="mrows">
            <div class="mrow"><span class="muted">Sommeil moyen</span><strong>{{ m.summary7d.sleepAvgMin != null ? sleepLabel(m.summary7d.sleepAvgMin) : '—' }}</strong></div>
            <div class="mrow"><span class="muted">FC repos</span><strong>{{ m.summary7d.restingHrAvgBpm != null ? m.summary7d.restingHrAvgBpm + ' bpm' : '—' }}</strong></div>
            <div class="mrow"><span class="muted">VFC</span><strong>{{ m.summary7d.hrvAvgMs != null ? m.summary7d.hrvAvgMs + ' ms' : '—' }}</strong></div>
          </div>
        </section>
      }
      @if (overview(); as o) {
        <section class="card">
          <h2>Ma semaine</h2>
          @if (o.week.length === 0) {
            <p class="muted">Semaine libre.</p>
          }
          @for (s of o.week; track s.id) {
            <div class="wrow">
              <span class="wday muted">{{ s.date.slice(8) }}/{{ s.date.slice(5, 7) }}</span>
              <span class="wname">{{ s.name }}</span>
              @if (s.status === 'completed') {
                <span class="status status-good">✓</span>
              } @else if (s.status === 'missed') {
                <span class="status status-bad">✕</span>
              }
            </div>
          }
          <a class="more" routerLink="/moi/progression">Voir ma progression →</a>
        </section>
      }
    </aside>
    </div>
  `,
  styles: `
    .date { text-transform: capitalize; }
    section { margin-bottom: 16px; }
    .feelings { display: flex; gap: 8px; }
    .feeling {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
      background: var(--surface); border: 1px solid var(--line-strong);
      border-radius: var(--radius-control); padding: 10px 4px; cursor: pointer; font-family: inherit;
    }
    .feeling:hover { background: var(--surface2); }
    .feeling .n { font-size: 16px; font-weight: 700; color: var(--ink); }
    .feeling .l { font-size: 11px; }
    .done-row { display: flex; gap: 14px; align-items: center; }
    .s-head { display: flex; justify-content: space-between; align-items: center; }
    .s-head h2 { margin: 0; }
    .quote { margin: 10px 0 0; }
    .rows { margin-top: 12px; display: grid; gap: 6px; }
    .row { display: flex; justify-content: space-between; font-variant-numeric: tabular-nums; font-size: 14px; }
    .done { margin: 14px 0 0; }
    .complete { display: flex; gap: 8px; margin-top: 14px; }
    .complete .input { max-width: 140px; }
    .cols { display: grid; grid-template-columns: 1fr 280px; gap: 16px; align-items: start; }
    .side { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 80px; }
    .side section { margin-bottom: 0; }
    .dots { display: flex; gap: 6px; margin-bottom: 14px; }
    .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--neutral-soft); }
    .dot.good { background: var(--good); }
    .dot.warn { background: var(--warn); }
    .dot.bad { background: var(--bad); }
    .mrows { display: grid; gap: 8px; }
    .mrow { display: flex; justify-content: space-between; font-size: 13px; font-variant-numeric: tabular-nums; }
    .wrow { display: flex; align-items: baseline; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--line); font-size: 13px; }
    .wrow:last-of-type { border-bottom: none; }
    .wday { font-variant-numeric: tabular-nums; min-width: 42px; }
    .wname { flex: 1; font-weight: 500; }
    .more { display: inline-block; margin-top: 12px; font-size: 13px; }
    @media (max-width: 900px) { .cols { grid-template-columns: 1fr; } .side { position: static; } }
  `,
})
export class MeTodayPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly feelings = FEELINGS;
  readonly checkin = signal<CheckinToday | null>(null);
  readonly session = signal<PlannedSessionDetail | null>(null);
  readonly overview = signal<AthleteOverview | null>(null);
  readonly monitoring = signal<Monitoring | null>(null);
  readonly loaded = signal(false);
  readonly busy = signal(false);
  durationMin: number | null = null;

  readonly dateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  levelLabel(level: string): string {
    return LEVEL_LABELS[level] ?? level;
  }

  pace(secPerKm: number): string {
    return formatPace(secPerKm);
  }

  sleepLabel(minutes: number): string {
    return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
  }

  async submitCheckin(feeling: number): Promise<void> {
    await this.api.post('/checkins', { date: todayYmd(), feeling });
    await this.load();
  }

  async markDone(): Promise<void> {
    const s = this.session();
    if (!s || !this.durationMin) return;
    this.busy.set(true);
    try {
      await this.api.post(`/sessions/${s.id}/complete-manual`, {
        durationSec: Math.round(this.durationMin * 60),
      });
      this.durationMin = null;
      await this.load();
    } finally {
      this.busy.set(false);
    }
  }

  private async load(): Promise<void> {
    const today = todayYmd();
    const [checkin, sessions, overview, monitoring] = await Promise.all([
      this.api.get<CheckinToday>('/me/checkin-today'),
      this.api.get<PlannedSession[]>(`/sessions?from=${today}&to=${today}`),
      this.api.get<AthleteOverview>('/me/overview'),
      this.api.get<Monitoring>('/me/monitoring?weeks=1'),
    ]);
    this.checkin.set(checkin);
    this.overview.set(overview);
    this.monitoring.set(monitoring);
    this.session.set(
      sessions[0] ? await this.api.get<PlannedSessionDetail>(`/sessions/${sessions[0].id}`) : null,
    );
    this.loaded.set(true);
  }
}
