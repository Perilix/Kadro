import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { CheckinToday, PlannedSession, PlannedSessionDetail } from '@kadro/shared';
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
  imports: [FormsModule],
  template: `
    <h1 class="date">{{ dateLabel }}</h1>

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
  `,
})
export class MeTodayPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly feelings = FEELINGS;
  readonly checkin = signal<CheckinToday | null>(null);
  readonly session = signal<PlannedSessionDetail | null>(null);
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
    const [checkin, sessions] = await Promise.all([
      this.api.get<CheckinToday>('/me/checkin-today'),
      this.api.get<PlannedSession[]>(`/sessions?from=${today}&to=${today}`),
    ]);
    this.checkin.set(checkin);
    this.session.set(
      sessions[0] ? await this.api.get<PlannedSessionDetail>(`/sessions/${sessions[0].id}`) : null,
    );
    this.loaded.set(true);
  }
}
