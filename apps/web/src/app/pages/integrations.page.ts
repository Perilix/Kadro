import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { Team, TeamConnections } from '@kadro/shared';
import { ApiClient } from '../core/api-client';
import { AvatarComponent } from '../ui/avatar.component';
import { IconComponent } from '../ui/icon.component';

interface ProviderInfo {
  key: string;
  name: string;
  sub: string;
  what: string;
  available: boolean;
}

const PROVIDERS: ProviderInfo[] = [
  { key: 'strava', name: 'Strava', sub: '', what: 'Import des activités · partage des séances réalisées', available: true },
  { key: 'polar', name: 'Polar', sub: 'Flow', what: 'Séances envoyées · Nightly Recharge', available: true },
  { key: 'garmin', name: 'Garmin', sub: 'Connect', what: 'Séances envoyées sur la montre · sommeil et FC repos', available: false },
  { key: 'coros', name: 'COROS', sub: 'Training Hub', what: 'Séances envoyées sur la montre · sommeil', available: false },
  { key: 'suunto', name: 'Suunto', sub: 'App', what: 'Séances envoyées · récupération', available: false },
  { key: 'apple', name: 'Apple Watch', sub: 'Santé', what: "Import des activités et du sommeil · pas d'envoi de séance", available: false },
  { key: 'wahoo', name: 'Wahoo', sub: 'ELEMNT', what: 'Vélo · séances envoyées', available: false },
  { key: 'zwift', name: 'Zwift', sub: '', what: 'Vélo indoor · séances envoyées (.zwo)', available: false },
  { key: 'withings', name: 'Withings', sub: '', what: 'Balance · poids automatique', available: false },
];

