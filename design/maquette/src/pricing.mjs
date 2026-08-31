// Tarifs — page in-app (web + mobile) et planche de positionnement face au marché.
export function pricing(L) {
  const { T, icon, page, sidebar, softPill, accentPill, donePill, tabBar, COACH_TABS, phone, mHeader, stickyBar, barChart } = L;
  const shell = (active, inner, pad = '28px 32px') => `<div style="width: 1440px; height: 900px; display: flex; background: ${T.bg}; overflow: hidden">${sidebar(active)}<main style="flex: 1 1 auto; min-width: 0; padding: ${pad}; display: flex; flex-direction: column; gap: 22px">${inner}</main></div>`;
  const top = (extra = '') => `padding: 56px 20px 0; ${extra}`;

  const PLANS = [
    { n: 'Solo', p: 19, pa: '15,80', pan: 190, ath: 5, coaches: '1 coach', for: 'Vous débutez ou coachez quelques proches.', feats: ['Jusqu’à 5 athlètes', '1 coach', 'Tout inclus, sans option'], cta: 'Choisir Solo', on: false },
    { n: 'Coach', p: 39, pa: '32,50', pan: 390, ath: 25, coaches: '1 coach', for: 'Le coach indépendant qui vit de son activité.', feats: ['Jusqu’à 25 athlètes', '1 coach', 'Groupes d’entraînement', 'Export des données'], cta: 'Passer à Coach', on: true },
    { n: 'Structure', p: 89, pa: '74,20', pan: 890, ath: 80, coaches: '3 coachs', for: 'Club, collectif ou cabinet à plusieurs coachs.', feats: ['Jusqu’à 80 athlètes', '3 coachs, planning partagé', 'Bibliothèque commune', 'Support prioritaire'], cta: 'Choisir Structure', on: false },
  ];
  const INCLUDED = [['run', 'Course à pied et renforcement'], ['target', 'Allures et charges individualisées'], ['heart', 'Check-in de forme et alertes'], ['calendar', 'Planning semaine et mois'], ['library', 'Bibliothèque de modèles'], ['message', 'Messagerie intégrée'], ['sync', 'Synchronisation Strava'], ['user', 'Application athlète gratuite']];
  const check = (t) => `<div class="row" style="gap: 8px; font-size: 13px">${icon('check', 14, T.good, 2.5)}<span>${t}</span></div>`;
  const planCard = (pl, annual = false, compact = false) => `
  <div style="flex: 1 1 0; min-width: 0; border-radius: 16px; border: 1.5px solid ${pl.on ? T.ink : T.line}; background: ${T.surface}; padding: ${compact ? '16px' : '22px 24px'}; display: flex; flex-direction: column; gap: ${compact ? '10px' : '14px'}; position: relative">
    ${pl.on ? `<span class="pill" style="position: absolute; top: -13px; left: ${compact ? '16px' : '24px'}; background: ${T.btnPrimaryBg}; color: ${T.btnPrimaryInk}">Recommandé pour vous · 18 athlètes</span>` : ''}
    <div><div style="font-weight: 600; font-size: 17px">${pl.n}</div><div class="muted" style="font-size: 13px; margin-top: 2px">${pl.for}</div></div>
    <div class="row" style="gap: 6px; align-items: baseline"><span class="num" style="font-size: ${compact ? '30px' : '36px'}; font-weight: 600; letter-spacing: -0.03em; line-height: 1">${annual ? pl.pa : pl.p} €</span><span class="muted" style="font-size: 13px">/ mois HT</span></div>
    <div class="faint" style="font-size: 12px; margin-top: -8px">${annual ? `soit ${pl.pan} € / an, 2 mois offerts` : 'sans engagement, résiliable à tout moment'}</div>
    <div class="col" style="gap: 7px">${pl.feats.map(check).join('')}</div>
    <div style="flex: 1 1 auto"></div>
    <span class="btn ${pl.on ? 'primary' : ''}" style="justify-content: center; height: 44px; border-radius: 11px">${pl.cta}</span>
  </div>`;
  const toggle = (annual) => `<div class="row" style="padding: 3px; border-radius: 10px; background: ${T.neutralSoft}; gap: 2px"><span class="row" style="height: 32px; padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 500; background: ${annual ? 'transparent' : T.surface}; color: ${annual ? T.ink2 : T.ink}">Mensuel</span><span class="row" style="height: 32px; padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 500; gap: 8px; background: ${annual ? T.surface : 'transparent'}; color: ${annual ? T.ink : T.ink2}">Annuel ${accentPill('−2 mois')}</span></div>`;

  // ---------- Desktop · Tarifs ----------
  const Tarifs = page('Kadro — Tarifs', shell('team', `
    <div class="row" style="gap: 6px; font-size: 13px; color: ${T.ink3}"><a style="color: ${T.ink2}">Équipe & réglages</a>${icon('chevron', 14)}<span style="color: ${T.ink}">Tarifs</span></div>
    <header class="row" style="gap: 16px"><div style="flex: 1 1 auto"><h1 class="h1">Une offre par taille d’équipe</h1><div class="muted" style="margin-top: 4px">Tout est inclus dans chaque offre. Vos athlètes ne paient jamais : leur application est comprise.</div></div>${toggle(false)}</header>
    <div class="row" style="gap: 10px; padding: 12px 16px; border-radius: 12px; background: ${T.accentSoft}; color: ${T.accentInk}; font-size: 13.5px; font-weight: 500">${icon('clock', 18)}<span style="flex: 1 1 auto">Essai gratuit · 12 jours restants · 18 athlètes actifs. Choisissez une offre avant le 12 septembre pour ne rien perdre.</span></div>
    <div style="display: flex; gap: 18px; padding-top: 6px">${PLANS.map((p) => planCard(p)).join('')}</div>
    <div style="display: flex; gap: 20px; flex: 1 1 auto; min-height: 0">
      <section class="card" style="flex: 1.4 1 0; padding: 18px 20px">
        <div class="row" style="gap: 10px; margin-bottom: 12px"><h2 class="h2" style="flex: 1 1 auto">Inclus dans toutes les offres</h2></div>
        <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px">${INCLUDED.map(([ic, t]) => `<div class="row" style="gap: 10px; font-size: 13px"><span style="width: 32px; height: 32px; border-radius: 9px; background: ${T.neutralSoft}; display: inline-flex; align-items: center; justify-content: center; color: ${T.ink2}; flex: 0 0 auto">${icon(ic, 16)}</span><span style="line-height: 1.3">${t}</span></div>`).join('')}</div>
      </section>
      <section class="card" style="flex: 1 1 0; padding: 18px 20px; font-size: 13px">
        <div class="row" style="gap: 10px; margin-bottom: 8px"><h2 class="h2" style="flex: 1 1 auto">Bon à savoir</h2></div>
        <div class="col">
          <div class="row" style="gap: 12px; padding: 8px 0; border-top: 1px solid ${T.line}"><span style="flex: 1 1 auto">Au-delà du palier</span><span class="num muted">1,50 € / athlète / mois, sans changer d’offre</span></div>
          <div class="row" style="gap: 12px; padding: 8px 0; border-top: 1px solid ${T.line}"><span style="flex: 1 1 auto">Coach supplémentaire (Structure)</span><span class="num muted">12 € / mois</span></div>
          <div class="row" style="gap: 12px; padding: 8px 0; border-top: 1px solid ${T.line}"><span style="flex: 1 1 auto">Plus de 80 athlètes, club ou fédération</span><span class="muted">sur devis</span></div>
          <div class="row" style="gap: 12px; padding: 8px 0; border-top: 1px solid ${T.line}"><span style="flex: 1 1 auto">Frais d’activation</span><span class="muted">aucun</span></div>
        </div>
      </section>
    </div>`, '24px 32px 24px'));

  // ---------- Mobile · Tarifs ----------
  const MobileTarifs = page('Kadro — Tarifs (mobile coach)', phone(`
  <div style="${top('display: flex; flex-direction: column; gap: 14px; flex: 1 1 auto; min-height: 0')}">
    ${mHeader('Tarifs')}
    <div class="muted" style="font-size: 13.5px; line-height: 1.45; text-align: center; padding: 0 8px">Tout est inclus. Vos athlètes ne paient jamais.</div>
    <div class="row" style="justify-content: center">${toggle(true)}</div>
    <div class="col" style="gap: 16px; padding-top: 8px">${[PLANS[1], PLANS[0], PLANS[2]].map((p) => planCard(p, true, true)).join('')}</div>
  </div>`, tabBar(COACH_TABS, 'Plus')));

  // ---------- Planche · Positionnement prix ----------
  const ROWS = [
    ['Nolio', 'France · endurance', '19,90 € · 3 ath.', '39,90 € · 30 ath.', '+ 1,50 € / ath. sup.', 'Gratuit (premium 6,90 €)', 'Partiel', 'Le repère français. Athlète « premium » payant pour modifier ses séances.'],
    ['Final Surge', 'US · running', '19 $ · 1–5 ath.', '39 $ · illimité', '—', 'Gratuit', 'Non', 'Le moins cher, mais course uniquement et interface datée.'],
    ['TrueCoach', 'US · fitness', '29,98 $ · 5 cl.', '69,98 $ · 20 cl.', '164,98 $ · 50 cl.', 'Gratuit', 'Oui', 'Fort en muscu, faible en endurance (pas d’allures VMA).'],
    ['TrainingPeaks', 'US · endurance', '21,99 $ + 9 $ / ath. premium', '54,99 $ illimité basic', '99 $ d’activation', 'Basic gratuit / premium 9 $', 'Partiel', 'Référence pro, mais complexe et cher dès que les athlètes sont premium.'],
    ['Everfit', 'US · fitness', '19 $ · 5 cl.', '29 $ · 10 cl. → 95 $ · 50', 'modules payants', 'Gratuit', 'Oui', 'Curseur par client + options (nutrition, automatisation).'],
    ['Hexfit', 'France / Québec · fitness', '9 € · 2 cl.', '59 € illimité', '89 € / 139 €', 'Gratuit', 'Oui', 'Orienté salle et kiné, pas de course structurée.'],
  ];
  const cell = (t, b = false) => `<div style="padding: 10px 12px; font-size: 12.5px; line-height: 1.35; ${b ? 'font-weight: 600' : ''}">${t}</div>`;
  const PrixMarche = page('Kadro — Positionnement prix', `
  <div style="width: 1440px; min-height: 1080px; background: ${T.bg}; padding: 40px 48px 48px; display: flex; flex-direction: column; gap: 28px">
    <header><div class="row" style="gap: 8px; margin-bottom: 8px"><span style="display: inline-flex; width: 26px; height: 26px; border-radius: 7px; background: ${T.btnPrimaryBg}; align-items: center; justify-content: center">${icon('logo', 15, T.btnPrimaryInk, 2.2)}</span><span style="font-weight: 700; letter-spacing: -0.02em">Kadro</span></div><h1 class="h1" style="font-size: 30px">Positionnement prix — face au marché</h1><div class="muted" style="margin-top: 6px; font-size: 14.5px; line-height: 1.5; max-width: 900px">Relevé public d’août 2026 (sites éditeurs et comparatifs, prix mensuels affichés, hors promotions). Les dollars sont convertis à titre indicatif à 0,92 € pour le graphique. À vérifier avant toute communication.</div></header>

    <section class="card" style="overflow: hidden">
      <div style="display: grid; grid-template-columns: 1fr 1.1fr 1.2fr 1.2fr 1.1fr 1.2fr 0.6fr 2fr; background: ${T.surface2}; border-bottom: 1px solid ${T.line}; font-size: 11.5px; font-weight: 500; color: ${T.ink3}">${['Solution', 'Marché', 'Entrée', 'Milieu', 'Haut', 'L’athlète paie ?', 'Muscu', 'Ce qu’il faut retenir'].map((h) => `<div style="padding: 8px 12px">${h}</div>`).join('')}</div>
      ${ROWS.map((r) => `<div style="display: grid; grid-template-columns: 1fr 1.1fr 1.2fr 1.2fr 1.1fr 1.2fr 0.6fr 2fr; border-bottom: 1px solid ${T.line}">${r.map((c, i) => cell(c, i === 0)).join('')}</div>`).join('')}
      <div style="display: grid; grid-template-columns: 1fr 1.1fr 1.2fr 1.2fr 1.1fr 1.2fr 0.6fr 2fr; background: ${T.accentSoft}; color: ${T.accentInk}">${['Kadro (proposition)', 'France · course + renfo', '19 € · 5 ath.', '39 € · 25 ath.', '89 € · 80 ath. · 3 coachs', 'Jamais', 'Oui', 'Aligné sur Nolio au palier Coach, muscu et charges individualisées incluses, zéro option payante côté athlète.'].map((c, i) => cell(c, i === 0)).join('')}</div>
    </section>

    <div style="display: flex; gap: 20px">
      <section class="card" style="flex: 1.2 1 0; padding: 18px 20px 10px">
        <div class="row" style="gap: 10px; margin-bottom: 4px"><h2 class="h2" style="flex: 1 1 auto">Ce que paie un coach pour 20 athlètes</h2><span class="faint" style="font-size: 12px">€ / mois, indicatif</span></div>
        <div class="muted" style="font-size: 12.5px; margin-bottom: 8px">Offre la plus proche de 20 athlètes chez chacun. TrainingPeaks : offre Basic illimitée, sans athlète premium.</div>
        ${barChart({ values: [39, 40, 36, 46, 51, 59, 64], labels: ['Kadro', 'Nolio', 'Final Surge', 'Everfit', 'TrainingPeaks', 'Hexfit', 'TrueCoach'], w: 720, h: 190, max: 80, grid: [0, 40, 80], current: -1 })}
      </section>
      <section class="card" style="flex: 1 1 0; padding: 18px 20px; font-size: 13.5px; line-height: 1.5">
        <h2 class="h2" style="margin-bottom: 10px">Pourquoi cette grille</h2>
        <div class="col" style="gap: 10px">
          <div><b style="font-weight: 600">19 / 39 / 89 €.</b> On se cale sur le repère que les coachs français connaissent (Nolio) au palier Coach, sans descendre dessous : en dessous de 19 €, on signale un outil amateur.</div>
          <div><b style="font-weight: 600">Tout inclus, l’athlète ne paie jamais.</b> C’est l’argument le plus simple à vendre face à Nolio (premium athlète) et TrainingPeaks (9 $ par athlète premium).</div>
          <div><b style="font-weight: 600">Course + muscu dans la même offre.</b> Personne ne le fait proprement : les outils d’endurance ignorent la muscu, les outils de fitness ignorent les allures.</div>
          <div><b style="font-weight: 600">1,50 € l’athlète au-delà du palier.</b> Un coach qui passe de 25 à 28 athlètes ne doit pas être forcé de doubler sa facture.</div>
          <div><b style="font-weight: 600">Structure à 89 €.</b> Attaque les clubs et collectifs, là où Hexfit et TrainingPeaks deviennent chers, avec 3 coachs inclus.</div>
        </div>
      </section>
    </div>
    <div class="faint" style="font-size: 11.5px; line-height: 1.5">Sources consultées : trainingpeaks.com/pricing/for-coaches · help.trainingpeaks.com (Coach Account Pricing) · quickcoach.fit/truecoach-pricing-2026 · coachbox.app/fr/comparer/nolio-tarifs · help.nolio.io (frais de plateforme) · finalsurge.com/pricing · quickcoach.fit/everfit-pricing-2026 · myhexfit.com (comparatif 2026). Prix à reconfirmer sur les pages officielles au moment de publier.</div>
  </div>`);

  return { Tarifs, MobileTarifs, PrixMarche };
}
