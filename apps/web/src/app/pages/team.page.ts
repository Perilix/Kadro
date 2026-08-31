import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import type {
  Billing,
  CheckoutUrl,
  Invitation,
  InviteCodeInfo,
  Team,
} from '@kadro/shared';
import { ApiClient, ApiError } from '../core/api-client';

const PLAN_LABELS: Record<string, string> = {
  trial: 'Essai gratuit',
  solo: 'Solo',
  coach: 'Coach',
  structure: 'Structure',
};

const STATUS_LABELS: Record<string, string> = {
  trialing: "En période d'essai",
  active: 'Actif',
  past_due: 'Paiement requis',
  canceled: 'Résilié',
};

@Component({
  selector: 'app-team-page',
  imports: [FormsModule],
  template: `
    <h1>Équipe & réglages</h1>

    @if (billingNotice()) {
      <p class="status status-good notice">{{ billingNotice() }}</p>
    }

    <section class="card">
      <h2>Abonnement</h2>
      @if (billing(); as b) {
        <div class="sub-head">
          <div>
            <strong>{{ planLabel(b.plan) }}</strong>
            <span class="status status-{{ b.status === 'active' || b.status === 'trialing' ? 'good' : 'bad' }}">
              {{ statusLabel(b.status) }}
            </span>
          </div>
          <span class="muted">
            {{ b.athleteCount }}/{{ b.athleteLimit }} athlètes
            @if (b.trialEndsAt && b.plan === 'trial') {
              · essai jusqu'au {{ b.trialEndsAt.slice(0, 10) }}
            }
            @if (b.currentPeriodEnd) {
              · renouvellement le {{ b.currentPeriodEnd.slice(0, 10) }}
            }
          </span>
        </div>
        @if (b.plan !== 'trial' && b.checkoutAvailable) {
          <button class="btn btn-ghost" type="button" (click)="portal()">Gérer mon abonnement</button>
        }
        <div class="plans">
          @for (p of b.amounts; track p.plan) {
            <div class="plan" [class.current]="p.plan === b.plan">
              <div class="p-name">{{ planLabel(p.plan) }}</div>
              <div class="p-price">
                {{ yearly ? p.yearlyEurHt + ' €/an' : p.monthlyEurHt + ' €/mois' }}
                <span class="muted ht">HT</span>
              </div>
              <div class="muted p-desc">
                {{ p.athleteLimit }} athlètes{{ p.coachLimit > 1 ? ' · ' + p.coachLimit + ' coachs' : '' }}
                · +{{ p.extraAthleteEurHt }} €/athlète au-delà
              </div>
              @if (b.checkoutAvailable && p.plan !== b.plan) {
                <button class="btn" type="button" [disabled]="busy()" (click)="checkout(p.plan)">Choisir</button>
              }
            </div>
          }
        </div>
        <label class="toggle">
          <input type="checkbox" [(ngModel)]="yearly" />
          Facturation annuelle <span class="badge">2 mois offerts</span>
        </label>
        @if (!b.checkoutAvailable) {
          <p class="muted small">Le paiement en ligne sera activé prochainement — l'essai continue en attendant.</p>
        }
      } @else {
        <p class="muted">Chargement…</p>
      }
    </section>

    <section class="card">
      <h2>Inviter des athlètes</h2>
      @if (invite(); as info) {
        <div class="code-row">
          <span>Code d'équipe : <span class="badge big">{{ info.code }}</span></span>
          <button class="btn btn-ghost" type="button" (click)="copy(info.joinUrl)">
            {{ copied() ? 'Lien copié ✓' : "Copier le lien d'invitation" }}
          </button>
          <button class="btn btn-ghost" type="button" (click)="rotate()">Régénérer le code</button>
        </div>
      }
      <form class="inv-form" (ngSubmit)="sendInvitation()">
        <input class="input" name="invEmail" type="email" [(ngModel)]="invEmail" placeholder="E-mail de l'athlète" />
        <button class="btn" type="submit" [disabled]="!invEmail.trim()">Inviter par e-mail</button>
      </form>
      @if (invError()) {
        <p class="error">{{ invError() }}</p>
      }
      @for (inv of invitations(); track inv.id) {
        <div class="inv">
          <span class="i-mail">{{ inv.email }}</span>
          <span class="status status-{{ inv.status === 'accepted' ? 'good' : 'none' }}">
            {{ inv.status === 'accepted' ? 'A rejoint' : 'En attente' }}
          </span>
          @if (inv.status === 'pending') {
            <button class="link-btn" type="button" (click)="remind(inv)">Relancer</button>
            <button class="link-btn danger" type="button" (click)="revoke(inv)">Révoquer</button>
          }
        </div>
      }
    </section>

    <section class="card">
      <h2>Réglages</h2>
      @if (team(); as t) {
        <label class="label">Nom de l'équipe</label>
        <input class="input settings-input" [(ngModel)]="draftName" />
        <div class="th-grid">
          <div>
            <label class="label">Jours « rouges » consécutifs avant alerte</label>
            <input class="input" type="number" min="1" max="14" [(ngModel)]="draftThresholds.redFeelingStreakDays" />
          </div>
          <div>
            <label class="label">Jours sans activité avant alerte</label>
            <input class="input" type="number" min="1" max="30" [(ngModel)]="draftThresholds.noActivityDays" />
          </div>
          <div>
            <label class="label">Jours sans check-in avant alerte</label>
            <input class="input" type="number" min="1" max="30" [(ngModel)]="draftThresholds.noCheckinDays" />
          </div>
          <div>
            <label class="label">Ratio aigu/chronique max</label>
            <input class="input" type="number" step="0.1" min="0.8" max="2.5" [(ngModel)]="draftThresholds.acuteChronicMax" />
          </div>
        </div>
        <label class="toggle">
          <input type="checkbox" [(ngModel)]="draftWatchPush.enabled" />
          Envoyer les séances sur les montres
        </label>
        @if (draftWatchPush.enabled) {
          <label class="label">Heure d'envoi (la veille, heure locale de l'athlète)</label>
          <input class="input settings-input" type="time" [(ngModel)]="draftWatchPush.sendLocalTime" />
        }
        <div class="save-row">
          @if (saved()) {
            <span class="status status-good">Enregistré</span>
          }
          <button class="btn" type="button" [disabled]="busy()" (click)="saveSettings()">Enregistrer</button>
        </div>
      }
    </section>
  `,
  styles: `
    section { margin-bottom: 16px; }
    .notice { margin: 0 0 12px; }
    .sub-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; }
    .sub-head strong { margin-right: 10px; font-size: 16px; }
    .plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 14px 0 10px; }
    .plan { border: 1px solid var(--line); border-radius: var(--radius-control); padding: 14px; display: flex; flex-direction: column; gap: 6px; }
    .plan.current { border-color: var(--accent); }
    .p-name { font-weight: 700; }
    .p-price { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
    .ht { font-size: 12px; font-weight: 400; }
    .p-desc { font-size: 12px; flex: 1; }
    .toggle { display: flex; align-items: center; gap: 8px; font-size: 14px; margin-top: 10px; cursor: pointer; }
    .small { font-size: 12px; margin: 10px 0 0; }
    .code-row { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
    .badge.big { font-size: 14px; padding: 5px 14px; }
    .inv-form { display: flex; gap: 8px; margin-bottom: 12px; }
    .inv-form .input { max-width: 300px; }
    .inv { display: flex; align-items: baseline; gap: 14px; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 13px; }
    .inv:last-child { border-bottom: none; }
    .i-mail { flex: 1; }
    .link-btn { background: none; border: none; color: var(--accent-ink); font-family: inherit; font-size: 12px; cursor: pointer; padding: 0; }
    .link-btn.danger { color: var(--bad); }
    .settings-input { max-width: 300px; }
    .th-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .save-row { display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 18px; }
  `,
})
export class TeamPage implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly route = inject(ActivatedRoute);

  readonly billing = signal<Billing | null>(null);
  readonly team = signal<Team | null>(null);
  readonly invite = signal<InviteCodeInfo | null>(null);
  readonly invitations = signal<Invitation[]>([]);
  readonly busy = signal(false);
  readonly saved = signal(false);
  readonly copied = signal(false);
  readonly invError = signal<string | null>(null);
  readonly billingNotice = signal<string | null>(null);

  yearly = false;
  invEmail = '';
  draftName = '';
  draftThresholds = { redFeelingStreakDays: 2, noActivityDays: 3, noCheckinDays: 7, acuteChronicMax: 1.3 };
  draftWatchPush = { enabled: true, sendLocalTime: '20:00' };

  async ngOnInit(): Promise<void> {
    if (this.route.snapshot.queryParamMap.get('billing') === 'success') {
      this.billingNotice.set('Paiement confirmé — votre abonnement est actif.');
    }
    const [billing, team, invite, invitations] = await Promise.all([
      this.api.get<Billing>('/billing'),
      this.api.get<Team>('/team'),
      this.api.get<InviteCodeInfo>('/team/invite-code'),
      this.api.get<Invitation[]>('/team/invitations'),
    ]);
    this.billing.set(billing);
    this.team.set(team);
    this.invite.set(invite);
    this.invitations.set(invitations);
    this.draftName = team.name;
    this.draftThresholds = {
      redFeelingStreakDays: team.alertDefaults.redFeelingStreakDays,
      noActivityDays: team.alertDefaults.noActivityDays,
      noCheckinDays: team.alertDefaults.noCheckinDays,
      acuteChronicMax: team.alertDefaults.acuteChronicMax,
    };
    this.draftWatchPush = {
      enabled: team.watchPush.enabled,
      sendLocalTime: team.watchPush.sendLocalTime,
    };
  }

  planLabel(plan: string): string {
    return PLAN_LABELS[plan] ?? plan;
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
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
      const invitation = await this.api.post<Invitation>('/team/invitations', {
        email: this.invEmail.trim(),
      });
      this.invitations.update((list) => [invitation, ...list]);
      this.invEmail = '';
    } catch (err) {
      this.invError.set(
        err instanceof ApiError && err.code === 'invite.already_sent'
          ? 'Une invitation existe déjà pour cet e-mail.'
          : 'Invitation impossible. Vérifiez l’adresse.',
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
        watchPush: {
          enabled: this.draftWatchPush.enabled,
          sendLocalTime: this.draftWatchPush.sendLocalTime,
        },
      });
      this.team.set(team);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2500);
    } finally {
      this.busy.set(false);
    }
  }
}