@Component({
  selector: 'app-integrations-page',
  imports: [FormsModule, RouterLink, AvatarComponent, IconComponent],
  template: `
    <div class="row crumb">
      <a routerLink="/equipe">Équipe & réglages</a>
      <ui-icon name="chevron" [size]="14" />
      <span class="here">Intégrations</span>
    </div>
    <header class="row head">
      <div class="head-txt">
        <h1>Intégrations & montres</h1>
        <div class="muted sub">Chaque athlète connecte sa propre montre depuis son app. Vous voyez ici qui est relié, et ce qui part vers les montres.</div>
      </div>
    </header>
    @if (data(); as d) {
      <div class="kpis">
        <div class="kpi">
          <div class="value num">{{ d.kpis.athletesConnected }} / {{ d.kpis.athletesTotal }}</div>
          <div class="caption">Athlètes reliés à une montre ou un service</div>
        </div>
        <div class="kpi">
          <div class="value num" [class.warn]="d.kpis.issues > 0">{{ d.kpis.issues }}</div>
          <div class="caption">Connexions en erreur</div>
        </div>
        <div class="kpi">
          <div class="value num" [class.bad]="unconnected(d) > 0">{{ unconnected(d) }}</div>
          <div class="caption">Sans aucune connexion</div>
        </div>
        <div class="kpi">
          <div class="value num">{{ activeProviders(d) }}</div>
          <div class="caption">Services utilisés par l'équipe</div>
        </div>
      </div>
      <div class="cols">
        <section class="card providers">
          <div class="row p-head">
            <h2>Montres et services</h2>
            <span class="pill soft">{{ rows(d).length }} connecteurs</span>
          </div>
          @for (p of rows(d); track p.key) {
            <div class="row p-row">
              <span class="p-badge">{{ p.name.slice(0, 2) }}</span>
              <div class="p-txt">
                <div class="p-name">{{ p.name }} @if (p.sub) {<span class="faint p-sub">{{ p.sub }}</span>}</div>
                <div class="muted p-what">{{ p.what }}</div>
              </div>
              <span class="num muted p-count">{{ p.athleteCount > 0 ? p.athleteCount + ' athlète' + (p.athleteCount > 1 ? 's' : '') : '—' }}</span>
              @if (p.status === 'error') {
                <span class="pill err">Erreur</span>
              } @else if (p.athleteCount > 0) {
                <span class="pill done">Actif</span>
              } @else if (p.available) {
                <span class="pill soft">Disponible</span>
              } @else {
                <span class="pill soft dim">Bientôt</span>
              }
            </div>
          }
        </section>
        <aside class="col side">
          <section class="card pad">
            <h2 class="side-h">Envoi des séances</h2>
            @if (team(); as t) {
              <label class="row toggle">
                <input type="checkbox" [(ngModel)]="draftWatchPush.enabled" (ngModelChange)="savePush()" />
                Envoyer chaque séance sur la montre
              </label>
              @if (draftWatchPush.enabled) {
                <div class="row time-row">
                  <span class="muted tiny">La veille à</span>
                  <input class="input time" type="time" [(ngModel)]="draftWatchPush.sendLocalTime" (change)="savePush()" />
                  <span class="muted tiny">heure locale de l'athlète</span>
                </div>
              }
              <div class="row fact"><span class="grow">Allures et charges converties par athlète</span><ui-icon name="check" [size]="15" [sw]="2.25" style="color: var(--good)" /></div>
              <div class="row fact"><span class="grow">Import automatique du réalisé</span><ui-icon name="check" [size]="15" [sw]="2.25" style="color: var(--good)" /></div>
              @if (saved()) {
                <div class="row saved"><ui-icon name="check" [size]="14" [sw]="2.25" />Enregistré</div>
              }
            }
          </section>
          <section class="card pad">
            <h2 class="side-h">À vérifier</h2>
            @if (d.issues.length === 0) {
              <p class="muted tiny none">Rien à signaler — toutes les connexions fonctionnent.</p>
            }
            @for (issue of d.issues; track issue.athleteId + issue.provider) {
              <div class="row i-row">
                <ui-avatar [name]="issue.athleteName" [size]="30" />
                <div class="i-txt">
                  <a class="i-name" [routerLink]="['/athletes', issue.athleteId]">{{ issue.athleteName }}</a>
                  <div class="muted ellip i-what">{{ providerName(issue.provider) }} · {{ issueLabel(issue.i18nKey) }}</div>
                </div>
              </div>
            }
          </section>
        </aside>
      </div>
    } @else {
      <p class="muted">Chargement…</p>
    }
  `,
  styles: `
    .crumb { gap: 6px; font-size: 13px; color: var(--ink3); margin-bottom: 4px; }
    .crumb a { color: var(--ink2); }
    .crumb .here { color: var(--ink); }
    .head { gap: 16px; margin-bottom: 4px; }
    .head-txt { flex: 1 1 auto; }
    .sub { margin-top: 4px; }
    .value.warn { color: var(--warn); }
    .value.bad { color: var(--bad); }
    .cols { display: flex; gap: 20px; align-items: flex-start; }
    .providers { flex: 1 1 auto; min-width: 0; overflow: hidden; }
    .p-head { gap: 10px; padding: 14px 16px 10px; }
    .p-head h2 { flex: 1 1 auto; }
    .p-row { gap: 14px; padding: 12px 16px; border-top: 1px solid var(--line); }
    .p-badge { width: 40px; height: 40px; border-radius: 10px; background: var(--surface2); display: inline-flex; align-items: center; justify-content: center; color: var(--ink2); font-weight: 700; font-size: 13px; flex: 0 0 auto; }
    .p-txt { flex: 1 1 auto; min-width: 0; line-height: 1.3; }
    .p-name { font-weight: 600; font-size: 14px; }
    .p-sub { font-weight: 400; font-size: 12.5px; }
    .p-what { font-size: 12.5px; }
    .p-count { font-size: 13px; width: 100px; text-align: right; flex: 0 0 auto; }
    .pill.err { background: var(--bad-soft); color: var(--bad); }
    .pill.dim { opacity: 0.7; }
    .side { width: 360px; flex: 0 0 auto; gap: 16px; }
    .pad { padding: 16px 18px; }
    .side-h { margin-bottom: 8px; }
    .toggle { gap: 8px; font-size: 13.5px; padding: 9px 0; border-top: 1px solid var(--line); cursor: pointer; }
    .time-row { gap: 8px; padding: 4px 0 9px; }
    .time { max-width: 110px; }
    .tiny { font-size: 12.5px; }
    .fact { gap: 12px; padding: 9px 0; border-top: 1px solid var(--line); font-size: 13.5px; }
    .grow { flex: 1 1 auto; min-width: 0; }
    .saved { gap: 6px; color: var(--good); font-size: 12.5px; font-weight: 500; margin-top: 8px; }
    .none { margin: 0; }
    .i-row { gap: 10px; padding: 9px 0; border-top: 1px solid var(--line); }
    .i-txt { flex: 1 1 auto; min-width: 0; line-height: 1.3; }
    .i-name { font-weight: 500; font-size: 13.5px; color: var(--ink); }
    .i-what { font-size: 12px; }
  `,
})
export class IntegrationsPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly data = signal<TeamConnections | null>(null);
  readonly team = signal<Team | null>(null);
  readonly saved = signal(false);
  draftWatchPush = { enabled: true, sendLocalTime: '20:00' };

  readonly rows = (d: TeamConnections) => {
    const live = new Map<string, TeamConnections['providers'][number]>(d.providers.map((p) => [p.provider, p]));
    return PROVIDERS.map((p) => ({
      ...p,
      athleteCount: live.get(p.key)?.athleteCount ?? 0,
      status: live.get(p.key)?.status ?? 'ok',
    })).sort((a, b) => b.athleteCount - a.athleteCount || Number(b.available) - Number(a.available));
  };

  async ngOnInit(): Promise<void> {
    const [data, team] = await Promise.all([
      this.api.get<TeamConnections>('/team/connections'),
      this.api.get<Team>('/team'),
    ]);
    this.data.set(data);
    this.team.set(team);
    this.draftWatchPush = { enabled: team.watchPush.enabled, sendLocalTime: team.watchPush.sendLocalTime };
  }

  unconnected(d: TeamConnections): number {
    return Math.max(0, d.kpis.athletesTotal - d.kpis.athletesConnected);
  }

  activeProviders(d: TeamConnections): number {
    return d.providers.filter((p) => p.athleteCount > 0).length;
  }

  providerName(key: string): string {
    return PROVIDERS.find((p) => p.key === key)?.name ?? key;
  }

  issueLabel(key: string): string {
    return key === 'connection.token_refresh_failed' ? 'Reconnexion nécessaire' : 'Erreur de connexion';
  }

  async savePush(): Promise<void> {
    const team = await this.api.patch<Team>('/team', {
      watchPush: { enabled: this.draftWatchPush.enabled, sendLocalTime: this.draftWatchPush.sendLocalTime },
    });
    this.team.set(team);
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }
}
