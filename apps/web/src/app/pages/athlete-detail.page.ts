import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type {
  ActivityListItem,
  Alert,
  Athlete,
  AthleteOverview,
  Checkin,
  ExerciseStats,
  Group,
  Monitoring,
  Note,
  PaceTable,
  Page,
  PlannedSession,
  Test,
} from '@kadro/shared';
import { formatDuration, formatPace } from '@kadro/shared';
import { ApiClient } from '../core/api-client';
import { AvatarComponent } from '../ui/avatar.component';
import { BarChartComponent } from '../ui/bar-chart.component';
import { IconComponent } from '../ui/icon.component';
import { StatusPillComponent, FORM_LEVELS } from '../ui/status-pill.component';
import { ALERT_LABELS, alertDetail } from './dashboard.page';

const TABS = ['Aperçu', 'Séances', 'Muscu', 'Monitoring', 'Tests', 'Notes'] as const;
type Tab = (typeof TABS)[number];

const ZONE_LABELS: Record<string, string> = {
  recovery: 'Récupération',
  easy: 'Endurance fondamentale',
  marathon: 'Allure marathon',
  threshold: 'Seuil',
  vma: 'VMA',
};

interface WeekDay {
  label: string;
  dayOfMonth: number;
  today: boolean;
  sessions: PlannedSession[];
}

