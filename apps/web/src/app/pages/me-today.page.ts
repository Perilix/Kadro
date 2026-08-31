import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type {
  ActivityDetail,
  Athlete,
  AthleteOverview,
  CheckinToday,
  Connection,
  Conversation,
  Message,
  PaceTable,
  Page,
  PlannedSession,
  PlannedSessionDetail,
} from '@kadro/shared';
import { formatPace } from '@kadro/shared';
import { ApiClient } from '../core/api-client';
import { AuthStore } from '../core/auth-store';
import { AvatarComponent } from '../ui/avatar.component';
import { BarChartComponent } from '../ui/bar-chart.component';
import { IconComponent } from '../ui/icon.component';

const FEELINGS: [number, string][] = [
  [1, 'Épuisé·e'],
  [2, 'Fatigué·e'],
  [3, 'Correct'],
  [4, 'Bien'],
  [5, 'Au top'],
];

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

interface WeekDay {
  label: string;
  dayOfMonth: number;
  today: boolean;
  sessions: PlannedSession[];
}

@Component({
  selector: 'app-me-today-page',
  imports: [FormsModule, RouterLink, AvatarComponent, IconComponent, BarChartComponent],
  template: `
    <header class="row head">
      <div class="head-txt">
        <div class="faint date">{{ dateLabel }}</div>
        <h1>Bonjour {{ auth.user()?.firstName }}</h1>
        @if (goalCountdown()) {
          <div class="muted sub">{{ goalCountdown() }}</div>
        }
      </div>
      @if (hasConnection()) {
        <button class="btn" type="button" [disabled]="syncing()" (click)="sync()">
          <ui-icon name="sync" [size]="18" />{{ syncing() ? 'Synchronisation…' : 'Synchroniser' }}
        </button>
      }
    </header>

    <div class="row two-cards">
      <section class="card checkin col">
        <div class="c-title">Comment tu te sens ce matin ?</div>
        <div class="muted c-sub">Ton coach le voit avant ta séance.</div>
        @if (checkin()?.checkin; as c) {
          <div class="row segs">
            @for (f of feelings; track f[0]) {
              <span class="seg" [class.on]="c.feeling === f[0]">{{ f[1] }}</span>
            }
          </div>
          <div class="row sent muted"><ui-icon name="check" [size]="15" [sw]="2.25" style="color: var(--good)" />Check-in envoyé</div>
        } @else {
          <div class="row segs">
            @for (f of feelings; track f[0]) {
              <button class="seg live" type="button" (click)="submitCheckin(f[0])">{{ f[1] }}</button>
            }
          </div>
        }
      </section>
      <section class="card session col">
        @if (session(); as s) {
          <div class="row s-top">
            <span class="pill accent"><ui-icon [name]="s.type === 'strength' ? 'dumbbell' : 'run'" [size]="13" />Séance du jour</span>
            <span class="grow"></span>
            <span class="faint num tiny">difficulté {{ s.expectedDifficulty }}/10</span>
          </div>
          <div class="s-name">{{ s.name }}</div>
          @if (s.instructions) {
            <div class="muted s-note">{{ s.instructions }}</div>
          }
          <div class="col s-blocks">
            @for (p of s.resolved?.paces ?? []; track p.blockPath) {
              <div class="row block">
                <span class="bar" style="background: var(--accent)"></span>
                <span class="grow muted">Bloc {{ p.blockPath }}</span>
                <span class="num strong">{{ pace(p.minSecPerKm) }} – {{ pace(p.maxSecPerKm) }}</span>
              </div>
            }
            @for (l of s.resolved?.loads ?? []; track l.exerciseId) {
              <div class="row block">
                <span class="bar" style="background: var(--accent)"></span>
                <span class="grow muted">Charge de travail</span>
                <span class="num strong">{{ l.kg }} kg</span>
              </div>
            }
          </div>
          <span class="grow"></span>
          @if (s.status === 'completed') {
            @if (activity() && !activity()!.feedback) {
              <div class="col fb">
                <div class="c-title small">C'était comment ? <span class="faint normal">(difficulté /10)</span></div>
                <div class="row chips">
                  @for (n of scale10; track n) {
                    <button class="chip num" type="button" [class.on]="rpe === n" (click)="rpe = n">{{ n }}</button>
                  }
                </div>
                <div class="row segs small">
                  @for (f of feelings; track f[0]) {
                    <button class="seg live sm" type="button" [class.on]="feeling === f[0]" (click)="feeling = f[0]">{{ f[1] }}</button>
                  }
                </div>
                <div class="row fb-send">
                  <input class="input" [(ngModel)]="fbComment" placeholder="Un mot pour ton coach (optionnel)" />
                  <button class="btn primary" type="button" [disabled]="rpe == null || feeling == null || busy()" (click)="sendFeedback()">Envoyer</button>
                </div>
              </div>
            } @else {
              <div class="row done-row">
                <span class="pill done"><ui-icon name="check" [size]="13" [sw]="2.25" />Réalisée</span>
                @if (activity()?.feedback; as fb) {
                  <span class="muted tiny">difficulté {{ fb.rpe }}/10{{ s.expectedDifficulty != null ? ' · attendue ' + s.expectedDifficulty + '/10' : '' }}</span>
                }
              </div>
            }
          } @else {
            <div class="row actions">
              <input class="input dur" type="number" min="1" placeholder="Durée (min)" [(ngModel)]="durationMin" />
              <button class="btn primary" type="button" [disabled]="!durationMin || busy()" (click)="markDone()">
                <ui-icon name="check" [size]="18" [sw]="2" />Marquer réalisée
              </button>
            </div>
          }
        } @else if (loaded()) {
          <div class="c-title">Repos aujourd'hui</div>
          <div class="muted c-sub">Aucune séance planifiée. Profites-en.</div>
        }
      </section>
    </div>

    <section class="card pad">
      <div class="row card-head">
        <h2>Ma semaine</h2>
        <span class="muted num tiny">{{ weekDone() }} / {{ weekTotal() }} réalisées</span>
      </div>
      <div class="week-strip">
        @for (day of week(); track day.dayOfMonth) {
          <div class="w-day col" [class.today]="day.today">
            <div class="row w-head"><span class="w-name">{{ day.label }}</span><span class="num faint">{{ day.dayOfMonth }}</span></div>
            @for (s of day.sessions; track s.id) {
              <div class="wchip col" [class]="'wchip col st-' + s.status" [class.st-today]="day.today && s.status === 'planned'">
                @if (s.status === 'completed') {
                  <ui-icon name="check" [size]="14" [sw]="2.25" style="color: var(--good)" />
                } @else if (s.status === 'missed') {
                  <ui-icon name="x" [size]="14" [sw]="2.25" style="color: var(--bad)" />
                } @else {
                  <ui-icon [name]="s.type === 'strength' ? 'dumbbell' : 'run'" [size]="14" />
                }
                <span class="ellip">{{ s.name }}</span>
              </div>
            }
            @if (day.sessions.length === 0) {
              <span class="faint rest">Repos</span>
            }
          </div>
        }
      </div>
    </section>

    <div class="row bottom-cols">
      <section class="card pad grow-1">
        <div class="row card-head"><h2>Volume hebdo</h2><span class="faint tiny">8 semaines · km</span></div>
        @if (overview(); as o) {
          <ui-bar-chart [values]="volumeValues(o)" [labels]="volumeLabels(o)" [w]="620" [h]="140" />
        }
      </section>
      <aside class="col side">
        @if (coachMessage(); as cm) {
          <section class="card pad">
            <div class="row card-head">
              <ui-avatar [name]="coachName()" [size]="36" />
              <div class="cm-id">
                <div class="cm-name">{{ coachName() }}</div>
                <div class="faint tiny">Ton coach</div>
              </div>
            </div>
            <div class="cm-bubble">{{ cm }}</div>
            <a class="btn small top" routerLink="/moi/messages">Répondre</a>
          </section>
        }
        @if (goal(); as g) {
          <section class="card pad">
            <div class="row card-head"><h2>Objectif</h2>
              @if (daysToRace() != null) {
                <span class="faint num tiny">J-{{ daysToRace() }}</span>
              }
            </div>
            <div class="g-name">{{ g.label }}</div>
            <div class="muted tiny">{{ g.date ? frDateLong(g.date) : '' }}{{ g.targetTime ? ' · objectif ' + g.targetTime : '' }}</div>
          </section>
        }
        @if (paceZones().length > 0) {
          <section class="card pad">
            <div class="row card-head"><h2>Mes allures</h2><span class="faint tiny">VMA {{ vma() }}</span></div>
            @for (z of paceZones(); track z.tag) {
              <div class="zone">
                <span class="pill num ztag" [style.background]="z.color">{{ z.tag }}</span>
                <span class="muted">{{ z.label }}</span>
                <span class="num strong">{{ z.value }}</span>
              </div>
            }
          </section>
        }
      </aside>
    </div>
  `,
  styles: `
    .head { gap: 16px; }
    .head-txt { flex: 1 1 auto; }
    .date { font-size: 13px; text-transform: capitalize; }
    h1 { margin-top: 2px; }
    .sub { margin-top: 4px; }
    .two-cards { gap: 20px; align-items: stretch; }
    .checkin { flex: 1 1 0; padding: 18px 20px; }
    .session { flex: 1.2 1 0; padding: 18px 20px; }
    .c-title { font-weight: 600; font-size: 15px; }
    .c-title.small { font-size: 14px; }
    .normal { font-weight: 400; }
    .c-sub { font-size: 13px; margin-top: 2px; margin-bottom: 12px; }
    .segs { gap: 6px; }
    .segs.small { margin-top: 4px; }
    .seg { flex: 1 1 0; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 12.5px; font-weight: 500; background: var(--surface); color: var(--ink2); border: 1px solid var(--line); font-family: inherit; }
    .seg.sm { height: 36px; font-size: 11.5px; }
    .seg.live { cursor: pointer; }
    .seg.live:hover { background: var(--surface2); }
    .seg.on { background: var(--btn-primary-bg); color: var(--btn-primary-ink); border-color: var(--btn-primary-bg); }
    .sent { gap: 8px; margin-top: 12px; font-size: 13px; }
    .s-top { gap: 10px; }
    .grow { flex: 1 1 auto; }
    .tiny { font-size: 12.5px; }
    .s-name { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; margin-top: 10px; }
    .s-note { font-size: 13px; margin: 2px 0 8px; }
    .s-blocks { margin-top: 4px; }
    .block { gap: 12px; padding: 9px 0; border-top: 1px solid var(--line); font-size: 13.5px; }
    .bar { width: 6px; height: 28px; border-radius: 99px; flex: 0 0 auto; }
    .strong { font-weight: 600; }
    .actions { gap: 10px; margin-top: 12px; }
    .dur { max-width: 140px; }
    .done-row { gap: 10px; margin-top: 12px; }
    .fb { gap: 8px; margin-top: 12px; }
    .chips { gap: 5px; flex-wrap: wrap; }
    .chip { width: 36px; height: 34px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; background: var(--surface); color: var(--ink2); border: 1px solid var(--line); font-family: inherit; cursor: pointer; }
    .chip.on { background: var(--btn-primary-bg); color: var(--btn-primary-ink); border-color: var(--btn-primary-bg); }
    .fb-send { gap: 8px; }
    .pad { padding: 16px 18px; }
    .card-head { gap: 10px; margin-bottom: 12px; }
    .card-head h2 { flex: 1 1 auto; }
    .week-strip { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
    .w-day { gap: 8px; min-height: 84px; padding: 10px 6px; min-width: 0; border-radius: 12px; border: 1px solid transparent; }
    .w-day.today { background: var(--surface2); border-color: var(--line); }
    .w-head { gap: 6px; font-size: 12px; }
    .w-name { font-weight: 600; }
    .wchip { gap: 5px; padding: 8px 7px; border-radius: 9px; font-size: 11.5px; font-weight: 500; line-height: 1.2; min-width: 0; align-items: flex-start; background: var(--surface); border: 1px solid var(--line); }
    .wchip.st-planned { border-style: dashed; border-color: var(--line-strong); color: var(--ink2); }
    .wchip.st-today { background: var(--accent-soft); border: 1px solid var(--accent); color: var(--accent-ink); }
    .wchip.st-missed { background: var(--bad-soft); border-color: var(--bad-soft); color: var(--bad); }
    .rest { font-size: 12px; padding: 8px 2px; }
    .bottom-cols { gap: 20px; align-items: flex-start; }
    .grow-1 { flex: 1 1 0; min-width: 0; }
    .side { width: 360px; flex: 0 0 auto; gap: 20px; }
    .cm-id { flex: 1 1 auto; line-height: 1.25; }
    .cm-name { font-weight: 600; }
    .cm-bubble { padding: 12px 14px; border-radius: 12px; background: var(--surface2); font-size: 13.5px; line-height: 1.45; }
    .top { margin-top: 12px; }
    .g-name { font-weight: 600; font-size: 15px; }
    .zone { display: grid; grid-template-columns: 44px 1fr auto; gap: 10px; align-items: center; padding: 7px 0; border-top: 1px solid var(--line); font-size: 13px; }
    .ztag { height: 22px; padding: 0 7px; color: #fff; font-size: 11px; justify-content: center; }
  `,
})
export class MeTodayPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly auth = inject(AuthStore);
  readonly feelings = FEELINGS;
  readonly scale10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  readonly checkin = signal<CheckinToday | null>(null);
  readonly session = signal<PlannedSessionDetail | null>(null);
  readonly activity = signal<ActivityDetail | null>(null);
  readonly overview = signal<AthleteOverview | null>(null);
  readonly paces = signal<PaceTable | null>(null);
  readonly me = signal<Athlete | null>(null);
  readonly connections = signal<Connection[]>([]);
  readonly coachMessage = signal<string | null>(null);
  readonly loaded = signal(false);
  readonly busy = signal(false);
  readonly syncing = signal(false);
  durationMin: number | null = null;
  rpe: number | null = null;
  feeling: number | null = null;
  fbComment = '';

  readonly dateLabel = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  readonly goal = computed(() => this.me()?.goal ?? null);
  readonly hasConnection = computed(() => this.connections().some((c) => c.status === 'connected'));

  readonly week = computed<WeekDay[]>(() => {
    const sessions = this.overview()?.week ?? [];
    const monday = new Date();
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const today = todayYmd();
    const names = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return names.map((label, i) => {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + i);
      const ymd = d.toISOString().slice(0, 10);
      return { label, dayOfMonth: d.getUTCDate(), today: ymd === today, sessions: sessions.filter((s) => s.date === ymd) };
    });
  });

  readonly paceZones = computed(() => {
    const rows = this.paces()?.rows ?? [];
    const easy = rows.find((r) => r.key === 'easy');
    const threshold = rows.find((r) => r.key === 'threshold');
    const vma = rows.find((r) => r.key === 'vma');
    const zones: { tag: string; label: string; value: string; color: string }[] = [];
    if (easy) zones.push({ tag: 'Z2', label: 'Endurance', value: this.range(easy), color: 'var(--ink3)' });
    if (threshold) zones.push({ tag: 'Seuil', label: 'Allure seuil', value: this.range(threshold), color: 'var(--ink2)' });
    if (vma) zones.push({ tag: 'VMA', label: 'Intervalles', value: this.range(vma), color: 'var(--accent)' });
    return zones;
  });

  async ngOnInit(): Promise<void> {
    await this.load();
    const [me, paces, connections, conversations] = await Promise.all([
      this.api.get<Athlete>('/me/profile').catch(() => null),
      this.api.get<PaceTable>('/me/paces').catch(() => null),
      this.api.get<Connection[]>('/me/connections').catch(() => []),
      this.api.get<Conversation[]>('/conversations').catch(() => []),
    ]);
    this.me.set(me);
    this.paces.set(paces);
    this.connections.set(connections);
    const conv = conversations[0];
    if (conv?.lastMessagePreview) this.coachMessage.set(conv.lastMessagePreview);
  }

  coachName(): string {
    return this.auth.athlete()?.coachName ?? 'Coach';
  }

  goalCountdown(): string | null {
    const g = this.goal();
    const days = this.daysToRace();
    if (!g || days == null) return null;
    return `${g.label} dans ${days} jour${days > 1 ? 's' : ''}`;
  }

  daysToRace(): number | null {
    const date = this.goal()?.date;
    if (!date) return null;
    return Math.max(0, Math.round((new Date(`${date}T00:00:00Z`).getTime() - Date.now()) / 86400000));
  }

  weekDone(): number {
    return (this.overview()?.week ?? []).filter((s) => s.status === 'completed').length;
  }

  weekTotal(): number {
    return (this.overview()?.week ?? []).length;
  }

  volumeValues(o: AthleteOverview): number[] {
    return o.loadByWeek.map((w) => w.volumeKm);
  }

  volumeLabels(o: AthleteOverview): string[] {
    return o.loadByWeek.map((w) => w.week.slice(5));
  }

  vma(): string {
    const v = this.paces()?.vmaKmh;
    return v != null ? String(v).replace('.', ',') : '—';
  }

  pace(secPerKm: number): string {
    return formatPace(secPerKm);
  }

  private range(row: { fastSecPerKm: number; slowSecPerKm: number }): string {
    return `${formatPace(row.fastSecPerKm).replace(' /km', '')} – ${formatPace(row.slowSecPerKm)}`;
  }

  frDateLong(ymd: string): string {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(`${ymd}T12:00:00Z`),
    );
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
      await this.api.post(`/sessions/${s.id}/complete-manual`, { durationSec: Math.round(this.durationMin * 60) });
      this.durationMin = null;
      await this.load();
    } finally {
      this.busy.set(false);
    }
  }

  async sendFeedback(): Promise<void> {
    const activity = this.activity();
    if (!activity || this.rpe == null || this.feeling == null) return;
    this.busy.set(true);
    try {
      await this.api.post(`/activities/${activity.id}/feedback`, {
        rpe: this.rpe,
        feeling: this.feeling,
        comment: this.fbComment.trim() || null,
      });
      this.rpe = null;
      this.feeling = null;
      this.fbComment = '';
      await this.load();
    } finally {
      this.busy.set(false);
    }
  }

  async sync(): Promise<void> {
    const connected = this.connections().find((c) => c.status === 'connected');
    if (!connected) return;
    this.syncing.set(true);
    try {
      await this.api.post(`/me/connections/${connected.provider}/sync`);
      await this.load();
    } finally {
      this.syncing.set(false);
    }
  }

  private async load(): Promise<void> {
    const today = todayYmd();
    const [checkin, sessions, overview] = await Promise.all([
      this.api.get<CheckinToday>('/me/checkin-today'),
      this.api.get<PlannedSession[]>(`/sessions?from=${today}&to=${today}`),
      this.api.get<AthleteOverview>('/me/overview'),
    ]);
    this.checkin.set(checkin);
    this.overview.set(overview);
    const detail = sessions[0] ? await this.api.get<PlannedSessionDetail>(`/sessions/${sessions[0].id}`) : null;
    this.session.set(detail);
    this.activity.set(
      detail?.completedSessionId
        ? await this.api.get<ActivityDetail>(`/activities/${detail.completedSessionId}`).catch(() => null)
        : null,
    );
    this.loaded.set(true);
  }
}
