import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type {
  AthleteListItem,
  Billing,
  CheckoutUrl,
  Group,
  Invitation,
  InviteCodeInfo,
  Page,
  Team,
} from '@kadro/shared';
import { ApiClient, ApiError } from '../core/api-client';
import { AvatarComponent } from '../ui/avatar.component';
import { IconComponent } from '../ui/icon.component';

const PLAN_LABELS: Record<string, string> = {
  trial: 'Essai gratuit',
  solo: 'Solo',
  coach: 'Coach',
  structure: 'Structure',
};

const STATUS_LABELS: Record<string, string> = {
  trialing: "en période d'essai",
  active: 'actif',
  past_due: 'paiement requis',
  canceled: 'résilié',
};

@Component({
  selector: 'app-team-page',
  imports: [FormsModule, RouterLink, AvatarComponent, IconComponent],
  template: `
    <header class="row head">
      <div class="head-txt">
        <h1>Équipe & réglages</h1>
        <div class="muted sub">Invitations, groupes, abonnement et alertes</div>
      </div>
    </header>
    @if (billingNotice()) {
      <p class="row notice"><ui-icon name="check" [size]="16" [sw]="2.25" />{{ billingNotice() }}</p>
    }
    <div class="grid">
      <section class="card pad col gap">
        <div>
          <h2>Inviter des athlètes</h2>
          <div class="muted tiny top2">L'athlète installe l'app, entre le code, et apparaît dans votre liste.</div>
        </div>
        @if (invite(); as info) {
          <div class="row inv-main">
            <div class="qr"><ui-icon name="qr" [size]="48" [sw]="1.5" /></div>
            <div class="col inv-right">
              <div class="col code-block">
                <span class="label">Code coach</span>
                <div class="row code-row">
                  <span class="num code">{{ info.code }}</span>
                  <button class="icon-btn sm" type="button" (click)="rotate()" title="Régénérer"><ui-icon name="sync" [size]="15" /></button>
                </div>
              </div>
              <div class="row link-row">
                <div class="input link-box"><ui-icon name="link" [size]="16" /><span class="ellip">{{ shortUrl(info.joinUrl) }}</span></div>
                <button class="btn small" type="button" (click)="copy(info.joinUrl)">{{ copied() ? 'Copié ✓' : 'Copier' }}</button>
              </div>
            </div>
          </div>
        }
        <form class="row mail-form" (ngSubmit)="sendInvitation()">
          <input class="input" name="invEmail" type="email" [(ngModel)]="invEmail" placeholder="E-mail de l'athlète" />
          <button class="btn primary" type="submit" [disabled]="!invEmail.trim()">Inviter</button>
        </form>
        @if (invError()) {
          <p class="error">{{ invError() }}</p>
        }
        @for (inv of invitations(); track inv.id) {
          <div class="row setting">
            <span class="grow ellip">{{ inv.email }}</span>
            <span class="muted">{{ inv.status === 'accepted' ? 'A rejoint' : 'En attente' }}</span>
            @if (inv.status === 'pending') {
              <button class="btn small" type="button" (click)="remind(inv)">Relancer</button>
              <button class="icon-btn sm" type="button" (click)="revoke(inv)" title="Révoquer"><ui-icon name="x" [size]="14" /></button>
            }
          </div>
        }
      </section>

      <section class="card pad">
        <div class="row card-head"><h2>Groupes</h2></div>
        @for (g of groups(); track g.id) {
          <div class="row setting">
            <div class="grow">
              <div class="strong">{{ g.name }}</div>
              <div class="faint tiny">{{ membersOf(g.id).length }} athlète{{ membersOf(g.id).length > 1 ? 's' : '' }}</div>
            </div>
            <div class="row stack">
              @for (m of membersOf(g.id).slice(0, 3); track m.id; let i = $index) {
                <span class="stacked" [style.margin-left.px]="i ? -8 : 0"><ui-avatar [name]="m.firstName + ' ' + m.lastName" [size]="28" /></span>
              }
            </div>
            <button class="icon-btn sm" type="button" (click)="deleteGroup(g)" title="Supprimer"><ui-icon name="x" [size]="14" /></button>
          </div>
        }
        <form class="row mail-form top" (ngSubmit)="createGroup()">
          <input class="input" name="groupDraft" [(ngModel)]="groupDraft" placeholder="Nouveau groupe (Marathon, Trail…)" />
          <button class="btn" type="submit" [disabled]="!groupDraft.trim()">Créer</button>
        </form>
        <p class="faint tiny top2">Rattachez les athlètes à un groupe depuis leur fiche.</p>
      </section>

      <section class="card pad">
        <div class="row card-head"><h2>Abonnement</h2>
          @if (billing(); as b) {
            <span class="pill accent">{{ planLabel(b.plan) }}</span>
          }
        </div>
        @if (billing(); as b) {
          <div class="row metrics">
            <div class="metric col"><span class="faint tiny">Athlètes</span><span class="num m-val">{{ b.athleteCount }} <span class="of">/ {{ b.athleteLimit }}</span></span></div>
            <div class="metric col"><span class="faint tiny">Statut</span><span class="m-val">{{ statusLabel(b.status) }}</span></div>
            <div class="metric col"><span class="faint tiny">{{ b.plan === 'trial' ? "Fin d'essai" : 'Renouvellement' }}</span><span class="num m-val">{{ periodLabel(b) }}</span></div>
          </div>
          <div class="meter"><div [style.width.%]="usagePct(b)" style="background: var(--ink)"></div></div>
          <div class="plans">
            @for (p of b.amounts; track p.plan) {
              <div class="plan col" [class.current]="p.plan === b.plan">
                <div class="p-name">{{ planLabel(p.plan) }}</div>
                <div class="num p-price">{{ yearly ? p.yearlyEurHt + ' €/an' : p.monthlyEurHt + ' €/mois' }} <span class="faint ht">HT</span></div>
                <div class="faint p-desc">{{ p.athleteLimit }} athlètes{{ p.coachLimit > 1 ? ' · ' + p.coachLimit + ' coachs' : '' }}</div>
                @if (b.checkoutAvailable && p.plan !== b.plan) {
                  <button class="btn small" type="button" [disabled]="busy()" (click)="checkout(p.plan)">Choisir</button>
                }
              </div>
            }
          </div>
          <label class="row toggle">
            <input type="checkbox" [(ngModel)]="yearly" />
            Facturation annuelle <span class="pill accent">2 mois offerts</span>
          </label>
          @if (b.plan !== 'trial' && b.checkoutAvailable) {
            <button class="btn small top" type="button" (click)="portal()">Gérer mon abonnement · factures, carte</button>
          }
          <div class="row setting top">
            <span class="grow">Le détail des offres et ce qui est inclus</span>
            <a class="btn small" routerLink="/tarifs">Voir les tarifs</a>
          </div>
          @if (!b.checkoutAvailable) {
            <p class="faint tiny top2">Le paiement en ligne arrive — l'essai continue en attendant.</p>
          }
        }
      </section>

      <section class="card pad">
        <div class="row card-head"><h2>Alertes & envoi montre</h2></div>
        @if (team(); as t) {
          <label class="label">Nom de l'équipe</label>
          <input class="input field" [(ngModel)]="draftName" />
          <div class="th-grid">
            <div><label class="label">Jours « rouges » avant alerte</label><input class="input" type="number" min="1" max="14" [(ngModel)]="draftThresholds.redFeelingStreakDays" /></div>
            <div><label class="label">Jours sans activité</label><input class="input" type="number" min="1" max="30" [(ngModel)]="draftThresholds.noActivityDays" /></div>
            <div><label class="label">Jours sans check-in</label><input class="input" type="number" min="1" max="30" [(ngModel)]="draftThresholds.noCheckinDays" /></div>
            <div><label class="label">Ratio aigu/chronique max</label><input class="input" type="number" step="0.1" min="0.8" max="2.5" [(ngModel)]="draftThresholds.acuteChronicMax" /></div>
          </div>
          <label class="row toggle">
            <input type="checkbox" [(ngModel)]="draftWatchPush.enabled" />
            Envoyer les séances sur les montres
          </label>
          @if (draftWatchPush.enabled) {
            <div class="row time-row">
              <span class="muted tiny">La veille à</span>
              <input class="input time" type="time" [(ngModel)]="draftWatchPush.sendLocalTime" />
              <span class="muted tiny">heure locale de l'athlète</span>
            </div>
          }
          <div class="row setting top">
            <span class="grow">Intégrations & montres</span>
            <a class="btn small" routerLink="/integrations">Gérer</a>
          </div>
          <div class="row save">
            @if (saved()) {
              <span class="row saved"><ui-icon name="check" [size]="15" [sw]="2.25" />Enregistré</span>
            }
            <button class="btn primary" type="button" [disabled]="busy()" (click)="saveSettings()">Enregistrer</button>
          </div>
        }
      </section>
    </div>
  `,
  styles: `
    .head-txt { flex: 1 1 auto; }
    .sub { margin-top: 4px; }
    .notice { gap: 8px; margin: 0; color: var(--good); font-weight: 500; font-size: 13.5px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; align-items: start; }
    .pad { padding: 18px 20px; }
    .gap { gap: 14px; }
    .card-head { gap: 10px; margin-bottom: 10px; }
    .card-head h2 { flex: 1 1 auto; }
    .tiny { font-size: 12.5px; }
    .top2 { margin-top: 2px; }
    .inv-main { gap: 14px; align-items: flex-start; }
    .qr { width: 96px; height: 96px; border-radius: 12px; border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; color: var(--ink2); flex: 0 0 auto; }
    .inv-right { gap: 8px; flex: 1 1 auto; min-width: 0; }
    .code-block { gap: 4px; }
    .code-row { gap: 8px; }
    .code { font-size: 26px; font-weight: 600; letter-spacing: 0.08em; }
    .icon-btn.sm { width: 32px; height: 32px; border: none; background: transparent; }
    .icon-btn.sm:hover { color: var(--bad); }
    .link-row { gap: 8px; }
    .link-box { flex: 1 1 auto; height: 36px; font-size: 13px; color: var(--ink2); min-width: 0; }
    .mail-form { gap: 8px; }
    .mail-form.top { margin-top: 8px; }
    .setting { gap: 12px; padding: 12px 0; border-top: 1px solid var(--line); font-size: 13.5px; }
    .setting.top { margin-top: 12px; }
    .grow { flex: 1 1 auto; min-width: 0; }
    .strong { font-weight: 500; }
    .stack { flex: 0 0 auto; }
    .stacked { border: 2px solid var(--surface); border-radius: 99px; display: inline-flex; }
    .metrics { gap: 16px; padding: 6px 0 12px; }
    .metric { gap: 3px; flex: 1 1 0; }
    .m-val { font-size: 17px; font-weight: 600; }
    .of { font-size: 12px; font-weight: 500; color: var(--ink3); }
    .plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px; }
    .plan { border: 1px solid var(--line); border-radius: 10px; padding: 12px; gap: 4px; }
    .plan.current { border-color: var(--accent); }
    .p-name { font-weight: 600; font-size: 13.5px; }
    .p-price { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
    .ht { font-size: 11px; font-weight: 400; }
    .p-desc { font-size: 11.5px; flex: 1 1 auto; }
    .toggle { gap: 8px; font-size: 13.5px; margin-top: 12px; cursor: pointer; }
    .top { margin-top: 12px; }
    .field { max-width: 300px; margin-bottom: 6px; }
    .th-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; margin-top: 10px; }
    .th-grid .label { display: block; margin-bottom: 4px; }
    .time-row { gap: 8px; margin-top: 8px; }
    .time { max-width: 120px; }
    .save { justify-content: flex-end; gap: 12px; margin-top: 16px; }
    .saved { gap: 6px; color: var(--good); font-size: 13px; font-weight: 500; }
  `,
})
export class TeamPage implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly route = inject(ActivatedRoute);

  readonly billing = signal<Billing | null>(null);
  readonly team = signal<Team | null>(null);
  readonly invite = signal<InviteCodeInfo | null>(null);
  readonly invitations = signal<Invitation[]>([]);
  readonly groups = signal<Group[]>([]);
  readonly roster = signal<AthleteListItem[]>([]);
  readonly busy = signal(false);
  readonly saved = signal(false);
  readonly copied = signal(false);
  readonly invError = signal<string | null>(null);
  readonly billingNotice = signal<string | null>(null);

  yearly = false;
  invEmail = '';
  groupDraft = '';
  draftName = '';
  draftThresholds = { redFeelingStreakDays: 2, noActivityDays: 3, noCheckinDays: 7, acuteChronicMax: 1.3 };
  draftWatchPush = { enabled: true, sendLocalTime: '20:00' };

  async ngOnInit(): Promise<void> {
    if (this.route.snapshot.queryParamMap.get('billing') === 'success') {
      this.billingNotice.set('Paiement confirmé — votre abonnement est actif.');
    }
    const [billing, team, invite, invitations, groups, roster] = await Promise.all([
      this.api.get<Billing>('/billing'),
      this.api.get<Team>('/team'),
      this.api.get<InviteCodeInfo>('/team/invite-code'),
      this.api.get<Invitation[]>('/team/invitations'),
      this.api.get<Group[]>('/groups'),
      this.api.get<Page<AthleteListItem>>('/athletes?limit=100'),
    ]);
    this.billing.set(billing);
    this.team.set(team);
    this.invite.set(invite);
    this.invitations.set(invitations);
    this.groups.set(groups);
    this.roster.set(roster.items);
    this.draftName = team.name;
    this.draftThresholds = {
      redFeelingStreakDays: team.alertDefaults.redFeelingStreakDays,
      noActivityDays: team.alertDefaults.noActivityDays,
      noCheckinDays: team.alertDefaults.noCheckinDays,
      acuteChronicMax: team.alertDefaults.acuteChronicMax,
    };
    this.draftWatchPush = { enabled: team.watchPush.enabled, sendLocalTime: team.watchPush.sendLocalTime };
  }

  planLabel(plan: string): string {
    return PLAN_LABELS[plan] ?? plan;
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  periodLabel(b: Billing): string {
    const iso = b.plan === 'trial' ? b.trialEndsAt : b.currentPeriodEnd;
    if (!iso) return '—';
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(iso));
  }

  usagePct(b: Billing): number {
    return Math.min(100, Math.round((b.athleteCount / Math.max(1, b.athleteLimit)) * 100));
  }

  shortUrl(url: string): string {
    return url.replace(/^https?:\/\//, '');
  }

  membersOf(groupId: string): AthleteListItem[] {
    return this.roster().filter((a) => a.groupIds.includes(groupId));
  }

  async checkout(plan: 'solo' | 'coach' | 'structure'): Promise<void> {
    this.busy.set(true);
    try {
      const { url } = await this.api.post<CheckoutUrl>('/billing/checkout', {
        plan,
        interval: this.yearly ? 'year' : 'month',
      });
      window.location.href = url;
    } finally {
      this.busy.set(false);
    }
  }

  async portal(): Promise<void> {
    const { url } = await this.api.post<CheckoutUrl>('/billing/portal');
    window.location.href = url;
  }

  async copy(url: string): Promise<void> {
    await navigator.clipboard.writeText(url);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  async rotate(): Promise<void> {
    this.invite.set(await this.api.post<InviteCodeInfo>('/team/invite-code/rotate'));
  }

  async sendInvitation(): Promise<void> {
    this.invError.set(null);
    try {
      const invitation = await this.api.post<Invitation>('/team/invitations', { email: this.invEmail.trim() });
      this.invitations.update((list) => [invitation, ...list]);
      this.invEmail = '';
    } catch (err) {
      this.invError.set(
        err instanceof ApiError && err.code === 'invite.already_sent'
          ? 'Une invitation existe déjà pour cet e-mail.'
          : "Invitation impossible. Vérifiez l'adresse.",
      );
    }
  }

  async remind(invitation: Invitation): Promise<void> {
    await this.api.post(`/team/invitations/${invitation.id}/remind`);
  }

  async revoke(invitation: Invitation): Promise<void> {
    await this.api.delete(`/team/invitations/${invitation.id}`);
    this.invitations.update((list) => list.filter((i) => i.id !== invitation.id));
  }

  async createGroup(): Promise<void> {
    const name = this.groupDraft.trim();
    if (!name) return;
    const group = await this.api.post<Group>('/groups', { name });
    this.groups.update((list) => [...list, group]);
    this.groupDraft = '';
  }

  async deleteGroup(group: Group): Promise<void> {
    await this.api.delete(`/groups/${group.id}`);
    this.groups.update((list) => list.filter((g) => g.id !== group.id));
  }

  async saveSettings(): Promise<void> {
    this.busy.set(true);
    try {
      const team = await this.api.patch<Team>('/team', {
        name: this.draftName.trim(),
        alertDefaults: {
          redFeelingStreakDays: Number(this.draftThresholds.redFeelingStreakDays),
          noActivityDays: Number(this.draftThresholds.noActivityDays),
          noCheckinDays: Number(this.draftThresholds.noCheckinDays),
          acuteChronicMax: Number(this.draftThresholds.acuteChronicMax),
        },
        watchPush: { enabled: this.draftWatchPush.enabled, sendLocalTime: this.draftWatchPush.sendLocalTime },
      });
      this.team.set(team);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2500);
    } finally {
      this.busy.set(false);
    }
  }
}
