import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CoachDashboard } from '@kadro/shared';
import { ApiClient } from '../core/api-client';

const FORM_LABELS: Record<string, string> = {
  good: 'En forme',
  warn: 'À surveiller',
  bad: 'Signal rouge',
  none: '—',
};

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
  `,
})
export class DashboardPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly dashboard = signal<CoachDashboard | null>(null);

  async ngOnInit(): Promise<void> {
    this.dashboard.set(await this.api.get<CoachDashboard>('/team/dashboard'));
  }

  formLabel(status: string): string {
    return FORM_LABELS[status] ?? '—';
  }
}
