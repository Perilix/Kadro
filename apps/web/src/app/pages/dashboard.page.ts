import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Alert, AthleteListItem, CoachDashboard, Page } from '@kadro/shared';
import { ApiClient } from '../core/api-client';

const FORM_LABELS: Record<string, string> = {
  good: 'En forme',
  warn: 'À surveiller',
  bad: 'Signal rouge',
  none: '—',
};

export const ALERT_LABELS: Record<string, string> = {
  form_red_streak: 'Jours rouges consécutifs',
  missed_session: 'Séance manquée',
  no_activity: 'Aucune activité',
  no_checkin: 'Sans check-in',
  sleep_low: 'Sommeil insuffisant',
  resting_hr_up: 'FC repos élevée',
  hrv_drop: 'Chute de VFC',
  acr_high: 'Charge aiguë élevée',
  race_soon: 'Objectif imminent',
  no_watch: 'Pas de montre reliée',
  watch_disconnected: 'Montre déconnectée',
  watch_push_failed: 'Envoi montre échoué',
};

export function alertDetail(alert: Alert): string {
  const p = alert.params;
  if (p['days'] != null) return `${p['days']} j`;
  if (p['deltaBpm'] != null) return `+${p['deltaBpm']} bpm`;
  if (p['dropPct'] != null) return `−${p['dropPct']} %`;
  if (p['avgMin'] != null) return `${Math.floor(Number(p['avgMin']) / 60)} h ${Number(p['avgMin']) % 60} en moyenne`;
  if (p['name'] != null) return String(p['name']);
  if (p['label'] != null) return String(p['label']);
  return '';
}

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  template: `
    <h1>Aperçu</h1>
    @if (dashboard(); as d) {
      <div class="kpis">
        <div class="kpi">
          <div class="value">{{ d.kpis.athleteCount }}</div>
          <div class="caption">Athlètes actifs</div>
        </div>
        <div class="kpi">
          <div class="value">{{ d.kpis.sessionsDone }}/{{ d.kpis.sessionsPlanned }}</div>
          <div class="caption">Séances cette semaine</div>
        </div>
        <div class="kpi">
          <div class="value">{{ d.kpis.adherence7d != null ? d.kpis.adherence7d + ' %' : '—' }}</div>
          <div class="caption">Adhérence 7 jours</div>
        </div>
        <div class="kpi">
          <div class="value" [class.alert]="d.kpis.openAlerts > 0">{{ d.kpis.openAlerts }}</div>
          <div class="caption">À traiter</div>
        </div>
      </div>
      @if (alerts(); as alertList) {
        @if (alertList.length > 0) {
          <section class="card treat">
            <h2>À traiter</h2>
            @for (alert of alertList; track alert.id) {
              <div class="alert-row">
                <span class="status status-{{ alert.severity === 'critical' ? 'bad' : alert.severity === 'warn' ? 'warn' : 'none' }}">
                  {{ alertLabel(alert.kind) }}
                </span>
                <a class="who" [routerLink]="['/athletes', alert.athleteId]">{{ athleteName(alert.athleteId) }}</a>
                <span class="muted detail">{{ detail(alert) }}</span>
                <span class="acts">
                  <button class="btn btn-ghost small" type="button" (click)="closeAlert(alert, 'resolve')">Traité</button>
                  <button class="btn btn-ghost small" type="button" (click)="closeAlert(alert, 'dismiss')">Ignorer</button>
                </span>
              </div>
            }
          </section>
        }
      }
      <section class="card">
        <h2>Aujourd'hui</h2>
        @if (d.today.length === 0) {
          <p class="muted">Aucun athlète pour l'instant. Partagez votre code d'équipe pour inviter.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Athlète</th>
                <th>Forme</th>
                <th>Check-in</th>
                <th>Séance du jour</th>
              </tr>
            </thead>
            <tbody>
              @for (item of d.today; track item.athleteId) {
                <tr [routerLink]="['/athletes', item.athleteId]">
                  <td>{{ item.firstName }} {{ item.lastName }}</td>
                  <td><span class="status status-{{ item.formStatus }}">{{ formLabel(item.formStatus) }}</span></td>
                  <td>
                    @if (item.checkinLevel; as level) {
                      <span class="status status-{{ level }}">{{ formLabel(level) }}</span>
                    } @else {
                      <span class="muted">Pas encore</span>
                    }
                  </td>
                  <td>
                    @if (item.session; as s) {
                      {{ s.name }}
                      @if (s.status === 'completed') {
                        <span class="badge">réalisée</span>
                      }
                    } @else {
                      <span class="muted">Repos</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    } @else {
      <p class="muted">Chargement…</p>
    }
  `,
  styles: `
    .value.alert { color: var(--bad); }
    section { margin-top: 4px; }
    .treat { margin-bottom: 16px; }
    .alert-row { display: flex; align-items: center; gap: 14px; padding: 9px 0; border-bottom: 1px solid var(--line); }
    .alert-row:last-child { border-bottom: none; }
    .alert-row .status { min-width: 190px; }
    .who { font-weight: 600; min-width: 130px; }
    .detail { flex: 1; font-size: 13px; }
    .acts { display: flex; gap: 6px; }
    .small { padding: 5px 10px; font-size: 12px; }
  `,
})
export class DashboardPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly dashboard = signal<CoachDashboard | null>(null);
  readonly alerts = signal<Alert[] | null>(null);
  private names = new Map<string, string>();

  async ngOnInit(): Promise<void> {
    const [dashboard, alerts, roster] = await Promise.all([
      this.api.get<CoachDashboard>('/team/dashboard'),
      this.api.get<Page<Alert>>('/alerts'),
      this.api.get<Page<AthleteListItem>>('/athletes'),
    ]);
    this.names = new Map(roster.items.map((a) => [a.id, `${a.firstName} ${a.lastName}`]));
    this.dashboard.set(dashboard);
    this.alerts.set(alerts.items);
  }

  formLabel(status: string): string {
    return FORM_LABELS[status] ?? '—';
  }

  alertLabel(kind: string): string {
    return ALERT_LABELS[kind] ?? kind;
  }

  athleteName(id: string): string {
    return this.names.get(id) ?? '';
  }

  detail(alert: Alert): string {
    return alertDetail(alert);
  }

  async closeAlert(alert: Alert, action: 'resolve' | 'dismiss'): Promise<void> {
    await this.api.post(`/alerts/${alert.id}/${action}`);
    this.alerts.update((list) => (list ? list.filter((a) => a.id !== alert.id) : list));
  }
}
