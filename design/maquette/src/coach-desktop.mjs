// Coach · Desktop screens (1440×900). Returns { name: html } for a given theme.
export function coachDesktop(L) {
  const { T, icon, page, avatar, statusPill, dot, softPill, accentPill, donePill, sidebar, searchBox, barChart, WEEK, chipStyle, chipIcon, weekStrip, checkinDay, metric, kpi, sectionHead, tabs, bubble, sessionCard, composer, ATHLETES, adhBar } = L;
  const shell = (active, inner, pad = '28px 32px') => `<div style="width: 1440px; height: 900px; display: flex; background: ${T.bg}; overflow: hidden">${sidebar(active)}<main style="flex: 1 1 auto; min-width: 0; padding: ${pad}; display: flex; flex-direction: column; gap: 22px">${inner}</main></div>`;
  const header = (title, sub, right) => `<header class="row" style="gap: 16px"><div style="flex: 1 1 auto"><h1 class="h1">${title}</h1>${sub ? `<div class="muted" style="margin-top: 4px">${sub}</div>` : ''}</div>${right}</header>`;
  const primary = (l, ic = 'plus') => `<span class="btn primary">${icon(ic, 18, T.btnPrimaryInk, 2)}${l}</span>`;

  // ---------- Aperçu ----------
  const todoRow = (a, reason, lv, action) => `
  <div class="row" style="gap: 14px; padding: 12px 16px; border-top: 1px solid ${T.line}">
    ${dot(lv, 10)}${avatar(a.i, 32)}
    <div style="flex: 1 1 auto; line-height: 1.3"><div style="font-weight: 600">${a.n}</div><div class="muted" style="font-size: 13px">${reason}</div></div>
    <span class="btn" style="height: 32px; padding: 0 12px; font-size: 13px">${action}</span>
  </div>`;
  const todayRow = (a, s, st) => `
  <div class="row" style="gap: 12px; padding: 10px 0; border-top: 1px solid ${T.line}">
    ${avatar(a.i, 30)}
    <div style="flex: 1 1 auto; line-height: 1.3"><div style="font-weight: 500">${a.n}</div><div class="muted" style="font-size: 12.5px">${s}</div></div>
    ${st === 'done' ? donePill() : softPill('Prévue')}
  </div>`;
  const cols = '1.5fr 0.7fr 1fr 0.95fr 1.35fr 1.15fr';
  const Apercu = page('Kadro — Aperçu coach', shell('apercu', `
    ${header('Bonjour Marc', 'Vendredi 29 août · 3 points à traiter avant les séances du jour', `${searchBox(260)}<span class="icon-btn">${icon('bell', 20)}</span>${primary('Nouvelle séance')}`)}
    <div style="display: flex; gap: 16px">
      ${kpi('Athlètes suivis', '18', '2 groupes · 16 actifs cette semaine')}
      ${kpi('Séances de la semaine', `52 <span style="font-size: 18px; color: ${T.ink3}; font-weight: 500">/ 64</span>`, '12 restantes d’ici dimanche')}
      ${kpi('Adhérence sur 7 jours', '86 %', '+4 pts vs. semaine dernière', T.good)}
      ${kpi('Alertes forme', '3', 'Léa, Karim et Adrien', T.bad)}
    </div>
    <div style="display: flex; gap: 20px; flex: 1 1 auto; min-height: 0">
      <div style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 20px">
        <section class="card">
          ${sectionHead('À traiter', '<a style="font-size: 13px; font-weight: 500">Tout voir</a>')}
          ${todoRow(ATHLETES[0], 'Fatigue signalée 2 jours de suite · sommeil 5 h 30 · courbatures 4/5', 'bad', 'Adapter la séance')}
          ${todoRow(ATHLETES[1], 'Seuil de mardi non réalisé · aucune activité depuis 3 jours', 'warn', 'Écrire')}
          ${todoRow(ATHLETES[2], 'Semi de Lyon dans 9 jours · semaine d’affûtage à valider', 'good', 'Valider')}
        </section>
        <section class="card" style="flex: 1 1 auto; overflow: hidden">
          ${sectionHead('Athlètes', softPill('Tous les groupes', 'filter'))}
          <div style="display: grid; grid-template-columns: ${cols}; gap: 12px; padding: 8px 16px; font-size: 12px; font-weight: 500; color: ${T.ink3}; border-top: 1px solid ${T.line}; border-bottom: 1px solid ${T.line}; background: ${T.surface2}">
            <div>Athlète</div><div>Groupe</div><div>Forme</div><div>Adhérence</div><div>Prochaine séance</div><div>Dernière activité</div>
          </div>
          ${ATHLETES.slice(0, 6).map((a) => `
          <div style="display: grid; grid-template-columns: ${cols}; gap: 12px; align-items: center; padding: 9px 16px; border-bottom: 1px solid ${T.line}; font-size: 13.5px; white-space: nowrap">
            <div class="row" style="gap: 10px">${avatar(a.i, 30)}<span style="font-weight: 500">${a.n}</span></div>
            <div class="muted">${a.g}</div><div>${statusPill(a.lv)}</div><div>${adhBar(a.adh)}</div>
            <div class="ellip">${a.next}</div><div class="muted ellip">${a.last}</div>
          </div>`).join('')}
        </section>
      </div>
      <aside style="width: 380px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 20px">
        <section class="card" style="padding: 14px 16px 6px">
          <div class="row" style="gap: 10px; margin-bottom: 6px"><h2 class="h2" style="flex: 1 1 auto">Aujourd’hui</h2><span class="faint num" style="font-size: 13px">7 séances</span></div>
          ${todayRow(ATHLETES[3], 'Footing 1 h · Z2', 'done')}${todayRow(ATHLETES[2], 'Allure semi 20′ · 4:25/km', 'done')}${todayRow(ATHLETES[0], 'Footing 45′ · Z2', 'planned')}${todayRow(ATHLETES[5], 'Footing 40′', 'planned')}${todayRow(ATHLETES[4], 'Renfo haut du corps', 'planned')}
        </section>
        <section class="card" style="padding: 16px 18px 12px; display: flex; flex-direction: column; gap: 10px">
          <div class="row" style="gap: 10px"><h2 class="h2" style="flex: 1 1 auto">Volume de l’équipe</h2><span class="faint" style="font-size: 12px">8 semaines · km</span></div>
          <div class="num" style="font-size: 28px; font-weight: 600; letter-spacing: -0.03em; line-height: 1">612 km <span style="font-size: 13px; font-weight: 500; color: ${T.ink3}; letter-spacing: 0">semaine en cours</span></div>
          ${barChart({ values: [560, 590, 610, 470, 640, 680, 705, 612], labels: ['S28', 'S29', 'S30', 'S31', 'S32', 'S33', 'S34', 'S35'], w: 340, h: 104, max: 800, grid: [0, 400, 800], annotate: false })}
        </section>
      </aside>
    </div>`));

  // ---------- Athlètes (liste complète) ----------
  const facet = (l, n, on = false) => `<div class="row" style="gap: 8px; height: 36px; padding: 0 12px; border-radius: 9px; font-size: 13.5px; font-weight: 500; color: ${on ? T.ink : T.ink2}; background: ${on ? T.navActive : 'transparent'}"><span style="flex: 1 1 auto">${l}</span><span class="faint num" style="font-size: 12px">${n}</span></div>`;
  const cols2 = '1.5fr 0.7fr 1fr 0.8fr 0.9fr 0.95fr 1.3fr 1.1fr';
  const loadBar = (v) => `<div class="row" style="gap: 8px"><div style="width: 56px; height: 6px; border-radius: 999px; background: ${T.neutralSoft}; overflow: hidden"><div style="width: ${Math.round(v / 70 * 100)}%; height: 100%; background: ${T.accent}"></div></div><span class="num muted">${v}</span></div>`;
  const Athletes = page('Kadro — Athlètes', shell('athletes', `
    ${header('Athlètes', '18 athlètes · 2 groupes actifs', `${searchBox(260)}${primary('Inviter un athlète', 'link')}`)}
    <div style="display: flex; gap: 20px; flex: 1 1 auto; min-height: 0">
      <aside style="width: 200px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 4px">
        <div class="label" style="padding: 4px 12px 6px">Groupes</div>
        ${facet('Tous', 18, true)}${facet('Marathon', 6)}${facet('Semi', 4)}${facet('10 km', 5)}${facet('Trail', 3)}
        <div class="label" style="padding: 16px 12px 6px">Filtres rapides</div>
        ${facet('À traiter', 3)}${facet('Sans check-in 7 j', 2)}${facet('Compétition < 30 j', 6)}
      </aside>
      <section class="card" style="flex: 1 1 auto; min-width: 0; overflow: hidden">
        ${sectionHead('Tous les athlètes', `${softPill('Trier : forme', 'chevronD')}${softPill('Colonnes', 'filter')}`)}
        <div style="display: grid; grid-template-columns: ${cols2}; gap: 12px; padding: 8px 16px; font-size: 12px; font-weight: 500; color: ${T.ink3}; border-top: 1px solid ${T.line}; border-bottom: 1px solid ${T.line}; background: ${T.surface2}">
          <div>Athlète</div><div>Groupe</div><div>Forme</div><div>Sommeil 7 j</div><div>Charge 7 j</div><div>Adhérence</div><div>Prochaine compétition</div><div>Dernière activité</div>
        </div>
        ${ATHLETES.map((a) => `
        <div style="display: grid; grid-template-columns: ${cols2}; gap: 12px; align-items: center; padding: 9px 16px; border-bottom: 1px solid ${T.line}; font-size: 13.5px; white-space: nowrap">
          <div class="row" style="gap: 10px">${avatar(a.i, 30)}<span style="font-weight: 500">${a.n}</span></div>
          <div class="muted">${a.g}</div><div>${statusPill(a.lv)}</div><div class="num muted">${a.sleep}</div><div>${loadBar(a.load)}</div><div>${adhBar(a.adh)}</div>
          <div class="ellip">${a.race}</div><div class="muted ellip">${a.last}</div>
        </div>`).join('')}
        <div class="row" style="padding: 12px 16px; gap: 10px; font-size: 12.5px; color: ${T.ink3}"><span style="flex: 1 1 auto">10 sur 18</span><span class="btn" style="height: 30px; padding: 0 10px; font-size: 12.5px">Charger la suite</span></div>
      </section>
    </div>`));

  // ---------- Fiche athlète ----------
  const sessionRow = (date, name, meta, lv, k = 'run') => `
  <div class="row" style="gap: 14px; padding: 11px 16px; border-top: 1px solid ${T.line}">
    <span style="width: 36px; height: 36px; border-radius: 10px; background: ${T.neutralSoft}; display: inline-flex; align-items: center; justify-content: center; color: ${T.ink2}">${icon(k, 18)}</span>
    <div style="flex: 1 1 auto; line-height: 1.3"><div style="font-weight: 500">${name}</div><div class="muted" style="font-size: 12.5px">${meta}</div></div>
    <div class="faint num" style="font-size: 12.5px; width: 64px">${date}</div>
    <div class="row" style="gap: 6px; width: 96px; justify-content: flex-end; font-size: 12.5px; color: ${T.ink2}">${dot(lv)}Ressenti ${lv === 'bad' ? '2' : lv === 'warn' ? '3' : '4'}/5</div>
  </div>`;
  const FicheAthlete = page('Kadro — Fiche athlète', shell('athletes', `
    <div class="row" style="gap: 6px; font-size: 13px; color: ${T.ink3}"><a style="color: ${T.ink2}">Athlètes</a>${icon('chevron', 14)}<span style="color: ${T.ink}">Léa Martin</span></div>
    <header class="row" style="gap: 18px">
      ${avatar('LM', 56)}
      <div style="flex: 1 1 auto"><h1 class="h1">Léa Martin</h1>
        <div class="row" style="gap: 8px; margin-top: 6px; font-size: 13.5px; color: ${T.ink2}">${statusPill('bad')}<span>Marathon de Paris · 12 avr. 2027 · objectif 3 h 15</span><span class="faint">·</span><span>VMA 16,5 km/h</span><span class="faint">·</span><span>Groupe Marathon</span></div>
      </div>
      <span class="btn">${icon('message', 18)}Message</span>${primary('Planifier une séance')}
    </header>
    ${tabs(['Aperçu', 'Planning', 'Séances', 'Muscu', 'Monitoring', 'Tests', 'Notes'], 'Aperçu')}
    <div style="display: flex; gap: 20px; flex: 1 1 auto; min-height: 0">
      <div style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 16px">
        <section class="card" style="padding: 16px 18px 12px">
          <div class="row" style="gap: 10px; margin-bottom: 10px"><h2 class="h2" style="flex: 1 1 auto">Charge d’entraînement</h2><span class="faint" style="font-size: 12.5px">8 dernières semaines · unités de charge</span></div>
          <div class="row" style="gap: 28px; margin-bottom: 8px">
            ${metric('Cette semaine', `34 <span style="font-size: 12px; font-weight: 500; color: ${T.ink3}">/ 58 prévues</span>`)}${metric('Moyenne 4 sem.', '56')}${metric('Ratio aigu / chronique', '1,12', T.good)}${metric('Volume 7 j', '38,4 km')}
          </div>
          ${barChart({ values: [42, 48, 51, 38, 55, 58, 61, 34], labels: ['S28', 'S29', 'S30', 'S31', 'S32', 'S33', 'S34', 'S35'], w: 700, h: 124 })}
        </section>
        <section class="card" style="padding: 16px 18px 14px">
          <div class="row" style="gap: 10px; margin-bottom: 12px"><h2 class="h2" style="flex: 1 1 auto">Cette semaine</h2><span class="muted num" style="font-size: 12.5px">3 / 5 réalisées</span><span class="faint">·</span><a style="font-size: 13px; font-weight: 500">Ouvrir le planning</a></div>
          ${weekStrip()}
        </section>
        <section class="card" style="flex: 1 1 auto; overflow: hidden">
          ${sectionHead('Dernières séances', '<a style="font-size: 13px; font-weight: 500">Toutes</a>', '12px 16px')}
          ${sessionRow('Jeu 28', 'Renfo bas du corps', '42 min · 6 exercices · charge max 60 kg', 'warn', 'dumbbell')}
          ${sessionRow('Mer 27', 'VMA 10 × 400 m', '12,1 km · 3:38/km sur les 400 · FC moy 168', 'bad')}
          ${sessionRow('Lun 25', 'Footing 50′', '8,4 km · 5:52/km · FC moy 141', 'good')}
        </section>
      </div>
      <aside style="width: 360px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 16px">
        <section class="card" style="padding: 16px 18px">
          <div class="row" style="gap: 10px; margin-bottom: 14px"><h2 class="h2" style="flex: 1 1 auto">Forme</h2><span class="faint" style="font-size: 12.5px">7 derniers jours</span></div>
          <div class="row" style="gap: 4px; margin-bottom: 16px">${checkinDay('Sam', 'good')}${checkinDay('Dim', 'good')}${checkinDay('Lun', 'good')}${checkinDay('Mar', 'warn')}${checkinDay('Mer', 'warn')}${checkinDay('Jeu', 'bad')}${checkinDay('Ven', 'bad', true)}</div>
          <div class="row" style="gap: 10px; padding: 12px 14px; border-radius: 10px; background: ${T.badSoft}; color: ${T.bad}; font-size: 13px; font-weight: 500; line-height: 1.35">${icon('alert', 18, T.bad)}<span>Fatigue signalée 2 jours de suite. Le footing du jour peut être allégé ou décalé.</span></div>
          <div class="row" style="gap: 16px; margin-top: 16px">${metric('Fatigue', '4 / 5', T.bad)}${metric('Sommeil', '5 h 30', T.bad)}${metric('Courbatures', '4 / 5', T.warn)}${metric('Humeur', '3 / 5')}</div>
        </section>
        <section class="card" style="padding: 16px 18px">
          <div class="row" style="gap: 10px; margin-bottom: 12px"><h2 class="h2" style="flex: 1 1 auto">Objectif</h2><span class="faint num" style="font-size: 12.5px">J-226</span></div>
          <div style="font-weight: 600; font-size: 15px">Marathon de Paris</div>
          <div class="muted" style="font-size: 13px; margin-top: 2px">12 avril 2027 · objectif 3 h 15 · réf. 3 h 31 (Nantes 2025)</div>
          <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 6px">
            <div class="row" style="justify-content: space-between; font-size: 12.5px"><span style="font-weight: 500">Développement général</span><span class="faint num">Semaine 6 / 32</span></div>
            <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px"><div style="height: 6px; border-radius: 999px; background: ${T.ink}"></div><div style="height: 6px; border-radius: 999px; background: ${T.neutralSoft}"></div><div style="height: 6px; border-radius: 999px; background: ${T.neutralSoft}"></div><div style="height: 6px; border-radius: 999px; background: ${T.neutralSoft}"></div></div>
            <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; font-size: 11px; color: ${T.ink3}"><span>Général</span><span>Spécifique</span><span>Compétition</span><span>Affûtage</span></div>
          </div>
        </section>
        <section class="card" style="padding: 16px 18px; flex: 1 1 auto">
          <div class="row" style="gap: 10px; margin-bottom: 10px"><h2 class="h2" style="flex: 1 1 auto">Notes</h2><a style="font-size: 13px; font-weight: 500">Ajouter</a></div>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; line-height: 1.45">
            <div style="padding: 10px 12px; border-radius: 10px; background: ${T.surface2}"><div class="faint" style="font-size: 11.5px; margin-bottom: 2px">Mer 27 août</div>Gêne tendon d’Achille droit après la VMA. Surveiller sur la sortie longue, prévoir du mollet excentrique.</div>
            <div style="padding: 10px 12px; border-radius: 10px; background: ${T.surface2}"><div class="faint" style="font-size: 11.5px; margin-bottom: 2px">Lun 18 août</div>Test VMA : 16,5 km/h (+0,5). Allures recalculées.</div>
          </div>
        </section>
      </aside>
    </div>`, '24px 32px 24px'));

  // ---------- Planning équipe (semaine) ----------
  const cell = (s) => s ? `<div class="row" style="gap: 6px; padding: 7px 8px; border-radius: 8px; font-size: 11.5px; font-weight: 500; min-width: 0; ${chipStyle(s.st)}">${chipIcon(s, 13)}<span class="ellip">${s.t}</span></div>` : '';
  const PLAN = [
    ['LM', 'Léa Martin', 'bad', [{ t: 'Footing 50′', st: 'done', k: 'run' }, null, { t: 'VMA 10×400', st: 'done', k: 'run' }, { t: 'Renfo bas', st: 'done', k: 'dumbbell' }, { t: 'Footing 45′', st: 'today', k: 'run' }, null, { t: 'SL 1 h 45', st: 'planned', k: 'run' }]],
    ['KD', 'Karim Diallo', 'warn', [null, { t: 'Seuil 3×8′', st: 'missed', k: 'run' }, null, { t: 'Footing 40′', st: 'missed', k: 'run' }, null, { t: 'Seuil 3×8′', st: 'planned', k: 'run' }, { t: 'Footing 1 h', st: 'planned', k: 'run' }]],
    ['NS', 'Nora Saidi', 'good', [{ t: 'Footing 45′', st: 'done', k: 'run' }, { t: 'VMA 6×500', st: 'done', k: 'run' }, null, { t: 'Footing 40′', st: 'done', k: 'run' }, { t: 'Allure semi 20′', st: 'done', k: 'run' }, null, { t: 'Footing 50′', st: 'planned', k: 'run' }]],
    ['TB', 'Théo Bernard', 'good', [{ t: 'Footing 1 h', st: 'done', k: 'run' }, { t: 'Renfo', st: 'done', k: 'dumbbell' }, { t: 'Seuil 2×15′', st: 'done', k: 'run' }, null, { t: 'Footing 1 h', st: 'done', k: 'run' }, { t: 'Renfo', st: 'planned', k: 'dumbbell' }, { t: 'SL 2 h', st: 'planned', k: 'run' }]],
    ['SR', 'Sofia Rossi', 'good', [{ t: 'Footing 50′', st: 'done', k: 'run' }, null, { t: 'Côtes 12×45″', st: 'done', k: 'run' }, null, { t: 'Renfo haut', st: 'today', k: 'dumbbell' }, { t: 'Côtes 12×45″', st: 'planned', k: 'run' }, { t: 'Trail 2 h 30', st: 'planned', k: 'mountain' }]],
    ['AP', 'Adrien Petit', 'none', [{ t: 'Footing 40′', st: 'missed', k: 'run' }, null, { t: 'VMA 8×300', st: 'missed', k: 'run' }, null, { t: 'Footing 40′', st: 'today', k: 'run' }, null, { t: 'Footing 50′', st: 'planned', k: 'run' }]],
    ['MO', 'Maya Okafor', 'good', [null, { t: 'Footing 45′', st: 'done', k: 'run' }, { t: 'Seuil 4×6′', st: 'done', k: 'run' }, null, { t: 'Footing 40′', st: 'done', k: 'run' }, { t: 'Footing 1 h', st: 'planned', k: 'run' }, null]],
    ['CL', 'Clara Lopez', 'good', [{ t: 'Footing 1 h', st: 'done', k: 'run' }, { t: 'VMA 10×400', st: 'done', k: 'run' }, null, { t: 'Renfo', st: 'done', k: 'dumbbell' }, { t: 'Seuil 2×15′', st: 'today', k: 'run' }, null, { t: 'SL 1 h 50', st: 'planned', k: 'run' }]],
  ];
  const legend = (st, l) => `<span class="row" style="gap: 6px; font-size: 12px; color: ${T.ink2}"><span style="width: 14px; height: 14px; border-radius: 4px; ${chipStyle(st)}"></span>${l}</span>`;
  const Planning = page('Kadro — Planning équipe', shell('planning', `
    ${header('Planning', 'Semaine 35 · 25 – 31 août · 52 / 64 séances réalisées', `<div class="row" style="gap: 0; border: 1px solid ${T.lineStrong}; border-radius: 10px; overflow: hidden; height: 40px"><span class="row" style="padding: 0 14px; height: 100%; font-weight: 500; background: ${T.navActive}">Semaine</span><span class="row" style="padding: 0 14px; height: 100%; font-weight: 500; color: ${T.ink2}">Mois</span></div><div class="row" style="gap: 4px"><span class="icon-btn">${icon('chevronL', 18)}</span><span class="btn" style="height: 40px">Aujourd’hui</span><span class="icon-btn">${icon('chevron', 18)}</span></div><span class="btn">${icon('layers', 18)}Assigner un modèle</span>${primary('Nouvelle séance')}`)}
    <section class="card" style="flex: 1 1 auto; overflow: hidden; display: flex; flex-direction: column">
      <div style="display: grid; grid-template-columns: 200px repeat(7, minmax(0, 1fr)); border-bottom: 1px solid ${T.line}; background: ${T.surface2}">
        <div class="row" style="padding: 10px 16px; gap: 8px">${softPill('Tous les groupes', 'filter')}</div>
        ${WEEK.map((w) => `<div style="padding: 10px 10px; font-size: 12.5px; border-left: 1px solid ${T.line}; color: ${w.today ? T.accentInk : T.ink2}"><span style="font-weight: 600">${w.d}</span> <span class="num">${w.n}</span>${w.today ? `<span class="pill" style="margin-left: 8px; height: 18px; padding: 0 6px; font-size: 10.5px; background: ${T.accentSoft}; color: ${T.accentInk}">Aujourd’hui</span>` : ''}</div>`).join('')}
      </div>
      ${PLAN.map(([i, n, lv, days]) => `
      <div style="display: grid; grid-template-columns: 200px repeat(7, minmax(0, 1fr)); border-bottom: 1px solid ${T.line}; flex: 1 1 0; min-height: 0">
        <div class="row" style="gap: 10px; padding: 0 16px">${avatar(i, 30)}<div style="line-height: 1.25; min-width: 0"><div class="ellip" style="font-weight: 500; font-size: 13.5px">${n}</div><div class="row" style="gap: 5px; font-size: 11.5px; color: ${T.ink3}">${dot(lv, 7)}${L.LEVEL[lv][0]}</div></div></div>
        ${days.map((s, di) => `<div style="padding: 8px; border-left: 1px solid ${T.line}; background: ${WEEK[di].today ? (T.mode === 'dark' ? '#141A24' : '#F8FAFF') : 'transparent'}; display: flex; flex-direction: column; justify-content: center">${cell(s)}</div>`).join('')}
      </div>`).join('')}
      <div class="row" style="gap: 18px; padding: 10px 16px">${legend('done', 'Réalisée')}${legend('today', 'Aujourd’hui')}${legend('planned', 'Prévue')}${legend('missed', 'Manquée')}<span style="flex: 1 1 auto"></span><span class="faint" style="font-size: 12px">Glisser une séance pour la déplacer · double-clic pour l’ouvrir</span></div>
    </section>`));

  // ---------- Bibliothèque ----------
  const tplRow = (name, meta, on = false, k = 'run') => `<div class="row" style="gap: 12px; padding: 10px 12px; border-radius: 10px; background: ${on ? T.navActive : 'transparent'}"><span style="width: 32px; height: 32px; border-radius: 8px; background: ${T.neutralSoft}; display: inline-flex; align-items: center; justify-content: center; color: ${T.ink2}">${icon(k, 16)}</span><div style="flex: 1 1 auto; min-width: 0; line-height: 1.3"><div class="ellip" style="font-weight: 500; font-size: 13.5px">${name}</div><div class="faint ellip" style="font-size: 12px">${meta}</div></div></div>`;
  const group = (l) => `<div class="label" style="padding: 12px 12px 4px">${l}</div>`;
  const blockRow = (t, d, m, rep = '') => `<div class="row" style="gap: 12px; padding: 11px 0; border-top: 1px solid ${T.line}"><div style="width: 6px; height: 36px; border-radius: 99px; background: ${m}"></div><div style="flex: 1 1 auto; line-height: 1.3"><div style="font-weight: 500">${t}</div><div class="muted" style="font-size: 12.5px">${d}</div></div>${rep ? accentPill(rep, 'repeat') : ''}</div>`;
  const paceRow = (i, n, vma, p400, rec) => `<div style="display: grid; grid-template-columns: 1.4fr 0.8fr 1fr 1fr; gap: 12px; align-items: center; padding: 8px 0; border-top: 1px solid ${T.line}; font-size: 13px"><div class="row" style="gap: 8px">${avatar(i, 26)}<span style="font-weight: 500">${n}</span></div><span class="num muted">${vma} km/h</span><span class="num" style="font-weight: 600">${p400}</span><span class="num muted">${rec}</span></div>`;
  const Bibliotheque = page('Kadro — Bibliothèque', shell('bib', `
    ${header('Bibliothèque de séances', '24 modèles · réutilisables pour tous vos athlètes', `${searchBox(260, 'Rechercher un modèle')}${primary('Nouveau modèle')}`)}
    <div style="display: flex; gap: 20px; flex: 1 1 auto; min-height: 0">
      <section class="card" style="width: 320px; flex: 0 0 auto; padding: 8px; overflow: hidden">
        ${group('Endurance')}${tplRow('Footing Z2', '30 – 60′ · aisance respiratoire')}${tplRow('Sortie longue progressive', '1 h 30 – 2 h 15 · fin en Z3')}
        ${group('VMA')}${tplRow('VMA 10 × 400 m', '100 % VMA · récup 1′ trot', true)}${tplRow('VMA 8 × 300 m', '105 % VMA · récup 1′')}${tplRow('30 / 30', '2 × 8 × (30″ / 30″)')}
        ${group('Seuil')}${tplRow('Seuil 3 × 8′', '85 – 88 % VMA · récup 2′')}${tplRow('Seuil 2 × 15′', 'allure semi · récup 3′')}
        ${group('Renforcement')}${tplRow('Renfo bas du corps', '6 exercices · 3 séries', false, 'dumbbell')}${tplRow('Gainage & pied', '20′ · circuit', false, 'dumbbell')}
      </section>
      <section class="card" style="flex: 1 1 auto; min-width: 0; padding: 20px 24px; display: flex; flex-direction: column; gap: 14px">
        <div class="row" style="gap: 12px">
          <div style="flex: 1 1 auto"><div class="row" style="gap: 8px">${accentPill('VMA', 'run')}${softPill('Difficulté attendue 8 / 10')}<span class="faint" style="font-size: 12.5px">Utilisé 34 fois · dernière fois mer. 27 août</span></div><h2 style="font-size: 22px; font-weight: 600; letter-spacing: -0.02em; margin: 8px 0 0">VMA 10 × 400 m</h2><div class="muted" style="font-size: 13.5px; margin-top: 2px">≈ 55 min · 12 km · intensité élevée</div></div>
          <span class="btn">${icon('copy', 18)}Dupliquer</span><span class="btn">${icon('edit', 18)}Modifier</span>${primary('Assigner à…', 'users')}
        </div>
        <div style="display: flex; gap: 24px; flex: 1 1 auto; min-height: 0">
          <div style="flex: 1 1 0; min-width: 0">
            <div class="label" style="margin-bottom: 4px">Structure</div>
            ${blockRow('Échauffement · 15′', 'Trot lent + 3 lignes droites', T.lineStrong)}
            ${blockRow('400 m à 100 % VMA', 'Récupération 1′ en trot', T.accent, '× 10')}
            ${blockRow('Retour au calme · 10′', 'Trot très lent, étirements légers', T.lineStrong)}
            <div class="label" style="margin: 18px 0 4px">Consigne affichée à l’athlète</div>
            <div style="padding: 12px 14px; border-radius: 10px; background: ${T.surface2}; font-size: 13.5px; line-height: 1.45">Les 3 premiers 400 en contrôle, régularité avant tout. Si la respiration s’emballe avant le 6ᵉ, allonge la récup à 1′15.</div>
          </div>
          <div style="width: 380px; flex: 0 0 auto">
            <div class="label" style="margin-bottom: 4px">Allures individualisées <span class="faint" style="font-weight: 400">· calculées depuis la VMA</span></div>
            <div style="display: grid; grid-template-columns: 1.4fr 0.8fr 1fr 1fr; gap: 12px; padding: 6px 0; font-size: 11.5px; color: ${T.ink3}"><span>Athlète</span><span>VMA</span><span>400 m</span><span>Allure</span></div>
            ${paceRow('LM', 'Léa Martin', '16,5', '1:27', '3:38 /km')}${paceRow('TB', 'Théo Bernard', '17,5', '1:22', '3:26 /km')}${paceRow('CL', 'Clara Lopez', '17,0', '1:25', '3:32 /km')}${paceRow('YA', 'Yanis Amrani', '18,0', '1:20', '3:20 /km')}
            <div class="faint" style="font-size: 12px; margin-top: 12px; line-height: 1.4">Chaque athlète voit sa propre allure cible sur sa montre et dans l’app.</div>
          </div>
        </div>
      </section>
    </div>`));

  // ---------- Éditeur de séance ----------
  const field = (l, v, w = 'auto', ic = '') => `<div class="col" style="gap: 6px; width: ${w}"><span class="label">${l}</span><div class="input" style="color: ${T.ink}">${ic ? icon(ic, 16, T.ink3) : ''}<span style="flex: 1 1 auto">${v}</span>${ic === '' ? icon('chevronD', 16, T.ink3) : ''}</div></div>`;
  const editBlock = (t, d, m, rep = '', on = false) => `<div class="row" style="gap: 10px; padding: 12px 12px; border-radius: 12px; border: 1px solid ${on ? T.accent : T.line}; background: ${T.surface}">${icon('drag', 18, T.ink3)}<div style="width: 6px; height: 36px; border-radius: 99px; background: ${m}"></div><div style="flex: 1 1 auto; line-height: 1.3"><div style="font-weight: 500">${t}</div><div class="muted" style="font-size: 12.5px">${d}</div></div>${rep ? accentPill(rep, 'repeat') : ''}<span class="icon-btn" style="width: 32px; height: 32px; border: 0; background: transparent">${icon('more', 18)}</span></div>`;
  const assignRow = (i, n, on) => `<div class="row" style="gap: 10px; padding: 8px 0; font-size: 13.5px"><span style="width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid ${on ? T.accent : T.lineStrong}; background: ${on ? T.accent : 'transparent'}; display: inline-flex; align-items: center; justify-content: center">${on ? icon('check', 12, '#fff', 3) : ''}</span>${avatar(i, 26)}<span style="flex: 1 1 auto; font-weight: 500">${n}</span></div>`;
  const Editeur = page('Kadro — Éditeur de séance', shell('bib', `
    <div class="row" style="gap: 6px; font-size: 13px; color: ${T.ink3}"><a style="color: ${T.ink2}">Bibliothèque</a>${icon('chevron', 14)}<span style="color: ${T.ink}">Nouvelle séance</span></div>
    ${header('Nouvelle séance', '', `<span class="btn">Annuler</span><span class="btn">${icon('library', 18)}Enregistrer comme modèle</span>${primary('Assigner', 'check')}`)}
    <div style="display: flex; gap: 20px; flex: 1 1 auto; min-height: 0">
      <section class="card" style="flex: 1 1 auto; min-width: 0; padding: 20px 24px; display: flex; flex-direction: column; gap: 18px; overflow: hidden">
        <div class="row" style="gap: 14px">${field('Nom de la séance', 'Seuil 3 × 8′', '1 1 auto', 'edit').replace('width: 1 1 auto', 'flex: 1 1 auto')}${field('Type', 'Course à pied', '180px')}${field('Intensité', 'Seuil · 85 – 88 % VMA', '220px')}</div>
        <div class="row" style="gap: 14px"><div class="col" style="gap: 6px; flex: 1 1 auto"><span class="label">Difficulté attendue <span class="faint" style="font-weight: 400">· ce que l’athlète doit ressentir, comparé à son RPE après la séance</span></span><div class="row" style="gap: 6px">${[1,2,3,4,5,6,7,8,9,10].map((n) => `<span class="num" style="width: 40px; height: 36px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; ${n === 7 ? `background: ${T.btnPrimaryBg}; color: ${T.btnPrimaryInk}` : `background: ${T.surface}; color: ${T.ink2}; border: 1px solid ${T.line}`}">${n}</span>`).join('')}<span class="muted" style="font-size: 13px; margin-left: 8px">7 · dur mais tenable, le dernier bloc doit rester propre</span></div></div></div>
        <div class="col" style="gap: 10px; flex: 1 1 auto; min-height: 0">
          <div class="row" style="gap: 10px"><span class="label" style="flex: 1 1 auto">Blocs</span><span class="faint" style="font-size: 12px">≈ 52 min · 11 km</span></div>
          ${editBlock('Échauffement · 15′', 'Z1 – Z2 · trot lent + 3 lignes droites', T.lineStrong)}
          ${editBlock('8′ à allure seuil', '85 – 88 % VMA · récupération 2′ en trot', T.accent, '× 3', true)}
          ${editBlock('Retour au calme · 10′', 'Z1 · marche puis étirements', T.lineStrong)}
          <div class="row" style="gap: 10px; margin-top: 4px"><span class="btn" style="height: 36px; font-size: 13px">${icon('plus', 16)}Bloc</span><span class="btn" style="height: 36px; font-size: 13px">${icon('repeat', 16)}Répétition</span><span class="btn" style="height: 36px; font-size: 13px">${icon('library', 16)}Depuis un modèle</span></div>
        </div>
        <div class="row" style="gap: 10px; padding: 10px 12px; border-radius: 10px; background: ${T.surface2}; font-size: 13px">${icon('clock', 16, T.ink2)}<span style="flex: 1 1 auto">Envoyée sur la montre de chaque athlète la veille à 20 h, avec ses allures</span>${donePill('Activé')}</div>
        <div class="col" style="gap: 6px"><span class="label">Consigne pour l’athlète</span><div class="input" style="height: 64px; align-items: flex-start; padding: 10px 12px; color: ${T.ink}">Tenir une allure régulière sur les trois blocs : le dernier doit être le plus facile mentalement, pas le plus rapide.</div></div>
      </section>
      <aside style="width: 380px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 16px">
        <section class="card" style="padding: 16px 18px">
          <div class="row" style="gap: 10px; margin-bottom: 10px"><h2 class="h2" style="flex: 1 1 auto">Assigner à</h2><span class="faint" style="font-size: 12.5px">3 sélectionnés</span></div>
          ${assignRow('LM', 'Léa Martin', true)}${assignRow('TB', 'Théo Bernard', true)}${assignRow('CL', 'Clara Lopez', true)}${assignRow('NS', 'Nora Saidi', false)}${assignRow('MO', 'Maya Okafor', false)}
          <div class="row" style="gap: 10px; margin-top: 8px">${field('Date', 'Sam 30 août', '1 1 auto', 'calendar').replace('width: 1 1 auto', 'flex: 1 1 auto')}</div>
        </section>
        <section class="card" style="padding: 16px 18px; flex: 1 1 auto">
          <div class="row" style="gap: 10px; margin-bottom: 8px"><h2 class="h2" style="flex: 1 1 auto">Aperçu · Léa Martin</h2><span class="faint" style="font-size: 12.5px">VMA 16,5</span></div>
          <div style="display: flex; flex-direction: column; gap: 0; font-size: 13px">
            <div class="row" style="justify-content: space-between; padding: 8px 0; border-top: 1px solid ${T.line}"><span class="muted">Allure seuil</span><span class="num" style="font-weight: 600">4:18 – 4:25 /km</span></div>
            <div class="row" style="justify-content: space-between; padding: 8px 0; border-top: 1px solid ${T.line}"><span class="muted">Distance par bloc</span><span class="num" style="font-weight: 600">≈ 1,85 km</span></div>
            <div class="row" style="justify-content: space-between; padding: 8px 0; border-top: 1px solid ${T.line}"><span class="muted">FC cible</span><span class="num" style="font-weight: 600">160 – 168 bpm</span></div>
            <div class="row" style="justify-content: space-between; padding: 8px 0; border-top: 1px solid ${T.line}"><span class="muted">Charge estimée</span><span class="num" style="font-weight: 600">14 UA</span></div>
          </div>
          <div class="row" style="gap: 10px; margin-top: 14px; padding: 10px 12px; border-radius: 10px; background: ${T.warnSoft}; color: ${T.warn}; font-size: 12.5px; font-weight: 500; line-height: 1.35">${icon('alert', 16, T.warn)}<span>Léa est en fatigue depuis 2 jours : la charge de la semaine passerait à 1,28.</span></div>
        </section>
      </aside>
    </div>`, '24px 32px 24px'));

  // ---------- Messages ----------
  const convo = (i, n, last, time, unread = 0, on = false) => `<div class="row" style="gap: 12px; padding: 12px 14px; border-radius: 12px; background: ${on ? T.navActive : 'transparent'}">${avatar(i, 40)}<div style="flex: 1 1 auto; min-width: 0; line-height: 1.3"><div class="row" style="gap: 8px"><span class="ellip" style="font-weight: ${unread ? 600 : 500}; flex: 1 1 auto">${n}</span><span class="faint num" style="font-size: 11.5px">${time}</span></div><div class="row" style="gap: 8px"><span class="ellip muted" style="font-size: 13px; flex: 1 1 auto; ${unread ? `color: ${T.ink}` : ''}">${last}</span>${unread ? `<span class="pill num" style="height: 18px; padding: 0 6px; background: ${T.accent}; color: #fff; font-size: 11px">${unread}</span>` : ''}</div></div></div>`;
  const Messages = page('Kadro — Messages', `<div style="width: 1440px; height: 900px; display: flex; background: ${T.bg}; overflow: hidden">${sidebar('msg')}
    <section style="width: 340px; flex: 0 0 auto; border-right: 1px solid ${T.line}; background: ${T.surface}; display: flex; flex-direction: column; padding: 24px 12px 12px; gap: 10px">
      <div class="row" style="gap: 10px; padding: 0 8px"><h1 class="h1" style="flex: 1 1 auto; font-size: 22px">Messages</h1><span class="icon-btn" style="width: 36px; height: 36px">${icon('edit', 18)}</span></div>
      <div style="padding: 0 4px">${searchBox(300, 'Rechercher')}</div>
      <div class="col" style="gap: 2px">
        ${convo('LM', 'Léa Martin', 'Ok pour alléger, je fais 30′ tranquille 🙂'.replace(' 🙂', ''), '09:12', 1, true)}
        ${convo('KD', 'Karim Diallo', 'Vous : Tout va bien ? Pas d’activité depuis mardi', 'Hier')}
        ${convo('NS', 'Nora Saidi', 'Merci pour le plan d’affûtage !', 'Hier', 1)}
        ${convo('TB', 'Théo Bernard', 'Vous : Belle sortie longue, bien géré', 'Mer.')}
        ${convo('SR', 'Sofia Rossi', 'Je peux décaler les côtes à dimanche ?', 'Mer.', 2)}
        ${convo('CL', 'Clara Lopez', 'Vous : On refait un test VMA mi-septembre', 'Mar.')}
        ${convo('JL', 'Jules Lefebvre', 'Photo envoyée', 'Lun.', 1)}
      </div>
    </section>
    <main style="flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column">
      <div class="row" style="gap: 12px; padding: 18px 28px; border-bottom: 1px solid ${T.line}; background: ${T.surface}">${avatar('LM', 40)}<div style="flex: 1 1 auto; line-height: 1.25"><div style="font-weight: 600; font-size: 15px">Léa Martin</div><div class="row" style="gap: 6px; font-size: 12.5px; color: ${T.ink2}">${dot('bad', 7)}Fatigue · Footing 45′ prévu aujourd’hui</div></div><span class="btn">${icon('user', 18)}Voir la fiche</span><span class="btn">${icon('calendar', 18)}Planning</span></div>
      <div style="flex: 1 1 auto; padding: 24px 28px; display: flex; flex-direction: column; gap: 14px; overflow: hidden">
        <div class="faint" style="text-align: center; font-size: 12px">Jeudi 28 août</div>
        ${bubble('Coach, j’ai les jambes lourdes depuis la VMA de mercredi et j’ai mal dormi. Je fais quoi demain ?', false, '21:40')}
        ${bubble('Merci de me le dire. On allège : footing 30′ très tranquille, et on voit dimanche pour la sortie longue selon ton ressenti du matin.', true, '22:05')}
        <div style="display: flex; justify-content: flex-end">${sessionCard('Footing 30′ · Z1', 'Ven 29 août · modifié depuis « Footing 45′ »', 'today')}</div>
        <div class="faint" style="text-align: center; font-size: 12px">Aujourd’hui</div>
        ${bubble('Ok pour alléger, je fais 30′ tranquille. Le tendon va mieux ce matin.', false, '09:12')}
      </div>
      <div style="padding: 14px 28px 24px; border-top: 1px solid ${T.line}; background: ${T.surface}">${composer()}</div>
    </main>
    <aside style="width: 300px; flex: 0 0 auto; border-left: 1px solid ${T.line}; background: ${T.surface}; padding: 24px 20px; display: flex; flex-direction: column; gap: 18px">
      <div class="col" style="align-items: center; gap: 8px; padding-top: 8px">${avatar('LM', 64)}<div style="font-weight: 600; font-size: 16px">Léa Martin</div><div class="muted" style="font-size: 12.5px">Marathon · VMA 16,5 · J-226</div>${statusPill('bad')}</div>
      <div class="col" style="gap: 0; font-size: 13px">
        <div class="row" style="justify-content: space-between; padding: 9px 0; border-top: 1px solid ${T.line}"><span class="muted">Sommeil ce matin</span><span class="num" style="font-weight: 600; color: ${T.bad}">5 h 30</span></div>
        <div class="row" style="justify-content: space-between; padding: 9px 0; border-top: 1px solid ${T.line}"><span class="muted">Charge 7 j</span><span class="num" style="font-weight: 600">34 UA</span></div>
        <div class="row" style="justify-content: space-between; padding: 9px 0; border-top: 1px solid ${T.line}"><span class="muted">Adhérence</span><span class="num" style="font-weight: 600">92 %</span></div>
        <div class="row" style="justify-content: space-between; padding: 9px 0; border-top: 1px solid ${T.line}; border-bottom: 1px solid ${T.line}"><span class="muted">Prochaine séance</span><span style="font-weight: 600">Aujourd’hui · 30′</span></div>
      </div>
      <div class="col" style="gap: 8px"><span class="label">Partager dans la conversation</span><span class="btn" style="justify-content: flex-start">${icon('run', 18)}Une séance</span><span class="btn" style="justify-content: flex-start">${icon('library', 18)}Un modèle</span><span class="btn" style="justify-content: flex-start">${icon('note', 18)}Une note</span></div>
    </aside>
  </div>`);

  // ---------- Équipe & réglages ----------
  const settingRow = (l, v, action = '') => `<div class="row" style="gap: 12px; padding: 12px 0; border-top: 1px solid ${T.line}; font-size: 13.5px"><span style="flex: 1 1 auto">${l}</span><span class="muted">${v}</span>${action ? `<span class="btn" style="height: 32px; padding: 0 12px; font-size: 13px">${action}</span>` : icon('chevron', 16, T.ink3)}</div>`;
  const groupRow = (n, count, members) => `<div class="row" style="gap: 12px; padding: 12px 0; border-top: 1px solid ${T.line}"><div style="flex: 1 1 auto; line-height: 1.3"><div style="font-weight: 500">${n}</div><div class="faint" style="font-size: 12.5px">${count} athlètes</div></div><div class="row" style="gap: -6px">${members.map((m, i) => `<span style="margin-left: ${i ? '-8px' : 0}; border: 2px solid ${T.surface}; border-radius: 99px">${avatar(m, 28)}</span>`).join('')}</div>${icon('chevron', 16, T.ink3)}</div>`;
  const Equipe = page('Kadro — Équipe & réglages', shell('team', `
    ${header('Équipe & réglages', 'Invitations, groupes, abonnement et intégrations', `${primary('Inviter un athlète', 'link')}`)}
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; flex: 1 1 auto; min-height: 0; align-content: start">
      <section class="card" style="padding: 18px 20px; display: flex; flex-direction: column; gap: 14px">
        <div><h2 class="h2">Inviter des athlètes</h2><div class="muted" style="font-size: 13px; margin-top: 2px">L’athlète installe l’app, entre le code, et apparaît dans votre liste.</div></div>
        <div class="row" style="gap: 14px">
          <div style="width: 96px; height: 96px; border-radius: 12px; border: 1px solid ${T.line}; display: flex; align-items: center; justify-content: center; color: ${T.ink3}">${icon('qr', 48, T.ink2, 1.5)}</div>
          <div class="col" style="gap: 8px; flex: 1 1 auto">
            <div class="col" style="gap: 4px"><span class="label">Code coach</span><div class="row" style="gap: 8px"><span class="num" style="font-size: 26px; font-weight: 600; letter-spacing: 0.08em">KDR-7K2M</span><span class="icon-btn" style="width: 32px; height: 32px">${icon('copy', 16)}</span></div></div>
            <div class="row" style="gap: 8px"><div class="input" style="flex: 1 1 auto; height: 36px; font-size: 13px">${icon('link', 16)}<span class="ellip">kadro-app.com/rejoindre/KDR-7K2M</span></div><span class="btn" style="height: 36px; font-size: 13px">Copier</span></div>
          </div>
        </div>
        <div class="col">${settingRow('Invitations en attente', '2 · Inès B., Marc T.', 'Relancer')}</div>
      </section>
      <section class="card" style="padding: 18px 20px">
        <div class="row" style="gap: 10px; margin-bottom: 4px"><h2 class="h2" style="flex: 1 1 auto">Groupes</h2><a style="font-size: 13px; font-weight: 500">Nouveau groupe</a></div>
        ${groupRow('Marathon', 6, ['LM', 'TB', 'CL'])}${groupRow('Semi', 4, ['NS', 'MO'])}${groupRow('10 km', 5, ['KD', 'AP', 'YA'])}${groupRow('Trail', 3, ['SR', 'JL'])}
      </section>
      <section class="card" style="padding: 18px 20px">
        <div class="row" style="gap: 10px; margin-bottom: 4px"><h2 class="h2" style="flex: 1 1 auto">Abonnement</h2>${accentPill('Coach Pro')}</div>
        <div class="row" style="gap: 16px; padding: 10px 0 12px">${metric('Athlètes', '18 <span style="font-size: 12px; font-weight: 500; color: ' + T.ink3 + '">/ 25</span>')}${metric('Renouvellement', '1ᵉʳ sept.')}${metric('Tarif', '39 € / mois HT')}</div>
        <div style="height: 6px; border-radius: 999px; background: ${T.neutralSoft}; overflow: hidden"><div style="width: 72%; height: 100%; background: ${T.ink}"></div></div>
        <div class="col" style="margin-top: 8px">${settingRow('Facturation', 'Carte •••• 4242', 'Gérer')}${settingRow('Passer à Structure · 80 athlètes, 3 coachs', '89 € / mois', 'Voir les tarifs')}</div>
      </section>
      <section class="card" style="padding: 18px 20px">
        <h2 class="h2" style="margin-bottom: 4px">Intégrations & compte</h2>
        <div class="col">
          <div class="row" style="gap: 12px; padding: 12px 0; border-top: 1px solid ${T.line}; font-size: 13.5px"><span style="flex: 1 1 auto">Montres · Garmin, Coros, Polar, Suunto, Apple Watch</span>${donePill('16 athlètes reliés')}</div>
          ${settingRow('Intégrations & envoi sur montre', '58 séances envoyées cette semaine · 1 échec', 'Gérer')}
          <div class="row" style="gap: 12px; padding: 12px 0; border-top: 1px solid ${T.line}; font-size: 13.5px"><span style="flex: 1 1 auto">Strava</span>${donePill('Connecté · 16 athlètes')}</div>
          ${settingRow('Alertes de forme', 'Rouge 2 j de suite · séance manquée')}${settingRow('Profil coach', 'Marc · diplôme affiché aux athlètes')}${settingRow('Sécurité', 'Mot de passe · 2FA activée')}
        </div>
      </section>
    </div>`));

  return { Main: Apercu, Athletes, FicheAthlete, Planning, Bibliotheque, Editeur, Messages, Equipe };
}
