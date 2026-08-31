// Athlète · Mobile screens (390×844) + one desktop dashboard (1440×900).
export function athlete(L) {
  const { T, icon, page, avatar, accentPill, softPill, donePill, dot, sidebar, barChart, lineChart, WEEK, chipStyle, chipIcon, miniWeek, weekStrip, mMetric, metric, sectionHead, tabBar, ATH_TABS, phone, mHeader, stickyBar, bubble, sessionCard, composer, kpi } = L;
  const top = (extra = '') => `padding: 56px 20px 0; ${extra}`;
  const seg = (l, on) => `<div style="flex: 1 1 0; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 12.5px; font-weight: 500; background: ${on ? T.btnPrimaryBg : T.surface}; color: ${on ? T.btnPrimaryInk : T.ink2}; border: 1px solid ${on ? T.btnPrimaryBg : T.line}">${l}</div>`;
  const block = (t, d, m, rep = '') => `<div class="row" style="gap: 12px; padding: 10px 0; border-top: 1px solid ${T.line}"><div style="width: 6px; height: 34px; border-radius: 99px; background: ${m}"></div><div style="flex: 1 1 auto; line-height: 1.3"><div style="font-weight: 500">${t}</div><div class="muted" style="font-size: 12.5px">${d}</div></div>${rep ? accentPill(rep, 'repeat') : ''}</div>`;
  const primaryBtn = (l, ic) => `<span class="btn primary" style="flex: 1 1 0; height: 48px; justify-content: center; border-radius: 12px">${ic ? icon(ic, 18, T.btnPrimaryInk, 2) : ''}${l}</span>`;

  // Onboarding — rejoindre son coach
  const cellBox = (c, on = false) => `<div class="num" style="flex: 1 1 0; height: 56px; border-radius: 12px; border: 1.5px solid ${on ? T.accent : T.line}; background: ${T.surface}; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 600">${c}</div>`;
  const step = (n, l, done = false) => `<div class="row" style="gap: 12px; padding: 10px 0; font-size: 14px"><span style="width: 24px; height: 24px; border-radius: 99px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; background: ${done ? T.good : T.neutralSoft}; color: ${done ? '#fff' : T.ink2}">${done ? icon('check', 12, '#fff', 3) : n}</span><span style="color: ${done ? T.ink3 : T.ink}">${l}</span></div>`;
  const Onboarding = page('Kadro — Rejoindre son coach', phone(`
  <div style="padding: 72px 24px 0; display: flex; flex-direction: column; gap: 22px; flex: 1 1 auto">
    <div class="row" style="gap: 10px"><span style="display: inline-flex; width: 32px; height: 32px; border-radius: 9px; background: ${T.btnPrimaryBg}; align-items: center; justify-content: center">${icon('logo', 18, T.btnPrimaryInk, 2.2)}</span><span style="font-weight: 700; font-size: 17px; letter-spacing: -0.02em">Kadro</span></div>
    <div><h1 class="h1" style="font-size: 28px">Rejoins ton coach</h1><div class="muted" style="margin-top: 8px; font-size: 15px; line-height: 1.45">Entre le code que ton coach t’a envoyé. Il verra tes séances, ta forme et pourra ajuster ton plan.</div></div>
    <div class="col" style="gap: 10px"><span class="label">Code coach</span><div class="row" style="gap: 8px">${cellBox('K')}${cellBox('D')}${cellBox('R')}<span style="color: ${T.ink3}; font-weight: 600">–</span>${cellBox('7')}${cellBox('K')}${cellBox('', true)}</div></div>
    <div class="card" style="padding: 14px 16px"><div class="row" style="gap: 12px">${avatar('MR', 40)}<div style="flex: 1 1 auto; line-height: 1.3"><div style="font-weight: 600">Marc · Coach diplômé</div><div class="muted" style="font-size: 12.5px">18 athlètes · course à pied & trail</div></div>${donePill('Trouvé')}</div></div>
    <div class="col" style="padding: 4px 0">${step(1, 'Code coach', true)}${step(2, 'Ton profil : VMA, objectif, jours disponibles')}${step(3, 'Relier ta montre (Garmin, Coros, Polar…)')}</div>
    <div style="flex: 1 1 auto"></div>
    <div class="col" style="gap: 12px; padding-bottom: 40px">${primaryBtn('Continuer')}<div class="faint" style="text-align: center; font-size: 13px">Pas de code ? Demande-le à ton coach.</div></div>
  </div>`));

  // Aujourd'hui
  const Aujourdhui = page('Kadro — Aujourd’hui (athlète)', phone(`
  <div style="padding: 60px 20px 0; display: flex; flex-direction: column; gap: 16px">
    <div class="row" style="gap: 12px"><div style="flex: 1 1 auto"><div class="faint" style="font-size: 13px">Vendredi 29 août</div><h1 class="h1" style="font-size: 28px; margin-top: 2px">Bonjour Léa</h1></div>${avatar('LM', 40)}</div>
    <section class="card" style="padding: 16px">
      <div style="font-weight: 600; font-size: 15px">Comment tu te sens ce matin ?</div>
      <div class="muted" style="font-size: 13px; margin-top: 2px; margin-bottom: 12px">Ton coach le voit avant ta séance.</div>
      <div class="row" style="gap: 6px">${seg('Épuisée')}${seg('Fatiguée', true)}${seg('Correct')}${seg('Bien')}${seg('Au top')}</div>
      <div class="row" style="gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px solid ${T.line}; font-size: 13.5px">${icon('moon', 18, T.ink2)}<span style="flex: 1 1 auto">Sommeil</span><span class="row num" style="gap: 14px; font-weight: 600"><span class="icon-btn" style="width: 32px; height: 32px; border-radius: 8px">${icon('minus', 14)}</span>5 h 30<span class="icon-btn" style="width: 32px; height: 32px; border-radius: 8px">${icon('plus', 14)}</span></span></div>
    </section>
    <section class="card" style="padding: 16px; overflow: hidden">
      <div class="row" style="gap: 10px">${accentPill('Séance du jour', 'run')}<span style="flex: 1 1 auto"></span><span class="faint num" style="font-size: 12.5px">30 min · Z1</span></div>
      <div style="font-size: 20px; font-weight: 600; letter-spacing: -0.02em; margin-top: 10px">Footing 30′ très tranquille</div>
      <div class="muted" style="font-size: 13px; margin-top: 2px; margin-bottom: 8px">Allégée par Marc hier soir · allure libre, reste en conversation</div>
      ${block('Échauffement · 5′', 'Marche rapide puis trot', T.lineStrong)}
      ${block('Corps de séance · 20′', 'Z1 – Z2 · 6:00 – 6:20 /km', T.accent)}
      ${block('Retour au calme · 5′', 'Marche, étirements légers', T.lineStrong)}
      <div class="row" style="gap: 10px; margin-top: 12px">${primaryBtn('Démarrer', 'play')}<span class="btn" style="height: 48px; padding: 0 14px; border-radius: 12px">${icon('clock', 18)}Sur ta montre</span></div>
    </section>
    <section class="card" style="padding: 14px 16px">
      <div class="row" style="gap: 10px; margin-bottom: 12px"><h2 class="h2" style="flex: 1 1 auto">Ma semaine</h2><span class="muted num" style="font-size: 12.5px">3 / 5 · 38,4 km</span></div>${miniWeek()}
    </section>
  </div>`, tabBar(ATH_TABS, 'Aujourd’hui')));

  // Séance détail (avant)
  const SeanceDetail = page('Kadro — Détail de séance (athlète)', phone(`
  <div style="${top('display: flex; flex-direction: column; gap: 14px; flex: 1 1 auto; min-height: 0')}">
    ${mHeader('Dimanche 31 août', `<span class="icon-btn" style="border: 0; background: transparent">${icon('more', 22, T.ink)}</span>`)}
    <div><div class="row" style="gap: 8px">${accentPill('Sortie longue', 'run')}${donePill('Sur ta Forerunner')}</div><div style="font-size: 24px; font-weight: 600; letter-spacing: -0.02em; margin-top: 10px">Sortie longue 1 h 45</div><div class="muted" style="font-size: 13.5px; margin-top: 4px">18 – 20 km · Z2 · fin progressive</div></div>
    <div class="row" style="gap: 8px">${mMetric('Durée', '1 h 45')}${mMetric('Allure', '5:30 – 5:50')}${mMetric('Difficulté attendue', '6 / 10')}</div>
    <section class="card" style="padding: 4px 16px 6px">
      ${block('Échauffement · 15′', 'Z1 · très facile, 6:10 /km', T.lineStrong).replace('border-top: 1px solid ' + T.line, 'border-top: 0')}
      ${block('Endurance · 1 h 15', 'Z2 régulier · 5:30 – 5:50 /km', T.accent)}
      ${block('Fin progressive · 10′', 'Monter vers 5:00 /km, sans forcer', T.accent)}
      ${block('Retour au calme · 5′', 'Marche + étirements', T.lineStrong)}
    </section>
    <section class="card" style="padding: 14px 16px"><div class="row" style="gap: 10px; margin-bottom: 8px">${avatar('MR', 28)}<span style="font-weight: 600; font-size: 13.5px">Le mot de Marc</span></div><div style="font-size: 13.5px; line-height: 1.45">Selon ton ressenti du matin, on décide ensemble : si la fatigue persiste, on coupe à 1 h 15 sans la fin progressive. Prends de l’eau et surveille le tendon.</div></section>
  </div>
  ${stickyBar(`${primaryBtn('Démarrer la séance', 'play')}<span class="btn" style="height: 48px; padding: 0 14px; border-radius: 12px">${icon('message', 18)}</span>`)}`, tabBar(ATH_TABS, 'Planning')));

  // Compte-rendu après séance
  const split = (v, max, on) => `<div style="flex: 1 1 0; display: flex; flex-direction: column; justify-content: flex-end; height: 56px"><div style="height: ${Math.round(v / max * 100)}%; border-radius: 3px 3px 0 0; background: ${on ? T.bad : T.accent}"></div></div>`;
  const rpe = (n, on) => `<div class="num" style="flex: 1 1 0; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; background: ${on ? T.btnPrimaryBg : T.surface}; color: ${on ? T.btnPrimaryInk : T.ink2}; border: 1px solid ${on ? T.btnPrimaryBg : T.line}">${n}</div>`;
  const CompteRendu = page('Kadro — Compte-rendu de séance (athlète)', phone(`
  <div style="${top('display: flex; flex-direction: column; gap: 14px; flex: 1 1 auto; min-height: 0')}">
    ${mHeader('Séance terminée', `<span class="icon-btn" style="border: 0; background: transparent">${icon('x', 22, T.ink)}</span>`, false)}
    <section class="card" style="padding: 14px 16px">
      <div class="row" style="gap: 10px"><div style="flex: 1 1 auto; line-height: 1.25"><div style="font-weight: 600; font-size: 17px">VMA 10 × 400 m</div><div class="muted" style="font-size: 12.5px">Mer 27 août · importée depuis Strava</div></div>${donePill('Synchronisée')}</div>
      <div class="row" style="gap: 8px; margin-top: 12px">${mMetric('Distance', '12,1 km')}${mMetric('Durée', '58:12')}${mMetric('FC moy', '168')}</div>
      <div class="row" style="gap: 10px; margin-top: 14px; margin-bottom: 6px"><span class="label" style="flex: 1 1 auto">Tes 10 × 400 m · temps</span><span class="faint num" style="font-size: 12px">cible 1:27</span></div>
      <div class="row" style="gap: 4px; align-items: flex-end">${[86, 86, 87, 87, 88, 88, 90, 91, 93, 95].map((v, i) => split(v, 100, i >= 8)).join('')}</div>
      <div class="row" style="justify-content: space-between; font-size: 11px; color: ${T.ink3}; margin-top: 4px"><span>1 · 1:26</span><span>5 · 1:28</span><span style="color: ${T.bad}">10 · 1:35</span></div>
    </section>
    <section class="card" style="padding: 14px 16px">
      <div style="font-weight: 600; font-size: 15px">Comment c’était ?</div>
      <div class="row" style="gap: 6px; margin-top: 10px">${seg('Très dur')}${seg('Dur', true)}${seg('Correct')}${seg('Facile')}${seg('Très facile')}</div>
      <div class="row" style="gap: 10px; margin-top: 14px; margin-bottom: 6px"><span class="label" style="flex: 1 1 auto">Effort perçu (RPE)</span><span class="num" style="font-size: 12px; color: ${T.good}; font-weight: 500">8 / 10 · Marc attendait 8</span></div>
      <div class="row" style="gap: 4px">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => rpe(n, n === 8)).join('')}</div>
      <div class="input" style="margin-top: 12px; height: 60px; align-items: flex-start; padding: 10px 12px; color: ${T.ink}">Les 2 derniers étaient très durs, jambes lourdes. Gêne légère au tendon droit.</div>
    </section>
  </div>
  ${stickyBar(primaryBtn('Envoyer à Marc', 'send'), 0)}`));

  // Planning (athlète)
  const dayRow = (w) => `
  <div style="display: flex; gap: 14px; padding: 10px 0; border-top: 1px solid ${T.line}">
    <div style="width: 40px; flex: 0 0 auto; text-align: center; line-height: 1.1; padding-top: 4px"><div style="font-size: 11px; color: ${w.today ? T.accentInk : T.ink3}; font-weight: 600">${w.d.toUpperCase()}</div><div class="num" style="font-size: 20px; font-weight: 600; margin-top: 2px; color: ${w.today ? T.accentInk : T.ink}">${w.n}</div></div>
    <div style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px">
      ${w.s.length ? w.s.map((s) => `<div class="row" style="gap: 10px; padding: 11px 14px; border-radius: 12px; ${chipStyle(s.st)}; font-size: 14px">${chipIcon(s, 18)}<div style="flex: 1 1 auto; line-height: 1.3; min-width: 0"><div style="font-weight: 600">${s.t}</div><div class="ellip" style="font-size: 12px; opacity: .8">${s.sub || ''}</div></div>${icon('chevron', 16, 'currentColor')}</div>`).join('')
        : `<div class="row" style="height: 42px; padding: 0 14px; border-radius: 12px; border: 1px dashed ${T.line}; color: ${T.ink3}; font-size: 13px">Repos</div>`}
    </div>
  </div>`;
  const WEEK_A = WEEK.map((w) => w.today ? { ...w, s: [{ t: 'Footing 30′ très tranquille', st: 'today', k: 'run', sub: 'Aujourd’hui · allégée par Marc' }] } : w);
  const Planning = page('Kadro — Planning (athlète)', phone(`
  <div style="${top('display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; gap: 10px')}">
    <div class="row" style="gap: 12px"><h1 class="h1" style="flex: 1 1 auto; font-size: 26px">Planning</h1><div class="row" style="border: 1px solid ${T.line}; border-radius: 9px; overflow: hidden; height: 34px; font-size: 13px; font-weight: 500"><span class="row" style="padding: 0 12px; height: 100%; background: ${T.navActive}">Semaine</span><span class="row" style="padding: 0 12px; height: 100%; color: ${T.ink2}">Mois</span></div></div>
    <div class="row" style="gap: 8px"><span class="icon-btn" style="width: 36px; height: 36px">${icon('chevronL', 18)}</span><div style="flex: 1 1 auto; text-align: center; line-height: 1.2"><div style="font-weight: 600; font-size: 15px">Semaine 35 · 25 – 31 août</div><div class="faint" style="font-size: 12px">Développement général · semaine 6 / 32</div></div><span class="icon-btn" style="width: 36px; height: 36px">${icon('chevron', 18)}</span></div>
    <div class="row" style="gap: 10px; padding: 10px 12px; border-radius: 12px; background: ${T.surface}; border: 1px solid ${T.line}; font-size: 13px">${icon('flag', 18, T.accent)}<span style="flex: 1 1 auto"><b style="font-weight: 600">Marathon de Paris</b> · 12 avril 2027</span><span class="faint num">J-226</span></div>
    <div style="flex: 1 1 auto; overflow: hidden">${WEEK_A.map(dayRow).join('')}</div>
  </div>`, tabBar(ATH_TABS, 'Planning')));

  // Progression
  const zone = (z, l, p, c) => `<div style="display: grid; grid-template-columns: 34px 1fr auto; gap: 10px; align-items: center; padding: 7px 0; border-top: 1px solid ${T.line}; font-size: 13px"><span class="pill num" style="height: 22px; padding: 0 7px; background: ${c}; color: #fff; font-size: 11px; justify-content: center">${z}</span><span class="muted">${l}</span><span class="num" style="font-weight: 600">${p}</span></div>`;
  const record = (d, t, when) => `<div style="flex: 1 1 0; padding: 10px 12px; border-radius: 10px; background: ${T.surface2}"><div class="faint" style="font-size: 11.5px">${d}</div><div class="num" style="font-size: 17px; font-weight: 600; letter-spacing: -0.01em">${t}</div><div class="faint" style="font-size: 11px">${when}</div></div>`;
  const Progression = page('Kadro — Progression (athlète)', phone(`
  <div style="${top('display: flex; flex-direction: column; gap: 14px')}">
    <div class="row" style="gap: 12px"><h1 class="h1" style="flex: 1 1 auto; font-size: 26px">Progression</h1>${softPill('12 semaines', 'chevronD')}</div>
    <section class="card" style="padding: 14px 16px 6px">
      <div class="row" style="gap: 10px; margin-bottom: 6px"><h2 class="h2" style="flex: 1 1 auto">Volume hebdo</h2><span class="faint" style="font-size: 12px">km</span></div>
      <div class="row" style="gap: 8px; margin-bottom: 4px">${metric('Cette semaine', '38,4')}${metric('Moy. 4 sem.', '44,1')}${metric('Total 12 sem.', '486')}</div>
      ${barChart({ values: [28, 32, 35, 38, 42, 45, 40, 48, 50, 46, 52, 38], labels: ['S24', 'S25', 'S26', 'S27', 'S28', 'S29', 'S30', 'S31', 'S32', 'S33', 'S34', 'S35'], w: 318, h: 110, max: 60, grid: [0, 30, 60], labelEvery: 2 })}
    </section>
    <section class="card" style="padding: 14px 16px 8px">
      <div class="row" style="gap: 10px"><h2 class="h2" style="flex: 1 1 auto">VMA</h2><span class="faint" style="font-size: 12px">3 tests · km/h</span></div>
      ${lineChart({ w: 318, h: 100, points: [{ l: 'Mars', v: 15.5 }, { l: 'Juin', v: 16 }, { l: 'Août', v: 16.5 }], min: 15, max: 17, fmt: (v) => String(v).replace('.', ',') })}
    </section>
    <section class="card" style="padding: 14px 16px 4px">
      <div class="row" style="gap: 10px; margin-bottom: 4px"><h2 class="h2" style="flex: 1 1 auto">Mes allures</h2><span class="faint" style="font-size: 12px">calculées sur VMA 16,5</span></div>
      ${zone('Z2', 'Endurance', '5:45 – 6:00', T.ink3)}${zone('Seuil', 'Allure semi', '4:18 – 4:25', T.ink2)}${zone('VMA', '400 m', '1:27', T.accent)}
    </section>
    <div class="row" style="gap: 8px">${record('10 km', '46:12', 'Mai 2026')}${record('Semi', '1 h 41', 'Oct. 2025')}${record('Marathon', '3 h 31', 'Nantes 2025')}</div>
  </div>`, tabBar(ATH_TABS, 'Progression')));

  // Coach (chat, côté athlète)
  const Coach = page('Kadro — Mon coach (athlète)', phone(`
  <div style="${top('display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; gap: 12px')}">
    <div class="row" style="gap: 10px">${avatar('MR', 40)}<div style="flex: 1 1 auto; line-height: 1.25"><div style="font-weight: 600; font-size: 16px">Marc</div><div class="faint" style="font-size: 12px">Ton coach · répond en général sous 24 h</div></div><span class="icon-btn">${icon('calendar', 18)}</span></div>
    <div style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 12px; overflow: hidden; padding-top: 6px">
      <div class="faint" style="text-align: center; font-size: 12px">Jeudi 28 août</div>
      ${bubble('Coach, j’ai les jambes lourdes depuis la VMA de mercredi et j’ai mal dormi. Je fais quoi demain ?', true, '21:40')}
      ${bubble('Merci de me le dire. On allège : footing 30′ très tranquille, et on voit dimanche pour la sortie longue selon ton ressenti du matin.', false, '22:05')}
      <div style="display: flex; justify-content: flex-start">${sessionCard('Footing 30′ · Z1', 'Ven 29 août · ta séance a été modifiée', 'today')}</div>
      <div class="faint" style="text-align: center; font-size: 12px">Aujourd’hui</div>
      ${bubble('Ok pour alléger, je fais 30′ tranquille. Le tendon va mieux ce matin.', true, '09:12')}
    </div>
  </div>
  <div style="padding: 10px 20px 96px; border-top: 1px solid ${T.line}; background: ${T.surface}">${composer('Écrire à Marc…')}</div>`, tabBar(ATH_TABS, 'Coach')));

  // Profil (athlète)
  const prow = (l, v, action = '') => `<div class="row" style="gap: 12px; height: 50px; padding: 0 16px; border-top: 1px solid ${T.line}; font-size: 14px"><span style="flex: 1 1 auto">${l}</span><span class="muted num">${v}</span>${action || icon('chevron', 16, T.ink3)}</div>`;
  const Profil = page('Kadro — Profil (athlète)', phone(`
  <div style="padding: 60px 20px 0; display: flex; flex-direction: column; gap: 16px">
    <div class="row" style="gap: 14px">${avatar('LM', 56)}<div style="flex: 1 1 auto; line-height: 1.25"><div style="font-size: 22px; font-weight: 600; letter-spacing: -0.02em">Léa Martin</div><div class="muted" style="font-size: 13px; margin-top: 3px">Coachée par Marc depuis mars 2026</div></div><span class="icon-btn">${icon('edit', 18)}</span></div>
    <div class="row" style="gap: 8px">${mMetric('VMA', '16,5 km/h')}${mMetric('FC max', '192')}${mMetric('Poids', '58 kg')}</div>
    <section class="card" style="overflow: hidden"><div class="label" style="padding: 12px 16px 6px">Objectif</div>${prow('Marathon de Paris', '12 avr. 2027 · 3 h 15')}${prow('Jours disponibles', 'Lun · Mer · Jeu · Ven · Dim')}</section>
    <section class="card" style="overflow: hidden"><div class="label" style="padding: 12px 16px 6px">Connexions</div>${prow('Garmin', 'Forerunner 265', donePill('Connectée'))}${prow('Strava', 'Connecté', donePill('Actif'))}${prow('Montres & connexions', 'Coros, Polar, Suunto, Apple Watch…')}</section>
    <section class="card" style="overflow: hidden"><div class="label" style="padding: 12px 16px 6px">Application</div>${prow('Rappel du check-in', '7:30')}${prow('Apparence', 'Système')}${prow('Confidentialité & données', '')}${prow('Se déconnecter', '', '<span></span>')}</section>
  </div>`, tabBar(ATH_TABS, 'Profil')));

  // Desktop athlète — tableau de bord
  const DesktopAthlete = page('Kadro — Athlète (web)', `<div style="width: 1440px; height: 900px; display: flex; background: ${T.bg}; overflow: hidden">${sidebar('today', 'athlete')}
  <main style="flex: 1 1 auto; min-width: 0; padding: 28px 32px; display: flex; flex-direction: column; gap: 22px">
    <header class="row" style="gap: 16px"><div style="flex: 1 1 auto"><h1 class="h1">Bonjour Léa</h1><div class="muted" style="margin-top: 4px">Vendredi 29 août · Marathon de Paris dans 226 jours</div></div><span class="icon-btn">${icon('bell', 20)}</span><span class="btn">${icon('sync', 18)}Synchroniser Strava</span></header>
    <div style="display: flex; gap: 20px; flex: 1 1 auto; min-height: 0">
      <div style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 20px">
        <div style="display: flex; gap: 20px">
          <section class="card" style="flex: 1 1 0; padding: 18px 20px">
            <div style="font-weight: 600; font-size: 15px">Comment tu te sens ce matin ?</div><div class="muted" style="font-size: 13px; margin-top: 2px; margin-bottom: 12px">Marc le voit avant ta séance.</div>
            <div class="row" style="gap: 6px">${seg('Épuisée')}${seg('Fatiguée', true)}${seg('Correct')}${seg('Bien')}${seg('Au top')}</div>
            <div class="row" style="gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px solid ${T.line}; font-size: 13.5px">${icon('moon', 18, T.ink2)}<span style="flex: 1 1 auto">Sommeil</span><span class="row num" style="gap: 14px; font-weight: 600"><span class="icon-btn" style="width: 32px; height: 32px; border-radius: 8px">${icon('minus', 14)}</span>5 h 30<span class="icon-btn" style="width: 32px; height: 32px; border-radius: 8px">${icon('plus', 14)}</span></span></div>
          </section>
          <section class="card" style="flex: 1.2 1 0; padding: 18px 20px; display: flex; flex-direction: column">
            <div class="row" style="gap: 10px">${accentPill('Séance du jour', 'run')}<span style="flex: 1 1 auto"></span><span class="faint num" style="font-size: 12.5px">30 min · Z1</span></div>
            <div style="font-size: 20px; font-weight: 600; letter-spacing: -0.02em; margin-top: 10px">Footing 30′ très tranquille</div>
            <div class="muted" style="font-size: 13px; margin-top: 2px; margin-bottom: 6px">Allégée par Marc hier soir · allure libre</div>
            ${block('Échauffement · 5′', 'Marche rapide puis trot', T.lineStrong)}${block('Corps de séance · 20′', 'Z1 – Z2 · 6:00 – 6:20 /km', T.accent)}
            <div style="flex: 1 1 auto"></div>
            <div class="row" style="gap: 10px; margin-top: 10px"><span class="btn primary">${icon('check', 18, T.btnPrimaryInk, 2)}Marquer réalisée</span><span class="btn">Voir le détail</span></div>
          </section>
        </div>
        <section class="card" style="padding: 16px 18px 14px"><div class="row" style="gap: 10px; margin-bottom: 12px"><h2 class="h2" style="flex: 1 1 auto">Ma semaine</h2><span class="muted num" style="font-size: 12.5px">3 / 5 réalisées · 38,4 km</span></div>${weekStrip(WEEK_A)}</section>
        <section class="card" style="padding: 16px 18px 10px; flex: 1 1 auto"><div class="row" style="gap: 10px; margin-bottom: 6px"><h2 class="h2" style="flex: 1 1 auto">Volume hebdo</h2><span class="faint" style="font-size: 12.5px">12 semaines · km</span></div>${barChart({ values: [28, 32, 35, 38, 42, 45, 40, 48, 50, 46, 52, 38], labels: ['S24', 'S25', 'S26', 'S27', 'S28', 'S29', 'S30', 'S31', 'S32', 'S33', 'S34', 'S35'], w: 760, h: 150, max: 60, grid: [0, 30, 60] })}</section>
      </div>
      <aside style="width: 360px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 20px">
        <section class="card" style="padding: 16px 18px"><div class="row" style="gap: 10px; margin-bottom: 12px">${avatar('MR', 36)}<div style="flex: 1 1 auto; line-height: 1.25"><div style="font-weight: 600">Marc</div><div class="faint" style="font-size: 12px">Ton coach · 09:12</div></div>${softPill('1 nouveau')}</div><div style="padding: 12px 14px; border-radius: 12px; background: ${T.surface2}; font-size: 13.5px; line-height: 1.45">Merci de me le dire. On allège : footing 30′ très tranquille, et on voit dimanche pour la sortie longue selon ton ressenti du matin.</div><div class="row" style="gap: 8px; margin-top: 12px"><div class="input" style="flex: 1 1 auto; height: 38px; font-size: 13px"><span>Répondre à Marc…</span></div><span class="icon-btn" style="width: 38px; height: 38px">${icon('send', 16)}</span></div></section>
        <section class="card" style="padding: 16px 18px"><div class="row" style="gap: 10px; margin-bottom: 10px"><h2 class="h2" style="flex: 1 1 auto">Objectif</h2><span class="faint num" style="font-size: 12.5px">J-226</span></div><div style="font-weight: 600; font-size: 15px">Marathon de Paris</div><div class="muted" style="font-size: 13px; margin-top: 2px">12 avril 2027 · objectif 3 h 15</div><div style="margin-top: 12px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px"><div style="height: 6px; border-radius: 999px; background: ${T.ink}"></div><div style="height: 6px; border-radius: 999px; background: ${T.neutralSoft}"></div><div style="height: 6px; border-radius: 999px; background: ${T.neutralSoft}"></div><div style="height: 6px; border-radius: 999px; background: ${T.neutralSoft}"></div></div><div class="row" style="justify-content: space-between; font-size: 11.5px; color: ${T.ink3}; margin-top: 6px"><span>Développement général</span><span class="num">Semaine 6 / 32</span></div></section>
        <section class="card" style="padding: 16px 18px; flex: 1 1 auto"><div class="row" style="gap: 10px; margin-bottom: 4px"><h2 class="h2" style="flex: 1 1 auto">Mes allures</h2><span class="faint" style="font-size: 12px">VMA 16,5</span></div>${zone('Z2', 'Endurance', '5:45 – 6:00', T.ink3)}${zone('Seuil', 'Allure semi', '4:18 – 4:25', T.ink2)}${zone('VMA', '400 m', '1:27', T.accent)}<div class="row" style="gap: 8px; margin-top: 14px">${record('10 km', '46:12', 'Mai 2026')}${record('Semi', '1 h 41', 'Oct. 2025')}</div></section>
      </aside>
    </div>
  </main></div>`);

  return { AthleteOnboarding: Onboarding, MobileAujourdhui: Aujourdhui, AthleteSeance: SeanceDetail, AthleteCompteRendu: CompteRendu, AthletePlanning: Planning, AthleteProgression: Progression, AthleteCoach: Coach, AthleteProfil: Profil, AthleteWeb: DesktopAthlete };
}
