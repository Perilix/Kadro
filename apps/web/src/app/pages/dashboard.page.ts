import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Alert, AthleteListItem, CoachDashboard, Page } from '@kadro/shared';
import { ApiClient } from '../core/api-client';
import { AuthStore } from '../core/auth-store';
import { AvatarComponent } from '../ui/avatar.component';
import { BarChartComponent } from '../ui/bar-chart.component';
import { IconComponent } from '../ui/icon.component';
import { StatusPillComponent } from '../ui/status-pill.component';

export const ALERT_LABELS: Record<string, string> = {
  form_red_streak: 'Fatigue signalée plusieurs jours de suite',
  missed_session: 'Séance manquée',
  no_activity: 'Aucune activité récente',
  no_checkin: 'Sans check-in depuis plusieurs jours',
  sleep_low: 'Sommeil insuffisant',
  resting_hr_up: 'FC repos élevée',
  hrv_drop: 'Chute de VFC',
  acr_high: 'Charge aiguë élevée',
  race_soon: 'Compétition imminente — semaine à valider',
  no_watch: 'Pas de montre reliée',
  watch_disconnected: 'Montre déconnectée',
  watch_push_failed: 'Envoi montre échoué',
};

export const ALERT_ACTIONS: Record<string, string> = {
  adapt_session: 'Adapter la séance',
  message: 'Écrire',
  validate_week: 'Valider',
  resend_push: 'Renvoyer',
  remind: 'Relancer',
};

export function alertDetail(alert: Alert): string {
  const p = alert.params;
  if (p['days'] != null) return `${p['days']} j`;
  if (p['deltaBpm'] != null) return `+${p['deltaBpm']} bpm`;
  if (p['dropPct'] != null) return `−${p['dropPct']} %`;
  if (p['avgMin'] != null) return `${Math.floor(Number(p['avgMin']) / 60)} h ${String(Number(p['avgMin']) % 60).padStart(2, '0')} en moyenne`;
  if (p['name'] != null) return String(p['name']);
  if (p['label'] != null) return String(p['label']);
  return '';
}

