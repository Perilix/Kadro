import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { Athlete, AuthorizeUrl, Connection } from '@kadro/shared';
import { ApiClient, ApiError } from '../core/api-client';
import { AuthStore } from '../core/auth-store';
import { AvatarComponent } from '../ui/avatar.component';
import { IconComponent } from '../ui/icon.component';

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
  imports: [AvatarComponent, IconComponent],
  template: `
    <header class="row head">
      <ui-avatar [name]="fullName()" [size]="56" />
      <div class="grow head-txt">
        <h1 class="p-name">{{ fullName() }}</h1>
        <div class="muted sub">Coaché·e par {{ auth.athlete()?.coachName || 'votre coach' }}</div>
      </div>
    </header>
    <div class="row chips">
      <div class="mchip col"><span class="faint tiny">VMA</span><span class="num m-val">{{ me()?.profile?.vmaKmh != null ? frNum(me()!.profile.vmaKmh!) + ' km/h' : '—' }}</span></div>
      <div class="mchip col"><span class="faint tiny">FC max</span><span class="num m-val">{{ me()?.profile?.hrMaxBpm ?? '—' }}</span></div>
      <div class="mchip col"><span class="faint tiny">Poids</span><span class="num m-val">{{ me()?.profile?.weightKg != null ? me()!.profile.weightKg + ' kg' : '—' }}</span></div>
    </div>

    @if (justConnected()) {
      <p class="row ok"><ui-icon name="check" [size]="16" [sw]="2.25" />Montre connectée — tes activités s'importent.</p>
    }

    @if (me()?.goal; as g) {
      <section class="card">
        <div class="label g-label">Objectif</div>
        <div class="row prow">
          <span class="grow">{{ g.label }}</span>
          <span class="muted num">{{ g.date ? frDate(g.date) : '' }}{{ g.targetTime ? ' · ' + g.targetTime : '' }}</span>
        </div>
      </section>
    }

    <section class="card">
      <div class="label g-label">Connexions</div>
      @for (c of connections(); track c.provider) {
        <div class="row prow">
          <span class="grow">{{ providerLabel(c.provider) }}</span>
          @if (c.deviceName) {
            <span class="muted">{{ c.deviceName }}</span>
          }
          <span class="pill" [class]="c.status === 'connected' ? 'pill done' : 'pill soft'">
            @if (c.status === 'connected') {
              <ui-icon name="check" [size]="13" [sw]="2.25" />Connecté
            } @else {
              Erreur
            }
          </span>
          <button class="icon-btn sm" type="button" (click)="disconnect(c.provider)" title="Déconnecter"><ui-icon name="x" [size]="14" /></button>
        </div>
      }
      <div class="row prow connect-row">
        @if (!has('strava')) {
          <button class="btn small" type="button" (click)="connect('strava')"><ui-icon name="plus" [size]="15" />Strava</button>
        }
        @if (!has('polar')) {
          <button class="btn small" type="button" (click)="connect('polar')"><ui-icon name="plus" [size]="15" />Polar</button>
        }
        <span class="faint tiny">Garmin, COROS et Suunto arrivent.</span>
      </div>
      @if (error()) {
        <p class="error pad-b">{{ error() }}</p>
      }
    </section>

    <section class="card">
      <div class="label g-label">Compte</div>
      <div class="row prow"><span class="grow">E-mail</span><span class="muted">{{ auth.user()?.email }}</span></div>
      <div class="row prow"><span class="grow">Jours disponibles</span><span class="muted">{{ availableDays() }}</span></div>
    </section>
  `,
  styles: `
    .head { gap: 14px; }
    .grow { flex: 1 1 auto; min-width: 0; }
    .p-name { font-size: 22px; }
    .sub { font-size: 13px; margin-top: 3px; }
    .chips { gap: 8px; }
    .mchip { flex: 1 1 0; padding: 10px 12px; border-radius: 10px; background: var(--surface2); gap: 2px; }
    .tiny { font-size: 12.5px; }
    .m-val { font-size: 16px; font-weight: 600; }
    .ok { gap: 8px; margin: 0; color: var(--good); font-weight: 500; font-size: 13.5px; }
    .g-label { padding: 12px 16px 6px; }
    .prow { gap: 12px; min-height: 50px; padding: 6px 16px; border-top: 1px solid var(--line); font-size: 14px; }
    .connect-row { gap: 10px; }
    .icon-btn.sm { width: 32px; height: 32px; border: none; background: transparent; }
    .icon-btn.sm:hover { color: var(--bad); }
    .error.pad-b { padding: 0 16px 12px; margin: 0; }
  `,
})
export class MeProfilePage implements OnInit {
  readonly auth = inject(AuthStore);
  private readonly api = inject(ApiClient);
  private readonly route = inject(ActivatedRoute);

  readonly connections = signal<Connection[]>([]);
  readonly me = signal<Athlete | null>(null);
  readonly error = signal<string | null>(null);
  readonly justConnected = signal(false);

  readonly availableDays = computed(() => {
    const days = this.me()?.profile.availableDays ?? [];
    if (days.length === 0) return '—';
    const names = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return days.map((d) => names[d]).join(' · ');
  });

  fullName(): string {
    const u = this.auth.user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  }

  async ngOnInit(): Promise<void> {
    this.justConnected.set(this.route.snapshot.queryParamMap.get('status') === 'connected');
    const [connections, me] = await Promise.all([
      this.api.get<Connection[]>('/me/connections'),
      this.api.get<Athlete>('/me/profile').catch(() => null),
    ]);
    this.connections.set(connections);
    this.me.set(me);
  }

  providerLabel(provider: string): string {
    return PROVIDER_LABELS[provider] ?? provider;
  }

  has(provider: string): boolean {
    return this.connections().some((c) => c.provider === provider);
  }

  frNum(value: number): string {
    return String(value).replace('.', ',');
  }

  frDate(ymd: string): string {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(`${ymd}T12:00:00Z`),
    );
  }

  async connect(provider: string): Promise<void> {
    this.error.set(null);
    try {
      const { url } = await this.api.get<AuthorizeUrl>(`/connections/${provider}/authorize?platform=web`);
      window.location.href = url;
    } catch (err) {
      this.error.set(
        err instanceof ApiError && err.code === 'connection.provider_not_configured'
          ? `${this.providerLabel(provider)} n'est pas encore configuré côté serveur.`
          : `Connexion à ${this.providerLabel(provider)} impossible pour le moment.`,
      );
    }
  }

  async disconnect(provider: string): Promise<void> {
    await this.api.delete(`/me/connections/${provider}`);
    this.connections.update((list) => list.filter((c) => c.provider !== provider));
  }
}
