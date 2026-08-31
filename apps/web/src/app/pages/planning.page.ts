import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AthleteListItem, Page, PlannedSession, SessionTemplate } from '@kadro/shared';
import { ApiClient } from '../core/api-client';

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function mondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

@Component({
  selector: 'app-planning-page',
  imports: [FormsModule],
  template: `
    <div class="head">
      <h1>Planning</h1>
      <div class="week-nav">
        <button class="btn btn-ghost" type="button" (click)="shiftWeek(-1)">←</button>
        <span class="range">{{ weekStartLabel() }} – {{ weekEndLabel() }}</span>
        <button class="btn btn-ghost" type="button" (click)="shiftWeek(1)">→</button>
        <button class="btn btn-ghost" type="button" (click)="today()">Aujourd'hui</button>
      </div>
      <button class="btn" type="button" (click)="assignOpen.set(!assignOpen())">Assigner une séance</button>
    </div>

    @if (assignOpen()) {
      <section class="card assign">
        <h2>Assigner une séance</h2>
        <div class="assign-row">
          <div>
            <label class="label">Modèle</label>
            <select class="input" [(ngModel)]="assignTemplateId">
              <option value="">Choisir…</option>
              @for (t of templates(); track t.id) {
                <option [value]="t.id">{{ t.name }} ({{ t.type === 'run' ? 'course' : 'renfo' }})</option>
              }
            </select>
          </div>
          <div>
            <label class="label">Date</label>
            <input class="input" type="date" [(ngModel)]="assignDate" />
          </div>
        </div>
        <label class="label">Athlètes</label>
        <div class="athlete-picks">
          @for (a of roster(); track a.id) {
            <label class="pick">
              <input type="checkbox" [checked]="assignAthletes().has(a.id)" (change)="toggleAthlete(a.id)" />
              {{ a.firstName }} {{ a.lastName }}
            </label>
          }
        </div>
        @if (assignError()) {
          <p class="error">{{ assignError() }}</p>
        }
        <div class="assign-actions">
          <button class="btn" type="button" [disabled]="assignBusy()" (click)="assign()">
            Assigner à {{ assignAthletes().size }} athlète{{ assignAthletes().size > 1 ? 's' : '' }}
          </button>
        </div>
      </section>
    }

    <div class="week">
      @for (day of days(); track day.date) {
        <div class="day" [class.today]="day.isToday">
          <div class="day-head">
            <span class="day-name">{{ day.label }}</span>
            <span class="day-date muted">{{ day.dayOfMonth }}</span>
          </div>
          @for (s of day.sessions; track s.id) {
            <div class="session" [class.done]="s.status === 'completed'" [class.missed]="s.status === 'missed'">
              <div class="s-name">{{ s.name }}</div>
              <div class="s-meta muted">
                {{ athleteName(s.athleteId) }}
                @if (s.status === 'completed') {
                  · réalisée
                } @else if (s.status === 'missed') {
                  · manquée
                }
              </div>
              <button class="x" type="button" (click)="remove(s)">×</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .head { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .head h1 { margin: 0; flex: 1; }
    .week-nav { display: flex; align-items: center; gap: 8px; }
    .week-nav .btn { padding: 6px 10px; }
    .range { font-weight: 600; font-variant-numeric: tabular-nums; }
    .assign { margin-bottom: 16px; }
    .assign-row { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
    .athlete-picks { display: flex; flex-wrap: wrap; gap: 10px; }
    .pick { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; border: 1px solid var(--line-strong); border-radius: var(--radius-control); padding: 7px 10px; cursor: pointer; }
    .assign-actions { margin-top: 14px; display: flex; justify-content: flex-end; }
    .week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
    .day { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-card); padding: 10px; min-height: 180px; }
    .day.today { border-color: var(--accent); }
    .day-head { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .day-name { font-size: 12px; font-weight: 600; }
    .day-date { font-size: 12px; }
    .session { position: relative; background: var(--surface2); border: 1px solid var(--line); border-radius: var(--radius-control); padding: 8px; margin-bottom: 6px; }
    .session.done { border-left: 3px solid var(--good); }
    .session.missed { border-left: 3px solid var(--bad); }
    .s-name { font-size: 12px; font-weight: 600; }
    .s-meta { font-size: 11px; }
    .x { position: absolute; top: 4px; right: 6px; background: none; border: none; color: var(--ink3); cursor: pointer; font-size: 13px; padding: 0; }
    .x:hover { color: var(--bad); }
  `,
})
export class PlanningPage implements OnInit {
  private readonly api = inject(ApiClient);

  readonly weekStart = signal(mondayOf(new Date()));
  readonly sessions = signal<PlannedSession[]>([]);
  readonly roster = signal<AthleteListItem[]>([]);
  readonly templates = signal<SessionTemplate[]>([]);

  readonly assignOpen = signal(false);
  readonly assignAthletes = signal(new Set<string>());
  readonly assignError = signal<string | null>(null);
  readonly assignBusy = signal(false);
  assignTemplateId = '';
  assignDate = ymd(new Date());

  readonly days = computed(() => {
    const start = this.weekStart();
    const todayYmd = ymd(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const date = ymd(addDays(start, i));
      return {
        date,
        label: DAY_LABELS[i],
        dayOfMonth: Number(date.slice(8, 10)),
        isToday: date === todayYmd,
        sessions: this.sessions().filter((s) => s.date === date),
      };
    });
  });

  readonly weekStartLabel = computed(() => frDate(this.weekStart()));
  readonly weekEndLabel = computed(() => frDate(addDays(this.weekStart(), 6)));

  async ngOnInit(): Promise<void> {
    const [roster, templates] = await Promise.all([
      this.api.get<Page<AthleteListItem>>('/athletes'),
      this.api.get<SessionTemplate[]>('/templates'),
    ]);
    this.roster.set(roster.items);
    this.templates.set(templates);
    await this.loadWeek();
  }

  athleteName(athleteId: string): string {
    const a = this.roster().find((x) => x.id === athleteId);
    return a ? `${a.firstName} ${a.lastName}` : '';
  }

  async shiftWeek(delta: number): Promise<void> {
    this.weekStart.set(addDays(this.weekStart(), delta * 7));
    await this.loadWeek();
  }

  async today(): Promise<void> {
    this.weekStart.set(mondayOf(new Date()));
    await this.loadWeek();
  }

  toggleAthlete(id: string): void {
    const next = new Set(this.assignAthletes());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.assignAthletes.set(next);
  }

  async assign(): Promise<void> {
    this.assignError.set(null);
    if (!this.assignTemplateId || this.assignAthletes().size === 0 || !this.assignDate) {
      this.assignError.set('Choisissez un modèle, une date et au moins un athlète.');
      return;
    }
    this.assignBusy.set(true);
    try {
      await this.api.post('/sessions/assign', {
        session: { templateId: this.assignTemplateId },
        athleteIds: [...this.assignAthletes()],
        date: this.assignDate,
      });
      this.assignOpen.set(false);
      this.assignAthletes.set(new Set());
      await this.loadWeek();
    } catch {
      this.assignError.set('Assignation impossible. Réessayez.');
    } finally {
      this.assignBusy.set(false);
    }
  }

  async remove(session: PlannedSession): Promise<void> {
    await this.api.delete(`/sessions/${session.id}?scope=one`);
    await this.loadWeek();
  }

  private async loadWeek(): Promise<void> {
    const from = ymd(this.weekStart());
    const to = ymd(addDays(this.weekStart(), 6));
    this.sessions.set(await this.api.get<PlannedSession[]>(`/sessions?from=${from}&to=${to}`));
  }
}

function frDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
}