const ROSTER_COLS = '1.5fr 1fr 0.95fr 1.15fr 1.15fr';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, AvatarComponent, IconComponent, StatusPillComponent, BarChartComponent],
  template: `
    <header class="row head">
      <div class="head-txt">
        <h1>Bonjour {{ auth.user()?.firstName }}</h1>
        <div class="muted sub">
          {{ today }}
          @if (alerts().length > 0) {
            · {{ alerts().length }} point{{ alerts().length > 1 ? 's' : '' }} à traiter avant les séances du jour
          }
        </div>
      </div>
      <a class="btn primary" routerLink="/bibliotheque/nouvelle"><ui-icon name="plus" [size]="18" [sw]="2" />Nouvelle séance</a>
    </header>

    @if (showOnboarding()) {
      <section class="card ob">
        <div class="section-head"><h2>Premiers pas</h2><span class="faint small-txt">{{ obDone() }} / 3</span></div>
        <a class="row ob-step" routerLink="/equipe">
          <span class="ob-n" [class.ok]="roster().length > 0">
            @if (roster().length > 0) {
              <ui-icon name="check" [size]="13" [sw]="3" />
            } @else {
              1
            }
          </span>
          <div class="ob-txt">
            <div class="ob-t" [class.done-t]="roster().length > 0">Invitez votre premier athlète</div>
            <div class="muted ob-s">Partagez votre code d'équipe — l'athlète installe l'app, entre le code, et apparaît ici.</div>
          </div>
          <ui-icon name="chevron" [size]="16" />
        </a>
        <a class="row ob-step" routerLink="/bibliotheque/nouvelle">
          <span class="ob-n" [class.ok]="hasTemplates()">
            @if (hasTemplates()) {
              <ui-icon name="check" [size]="13" [sw]="3" />
            } @else {
              2
            }
          </span>
          <div class="ob-txt">
            <div class="ob-t" [class.done-t]="hasTemplates()">Écrivez votre première séance</div>
            <div class="muted ob-s">Une séance écrite une fois — chaque athlète recevra ses allures et ses charges.</div>
          </div>
          <ui-icon name="chevron" [size]="16" />
        </a>
        <a class="row ob-step" routerLink="/planning">
          <span class="ob-n" [class.ok]="hasSessions()">
            @if (hasSessions()) {
              <ui-icon name="check" [size]="13" [sw]="3" />
            } @else {
              3
            }
          </span>
          <div class="ob-txt">
            <div class="ob-t" [class.done-t]="hasSessions()">Assignez-la sur le planning</div>
            <div class="muted ob-s">Elle partira sur la montre de chaque athlète la veille au soir, avec ses allures.</div>
          </div>
          <ui-icon name="chevron" [size]="16" />
        </a>
      </section>
    }
    @if (dashboard(); as d) {
      <div class="kpis row">
        <div class="card kpi">
          <div class="kpi-label">Athlètes suivis</div>
          <div class="kpi-value num">{{ d.kpis.athleteCount }}</div>
          <div class="kpi-sub faint">{{ d.kpis.activeThisWeek }} actifs cette semaine</div>
        </div>
        <div class="card kpi">
          <div class="kpi-label">Séances de la semaine</div>
          <div class="kpi-value num">{{ d.kpis.sessionsDone }} <span class="kpi-of">/ {{ d.kpis.sessionsPlanned }}</span></div>
          <div class="kpi-sub faint">{{ d.kpis.sessionsPlanned - d.kpis.sessionsDone }} restantes d'ici dimanche</div>
        </div>
        <div class="card kpi">
          <div class="kpi-label">Adhérence sur 7 jours</div>
          <div class="kpi-value num">{{ d.kpis.adherence7d != null ? d.kpis.adherence7d + ' %' : '—' }}</div>
          <div class="kpi-sub faint">séances réalisées / prévues</div>
        </div>
        <div class="card kpi">
          <div class="kpi-label">Alertes forme</div>
          <div class="kpi-value num" [style.color]="d.kpis.openAlerts > 0 ? 'var(--bad)' : null">{{ d.kpis.openAlerts }}</div>
          <div class="kpi-sub" [class.faint]="!alertNames()" [style.color]="alertNames() ? 'var(--bad)' : null">{{ alertNames() || 'rien à signaler' }}</div>
        </div>
      </div>

      <div class="cols row">
        <div class="col main">
          @if (alerts().length > 0) {
            <section class="card">
              <div class="section-head"><h2>À traiter</h2></div>
              @for (alert of alerts(); track alert.id) {
                <div class="row todo">
                  <span class="dot big" [class]="'dot big ' + severityClass(alert)"></span>
                  <ui-avatar [name]="athleteName(alert.athleteId)" [size]="32" />
                  <div class="todo-txt">
                    <div class="todo-name"><a [routerLink]="['/athletes', alert.athleteId]">{{ athleteName(alert.athleteId) }}</a></div>
                    <div class="muted todo-why">{{ alertLabel(alert.kind) }}{{ detail(alert) ? ' · ' + detail(alert) : '' }}</div>
                  </div>
                  <button class="btn small" type="button" (click)="closeAlert(alert, 'resolve')">{{ actionLabel(alert) }}</button>
                  <button class="icon-btn ignore" type="button" title="Ignorer" (click)="closeAlert(alert, 'dismiss')"><ui-icon name="x" [size]="15" /></button>
                </div>
              }
            </section>
          }
          <section class="card grow">
            <div class="section-head"><h2>Athlètes</h2><a routerLink="/athletes" class="see">Tout voir</a></div>
            <div class="table-head" [style.grid-template-columns]="cols">
              <div>Athlète</div><div>Forme</div><div>Adhérence</div><div>Prochaine séance</div><div>Dernière activité</div>
            </div>
            @for (a of roster().slice(0, 6); track a.id) {
              <a class="table-row" [style.grid-template-columns]="cols" [routerLink]="['/athletes', a.id]">
                <div class="row cell-name"><ui-avatar [name]="a.firstName + ' ' + a.lastName" [size]="30" /><span class="ellip strong">{{ a.firstName }} {{ a.lastName }}</span></div>
                <div><ui-status-pill [level]="a.formStatus" /></div>
                <div class="row adh">
                  <span class="meter"><span [style.width.%]="a.adherence7d ?? 0" [style.background]="(a.adherence7d ?? 100) < 75 ? 'var(--warn)' : 'var(--ink)'"></span></span>
                  <span class="num muted">{{ a.adherence7d != null ? a.adherence7d + ' %' : '—' }}</span>
                </div>
                <div class="ellip">{{ a.nextSessionDate ?? '—' }}</div>
                <div class="muted ellip">{{ lastActivity(a) }}</div>
              </a>
            }
          </section>
        </div>
        <aside class="col side">
          <section class="card today-card">
            <div class="section-head pad"><h2>Aujourd'hui</h2><span class="faint num small-txt">{{ todaySessions(d) }} séance{{ todaySessions(d) > 1 ? 's' : '' }}</span></div>
            @for (item of d.today; track item.athleteId) {
              <div class="row t-row">
                <ui-avatar [name]="item.firstName + ' ' + item.lastName" [size]="30" />
                <div class="t-txt">
                  <div class="t-name">{{ item.firstName }} {{ item.lastName }}</div>
                  <div class="muted t-sub">{{ item.session?.name ?? 'Repos' }}</div>
                </div>
                @if (item.session?.status === 'completed') {
                  <span class="pill done"><ui-icon name="check" [size]="13" [sw]="2.25" />Réalisée</span>
                } @else if (item.session) {
                  <span class="pill soft">Prévue</span>
                } @else {
                  <span class="faint small-txt">—</span>
                }
              </div>
            }
            @if (d.today.length === 0) {
              <p class="muted empty">Aucun athlète pour l'instant — partagez votre code d'équipe.</p>
            }
          </section>
          <section class="card vol">
            <div class="row vol-head"><h2>Volume de l'équipe</h2><span class="faint small-txt">8 semaines · km</span></div>
            <div class="num vol-total">{{ currentVolume(d) }} km <span class="vol-cap faint">semaine en cours</span></div>
            <ui-bar-chart [values]="volumes(d)" [labels]="volumeLabels(d)" [w]="340" [h]="104" />
          </section>
        </aside>
      </div>
    } @else {
      <p class="muted">Chargement…</p>
    }
  `,
  styles: `
    .head { gap: 16px; }
    .head-txt { flex: 1 1 auto; }
    .sub { margin-top: 4px; }
    .kpis { gap: 16px; align-items: stretch; }
    .kpi { padding: 18px 20px; display: flex; flex-direction: column; gap: 6px; flex: 1 1 0; }
    .kpi-label { font-size: 13px; color: var(--ink2); font-weight: 500; }
    .kpi-value { font-size: 30px; font-weight: 600; letter-spacing: -0.03em; line-height: 1; }
    .kpi-of { font-size: 18px; color: var(--ink3); font-weight: 500; }
    .kpi-sub { font-size: 12px; }
    .cols { gap: 20px; align-items: stretch; }
    .main { flex: 1 1 0; min-width: 0; gap: 20px; }
    .side { width: 380px; flex: 0 0 auto; gap: 20px; }
    .grow { flex: 1 1 auto; overflow: hidden; }
    .see { font-size: 13px; font-weight: 500; }
    .todo { gap: 14px; padding: 12px 16px; border-top: 1px solid var(--line); }
    .dot.big { width: 10px; height: 10px; }
    .dot.sev-bad { background: var(--bad); }
    .dot.sev-warn { background: var(--warn); }
    .dot.sev-info { background: var(--ink3); }
    .todo-txt { flex: 1 1 auto; line-height: 1.3; min-width: 0; }
    .todo-name a { color: var(--ink); font-weight: 600; }
    .todo-why { font-size: 13px; }
    .ignore { width: 32px; height: 32px; border: none; background: transparent; }
    .ignore:hover { color: var(--bad); }
    .cell-name { gap: 10px; min-width: 0; }
    .strong { font-weight: 500; }
    .adh { gap: 10px; }
    .meter { display: block; width: 72px; }
    .meter span { display: block; }
    .t-row { gap: 12px; padding: 10px 16px; border-top: 1px solid var(--line); }
    .t-txt { flex: 1 1 auto; line-height: 1.3; min-width: 0; }
    .t-name { font-weight: 500; }
    .t-sub { font-size: 12.5px; }
    .small-txt { font-size: 12.5px; }
    .section-head.pad { padding-bottom: 6px; }
    .empty { padding: 4px 16px 14px; margin: 0; font-size: 13px; }
    .vol { padding: 16px 18px 12px; display: flex; flex-direction: column; gap: 10px; }
    .vol-head { gap: 10px; }
    .vol-head h2 { flex: 1 1 auto; }
    .vol-total { font-size: 28px; font-weight: 600; letter-spacing: -0.03em; line-height: 1; }
    .vol-cap { font-size: 13px; font-weight: 500; letter-spacing: 0; }
    .ob { margin-bottom: 0; }
    .ob-step { gap: 14px; padding: 12px 16px; border-top: 1px solid var(--line); color: var(--ink); }
    .ob-step:hover { background: var(--surface2); }
    .ob-n { width: 24px; height: 24px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; background: var(--neutral-soft); color: var(--ink2); flex: 0 0 auto; }
    .ob-n.ok { background: var(--good); color: #fff; }
    .ob-txt { flex: 1 1 auto; line-height: 1.3; min-width: 0; }
    .ob-t { font-weight: 600; }
    .ob-t.done-t { color: var(--ink3); text-decoration: line-through; }
    .ob-s { font-size: 12.5px; }
  `,
})
export class DashboardPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly auth = inject(AuthStore);
  readonly dashboard = signal<CoachDashboard | null>(null);
  readonly alerts = signal<Alert[]>([]);
  readonly roster = signal<AthleteListItem[]>([]);
  readonly cols = ROSTER_COLS;
  readonly today = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  private names = new Map<string, string>();
  readonly alertNames = computed(() => {
    const list = [...new Set(this.alerts().map((a) => this.athleteName(a.athleteId).split(' ')[0]))].filter(Boolean);
    return list.slice(0, 3).join(', ');
  });

  readonly templateCount = signal<number | null>(null);

  hasTemplates(): boolean {
    return (this.templateCount() ?? 0) > 0;
  }

  hasSessions(): boolean {
    const d = this.dashboard();
    return d != null && (d.kpis.sessionsPlanned > 0 || d.kpis.sessionsDone > 0);
  }

  obDone(): number {
    return [this.roster().length > 0, this.hasTemplates(), this.hasSessions()].filter(Boolean).length;
  }

  showOnboarding(): boolean {
    return this.dashboard() != null && this.templateCount() != null && this.obDone() < 3;
  }

  async ngOnInit(): Promise<void> {
    const [dashboard, alerts, roster, templates] = await Promise.all([
      this.api.get<CoachDashboard>('/team/dashboard'),
      this.api.get<Page<Alert>>('/alerts'),
      this.api.get<Page<AthleteListItem>>('/athletes?sort=form'),
      this.api.get<{ length: number }[]>('/templates').catch(() => []),
    ]);
    this.names = new Map(roster.items.map((a) => [a.id, `${a.firstName} ${a.lastName}`]));
    this.dashboard.set(dashboard);
    this.alerts.set(alerts.items);
    this.roster.set(roster.items);
    this.templateCount.set(templates.length);
  }

  athleteName(id: string): string {
    return this.names.get(id) ?? '';
  }

  alertLabel(kind: string): string {
    return ALERT_LABELS[kind] ?? kind;
  }

  actionLabel(alert: Alert): string {
    return ALERT_ACTIONS[alert.suggestedAction ?? ''] ?? 'Traiter';
  }

  detail(alert: Alert): string {
    return alertDetail(alert);
  }

  severityClass(alert: Alert): string {
    return alert.severity === 'critical' ? 'sev-bad' : alert.severity === 'warn' ? 'sev-warn' : 'sev-info';
  }

  lastActivity(a: AthleteListItem): string {
    if (!a.lastActivityAt) return '—';
    const days = Math.floor((Date.now() - new Date(a.lastActivityAt).getTime()) / 86400000);
    return days === 0 ? "Aujourd'hui" : days === 1 ? 'Hier' : `Il y a ${days} j`;
  }

  todaySessions(d: CoachDashboard): number {
    return d.today.filter((t) => t.session).length;
  }

  volumes(d: CoachDashboard): number[] {
    return d.weeklyVolumeKm.map((w) => w.km);
  }

  volumeLabels(d: CoachDashboard): string[] {
    return d.weeklyVolumeKm.map((w) => w.week);
  }

  currentVolume(d: CoachDashboard): number {
    return d.weeklyVolumeKm[d.weeklyVolumeKm.length - 1]?.km ?? 0;
  }

  async closeAlert(alert: Alert, action: 'resolve' | 'dismiss'): Promise<void> {
    await this.api.post(`/alerts/${alert.id}/${action}`);
    this.alerts.update((list) => list.filter((a) => a.id !== alert.id));
  }
}
