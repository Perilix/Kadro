import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { AuthorizeUrl, Connection } from '@kadro/shared';
import { ApiClient, ApiError } from '../core/api-client';
import { AuthStore } from '../core/auth-store';

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
  selector: 'app-me-profile-page',
  template: `
    <h1>Profil</h1>
    <section class="card">
      <strong>{{ auth.user()?.firstName }} {{ auth.user()?.lastName }}</strong>
      <p class="muted">{{ auth.user()?.email }}</p>
    </section>
    <section class="card">
      <h2>Montres & connexions</h2>
      @if (justConnected()) {
        <p class="status status-good">Strava connecté — vos activités s'importent.</p>
      }
      @for (c of connections(); track c.provider) {
        <div class="conn">
          <div>
            <strong>{{ providerLabel(c.provider) }}</strong>
            <span class="status status-{{ c.status === 'connected' ? 'good' : 'bad' }}">
              {{ c.status === 'connected' ? 'Connecté' : 'Erreur' }}
            </span>
          </div>
          <button class="btn btn-ghost" type="button" (click)="disconnect(c.provider)">Déconnecter</button>
        </div>
      }
      @if (!hasStrava()) {
        <button class="btn strava" type="button" (click)="connectStrava()">Connecter Strava</button>
      }
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
      <p class="muted small">Garmin, COROS, Polar et Suunto arrivent bientôt.</p>
    </section>
  `,
  styles: `
    section { margin-bottom: 16px; }
    section p { margin: 6px 0 0; }
    .conn { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--line); }
    .conn:last-of-type { border-bottom: none; }
    .conn .status { margin-left: 12px; }
    .conn .btn { font-size: 13px; padding: 6px 12px; }
    .strava { margin-top: 12px; }
    .small { font-size: 12px; margin-top: 12px; }
  `,
})
export class MeProfilePage implements OnInit {
  readonly auth = inject(AuthStore);
  private readonly api = inject(ApiClient);
  private readonly route = inject(ActivatedRoute);

  readonly connections = signal<Connection[]>([]);
  readonly error = signal<string | null>(null);
  readonly justConnected = signal(false);

  async ngOnInit(): Promise<void> {
    this.justConnected.set(this.route.snapshot.queryParamMap.get('status') === 'connected');
    await this.load();
  }

  providerLabel(provider: string): string {
    return PROVIDER_LABELS[provider] ?? provider;
  }

  hasStrava(): boolean {
    return this.connections().some((c) => c.provider === 'strava');
  }

  async connectStrava(): Promise<void> {
    this.error.set(null);
    try {
      const { url } = await this.api.get<AuthorizeUrl>('/connections/strava/authorize?platform=web');
      window.location.href = url;
    } catch (err) {
      this.error.set(
        err instanceof ApiError && err.code === 'connection.provider_not_configured'
          ? "Strava n'est pas configuré côté serveur."
          : 'Connexion à Strava impossible pour le moment.',
      );
    }
  }

  async disconnect(provider: string): Promise<void> {
    await this.api.delete(`/me/connections/${provider}`);
    await this.load();
  }

  private async load(): Promise<void> {
    this.connections.set(await this.api.get<Connection[]>('/me/connections'));
  }
}