@Component({
  selector: 'app-athlete-detail-page',
  imports: [RouterLink, FormsModule, AvatarComponent, IconComponent, StatusPillComponent, BarChartComponent],
  template: `
    @if (athlete(); as a) {
      <div class="row crumb faint">
        <a routerLink="/athletes" class="crumb-link">Athlètes</a>
        <ui-icon name="chevron" [size]="14" />
        <span class="crumb-here">{{ a.firstName }} {{ a.lastName }}</span>
      </div>
      <header class="row head">
        <ui-avatar [name]="a.firstName + ' ' + a.lastName" [size]="56" />
        <div class="head-txt">
          <h1>{{ a.firstName }} {{ a.lastName }}</h1>
          <div class="row meta muted">
            <ui-status-pill [level]="a.snapshot.formStatus" />
            @if (a.goal) {
              <span>{{ a.goal.label }}{{ a.goal.date ? ' · ' + frDate(a.goal.date) : '' }}{{ a.goal.targetTime ? ' · objectif ' + a.goal.targetTime : '' }}</span>
              <span class="faint">·</span>
            }
            @if (a.profile.vmaKmh != null) {
              <span>VMA {{ a.profile.vmaKmh }} km/h</span>
            }
          </div>
        </div>
        <a class="btn" routerLink="/messages"><ui-icon name="message" [size]="18" />Message</a>
        <a class="btn primary" routerLink="/bibliotheque/nouvelle"><ui-icon name="plus" [size]="18" [sw]="2" />Planifier une séance</a>
      </header>

      <div class="tabs">
        @for (t of tabsList; track t) {
          <button type="button" [class.on]="tab() === t" (click)="tab.set(t)">{{ t }}</button>
        }
      </div>

      @switch (tab()) {
        @case ('Aperçu') {
          <div class="row cols">
            <div class="col main">
              <section class="card pad">
                <div class="row card-head"><h2>Charge d'entraînement</h2><span class="faint tiny">8 dernières semaines · unités de charge</span></div>
                <div class="row metrics">
                  <div class="metric col"><span class="faint tiny">Cette semaine</span><span class="num m-val">{{ currentLoad() }}</span></div>
                  <div class="metric col"><span class="faint tiny">Moyenne 4 sem.</span><span class="num m-val">{{ avgLoad() }}</span></div>
                  <div class="metric col"><span class="faint tiny">Ratio aigu / chronique</span><span class="num m-val" [style.color]="acrColor()">{{ acr() }}</span></div>
                  <div class="metric col"><span class="faint tiny">Volume 7 j</span><span class="num m-val">{{ a.snapshot.volume7dKm != null ? a.snapshot.volume7dKm + ' km' : '—' }}</span></div>
                </div>
                @if (overview(); as o) {
                  <ui-bar-chart [values]="loadValues(o)" [labels]="loadLabels(o)" [w]="700" [h]="124" />
                }
              </section>
              <section class="card pad">
                <div class="row card-head">
                  <h2>Cette semaine</h2>
                  <span class="muted num tiny">{{ weekDone() }} / {{ weekTotal() }} réalisées</span>
                  <span class="faint">·</span>
                  <a routerLink="/planning" class="link-sm">Ouvrir le planning</a>
                </div>
                <div class="week-strip">
                  @for (day of week(); track day.dayOfMonth) {
                    <div class="w-day col" [class.today]="day.today">
                      <div class="row w-head"><span class="w-name">{{ day.label }}</span><span class="num faint">{{ day.dayOfMonth }}</span></div>
                      @for (s of day.sessions; track s.id) {
                        <div class="chip col" [class]="'chip col st-' + s.status" [class.st-today]="day.today && s.status === 'planned'">
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
              <section class="card">
                <div class="section-head"><h2>Dernières séances</h2><button class="link-sm as-link" type="button" (click)="tab.set('Séances')">Toutes</button></div>
                @for (s of recent(); track s.id) {
                  <a class="row s-row" [routerLink]="['/activites', s.id]">
                    <span class="s-ic"><ui-icon [name]="s.sport === 'strength' ? 'dumbbell' : 'run'" [size]="18" /></span>
                    <div class="s-txt">
                      <div class="s-name">{{ s.name ?? (s.sport === 'strength' ? 'Renfo libre' : 'Sortie libre') }}</div>
                      <div class="muted s-meta">{{ activityMeta(s) }}</div>
                    </div>
                    <span class="faint num s-date">{{ shortDate(s.startedAt) }}</span>
                    @if (s.feedbackRpe != null) {
                      <span class="muted num s-rpe">RPE {{ s.feedbackRpe }}</span>
                    }
                  </a>
                }
                @if (recent().length === 0) {
                  <p class="muted empty">Aucune activité pour l'instant.</p>
                }
              </section>
            </div>
            <aside class="col side">
              <section class="card pad">
                <div class="row card-head"><h2>Forme</h2><span class="faint tiny">7 derniers jours</span></div>
                <div class="row ck-days">
                  @for (day of checkinDays(); track day.label) {
                    <div class="col ck-day">
                      <span class="ck-dot" [style.background]="day.color" [class.ring]="day.today"></span>
                      <span class="tiny" [class.faint]="!day.today" [style.font-weight]="day.today ? 600 : 400">{{ day.label }}</span>
                    </div>
                  }
                </div>
                @if (currentAlert(); as alert) {
                  <div class="row banner">
                    <ui-icon name="alert" [size]="18" />
                    <span>{{ alertLabel(alert.kind) }}{{ detail(alert) ? ' · ' + detail(alert) : '' }}. La séance du jour peut être allégée ou décalée.</span>
                  </div>
                }
                @if (lastCheckin(); as c) {
                  <div class="row metrics tight">
                    <div class="metric col"><span class="faint tiny">Ressenti</span><span class="num m-val" [style.color]="levelColor(c.level)">{{ c.feeling }} / 5</span></div>
                    <div class="metric col"><span class="faint tiny">Sommeil</span><span class="num m-val">{{ c.sleepMin != null ? sleepLabel(c.sleepMin) : '—' }}</span></div>
                    <div class="metric col"><span class="faint tiny">Courbatures</span><span class="num m-val">{{ c.soreness != null ? c.soreness + ' / 5' : '—' }}</span></div>
                    <div class="metric col"><span class="faint tiny">Humeur</span><span class="num m-val">{{ c.mood != null ? c.mood + ' / 5' : '—' }}</span></div>
                  </div>
                }
              </section>
              @if (a.goal; as goal) {
                <section class="card pad">
                  <div class="row card-head"><h2>Objectif</h2>
                    @if (daysToRace() != null) {
                      <span class="faint num tiny">J-{{ daysToRace() }}</span>
                    }
                  </div>
                  <div class="g-name">{{ goal.label }}</div>
                  <div class="muted g-meta">
                    {{ goal.date ? frDateLong(goal.date) : '' }}{{ goal.targetTime ? ' · objectif ' + goal.targetTime : '' }}{{ goal.referenceTime ? ' · réf. ' + goal.referenceTime : '' }}
                  </div>
                </section>
              }
              @if (groups().length > 0) {
                <section class="card pad">
                  <div class="row card-head"><h2>Groupes</h2></div>
                  <div class="row g-chips">
                    @for (g of groups(); track g.id) {
                      <button
                        class="g-chip"
                        type="button"
                        [class.on]="inGroup(g.id)"
                        (click)="toggleGroup(g.id)"
                      >{{ g.name }}</button>
                    }
                  </div>
                </section>
              }
              <section class="card pad">
                <div class="row card-head"><h2>Notes</h2><button class="link-sm as-link" type="button" (click)="tab.set('Notes')">Ajouter</button></div>
                <div class="col notes-mini">
                  @for (note of notes().slice(0, 2); track note.id) {
                    <div class="note-box">
                      <div class="faint tiny">{{ frDate(note.date) }}</div>
                      {{ note.text }}
                    </div>
                  }
                  @if (notes().length === 0) {
                    <p class="muted empty-pad">Vos notes privées sur {{ a.firstName }} — jamais visibles de l'athlète.</p>
                  }
                </div>
              </section>
            </aside>
          </div>
        }
        @case ('Séances') {
          <section class="card">
            <div class="section-head"><h2>Toutes les séances réalisées</h2></div>
            @for (s of activities(); track s.id) {
              <a class="row s-row" [routerLink]="['/activites', s.id]">
                <span class="s-ic"><ui-icon [name]="s.sport === 'strength' ? 'dumbbell' : 'run'" [size]="18" /></span>
                <div class="s-txt">
                  <div class="s-name">{{ s.name ?? (s.sport === 'strength' ? 'Renfo libre' : 'Sortie libre') }}</div>
                  <div class="muted s-meta">{{ activityMeta(s) }}</div>
                </div>
                <span class="pill soft">{{ s.source === 'manual' ? 'Manuelle' : s.source }}</span>
                <span class="faint num s-date">{{ shortDate(s.startedAt) }}</span>
              </a>
            }
            @if (activities().length === 0) {
              <p class="muted empty">Aucune activité — elles arriveront de la montre ou de la saisie manuelle.</p>
            }
          </section>
        }
        @case ('Muscu') {
          <section class="card pad">
            <div class="row card-head"><h2>Charges de travail par exercice</h2><span class="faint tiny">1RM estimés · 16 semaines</span></div>
            @for (s of strength(); track s.exerciseId) {
              <div class="row str-row">
                <div class="s-txt">
                  <div class="s-name">{{ s.name }}</div>
                  <div class="muted s-meta">Dernière charge {{ s.lastWorkingKg != null ? s.lastWorkingKg + ' kg' : '—' }}</div>
                </div>
                <div class="col str-rm">
                  <span class="faint tiny">1RM estimé</span>
                  <span class="num m-val">{{ s.est1RmKg != null ? s.est1RmKg + ' kg' : '—' }}</span>
                </div>
              </div>
            }
            @if (strength().length === 0) {
              <p class="muted empty-pad">Les charges apparaîtront après les premières séances de renfo enregistrées série par série.</p>
            }
          </section>
        }
        @case ('Monitoring') {
          <section class="card">
            <div class="section-head"><h2>Monitoring</h2><span class="faint tiny">28 derniers jours · montre & check-ins</span></div>
            <div class="table-head" [style.grid-template-columns]="'0.8fr 0.8fr 0.9fr 0.8fr 0.8fr 1fr'">
              <div>Date</div><div>Check-in</div><div>Sommeil</div><div>FC repos</div><div>VFC</div><div>Poids</div>
            </div>
            @for (day of monitoringDays(); track day.date) {
              <div class="table-row" [style.grid-template-columns]="'0.8fr 0.8fr 0.9fr 0.8fr 0.8fr 1fr'">
                <div class="num">{{ frDate(day.date) }}</div>
                <div>
                  @if (day.checkinLevel) {
                    <span class="row lv"><span class="dot" [class]="'dot ' + day.checkinLevel"></span>{{ levelWord(day.checkinLevel) }}</span>
                  } @else {
                    <span class="faint">—</span>
                  }
                </div>
                <div class="num">{{ day.sleepMin != null ? sleepLabel(day.sleepMin) : '—' }}</div>
                <div class="num">{{ day.restingHrBpm != null ? day.restingHrBpm + ' bpm' : '—' }}</div>
                <div class="num">{{ day.hrvRmssdMs != null ? day.hrvRmssdMs + ' ms' : '—' }}</div>
                <div class="num">{{ day.weightKg != null ? day.weightKg + ' kg' : '—' }}</div>
              </div>
            }
          </section>
        }
        @case ('Tests') {
          <div class="row cols">
            <section class="card grow-half">
              <div class="section-head"><h2>Historique des tests</h2></div>
              @for (t of tests(); track t.id) {
                <div class="row s-row">
                  <span class="s-ic"><ui-icon [name]="t.kind === 'one_rm' ? 'dumbbell' : t.kind === 'vma' ? 'trend' : 'flag'" [size]="18" /></span>
                  <div class="s-txt">
                    <div class="s-name">
                      @if (t.kind === 'vma') { VMA {{ t.vmaKmh }} km/h }
                      @else if (t.kind === 'one_rm') { 1RM {{ t.oneRm?.kg }} kg }
                      @else { {{ t.race?.label }} — {{ t.race?.time }} }
                    </div>
                    <div class="muted s-meta">{{ t.source === 'manual' ? 'Saisi' : 'Déduit d’une séance' }}{{ t.note ? ' · ' + t.note : '' }}</div>
                  </div>
                  <span class="faint num s-date">{{ frDate(t.date) }}</span>
                </div>
              }
              @if (tests().length === 0) {
                <p class="muted empty">Aucun test enregistré.</p>
              }
              <div class="row test-form">
                <input class="input" type="number" step="0.1" min="8" max="26" placeholder="Nouvelle VMA (km/h)" [(ngModel)]="vmaDraft" />
                <button class="btn" type="button" [disabled]="!vmaDraft" (click)="addVmaTest()">Enregistrer le test</button>
              </div>
            </section>
            <section class="card grow-half">
              <div class="section-head"><h2>Allures individualisées</h2><span class="faint tiny">calculées depuis la VMA</span></div>
              @if (paces(); as p) {
                @if (p.rows.length === 0) {
                  <p class="muted empty">Pas de VMA — les cibles s'affichent en zones de ressenti.</p>
                } @else {
                  <div class="table-head" [style.grid-template-columns]="'1.4fr 0.8fr 1.2fr'">
                    <div>Zone</div><div>% VMA</div><div>Allure</div>
                  </div>
                  @for (row of p.rows; track row.key) {
                    <div class="table-row" [style.grid-template-columns]="'1.4fr 0.8fr 1.2fr'">
                      <div>{{ zoneLabel(row.key) }}</div>
                      <div class="num muted">{{ row.minPct }}–{{ row.maxPct }} %</div>
                      <div class="num strong">{{ pace(row.fastSecPerKm) }} – {{ pace(row.slowSecPerKm) }}</div>
                    </div>
                  }
                }
              }
            </section>
          </div>
        }
        @case ('Notes') {
          <section class="card pad">
            <div class="row card-head"><h2>Notes privées</h2><span class="faint tiny">jamais visibles de l'athlète</span></div>
            <form class="row note-form" (ngSubmit)="addNote()">
              <input class="input" name="noteDraft" [(ngModel)]="noteDraft" placeholder="Gêne au tendon, test à prévoir, contexte perso…" />
              <button class="btn primary" type="submit" [disabled]="!noteDraft.trim()">Ajouter</button>
            </form>
            @for (note of notes(); track note.id) {
              <div class="note-box big">
                <div class="row"><span class="faint tiny grow-txt">{{ frDate(note.date) }}</span>
                  <button class="icon-btn del" type="button" (click)="deleteNote(note)"><ui-icon name="x" [size]="14" /></button>
                </div>
                {{ note.text }}
              </div>
            }
          </section>
        }
      }
    } @else {
      <p class="muted">Chargement…</p>
    }
  `,
  styles: `
    .crumb { gap: 6px; font-size: 13px; }
    .crumb-link { color: var(--ink2); }
    .crumb-here { color: var(--ink); }
    .head { gap: 18px; }
    .head-txt { flex: 1 1 auto; }
    .meta { gap: 8px; margin-top: 6px; font-size: 13.5px; flex-wrap: wrap; }
    .cols { gap: 20px; align-items: flex-start; }
    .main { flex: 1 1 0; min-width: 0; gap: 16px; }
    .side { width: 360px; flex: 0 0 auto; gap: 16px; }
    .pad { padding: 16px 18px; }
    .card-head { gap: 10px; margin-bottom: 12px; }
    .card-head h2 { flex: 1 1 auto; }
    .tiny { font-size: 12.5px; }
    .link-sm { font-size: 13px; font-weight: 500; }
    .as-link { background: none; border: none; font-family: inherit; color: var(--accent); cursor: pointer; padding: 0; }
    .metrics { gap: 28px; margin-bottom: 8px; }
    .metrics.tight { gap: 16px; margin: 16px 0 0; }
    .metric { gap: 3px; flex: 1 1 0; }
    .m-val { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
    .week-strip { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
    .w-day { gap: 8px; min-height: 84px; padding: 10px 6px; min-width: 0; border-radius: 12px; border: 1px solid transparent; }
    .w-day.today { background: var(--surface2); border-color: var(--line); }
    .w-head { gap: 6px; font-size: 12px; }
    .w-name { font-weight: 600; }
    .chip { gap: 5px; padding: 8px 7px; border-radius: 9px; font-size: 11.5px; font-weight: 500; line-height: 1.2; min-width: 0; align-items: flex-start; background: var(--surface); border: 1px solid var(--line); }
    .chip.st-planned { border-style: dashed; border-color: var(--line-strong); color: var(--ink2); }
    .chip.st-today { background: var(--accent-soft); border: 1px solid var(--accent); color: var(--accent-ink); }
    .chip.st-missed { background: var(--bad-soft); border-color: var(--bad-soft); color: var(--bad); }
    .rest { font-size: 12px; padding: 8px 2px; }
    .s-row { gap: 14px; padding: 11px 16px; border-top: 1px solid var(--line); color: var(--ink); }
    a.s-row:hover { background: var(--surface2); }
    .s-ic { width: 36px; height: 36px; border-radius: 10px; background: var(--neutral-soft); display: inline-flex; align-items: center; justify-content: center; color: var(--ink2); flex: 0 0 auto; }
    .s-txt { flex: 1 1 auto; line-height: 1.3; min-width: 0; }
    .s-name { font-weight: 500; }
    .s-meta { font-size: 12.5px; }
    .s-date { font-size: 12.5px; }
    .s-rpe { font-size: 12.5px; }
    .ck-days { gap: 4px; margin-bottom: 16px; }
    .ck-day { align-items: center; gap: 6px; flex: 1 1 0; }
    .ck-dot { width: 18px; height: 18px; border-radius: 999px; }
    .ck-dot.ring { box-shadow: 0 0 0 3px var(--surface), 0 0 0 4.5px currentColor; }
    .banner { gap: 10px; padding: 12px 14px; border-radius: 10px; background: var(--bad-soft); color: var(--bad); font-size: 13px; font-weight: 500; line-height: 1.35; }
    .g-name { font-weight: 600; font-size: 15px; }
    .g-meta { font-size: 13px; margin-top: 2px; }
    .notes-mini { gap: 10px; font-size: 13px; line-height: 1.45; }
    .note-box { padding: 10px 12px; border-radius: 10px; background: var(--surface2); font-size: 13px; line-height: 1.45; }
    .note-box.big { margin-top: 10px; }
    .note-box .tiny { margin-bottom: 2px; }
    .grow-txt { flex: 1 1 auto; }
    .del { width: 26px; height: 26px; border: none; background: transparent; }
    .del:hover { color: var(--bad); }
    .empty { padding: 12px 16px; margin: 0; font-size: 13px; }
    .empty-pad { margin: 0; font-size: 13px; }
    .note-form { gap: 8px; margin-bottom: 4px; }
    .test-form { gap: 8px; padding: 12px 16px; border-top: 1px solid var(--line); }
    .test-form .input { max-width: 220px; }
    .grow-half { flex: 1 1 0; min-width: 0; }
    .str-row { gap: 14px; padding: 11px 0; border-top: 1px solid var(--line); }
    .str-rm { gap: 2px; align-items: flex-end; }
    .lv { gap: 6px; font-size: 13px; }
    .strong { font-weight: 600; }
    .g-chips { gap: 8px; flex-wrap: wrap; }
    .g-chip { height: 32px; padding: 0 12px; border-radius: 999px; font-family: inherit; font-size: 13px; font-weight: 500; background: var(--surface); color: var(--ink2); border: 1px solid var(--line-strong); cursor: pointer; }
    .g-chip.on { background: var(--btn-primary-bg); color: var(--btn-primary-ink); border-color: var(--btn-primary-bg); }
  `,
})
export class AthleteDetailPage implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly route = inject(ActivatedRoute);

  readonly tabsList = TABS;
  readonly tab = signal<Tab>('Aperçu');
  readonly athlete = signal<Athlete | null>(null);
  readonly overview = signal<AthleteOverview | null>(null);
  readonly monitoring = signal<Monitoring | null>(null);
  readonly paces = signal<PaceTable | null>(null);
  readonly notes = signal<Note[]>([]);
  readonly tests = signal<Test[]>([]);
  readonly activities = signal<ActivityListItem[]>([]);
  readonly strength = signal<ExerciseStats[]>([]);
  readonly groups = signal<Group[]>([]);
  noteDraft = '';
  vmaDraft: number | null = null;
  private athleteId = '';

  readonly recent = computed(() => this.overview()?.recentSessions ?? []);
  readonly currentAlert = computed(() => this.overview()?.currentAlert ?? null);
  readonly lastCheckin = computed<Checkin | null>(() => {
    const list = this.overview()?.checkins7d ?? [];
    return list[list.length - 1] ?? null;
  });

  readonly week = computed<WeekDay[]>(() => {
    const sessions = this.overview()?.week ?? [];
    const monday = new Date();
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const todayYmd = new Date().toISOString().slice(0, 10);
    const names = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return names.map((label, i) => {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + i);
      const ymd = d.toISOString().slice(0, 10);
      return {
        label,
        dayOfMonth: d.getUTCDate(),
        today: ymd === todayYmd,
        sessions: sessions.filter((s) => s.date === ymd),
      };
    });
  });

  readonly checkinDays = computed(() => {
    const checkins = new Map((this.overview()?.checkins7d ?? []).map((c) => [c.date, c.level]));
    const names = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const days: { label: string; color: string; today: boolean }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(Date.now() - i * 86400000);
      const ymd = d.toISOString().slice(0, 10);
      const level = checkins.get(ymd);
      days.push({
        label: names[d.getUTCDay()] ?? '',
        color: level ? FORM_LEVELS[level]!.color : 'var(--neutral-soft)',
        today: i === 0,
      });
    }
    return days;
  });

  readonly monitoringDays = computed(() => [...(this.monitoring()?.days ?? [])].reverse().slice(0, 28));

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.athleteId = id;
    const [athlete, overview, monitoring, paces, notes, tests, activities, strength, groups] = await Promise.all([
      this.api.get<Athlete>(`/athletes/${id}`),
      this.api.get<AthleteOverview>(`/athletes/${id}/overview`),
      this.api.get<Monitoring>(`/athletes/${id}/monitoring?weeks=4`),
      this.api.get<PaceTable>(`/athletes/${id}/paces`),
      this.api.get<Note[]>(`/athletes/${id}/notes`),
      this.api.get<Test[]>(`/athletes/${id}/tests`),
      this.api.get<Page<ActivityListItem>>(`/activities?athleteId=${id}&limit=50`),
      this.api.get<ExerciseStats[]>(`/athletes/${id}/strength-stats`),
      this.api.get<Group[]>('/groups'),
    ]);
    this.groups.set(groups);
    this.athlete.set(athlete);
    this.overview.set(overview);
    this.monitoring.set(monitoring);
    this.paces.set(paces);
    this.notes.set(notes);
    this.tests.set(tests);
    this.activities.set(activities.items);
    this.strength.set(strength);
  }

  loadValues(o: AthleteOverview): number[] {
    return o.loadByWeek.map((w) => w.loadUa);
  }

  loadLabels(o: AthleteOverview): string[] {
    return o.loadByWeek.map((w) => w.week.slice(5));
  }

  currentLoad(): string {
    const list = this.overview()?.loadByWeek ?? [];
    return String(list[list.length - 1]?.loadUa ?? '—');
  }

  avgLoad(): string {
    const list = (this.overview()?.loadByWeek ?? []).slice(-5, -1);
    if (list.length === 0) return '—';
    return String(Math.round(list.reduce((s, w) => s + w.loadUa, 0) / list.length));
  }

  acr(): string {
    const v = this.athlete()?.snapshot.acuteChronicRatio;
    return v != null ? String(v).replace('.', ',') : '—';
  }

  acrColor(): string | null {
    const v = this.athlete()?.snapshot.acuteChronicRatio;
    if (v == null) return null;
    return v > 1.3 ? 'var(--bad)' : v > 1.15 ? 'var(--warn)' : 'var(--good)';
  }

  weekDone(): number {
    return (this.overview()?.week ?? []).filter((s) => s.status === 'completed').length;
  }

  weekTotal(): number {
    return (this.overview()?.week ?? []).length;
  }

  daysToRace(): number | null {
    const date = this.athlete()?.goal?.date;
    if (!date) return null;
    return Math.max(0, Math.round((new Date(`${date}T00:00:00Z`).getTime() - Date.now()) / 86400000));
  }

  activityMeta(s: ActivityListItem): string {
    const parts = [formatDuration(s.durationSec)];
    if (s.distanceM) parts.push(`${(s.distanceM / 1000).toFixed(1)} km`);
    if (s.avgPaceSecPerKm) parts.push(formatPace(s.avgPaceSecPerKm));
    if (s.avgHrBpm) parts.push(`FC moy ${s.avgHrBpm}`);
    return parts.join(' · ');
  }

  alertLabel(kind: string): string {
    return ALERT_LABELS[kind] ?? kind;
  }

  detail(alert: Alert): string {
    return alertDetail(alert);
  }

  levelColor(level: string): string {
    return FORM_LEVELS[level]?.color ?? 'var(--ink)';
  }

  levelWord(level: string): string {
    return level === 'good' ? 'Bonne' : level === 'warn' ? 'Moyenne' : 'Fatigue';
  }

  pace(secPerKm: number): string {
    return formatPace(secPerKm);
  }

  zoneLabel(key: string): string {
    return ZONE_LABELS[key] ?? key;
  }

  sleepLabel(minutes: number): string {
    return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
  }

  frDate(ymd: string): string {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
      new Date(`${ymd}T12:00:00Z`),
    );
  }

  frDateLong(ymd: string): string {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(`${ymd}T12:00:00Z`),
    );
  }

  shortDate(iso: string): string {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' }).format(new Date(iso));
  }

  inGroup(groupId: string): boolean {
    return this.athlete()?.groupIds.includes(groupId) ?? false;
  }

  async toggleGroup(groupId: string): Promise<void> {
    const current = this.athlete()?.groupIds ?? [];
    const next = current.includes(groupId) ? current.filter((g) => g !== groupId) : [...current, groupId];
    const updated = await this.api.patch<Athlete>(`/athletes/${this.athleteId}`, { groupIds: next });
    this.athlete.set(updated);
  }

  async addNote(): Promise<void> {
    const text = this.noteDraft.trim();
    if (!text) return;
    const note = await this.api.post<Note>(`/athletes/${this.athleteId}/notes`, { text });
    this.notes.update((list) => [note, ...list]);
    this.noteDraft = '';
  }

  async deleteNote(note: Note): Promise<void> {
    await this.api.delete(`/athletes/${this.athleteId}/notes/${note.id}`);
    this.notes.update((list) => list.filter((n) => n.id !== note.id));
  }

  async addVmaTest(): Promise<void> {
    if (!this.vmaDraft) return;
    const test = await this.api.post<Test>(`/athletes/${this.athleteId}/tests`, {
      kind: 'vma',
      date: new Date().toISOString().slice(0, 10),
      vmaKmh: Number(this.vmaDraft),
    });
    this.tests.update((list) => [test, ...list]);
    this.vmaDraft = null;
    this.paces.set(await this.api.get<PaceTable>(`/athletes/${this.athleteId}/paces`));
    this.athlete.set(await this.api.get<Athlete>(`/athletes/${this.athleteId}`));
  }
}
