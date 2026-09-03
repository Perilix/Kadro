import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { AthleteListItem, Page, PlannedSession, PlannedSessionDetail, SessionTemplate } from '@kadro/shared';
import { formatPace } from '@kadro/shared';
import { ApiClient } from '../core/api-client';
import { AvatarComponent } from '../ui/avatar.component';
import { IconComponent } from '../ui/icon.component';
import { FORM_LEVELS } from '../ui/status-pill.component';

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

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

function firstOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

@Component({
  selector: 'app-planning-page',
  imports: [FormsModule, RouterLink, AvatarComponent, IconComponent],
  template: `
    <header class="row head">
      <div class="head-txt">
        <h1>Planning</h1>
        @if (view() === 'week') {
          <div class="muted sub">Semaine du {{ weekStartLabel() }} · {{ doneCount() }} / {{ sessions().length }} séances réalisées</div>
        } @else {
          <div class="muted sub">{{ monthLabel() }} · {{ monthAthleteName() }} · {{ monthSessions().length }} séance{{ monthSessions().length > 1 ? 's' : '' }}</div>
        }
      </div>
      <div class="row seg">
        <button class="seg-btn" type="button" [class.on]="view() === 'week'" (click)="setView('week')">Semaine</button>
        <button class="seg-btn" type="button" [class.on]="view() === 'month'" (click)="setView('month')">Mois</button>
      </div>
      <div class="row nav-week">
        <button class="icon-btn" type="button" (click)="shift(-1)"><ui-icon name="chevronL" [size]="18" /></button>
        <button class="btn" type="button" (click)="goToday()">Aujourd'hui</button>
        <button class="icon-btn" type="button" (click)="shift(1)"><ui-icon name="chevron" [size]="18" /></button>
      </div>
      <button class="btn" type="button" (click)="assignOpen.set(!assignOpen())"><ui-icon name="layers" [size]="18" />Assigner un modèle</button>
      <a class="btn primary" routerLink="/bibliotheque/nouvelle"><ui-icon name="plus" [size]="18" [sw]="2" />Nouvelle séance</a>
    </header>

    @if (assignOpen()) {
      <section class="card assign">
        <div class="row a-row">
          <select class="input a-tpl" [(ngModel)]="assignTemplateId">
            <option value="">Choisir un modèle…</option>
            @for (t of templates(); track t.id) {
              <option [value]="t.id">{{ t.name }} ({{ t.type === 'run' ? 'course' : 'renfo' }})</option>
            }
          </select>
          <input class="input a-date" type="date" [(ngModel)]="assignDate" />
          <button class="btn primary" type="button" [disabled]="!canAssign() || busy()" (click)="assign()">
            Assigner à {{ assignAthletes().size }} athlète{{ assignAthletes().size > 1 ? 's' : '' }}
          </button>
        </div>
        <div class="row picks">
          @for (a of roster(); track a.id) {
            <label class="pick row">
              <input type="checkbox" [checked]="assignAthletes().has(a.id)" (change)="toggleAthlete(a.id)" />
              {{ a.firstName }} {{ a.lastName }}
            </label>
          }
        </div>
        @if (assignError()) {
          <p class="error">{{ assignError() }}</p>
        }
      </section>
    }

    @if (selected(); as sel) {
      <section class="card sel-panel">
        <div class="row sel-head">
          <div class="grow">
            <div class="row sel-title">
              <h2>{{ sel.name }}</h2>
              <span class="pill soft">difficulté {{ sel.expectedDifficulty }}/10</span>
            </div>
            <div class="muted sel-sub">
              {{ athleteName(sel.athleteId) }} · {{ sel.date }}
              @if (sel.modification) {
                · modifiée depuis « {{ sel.modification.fromName }} »
              }
            </div>
          </div>
          <button class="icon-btn close" type="button" (click)="selected.set(null)"><ui-icon name="x" [size]="16" /></button>
        </div>
        @if (sel.instructions) {
          <p class="muted sel-note">« {{ sel.instructions }} »</p>
        }
        <div class="row sel-body">
          <div class="grow sel-paces">
            @for (p of sel.resolved?.paces ?? []; track p.blockPath) {
              <div class="row sel-row"><span class="muted">Bloc {{ p.blockPath }}</span><span class="num strong">{{ pace(p.minSecPerKm) }} – {{ pace(p.maxSecPerKm) }}</span></div>
            }
            @for (l of sel.resolved?.loads ?? []; track l.exerciseId) {
              <div class="row sel-row"><span class="muted">Charge de travail</span><span class="num strong">{{ l.kg }} kg</span></div>
            }
            @if (sel.resolved?.estLoadUa != null) {
              <div class="row sel-row"><span class="muted">Charge estimée</span><span class="num strong">{{ sel.resolved?.estLoadUa }} UA</span></div>
            }
          </div>
          <div class="col sel-actions">
            <div class="col field">
              <span class="label">Déplacer au</span>
              <div class="row move-row">
                <input class="input date-in" type="date" [(ngModel)]="moveDate" />
                <button class="btn small" type="button" [disabled]="moveDate === sel.date || busy()" (click)="moveSession(sel)">Déplacer</button>
              </div>
            </div>
            <button class="btn small danger" type="button" (click)="removeSelected(sel, 'one')">Supprimer cette séance</button>
            @if (sel.assignmentId) {
              <button class="btn small danger" type="button" (click)="removeSelected(sel, 'assignment')">Supprimer pour tous les athlètes</button>
            }
          </div>
        </div>
      </section>
    }
    @if (view() === 'month') {
      <div class="row month-bar">
        <select class="input m-athlete" [ngModel]="monthAthleteId()" (ngModelChange)="setMonthAthlete($event)">
          @for (a of roster(); track a.id) {
            <option [value]="a.id">{{ a.firstName }} {{ a.lastName }}</option>
          }
        </select>
        <span class="muted" style="font-size: 12.5px">Une vue d'ensemble du mois pour un athlète — cliquez une séance pour la déplacer ou la supprimer.</span>
      </div>
      <section class="card month-card">
        <div class="month-head">
          @for (d of dayNames; track d) {
            <div class="mh-cell">{{ d }}</div>
          }
        </div>
        @for (week of monthWeeks(); track week.key) {
          <div class="month-week">
            @for (day of week.days; track day.date) {
              <div class="m-cell" [class.out]="day.outside" [class.today-cell]="day.today">
                <span class="num m-num" [class.m-today]="day.today">{{ day.dayOfMonth }}</span>
                @for (s of day.sessions; track s.id) {
                  <div class="chip row" [class]="'chip row st-' + monthChipState(s, day)" style="padding: 4px 7px; font-size: 11px" (click)="openSession(s)">
                    @if (s.status === 'completed') {
                      <ui-icon name="check" [size]="12" [sw]="2.25" style="color: var(--good)" />
                    } @else if (s.status === 'missed') {
                      <ui-icon name="x" [size]="12" [sw]="2.25" style="color: var(--bad)" />
                    } @else {
                      <ui-icon [name]="s.type === 'strength' ? 'dumbbell' : 'run'" [size]="12" />
                    }
                    <span class="ellip">{{ s.name }}</span>
                  </div>
                }
              </div>
            }
          </div>
        }
        @if (roster().length === 0) {
          <p class="muted empty">Vos athlètes apparaîtront ici dès qu'ils auront rejoint l'équipe.</p>
        }
        <div class="row legend">
          <span class="row lg"><span class="sw st-completed"><ui-icon name="check" [size]="10" [sw]="2.5" style="color: var(--good)" /></span>Réalisée</span>
          <span class="row lg"><span class="sw st-today"></span>Aujourd'hui</span>
          <span class="row lg"><span class="sw st-planned"></span>Prévue</span>
          <span class="row lg"><span class="sw st-missed"></span>Manquée</span>
        </div>
      </section>
    } @else {
    <section class="card grid-card">
      <div class="matrix head-row">
        <div class="corner"></div>
        @for (day of days(); track day.date) {
          <div class="day-head" [class.today-col]="day.today">
            <span class="d-name">{{ day.label }}</span> <span class="num">{{ day.dayOfMonth }}</span>
            @if (day.today) {
              <span class="pill accent today-pill">Aujourd'hui</span>
            }
          </div>
        }
      </div>
      @for (a of roster(); track a.id) {
        <div class="matrix body-row">
          <a class="row who" [routerLink]="['/athletes', a.id]">
            <ui-avatar [name]="a.firstName + ' ' + a.lastName" [size]="30" />
            <div class="who-txt">
              <div class="ellip who-name">{{ a.firstName }} {{ a.lastName }}</div>
              <div class="row who-lv"><span class="dot sm" [style.background]="lvColor(a.formStatus)"></span>{{ lvLabel(a.formStatus) }}</div>
            </div>
          </a>
          @for (day of days(); track day.date) {
            <div class="cell" [class.today-col]="day.today">
              @for (s of cellSessions(a.id, day.date); track s.id) {
                <div class="chip row" [class]="'chip row st-' + chipState(s, day)" (click)="openSession(s)">
                  @if (s.status === 'completed') {
                    <ui-icon name="check" [size]="13" [sw]="2.25" style="color: var(--good)" />
                  } @else if (s.status === 'missed') {
                    <ui-icon name="x" [size]="13" [sw]="2.25" style="color: var(--bad)" />
                  } @else {
                    <ui-icon [name]="s.type === 'strength' ? 'dumbbell' : 'run'" [size]="13" />
                  }
                  <span class="ellip">{{ s.name }}</span>
                  @if (s.status === 'planned') {
                    <button class="chip-x" type="button" title="Supprimer" (click)="remove(s)">×</button>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
      @if (roster().length === 0) {
        <p class="muted empty">Vos athlètes apparaîtront ici dès qu'ils auront rejoint l'équipe.</p>
      }
      <div class="row legend">
        <span class="row lg"><span class="sw st-completed"><ui-icon name="check" [size]="10" [sw]="2.5" style="color: var(--good)" /></span>Réalisée</span>
        <span class="row lg"><span class="sw st-today"></span>Aujourd'hui</span>
        <span class="row lg"><span class="sw st-planned"></span>Prévue</span>
        <span class="row lg"><span class="sw st-missed"></span>Manquée</span>
      </div>
    </section>
    }
  `,
  styles: `
    .head { gap: 12px; }
    .head-txt { flex: 1 1 auto; }
    .sub { margin-top: 4px; }
    .nav-week { gap: 4px; }
    .seg { border: 1px solid var(--line-strong); border-radius: 10px; overflow: hidden; height: 40px; }
    .seg-btn { height: 100%; padding: 0 14px; border: none; background: transparent; font-family: inherit; font-size: 13.5px; font-weight: 500; color: var(--ink2); cursor: pointer; }
    .seg-btn.on { background: var(--nav-active); color: var(--ink); }
    .month-bar { gap: 12px; }
    .m-athlete { max-width: 260px; }
    .month-card { overflow: hidden; }
    .month-head, .month-week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
    .month-head { background: var(--surface2); }
    .mh-cell { padding: 8px 10px; font-size: 12px; font-weight: 500; color: var(--ink2); }
    .m-cell { border-top: 1px solid var(--line); padding: 8px; min-height: 92px; display: flex; flex-direction: column; gap: 5px; min-width: 0; }
    .mh-cell + .mh-cell, .m-cell + .m-cell { border-left: 1px solid var(--line); }
    .out { background: var(--surface2); }
    .out .m-num { color: var(--ink3); }
    .today-cell { background: var(--accent-soft); }
    .m-num { font-size: 12.5px; font-weight: 500; }
    .m-today { font-weight: 700; color: var(--accent-ink); }
    .assign { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
    .a-row { gap: 10px; }
    .a-tpl { max-width: 340px; }
    .a-date { max-width: 170px; }
    .picks { gap: 10px; flex-wrap: wrap; }
    .pick { gap: 6px; font-size: 13px; border: 1px solid var(--line-strong); border-radius: 10px; padding: 7px 10px; cursor: pointer; }
    .grid-card { overflow: hidden; display: flex; flex-direction: column; }
    .matrix { display: grid; grid-template-columns: 200px repeat(7, minmax(0, 1fr)); border-bottom: 1px solid var(--line); }
    .head-row { background: var(--surface2); }
    .corner { padding: 10px 16px; }
    .day-head { padding: 10px; font-size: 12.5px; border-left: 1px solid var(--line); color: var(--ink2); }
    .day-head.today-col { color: var(--accent-ink); }
    .d-name { font-weight: 600; }
    .today-pill { margin-left: 8px; height: 18px; padding: 0 6px; font-size: 10.5px; }
    .body-row { min-height: 68px; }
    .who { gap: 10px; padding: 8px 16px; color: var(--ink); }
    .who-txt { line-height: 1.25; min-width: 0; }
    .who-name { font-weight: 500; font-size: 13.5px; }
    .who-lv { gap: 5px; font-size: 11.5px; color: var(--ink3); }
    .dot.sm { width: 7px; height: 7px; }
    .cell { padding: 8px; border-left: 1px solid var(--line); display: flex; flex-direction: column; gap: 6px; justify-content: center; min-width: 0; }
    .cell.today-col { background: var(--surface2); }
    .chip { gap: 6px; padding: 7px 8px; border-radius: 8px; font-size: 11.5px; font-weight: 500; min-width: 0; position: relative; background: var(--surface); border: 1px solid var(--line); color: var(--ink); }
    .chip.st-planned { border-style: dashed; border-color: var(--line-strong); color: var(--ink2); }
    .chip.st-today { background: var(--accent-soft); border: 1px solid var(--accent); color: var(--accent-ink); }
    .chip.st-missed { background: var(--bad-soft); border-color: var(--bad-soft); color: var(--bad); }
    .chip-x { position: absolute; top: 2px; right: 4px; background: none; border: none; color: inherit; opacity: 0; cursor: pointer; font-size: 13px; padding: 0; }
    .chip:hover .chip-x { opacity: 0.7; }
    .legend { gap: 18px; padding: 10px 16px; }
    .lg { gap: 6px; font-size: 12px; color: var(--ink2); }
    .sw { width: 14px; height: 14px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; background: var(--surface); border: 1px solid var(--line); }
    .sw.st-today { background: var(--accent-soft); border-color: var(--accent); }
    .sw.st-planned { border-style: dashed; border-color: var(--line-strong); }
    .sw.st-missed { background: var(--bad-soft); border-color: var(--bad-soft); }
    .empty { padding: 16px; margin: 0; font-size: 13px; }
    .chip { cursor: pointer; }
    .sel-panel { padding: 16px 18px; }
    .sel-head { gap: 12px; align-items: flex-start; }
    .grow { flex: 1 1 auto; min-width: 0; }
    .sel-title { gap: 10px; }
    .sel-title h2 { margin: 0; }
    .sel-sub { font-size: 13px; margin-top: 4px; }
    .close { width: 32px; height: 32px; border: none; background: transparent; }
    .sel-note { font-size: 13px; margin: 10px 0 0; }
    .sel-body { gap: 24px; align-items: flex-start; margin-top: 12px; }
    .sel-paces { font-size: 13.5px; }
    .sel-row { justify-content: space-between; padding: 7px 0; border-top: 1px solid var(--line); }
    .strong { font-weight: 600; }
    .sel-actions { gap: 8px; width: 280px; flex: 0 0 auto; }
    .field { gap: 6px; }
    .move-row { gap: 8px; }
    .date-in { max-width: 160px; }
    .btn.danger { color: var(--bad); border-color: var(--bad-soft); }
  `,
})
export class PlanningPage implements OnInit {
  private readonly api = inject(ApiClient);

