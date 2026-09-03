import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Billing, CheckoutUrl } from '@kadro/shared';
import { ApiClient } from '../core/api-client';
import { IconComponent } from '../ui/icon.component';

const PLAN_COPY: Record<string, { name: string; tagline: string; features: string[]; cta: string }> = {
  solo: {
    name: 'Solo',
    tagline: 'Vous débutez ou coachez quelques proches.',
    features: ['1 coach', 'Tout inclus, sans option'],
    cta: 'Choisir Solo',
  },
  coach: {
    name: 'Coach',
    tagline: "Le coach indépendant qui vit de son activité.",
    features: ['1 coach', "Groupes d'entraînement", 'Export des données'],
    cta: 'Passer à Coach',
  },
  structure: {
    name: 'Structure',
    tagline: 'Club, collectif ou cabinet à plusieurs coachs.',
    features: ['Planning partagé', 'Bibliothèque commune', 'Support prioritaire'],
    cta: 'Choisir Structure',
  },
};

const INCLUDED: { icon: string; label: string }[] = [
  { icon: 'run', label: 'Course à pied et renforcement' },
  { icon: 'target', label: 'Allures et charges individualisées' },
  { icon: 'heart', label: 'Check-in de forme et alertes' },
  { icon: 'calendar', label: 'Planning semaine et mois' },
  { icon: 'library', label: 'Bibliothèque de modèles' },
  { icon: 'message', label: 'Messagerie intégrée' },
  { icon: 'sync', label: 'Synchronisation des montres' },
  { icon: 'user', label: 'Application athlète gratuite' },
];

