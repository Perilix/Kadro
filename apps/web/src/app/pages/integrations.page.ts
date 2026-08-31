import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { TeamConnections } from '@kadro/shared';
import { ApiClient } from '../core/api-client';

const PROVIDER_LABELS: Record<string, string> = {
  garmin: 'Garmin',
  coros: 'COROS',
  polar: 'Polar',
  suunto: 'Suunto',
  apple: 'Apple Santé',
  wahoo: 'Wahoo',
  strava: 'Strava',
  zwift: 'Zwift',
  withings: 'Withings',
};

@Component({
  selector: 'app-integrations-page',
  imports: [RouterLink],
  template: `
    <h1>Intégrations & montres</h1>
    @if (data(); as d) {
      <div class="kpis">
        <div class="kpi">
          <div class="value">{{ d.kpis.athletesConnected }}/{{ d.kpis.athletesTotal }}</div>
          <div class="caption">Athlètes avec une montre reliée</div>
        </div>
        <div class="kpi">
          <div class="value" [class.alert]="d.kpis.issues > 0">{{ d.kpis.issues }}</div>
          <div class="caption">Connexions en erreur</div>
        </div>
      </div>
      <section class="card">
        <h2>Fournisseurs</h2>
        @if (d.providers.length === 0) {
          <p class="muted">
            Aucune montre reliée pour l'instant. Vos athlètes se connectent depuis leur app
            (Profil → Montres & connexions) — Strava et Polar sont disponibles, Garmin, COROS et
            Suunto arrivent.
          </p>
        } @else {
          <table class="table">
            <thead>
              <tr><th>Fournisseur</th><th>Athlètes</th><th>État</th></tr>
            </thead>
            <tbody>
              @for (p of d.providers; track p.provider) {
                <tr>
                  <td><strong>{{ providerLabel(p.provider) }}</strong></td>
                  <td>{{ p.athleteCount }}</td>
                  <td>
                    <span class="status status-{{ p.status === 'ok' ? 'good' : 'bad' }}">
                      {{ p.status === 'ok' ? 'Opérationnel' : 'Erreur' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
      @if (d.issues.length > 0) {
        <section class="card issues">
          <h2>À vérifier</h2>
          @for (issue of d.issues; track issue.athleteId + issue.provider) {
            <div class="issue">
              <a [routerLink]="['/athletes', issue.athleteId]"><strong>{{ issue.athleteName }}</strong></a>
              <span>{{ providerLabel(issue.provider) }}</span>
              <span class="muted">{{ issue.i18nKey === 'connection.token_refresh_failed' ? 'Reconnexion nécessaire' : 'Erreur de connexion' }}</span>
            </div>
          }
        </section>
      }
    } @else {
      <p class="muted">Chargement…</p>
    }
  `,
  styles: `
    .value.alert { color: var(--bad); }
    
    
    .issue { display: flex; gap: 16px; align-items: baseline; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 14px; }
    .issue:last-child { border-bottom: none; }
    .table tbody tr { cursor: default; }
    .table tbody tr:hover { background: transparent; }
  `,
})
export class IntegrationsPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly data = signal<TeamConnections | null>(null);

  async ngOnInit(): Promise<void> {
    this.data.set(await this.api.get<TeamConnections>('/team/connections'));
  }

  providerLabel(provider: string): string {
    return PROVIDER_LABELS[provider] ?? provider;
  }
}