  readonly view = signal<'week' | 'month'>('week');
  readonly weekStart = signal(mondayOf(new Date()));
  readonly monthAnchor = signal(firstOfMonth(new Date()));
  readonly monthAthleteId = signal('');
  readonly monthSessions = signal<PlannedSession[]>([]);
  readonly dayNames = DAY_NAMES;
  readonly sessions = signal<PlannedSession[]>([]);
  readonly roster = signal<AthleteListItem[]>([]);
  readonly templates = signal<SessionTemplate[]>([]);
  readonly assignOpen = signal(false);
  readonly assignAthletes = signal(new Set<string>());
  readonly assignError = signal<string | null>(null);
  readonly busy = signal(false);
  readonly selected = signal<PlannedSessionDetail | null>(null);
  assignTemplateId = '';
  assignDate = ymd(new Date());
  moveDate = ymd(new Date());

  readonly days = computed(() => {
    const start = this.weekStart();
    const today = ymd(new Date());
    return DAY_NAMES.map((label, i) => {
      const date = ymd(addDays(start, i));
      return { label, date, dayOfMonth: Number(date.slice(8, 10)), today: date === today };
    });
  });

  readonly doneCount = computed(() => this.sessions().filter((s) => s.status === 'completed').length);
  readonly weekStartLabel = computed(() =>
    new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(this.weekStart()),
  );
  readonly monthLabel = computed(() => {
    const label = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(this.monthAnchor());
    return label.charAt(0).toUpperCase() + label.slice(1);
  });
  readonly monthAthleteName = computed(() => this.athleteName(this.monthAthleteId()));
  readonly monthWeeks = computed(() => {
    const anchor = this.monthAnchor();
    const month = anchor.getUTCMonth();
    const today = ymd(new Date());
    const sessions = this.monthSessions();
    const start = mondayOf(anchor);
    const end = mondayOf(addDays(addMonths(anchor, 1), -1));
    const weeks: { key: string; days: { date: string; dayOfMonth: number; outside: boolean; today: boolean; sessions: PlannedSession[] }[] }[] = [];
    for (let w = start; w.getTime() <= end.getTime(); w = addDays(w, 7)) {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = addDays(w, i);
        const date = ymd(d);
        return {
          date,
          dayOfMonth: d.getUTCDate(),
          outside: d.getUTCMonth() !== month,
          today: date === today,
          sessions: sessions.filter((s) => s.date === date),
        };
      });
      weeks.push({ key: days[0].date, days });
    }
    return weeks;
  });

  private readonly route = inject(ActivatedRoute);

  async ngOnInit(): Promise<void> {
    const [roster, templates] = await Promise.all([
      this.api.get<Page<AthleteListItem>>('/athletes?limit=100&sort=name'),
      this.api.get<SessionTemplate[]>('/templates'),
    ]);
    this.roster.set(roster.items);
    if (roster.items.length > 0) this.monthAthleteId.set(roster.items[0].id);
    this.templates.set(templates);
    const preselect = this.route.snapshot.queryParamMap.get('template');
    if (preselect && templates.some((t) => t.id === preselect)) {
      this.assignTemplateId = preselect;
      this.assignOpen.set(true);
    }
    await this.loadWeek();
  }

  cellSessions(athleteId: string, date: string): PlannedSession[] {
    return this.sessions().filter((s) => s.athleteId === athleteId && s.date === date);
  }

  chipState(s: PlannedSession, day: { today: boolean }): string {
    if (s.status === 'planned' && day.today) return 'today';
    return s.status;
  }

  lvColor(level: string): string {
    return FORM_LEVELS[level]?.color ?? 'var(--ink3)';
  }

  lvLabel(level: string): string {
    return FORM_LEVELS[level]?.label ?? '';
  }

  canAssign(): boolean {
    return Boolean(this.assignTemplateId && this.assignDate && this.assignAthletes().size > 0);
  }

  async shift(delta: number): Promise<void> {
    if (this.view() === 'month') {
      this.monthAnchor.set(addMonths(this.monthAnchor(), delta));
      await this.loadMonth();
    } else {
      this.weekStart.set(addDays(this.weekStart(), delta * 7));
      await this.loadWeek();
    }
  }

  async goToday(): Promise<void> {
    if (this.view() === 'month') {
      this.monthAnchor.set(firstOfMonth(new Date()));
      await this.loadMonth();
    } else {
      this.weekStart.set(mondayOf(new Date()));
      await this.loadWeek();
    }
  }

  async setView(view: 'week' | 'month'): Promise<void> {
    if (this.view() === view) return;
    this.view.set(view);
    this.selected.set(null);
    if (view === 'month') {
      if (!this.monthAthleteId() && this.roster().length > 0) this.monthAthleteId.set(this.roster()[0].id);
      await this.loadMonth();
    } else {
      await this.loadWeek();
    }
  }

  async setMonthAthlete(id: string): Promise<void> {
    this.monthAthleteId.set(id);
    this.selected.set(null);
    await this.loadMonth();
  }

  monthChipState(s: PlannedSession, day: { today: boolean }): string {
    if (s.status === 'planned' && day.today) return 'today';
    return s.status;
  }

  toggleAthlete(id: string): void {
    const next = new Set(this.assignAthletes());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.assignAthletes.set(next);
  }

  async assign(): Promise<void> {
    this.assignError.set(null);
    this.busy.set(true);
    try {
      await this.api.post('/sessions/assign', {
        session: { templateId: this.assignTemplateId },
        athleteIds: [...this.assignAthletes()],
        date: this.assignDate,
      });
      this.assignOpen.set(false);
      this.assignAthletes.set(new Set());
      await this.reload();
    } catch {
      this.assignError.set('Assignation impossible. Réessayez.');
    } finally {
      this.busy.set(false);
    }
  }

  athleteName(id: string): string {
    const a = this.roster().find((x) => x.id === id);
    return a ? `${a.firstName} ${a.lastName}` : '';
  }

  pace(secPerKm: number): string {
    return formatPace(secPerKm);
  }

  async openSession(session: PlannedSession): Promise<void> {
    const detail = await this.api.get<PlannedSessionDetail>(`/sessions/${session.id}`);
    this.moveDate = detail.date;
    this.selected.set(detail);
  }

  async moveSession(sel: PlannedSessionDetail): Promise<void> {
    this.busy.set(true);
    try {
      await this.api.patch(`/sessions/${sel.id}`, { date: this.moveDate });
      this.selected.set(null);
      await this.reload();
    } finally {
      this.busy.set(false);
    }
  }

  async removeSelected(sel: PlannedSessionDetail, scope: 'one' | 'assignment'): Promise<void> {
    await this.api.delete(`/sessions/${sel.id}?scope=${scope}`);
    this.selected.set(null);
    await this.reload();
  }

  async remove(session: PlannedSession): Promise<void> {
    await this.api.delete(`/sessions/${session.id}?scope=one`);
    this.sessions.update((list) => list.filter((s) => s.id !== session.id));
    this.monthSessions.update((list) => list.filter((s) => s.id !== session.id));
  }

  private async reload(): Promise<void> {
    if (this.view() === 'month') await this.loadMonth();
    else await this.loadWeek();
  }

  private async loadWeek(): Promise<void> {
    const from = ymd(this.weekStart());
    const to = ymd(addDays(this.weekStart(), 6));
    this.sessions.set(await this.api.get<PlannedSession[]>(`/sessions?from=${from}&to=${to}`));
  }

  private async loadMonth(): Promise<void> {
    const athleteId = this.monthAthleteId();
    if (!athleteId) {
      this.monthSessions.set([]);
      return;
    }
    const from = ymd(mondayOf(this.monthAnchor()));
    const to = ymd(addDays(mondayOf(addDays(addMonths(this.monthAnchor(), 1), -1)), 6));
    this.monthSessions.set(
      await this.api.get<PlannedSession[]>(`/sessions?athleteId=${athleteId}&from=${from}&to=${to}`),
    );
  }
}