@Component({
  selector: 'app-pricing-page',
  imports: [RouterLink, IconComponent],
  template: `
    <div class="row crumb">
      <a routerLink="/equipe">Équipe & réglages</a>
      <ui-icon name="chevron" [size]="14" />
      <span class="here">Tarifs</span>
    </div>
    <header class="row head">
      <div class="head-txt">
        <h1>Une offre par taille d'équipe</h1>
        <div class="muted sub">Tout est inclus dans chaque offre. Vos athlètes ne paient jamais : leur application est comprise.</div>
      </div>
      <div class="row seg">
        <button class="seg-btn" type="button" [class.on]="!yearly()" (click)="yearly.set(false)">Mensuel</button>
        <button class="seg-btn" type="button" [class.on]="yearly()" (click)="yearly.set(true)">Annuel <span class="pill accent">−2 mois</span></button>
      </div>
    </header>
    @if (billing(); as b) {
      @if (b.plan === 'trial' && trialDays(b) != null) {
        <div class="row banner">
          <ui-icon name="clock" [size]="18" />
          <span>Essai gratuit · {{ trialDays(b) }} jour{{ trialDays(b)! > 1 ? 's' : '' }} restant{{ trialDays(b)! > 1 ? 's' : '' }} · {{ b.athleteCount }} athlète{{ b.athleteCount > 1 ? 's' : '' }} actif{{ b.athleteCount > 1 ? 's' : '' }}. Choisissez une offre pour ne rien perdre.</span>
        </div>
      }
      <div class="plans">
        @for (p of b.amounts; track p.plan) {
          <div class="plan col" [class.reco]="p.plan === recommended()">
            @if (p.plan === recommended()) {
              <span class="pill reco-pill">Recommandé pour vous · {{ b.athleteCount }} athlète{{ b.athleteCount > 1 ? 's' : '' }}</span>
            }
            <div>
              <div class="p-name">{{ copy(p.plan).name }}</div>
              <div class="muted p-for">{{ copy(p.plan).tagline }}</div>
            </div>
            <div class="row price-row">
              <span class="num price">{{ price(p) }} €</span>
              <span class="muted per">/ mois HT</span>
            </div>
            <div class="faint p-note">{{ yearly() ? 'soit ' + p.yearlyEurHt + ' € / an, 2 mois offerts' : "sans engagement, résiliable à tout moment" }}</div>
            <div class="col feats">
              <div class="row feat"><ui-icon name="check" [size]="14" [sw]="2.5" style="color: var(--good)" />Jusqu'à {{ p.athleteLimit }} athlètes</div>
              @if (p.coachLimit > 1) {
                <div class="row feat"><ui-icon name="check" [size]="14" [sw]="2.5" style="color: var(--good)" />{{ p.coachLimit }} coachs inclus</div>
              }
              @for (f of copy(p.plan).features; track f) {
                <div class="row feat"><ui-icon name="check" [size]="14" [sw]="2.5" style="color: var(--good)" />{{ f }}</div>
              }
            </div>
            <div class="fill"></div>
            @if (p.plan === b.plan) {
              <span class="btn current">Votre offre actuelle</span>
            } @else if (b.checkoutAvailable) {
              <button class="btn cta" [class.primary]="p.plan === recommended()" type="button" [disabled]="busy()" (click)="checkout(p.plan)">{{ copy(p.plan).cta }}</button>
            } @else {
              <span class="btn current">{{ copy(p.plan).cta }} — bientôt</span>
            }
          </div>
        }
      </div>
      <div class="cols">
        <section class="card incl">
          <h2 class="c-h">Inclus dans toutes les offres</h2>
          <div class="incl-grid">
            @for (item of included; track item.label) {
              <div class="row incl-item">
                <span class="incl-ic"><ui-icon [name]="item.icon" [size]="16" /></span>
                <span>{{ item.label }}</span>
              </div>
            }
          </div>
        </section>
        <section class="card know">
          <h2 class="c-h">Bon à savoir</h2>
          <div class="row k-row"><span class="grow">Au-delà du palier</span><span class="num muted">1,50 € / athlète / mois, sans changer d'offre</span></div>
          <div class="row k-row"><span class="grow">Coach supplémentaire (Structure)</span><span class="num muted">12 € / mois</span></div>
          <div class="row k-row"><span class="grow">Plus de 80 athlètes, club ou fédération</span><span class="muted">sur devis</span></div>
          <div class="row k-row"><span class="grow">Frais d'activation</span><span class="muted">aucun</span></div>
        </section>
      </div>
    } @else {
      <p class="muted">Chargement…</p>
    }
  `,
  styles: `
    .crumb { gap: 6px; font-size: 13px; color: var(--ink3); margin-bottom: 4px; }
    .crumb a { color: var(--ink2); }
    .crumb .here { color: var(--ink); }
    .head { gap: 16px; }
    .head-txt { flex: 1 1 auto; }
    .sub { margin-top: 4px; }
    .seg { padding: 3px; border-radius: 10px; background: var(--surface2); gap: 2px; }
    .seg-btn { height: 32px; padding: 0 14px; border: none; border-radius: 8px; background: transparent; font-family: inherit; font-size: 13px; font-weight: 500; color: var(--ink2); cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
    .seg-btn.on { background: var(--surface); color: var(--ink); }
    .banner { gap: 10px; padding: 12px 16px; border-radius: 12px; background: var(--accent-soft); color: var(--accent-ink); font-size: 13.5px; font-weight: 500; }
    .plans { display: flex; gap: 18px; padding-top: 8px; }
    .plan { flex: 1 1 0; min-width: 0; border-radius: 16px; border: 1.5px solid var(--line); background: var(--surface); padding: 22px 24px; gap: 14px; position: relative; }
    .plan.reco { border-color: var(--ink); }
    .reco-pill { position: absolute; top: -13px; left: 24px; background: var(--btn-primary-bg); color: var(--btn-primary-ink); }
    .p-name { font-weight: 600; font-size: 17px; }
    .p-for { font-size: 13px; margin-top: 2px; }
    .price-row { gap: 6px; align-items: baseline; }
    .price { font-size: 36px; font-weight: 600; letter-spacing: -0.03em; line-height: 1; }
    .per { font-size: 13px; }
    .p-note { font-size: 12px; margin-top: -8px; }
    .feats { gap: 7px; }
    .feat { gap: 8px; font-size: 13px; }
    .fill { flex: 1 1 auto; }
    .cta { justify-content: center; height: 44px; border-radius: 11px; }
    .current { justify-content: center; height: 44px; border-radius: 11px; color: var(--ink3); cursor: default; }
    .cols { display: flex; gap: 20px; align-items: flex-start; }
    .incl { flex: 1.4 1 0; padding: 18px 20px; }
    .know { flex: 1 1 0; padding: 18px 20px; font-size: 13px; }
    .c-h { margin-bottom: 12px; }
    .incl-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .incl-item { gap: 10px; font-size: 13px; }
    .incl-ic { width: 32px; height: 32px; border-radius: 9px; background: var(--surface2); display: inline-flex; align-items: center; justify-content: center; color: var(--ink2); flex: 0 0 auto; }
    .k-row { gap: 12px; padding: 8px 0; border-top: 1px solid var(--line); }
    .grow { flex: 1 1 auto; }
  `,
})
export class PricingPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly billing = signal<Billing | null>(null);
  readonly yearly = signal(false);
  readonly busy = signal(false);
  readonly included = INCLUDED;

  readonly recommended = computed(() => {
    const b = this.billing();
    if (!b) return null;
    const fitting = [...b.amounts].sort((x, y) => x.athleteLimit - y.athleteLimit).find((p) => p.athleteLimit >= b.athleteCount);
    return fitting?.plan ?? 'structure';
  });

  async ngOnInit(): Promise<void> {
    this.billing.set(await this.api.get<Billing>('/billing'));
  }

  copy(plan: string): { name: string; tagline: string; features: string[]; cta: string } {
    return PLAN_COPY[plan] ?? { name: plan, tagline: '', features: [], cta: 'Choisir' };
  }

  price(p: { monthlyEurHt: number; yearlyEurHt: number }): string {
    if (!this.yearly()) return String(p.monthlyEurHt);
    return (p.yearlyEurHt / 12).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  trialDays(b: Billing): number | null {
    if (!b.trialEndsAt) return null;
    return Math.max(0, Math.ceil((new Date(b.trialEndsAt).getTime() - Date.now()) / 86400000));
  }

  async checkout(plan: string): Promise<void> {
    this.busy.set(true);
    try {
      const { url } = await this.api.post<CheckoutUrl>('/billing/checkout', {
        plan,
        interval: this.yearly() ? 'year' : 'month',
      });
      window.location.href = url;
    } finally {
      this.busy.set(false);
    }
  }
}
