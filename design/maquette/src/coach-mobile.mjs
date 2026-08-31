// Coach · Mobile screens (390×844).
export function coachMobile(L) {
  const { T, icon, page, avatar, statusPill, dot, softPill, donePill, searchBox, barChart, WEEK, chipStyle, chipIcon, miniWeek, checkinDay, mMetric, sectionHead, tabBar, COACH_TABS, phone, mHeader, stickyBar, bubble, sessionCard, composer, ATHLETES } = L;
  const top = (extra = '') => `padding: 56px 20px 0; ${extra}`;

  // Aperçu
  const mk = (l, v, c = T.ink) => `<div class="card" style="padding: 12px 14px; display: flex; flex-direction: column; gap: 2px"><span class="faint" style="font-size: 12px">${l}</span><span class="num" style="font-size: 22px; font-weight: 600; letter-spacing: -0.02em; color: ${c}">${v}</span></div>`;
  const todo = (a, why, lv) => `<div class="row" style="gap: 12px; padding: 12px 14px; border-top: 1px solid ${T.line}">${dot(lv, 9)}${avatar(a.i, 34)}<div style="flex: 1 1 auto; min-width: 0; line-height: 1.3"><div style="font-weight: 600; font-size: 14px">${a.n}</div><div class="muted ellip" style="font-size: 12.5px">${why}</div></div>${icon('chevron', 16, T.ink3)}</div>`;
  const today = (a, s, st) => `<div class="row" style="gap: 12px; padding: 10px 14px; border-top: 1px solid ${T.line}">${avatar(a.i, 30)}<div style="flex: 1 1 auto; min-width: 0; line-height: 1.3"><div style="font-weight: 500; font-size: 13.5px">${a.n}</div><div class="muted ellip" style="font-size: 12px">${s}</div></div>${st === 'done' ? donePill() : softPill('Prévue')}</div>`;
  const Apercu = page('Kadro — Aperçu coach (mobile)', phone(`
  <div style="${top('display: flex; flex-direction: column; gap: 14px')}">
    <div class="row" style="gap: 12px"><div style="flex: 1 1 auto"><div class="faint" style="font-size: 13px">Vendredi 29 août</div><h1 class="h1" style="font-size: 26px; margin-top: 2px">Bonjour Marc</h1></div><span class="icon-btn">${icon('bell', 20)}</span></div>
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">${mk('Séances cette semaine', '52 / 64')}${mk('Alertes forme', '3', T.bad)}</div>
    <section class="card" style="overflow: hidden">${sectionHead('À traiter', `<span class="faint num" style="font-size: 12.5px">3</span>`, '12px 14px')}${todo(ATHLETES[0], 'Fatigue 2 j de suite · sommeil 5 h 30', 'bad')}${todo(ATHLETES[1], 'Seuil non réalisé · inactif depuis 3 j', 'warn')}${todo(ATHLETES[2], 'Semi dans 9 j · affûtage à valider', 'good')}</section>
    <section class="card" style="overflow: hidden">${sectionHead('Aujourd’hui', `<span class="faint num" style="font-size: 12.5px">7 séances</span>`, '12px 14px')}${today(ATHLETES[3], 'Footing 1 h · Z2', 'done')}${today(ATHLETES[2], 'Allure semi 20′', 'done')}${today(ATHLETES[0], 'Footing 30′ · allégé', 'planned')}${today(ATHLETES[5], 'Footing 40′', 'planned')}</section>
  </div>`, tabBar(COACH_TABS, 'Aperçu')));

  // Athlètes
  const fchip = (l, on) => `<span class="pill" style="height: 32px; padding: 0 12px; font-size: 13px; background: ${on ? T.btnPrimaryBg : T.surface}; color: ${on ? T.btnPrimaryInk : T.ink2}; border: 1px solid ${on ? T.btnPrimaryBg : T.line}">${l}</span>`;
  const Athletes = page('Kadro — Athlètes (mobile)', phone(`
  <div style="padding: 60px 20px 0; display: flex; flex-direction: column; gap: 14px">
    <div class="row" style="gap: 12px"><h1 class="h1" style="flex: 1 1 auto; font-size: 28px">Athlètes</h1><span class="icon-btn">${icon('bell', 20)}</span><span class="icon-btn" style="background: ${T.btnPrimaryBg}; color: ${T.btnPrimaryInk}; border-color: ${T.btnPrimaryBg}">${icon('plus', 20, T.btnPrimaryInk, 2)}</span></div>
    ${searchBox(350, 'Rechercher')}
    <div class="row" style="gap: 8px; overflow: hidden">${fchip('Tous · 18', true)}${fchip('À traiter · 3')}${fchip('Marathon')}${fchip('10 km')}${fchip('Trail')}</div>
  </div>
  <div class="card" style="margin: 16px 20px 0; overflow: hidden">
    ${ATHLETES.slice(0, 8).map((a, i) => `
    <div class="row" style="gap: 12px; height: 66px; padding: 0 14px; ${i ? `border-top: 1px solid ${T.line}` : ''}">
      ${avatar(a.i, 40)}
      <div style="flex: 1 1 auto; min-width: 0; line-height: 1.3"><div style="font-weight: 600; font-size: 15px">${a.n}</div><div class="muted ellip" style="font-size: 12.5px">${a.g} · ${a.next}</div></div>
      ${statusPill(a.lv)}${icon('chevron', 16, T.ink3)}
    </div>`).join('')}
  </div>`, tabBar(COACH_TABS, 'Athlètes')));

  // Fiche athlète
  const sRow = (name, meta, lv, k = 'run') => `<div class="row" style="gap: 12px; padding: 11px 16px; border-top: 1px solid ${T.line}"><span style="width: 36px; height: 36px; border-radius: 10px; background: ${T.neutralSoft}; display: inline-flex; align-items: center; justify-content: center; color: ${T.ink2}">${icon(k, 18)}</span><div style="flex: 1 1 auto; line-height: 1.3"><div style="font-weight: 500">${name}</div><div class="muted" style="font-size: 12.5px">${meta}</div></div><div class="row" style="gap: 6px; font-size: 12.5px; color: ${T.ink2}">${dot(lv)}${lv === 'bad' ? '2' : lv === 'warn' ? '3' : '4'}/5</div></div>`;
  const FicheAthlete = page('Kadro — Fiche athlète (mobile)', phone(`
  <div style="${top('display: flex; flex-direction: column; gap: 16px; flex: 1 1 auto; min-height: 0')}">
    <div class="row" style="gap: 8px"><span class="icon-btn" style="border: 0; background: transparent; width: 32px; margin-left: -8px">${icon('back', 22, T.ink)}</span><span style="flex: 1 1 auto"></span><span class="icon-btn" style="border: 0; background: transparent">${icon('more', 22, T.ink)}</span></div>
    <div class="row" style="gap: 14px">${avatar('LM', 56)}<div style="flex: 1 1 auto; line-height: 1.25"><div style="font-size: 22px; font-weight: 600; letter-spacing: -0.02em">Léa Martin</div><div class="muted" style="font-size: 13px; margin-top: 3px">Marathon de Paris · J-226 · obj. 3 h 15</div></div></div>
    <section class="card" style="padding: 14px 16px">
      <div class="row" style="gap: 10px; margin-bottom: 12px"><h2 class="h2" style="flex: 1 1 auto">Forme</h2>${statusPill('bad')}</div>
      <div class="row" style="gap: 2px; margin-bottom: 12px">${checkinDay('S', 'good')}${checkinDay('D', 'good')}${checkinDay('L', 'good')}${checkinDay('M', 'warn')}${checkinDay('M', 'warn')}${checkinDay('J', 'bad')}${checkinDay('V', 'bad', true)}</div>
      <div class="row" style="gap: 8px">${mMetric('Fatigue', '4 / 5', T.bad)}${mMetric('Sommeil', '5 h 30', T.bad)}${mMetric('Courbatures', '4 / 5', T.warn)}</div>
    </section>
    <section class="card" style="padding: 14px 16px">
      <div class="row" style="gap: 10px; margin-bottom: 12px"><h2 class="h2" style="flex: 1 1 auto">Semaine 35</h2><span class="muted num" style="font-size: 12.5px">3 / 5 réalisées</span></div>${miniWeek()}
    </section>
    <section class="card" style="padding: 14px 16px 6px">
      <div class="row" style="gap: 10px; margin-bottom: 4px"><h2 class="h2" style="flex: 1 1 auto">Charge · 8 sem.</h2><span class="faint num" style="font-size: 12.5px">ratio 1,12</span></div>
      ${barChart({ values: [42, 48, 51, 38, 55, 58, 61, 34], labels: ['S28', 'S29', 'S30', 'S31', 'S32', 'S33', 'S34', 'S35'], w: 318, h: 112 })}
    </section>
    <section class="card" style="overflow: hidden">${sectionHead('Dernières séances', '', '12px 16px 8px')}${sRow('Renfo bas du corps', '42 min · 6 exercices', 'warn', 'dumbbell')}${sRow('VMA 10 × 400 m', '12,1 km · 3:38/km', 'bad')}</section>
  </div>
  ${stickyBar(`<span class="btn" style="flex: 1 1 0; height: 48px; justify-content: center; border-radius: 12px">${icon('message', 18)}Message</span><span class="btn primary" style="flex: 1 1 0; height: 48px; justify-content: center; border-radius: 12px">${icon('plus', 18, T.btnPrimaryInk, 2)}Planifier</span>`)}`, tabBar(COACH_TABS, 'Athlètes')));

  // Planning semaine
  const dayRow = (w) => `
  <div style="display: flex; gap: 14px; padding: 12px 0; border-top: 1px solid ${T.line}">
    <div style="width: 40px; flex: 0 0 auto; text-align: center; line-height: 1.1; padding-top: 4px"><div style="font-size: 11px; color: ${w.today ? T.accentInk : T.ink3}; font-weight: 600">${w.d.toUpperCase()}</div><div class="num" style="font-size: 20px; font-weight: 600; margin-top: 2px; color: ${w.today ? T.accentInk : T.ink}">${w.n}</div></div>
    <div style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px">
      ${w.s.length ? w.s.map((s) => `<div class="row" style="gap: 10px; padding: 12px 14px; border-radius: 12px; ${chipStyle(s.st)}; font-size: 14px">${chipIcon(s, 18)}<div style="flex: 1 1 auto; line-height: 1.3; min-width: 0"><div style="font-weight: 600">${s.t}</div><div class="ellip" style="font-size: 12px; opacity: .8">${s.sub || ''}</div></div>${icon('chevron', 16, 'currentColor')}</div>`).join('')
        : `<div class="row" style="height: 44px; padding: 0 14px; border-radius: 12px; border: 1px dashed ${T.line}; color: ${T.ink3}; font-size: 13px; gap: 8px">Repos</div>`}
    </div>
  </div>`;
  const Planning = page('Kadro — Planning semaine (mobile)', phone(`
  <div style="${top('display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0')}">
    <div class="row" style="gap: 8px; margin-bottom: 10px"><span class="icon-btn" style="border: 0; background: transparent; width: 32px; margin-left: -8px">${icon('back', 22, T.ink)}</span><div class="row" style="flex: 1 1 auto; gap: 8px">${avatar('LM', 28)}<span style="font-weight: 600; font-size: 15px">Léa Martin</span></div><span class="icon-btn" style="border: 0; background: transparent">${icon('more', 22, T.ink)}</span></div>
    <div class="row" style="gap: 8px; margin-bottom: 8px"><span class="icon-btn" style="width: 36px; height: 36px">${icon('chevronL', 18)}</span><div style="flex: 1 1 auto; text-align: center; line-height: 1.2"><div style="font-weight: 600; font-size: 16px">Semaine 35</div><div class="faint" style="font-size: 12px">25 – 31 août · 3 / 5 réalisées · 38,4 km</div></div><span class="icon-btn" style="width: 36px; height: 36px">${icon('chevron', 18)}</span></div>
    <div style="flex: 1 1 auto; overflow: hidden">${WEEK.map(dayRow).join('')}</div>
  </div>
  <div style="position: absolute; right: 20px; bottom: 100px; width: 56px; height: 56px; border-radius: 16px; background: ${T.btnPrimaryBg}; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(0,0,0,.22)">${icon('plus', 24, T.btnPrimaryInk, 2.25)}</div>`, tabBar(COACH_TABS, 'Planning')));

  // Messages (thread)
  const MessagesThread = page('Kadro — Conversation (mobile coach)', phone(`
  <div style="${top('display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; gap: 12px')}">
    <div class="row" style="gap: 10px"><span class="icon-btn" style="border: 0; background: transparent; width: 32px; margin-left: -8px">${icon('back', 22, T.ink)}</span>${avatar('LM', 36)}<div style="flex: 1 1 auto; line-height: 1.25"><div style="font-weight: 600; font-size: 15px">Léa Martin</div><div class="row" style="gap: 6px; font-size: 12px; color: ${T.ink2}">${dot('bad', 7)}Fatigue · séance du jour allégée</div></div><span class="icon-btn" style="border: 0; background: transparent">${icon('user', 22, T.ink)}</span></div>
    <div style="flex: 1 1 auto; display: flex; flex-direction: column; gap: 12px; overflow: hidden; padding-top: 6px">
      <div class="faint" style="text-align: center; font-size: 12px">Jeudi 28 août</div>
      ${bubble('Coach, j’ai les jambes lourdes depuis la VMA de mercredi et j’ai mal dormi. Je fais quoi demain ?', false, '21:40')}
      ${bubble('Merci de me le dire. On allège : footing 30′ très tranquille, et on voit dimanche pour la sortie longue selon ton ressenti du matin.', true, '22:05')}
      <div style="display: flex; justify-content: flex-end">${sessionCard('Footing 30′ · Z1', 'Ven 29 août · modifiée', 'today')}</div>
      <div class="faint" style="text-align: center; font-size: 12px">Aujourd’hui</div>
      ${bubble('Ok pour alléger, je fais 30′ tranquille. Le tendon va mieux ce matin.', false, '09:12')}
    </div>
  </div>
  <div style="padding: 10px 20px 28px; border-top: 1px solid ${T.line}; background: ${T.surface}">${composer()}</div>`));

  // Plus (menu)
  const menu = (ic, l, sub = '', badge = '') => `<div class="row" style="gap: 14px; height: 56px; padding: 0 16px; border-top: 1px solid ${T.line}"><span style="width: 36px; height: 36px; border-radius: 10px; background: ${T.neutralSoft}; display: inline-flex; align-items: center; justify-content: center; color: ${T.ink2}">${icon(ic, 18)}</span><div style="flex: 1 1 auto; line-height: 1.25"><div style="font-weight: 500; font-size: 15px">${l}</div>${sub ? `<div class="faint" style="font-size: 12px">${sub}</div>` : ''}</div>${badge ? softPill(badge) : ''}${icon('chevron', 16, T.ink3)}</div>`;
  const Plus = page('Kadro — Plus (mobile coach)', phone(`
  <div style="padding: 60px 20px 0; display: flex; flex-direction: column; gap: 16px">
    <div class="row" style="gap: 14px; padding: 4px 0">${avatar('MR', 56)}<div style="flex: 1 1 auto; line-height: 1.25"><div style="font-size: 20px; font-weight: 600; letter-spacing: -0.02em">Marc</div><div class="muted" style="font-size: 13px; margin-top: 2px">Coach Pro · 18 / 25 athlètes</div></div><span class="icon-btn">${icon('edit', 18)}</span></div>
    <section class="card" style="overflow: hidden"><div style="height: 0"></div>${menu('link', 'Inviter un athlète', 'Code KDR-7K2M').replace('border-top: 1px solid ' + T.line, 'border-top: 0')}${menu('library', 'Bibliothèque de séances', '24 modèles')}${menu('layers', 'Groupes', 'Marathon, Semi, 10 km, Trail')}${menu('calendar', 'Planning équipe', 'Vue semaine · tous les athlètes')}</section>
    <section class="card" style="overflow: hidden">${menu('card', 'Abonnement', 'Renouvellement le 1ᵉʳ sept.', 'Coach Pro').replace('border-top: 1px solid ' + T.line, 'border-top: 0')}${menu('sync', 'Intégrations', 'Strava connecté · Garmin bientôt')}${menu('bell', 'Alertes & notifications')}${menu('settings', 'Réglages du compte')}</section>
    <section class="card" style="overflow: hidden">${menu('help', 'Aide & contact').replace('border-top: 1px solid ' + T.line, 'border-top: 0')}${menu('logout', 'Se déconnecter')}</section>
  </div>`, tabBar(COACH_TABS, 'Plus')));

  return { MobileApercu: Apercu, MobileAthletes: Athletes, MobileFicheAthlete: FicheAthlete, MobilePlanning: Planning, MobileMessages: MessagesThread, MobilePlus: Plus };
}
