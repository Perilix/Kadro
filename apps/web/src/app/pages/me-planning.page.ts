import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Athlete, PlannedSession } from '@kadro/shared';
import { ApiClient } from '../core/api-client';
import { IconComponent } from '../ui/icon.component';

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

const DAY_NAMES = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

@Component({
  selector: 'app-me-planning-page',
  imports: [IconComponent],
  template: `
    <header class="row head">
      <h1 class="grow">Planning</h1>
    </header>
    <div class="row nav-row">
      <button class="icon-btn" type="button" (click)="shiftWeek(-1)"><ui-icon name="chevronL" [size]="18" /></button>
      <div class="center grow">
        <div class="w-title">Semaine du {{ weekLabel() }}</div>
      </div>
      <button class="icon-btn" type="button" (click)="shiftWeek(1)"><ui-icon name="chevron" [size]="18" /></button>
    </div>
    @if (goal(); as g) {
      <div class="row goal-band">
        <ui-icon name="flag" [size]="18" style="color: var(--accent)" />
        <span class="grow"><b>{{ g.label }}</b>{{ g.date ? ' · ' + frDateLong(g.date) : '' }}</span>
        @if (daysToRace() != null) {
          <span class="faint num">J-{{ daysToRace() }}</span>
        }
      </div>
    }
    <section class="card days-card">
      @for (day of days(); track day.date) {
        <div class="row day-row">
          <div class="d-col">
            <div class="d-name" [class.on]="day.today">{{ day.label }}</div>
            <div class="num d-num" [class.on]="day.today">{{ day.dayOfMonth }}</div>
          </div>
          <div class="col d-sessions grow">
            @for (s of day.sessions; track s.id) {
              <a class="row sess" [class]="'row sess st-' + state(s, day)" (click)="open(s)">
                @if (s.status === 'completed') {
                  <ui-icon name="check" [size]="18" [sw]="2.25" style="color: var(--good)" />
                } @else if (s.status === 'missed') {
                  <ui-icon name="x" [size]="18" [sw]="2.25" style="color: var(--bad)" />
                } @else {
                  <ui-icon [name]="s.type === 'strength' ? 'dumbbell' : 'run'" [size]="18" />
                }
                <div class="grow s-txt">
                  <div class="s-name">{{ s.name }}</div>
                  <div class="ellip s-sub">{{ sub(s) }}</div>
                </div>
                <ui-icon name="chevron" [size]="16" />
              </a>
            }
            @if (day.sessions.length === 0) {
              <div class="row rest">Repos</div>
            }
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    .grow { flex: 1 1 auto; min-width: 0; }
    .nav-row { gap: 8px; }
    .center { text-align: center; line-height: 1.2; }
    .w-title { font-weight: 600; font-size: 15px; }
    .goal-band { gap: 10px; padding: 10px 12px; border-radius: 12px; background: var(--surface); border: 1px solid var(--line); font-size: 13px; }
    .goal-band b { font-weight: 600; }
    .days-card { padding: 6px 16px; }
    .day-row { gap: 14px; padding: 10px 0; border-top: 1px solid var(--line); align-items: flex-start; }
    .day-row:first-child { border-top: none; }
    .d-col { width: 40px; flex: 0 0 auto; text-align: center; line-height: 1.1; padding-top: 4px; }
    .d-name { font-size: 11px; color: var(--ink3); font-weight: 600; }
    .d-name.on, .d-num.on { color: var(--accent-ink); }
    .d-num { font-size: 20px; font-weight: 600; margin-top: 2px; }
    .d-sessions { gap: 8px; }
    .sess { gap: 10px; padding: 11px 14px; border-radius: 12px; font-size: 14px; background: var(--surface); border: 1px solid var(--line); color: var(--ink); }
    .sess.st-planned { border-style: dashed; border-color: var(--line-strong); color: var(--ink2); }
    .sess.st-today { background: var(--accent-soft); border: 1px solid var(--accent); color: var(--accent-ink); }
    .sess.st-missed { background: var(--bad-soft); border-color: var(--bad-soft); color: var(--bad); }
    .s-txt { line-height: 1.3; min-width: 0; }
    .s-name { font-weight: 600; }
    .s-sub { font-size: 12px; opacity: 0.8; }
    .rest { height: 42px; padding: 0 14px; border-radius: 12px; border: 1px dashed var(--line); color: var(--ink3); font-size: 13px; }
  `,
})
export class MePlanningPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly weekStart = signal(mondayOf(new Date()));
  readonly sessions = signal<PlannedSession[]>([]);
  readonly me = signal<Athlete | null>(null);

  readonly goal = computed(() => this.me()?.goal ?? null);
  readonly weekLabel = computed(() =>
    new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(this.weekStart()),
  );

  readonly days = computed(() => {
    const start = this.weekStart();
    const today = ymd(new Date());
    return DAY_NAMES.map((label, i) => {
      const date = ymd(addDays(start, i));
      return {
        label,
        date,
        dayOfMonth: Number(date.slice(8, 10)),
        today: date === today,
        sessions: this.sessions().filter((s) => s.date === date),
      };
    });
  });

  private readonly router = inject(Router);

  async open(s: PlannedSession): Promise<void> {
    if (s.status !== 'completed') return;
    const detail = await this.api.get<{ completedSessionId: string | null }>(`/sessions/${s.id}`);
    if (detail.completedSessionId) {
      await this.router.navigate(['/moi/activites', detail.completedSessionId]);
    }
  }

  async ngOnInit(): Promise<void> {
    this.me.set(await this.api.get<Athlete>('/me/profile').catch(() => null));
    await this.loadWeek();
  }

  daysToRace(): number | null {
    const date = this.goal()?.date;
    if (!date) return null;
    return Math.max(0, Math.round((new Date(`${date}T00:00:00Z`).getTime() - Date.now()) / 86400000));
  }

  frDateLong(ymdStr: string): string {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(`${ymdStr}T12:00:00Z`),
    );
  }

  state(s: PlannedSession, day: { today: boolean }): string {
    if (s.status === 'planned' && day.today) return 'today';
    return s.status;
  }

  sub(s: PlannedSession): string {
    if (s.status === 'completed') return 'Réalisée';
    if (s.status === 'missed') return 'Manquée';
    return s.type === 'run' ? 'Course' : 'Renfo';
  }

  async shiftWeek(delta: number): Promise<void> {
    this.weekStart.set(addDays(this.weekStart(), delta * 7));
    await this.loadWeek();
  }

  private async loadWeek(): Promise<void> {
    const from = ymd(this.weekStart());
    const to = ymd(addDays(this.weekStart(), 6));
    this.sessions.set(await this.api.get<PlannedSession[]>(`/sessions?from=${from}&to=${to}`));
  }
}
