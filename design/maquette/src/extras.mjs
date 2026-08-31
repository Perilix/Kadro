// Premiers pas & états vides, création de séance mobile (course), vue mois, notifications.
export function extras(L) {
  const { T, icon, page, avatar, statusPill, dot, softPill, accentPill, donePill, sidebar, searchBox, WEEK, chipStyle, chipIcon, miniWeek, mMetric, kpi, sectionHead, tabs, tabBar, COACH_TABS, ATH_TABS, phone, mHeader, stickyBar, ATHLETES } = L;
  const shell = (active, inner, pad = '28px 32px') => `<div style="width: 1440px; height: 900px; display: flex; background: ${T.bg}; overflow: hidden">${sidebar(active)}<main style="flex: 1 1 auto; min-width: 0; padding: ${pad}; display: flex; flex-direction: column; gap: 22px">${inner}</main></div>`;
  const primary = (l, ic = 'plus') => `<span class="btn primary">${icon(ic, 18, T.btnPrimaryInk, 2)}${l}</span>`;
  const primaryBtn = (l, ic) => `<span class="btn primary" style="flex: 1 1 0; height: 48px; justify-content: center; border-radius: 12px">${ic ? icon(ic, 18, T.btnPrimaryInk, 2) : ''}${l}</span>`;
  const top = (extra = '') => `padding: 56px 20px 0; ${extra}`;
  const empty = (ic, title, sub, action = '') => `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 28px 20px; text-align: center"><span style="width: 44px; height: 44px; border-radius: 12px; background: ${T.neutralSoft}; display: inline-flex; align-items: center; justify-content: center; color: ${T.ink3}">${icon(ic, 22)}</span><div style="font-weight: 600; margin-top: 4px">${title}</div><div class="muted" style="font-size: 13px; max-width: 340px; line-height: 1.45">${sub}</div>${action ? `<div style="margin-top: 6px">${action}</div>` : ''}</div>`;
  const stepCard = (n, title, sub, done, action) => `<div class="row" style="gap: 16px; padding: 16px 18px; border-top: 1px solid ${T.line}"><span style="width: 28px; height: 28px; border-radius: 99px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; background: ${done ? T.good : T.neutralSoft}; color: ${done ? '#fff' : T.ink2}; flex: 0 0 auto">${done ? icon('check', 14, '#fff', 3) : n}</span><div style="flex: 1 1 auto; line-height: 1.3"><div style="font-weight: 600; color: ${done ? T.ink3 : T.ink}; ${done ? 'text-decoration: line-through' : ''}">${title}</div><div class="muted" style="font-size: 13px">${sub}</div></div>${action}</div>`;

  // ---------- Desktop · Aperçu à J0 ----------
  const ApercuVide = page('Kadro — Aperçu coach · premier jour', shell('apercu', `
    <header class="row" style="gap: 16px"><div style="flex: 1 1 auto"><h1 class="h1">Bienvenue Marc</h1><div class="muted" style="margin-top: 4px">Trois étapes et votre premier athlète reçoit sa séance.</div></div>${searchBox(260)}<span class="icon-btn">${icon('bell', 20)}</span>${primary('Nouvelle séance')}</header>
    <div style="display: flex; gap: 16px">${kpi('Athlètes suivis', '0', 'Aucune invitation acceptée')}${kpi('Séances de la semaine', '—', 'Rien de planifié')}${kpi('Adhérence sur 7 jours', '—', 'Disponible après 7 jours')}${kpi('Alertes forme', '0', 'Les check-ins arrivent avec vos athlètes')}</div>
    <div style="display: flex; gap: 20px; flex: 1 1 auto; min-height: 0">
      <div style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 20px">
        <section class="card">
          ${sectionHead('Pour démarrer', '<span class="faint num" style="font-size: 12.5px">1 / 3</span>')}
          ${stepCard(1, 'Créer votre compte coach', 'Profil, diplôme, sports encadrés', true, '')}
          ${stepCard(2, 'Inviter vos athlètes', `Partagez votre code <b class="num" style="font-weight: 600; color: ${T.ink}; letter-spacing: 0.06em">KDR-7K2M</b> ou le lien — ils installent l’app, entrent le code, c’est tout.`, false, `<span class="btn">${icon('copy', 16)}Copier le lien</span>${primary('Inviter', 'link')}`)}
          ${stepCard(3, 'Préparer votre première séance', 'Partez d’un des 24 modèles (footing, VMA, seuil, renfo…) ou créez la vôtre. Chaque athlète recevra ses propres allures et charges.', false, `<span class="btn">${icon('library', 16)}Voir les modèles</span>`)}
        </section>
        <section class="card" style="flex: 1 1 auto">${sectionHead('Athlètes')}${empty('users', 'Aucun athlète pour l’instant', 'Dès qu’un athlète entre votre code, il apparaît ici avec sa forme du jour, son adhérence et sa prochaine séance.', `<span class="btn">${icon('link', 16)}Partager mon code</span>`)}</section>
      </div>
      <aside style="width: 380px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 20px">
        <section class="card">${sectionHead('Aujourd’hui')}${empty('calendar', 'Rien de prévu', 'Les séances du jour de toute l’équipe s’afficheront ici.')}</section>
        <section class="card" style="padding: 16px 18px">
          <div class="row" style="gap: 10px; margin-bottom: 8px"><h2 class="h2" style="flex: 1 1 auto">Votre abonnement</h2>${accentPill('Essai · 14 jours')}</div>
          <div class="muted" style="font-size: 13px; line-height: 1.45">Gratuit jusqu’au 12 septembre, jusqu’à 25 athlètes. Vos athlètes ne paient jamais : l’accès est compris dans votre abonnement.</div>
          <div class="row" style="gap: 8px; margin-top: 12px"><span class="btn" style="height: 34px; font-size: 13px">Voir les tarifs</span></div>
        </section>
        <section class="card" style="padding: 16px 18px; flex: 1 1 auto">
          <div class="row" style="gap: 10px; margin-bottom: 8px"><h2 class="h2" style="flex: 1 1 auto">Intégrations</h2></div>
          <div class="row" style="gap: 12px; padding: 10px 0; border-top: 1px solid ${T.line}; font-size: 13.5px"><span style="flex: 1 1 auto">Montres (Garmin, Coros, Polar, Suunto, Apple Watch)</span><span class="muted" style="font-size: 12.5px">chaque athlète relie la sienne</span></div>
          <div class="row" style="gap: 12px; padding: 10px 0; border-top: 1px solid ${T.line}; font-size: 13.5px"><span style="flex: 1 1 auto">Strava</span>${softPill('Côté athlète')}</div>
        </section>
      </aside>
    </div>`));

  // ---------- Desktop · Fiche athlète sans données ----------
  const need = (ic, title, sub, action) => `<div class="row" style="gap: 14px; padding: 12px 16px; border-top: 1px solid ${T.line}"><span style="width: 36px; height: 36px; border-radius: 10px; background: ${T.neutralSoft}; display: inline-flex; align-items: center; justify-content: center; color: ${T.ink2}; flex: 0 0 auto">${icon(ic, 18)}</span><div style="flex: 1 1 auto; line-height: 1.3"><div style="font-weight: 600">${title}</div><div class="muted" style="font-size: 13px">${sub}</div></div>${action}</div>`;
  const FicheVide = page('Kadro — Fiche athlète · nouvel athlète', shell('athletes', `
    <div class="row" style="gap: 6px; font-size: 13px; color: ${T.ink3}"><a style="color: ${T.ink2}">Athlètes</a>${icon('chevron', 14)}<span style="color: ${T.ink}">Inès Bernard</span></div>
    <header class="row" style="gap: 18px">${avatar('IB', 56)}<div style="flex: 1 1 auto"><h1 class="h1">Inès Bernard</h1><div class="row" style="gap: 8px; margin-top: 6px; font-size: 13.5px; color: ${T.ink2}">${statusPill('none')}<span>A rejoint hier</span><span class="faint">·</span><span>Objectif : 10 km de Lyon · 28 sept.</span><span class="faint">·</span><span>Pas encore de VMA</span></div></div><span class="btn">${icon('message', 18)}Message</span>${primary('Planifier une séance')}</header>
    ${tabs(['Aperçu', 'Planning', 'Séances', 'Muscu', 'Monitoring', 'Tests', 'Notes'], 'Aperçu')}
    <div style="display: flex; gap: 20px; flex: 1 1 auto; min-height: 0">
      <div style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 16px">
        <section class="card">
          ${sectionHead('À compléter pour la suivre correctement', '<span class="faint num" style="font-size: 12.5px">3 points</span>')}
          ${need('target', 'Aucune VMA connue', 'Sans VMA, ses séances s’affichent en zones de ressenti au lieu d’allures précises.', `<span class="btn" style="height: 34px; font-size: 13px">Saisir une valeur</span>${primary('Programmer un test', 'calendar').replace('class="btn primary"', 'class="btn primary" style="height: 34px; font-size: 13px"')}`)}
          ${need('sync', 'Aucune montre connectée', 'Sans montre, ses séances ne partent pas sur son poignet et ses sorties devront être saisies à la main. Garmin, Coros, Polar, Suunto ou Apple Watch.', `<span class="btn" style="height: 34px; font-size: 13px">Lui envoyer le lien</span>`)}
          ${need('heart', 'Aucun check-in', 'Le premier check-in de forme arrive demain matin à 7 h 30 si les rappels sont activés.', softPill('Rappel activé', 'check'))}
        </section>
        <section class="card" style="padding: 16px 18px 14px">
          <div class="row" style="gap: 10px; margin-bottom: 12px"><h2 class="h2" style="flex: 1 1 auto">Cette semaine</h2><span class="faint" style="font-size: 12.5px">rien de planifié</span></div>
          <div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px">${WEEK.map((w) => `<div style="min-height: 72px; padding: 10px 8px; border-radius: 12px; border: 1px dashed ${T.line}; color: ${T.ink3}; font-size: 12px"><span style="font-weight: 600">${w.d}</span> <span class="num">${w.n}</span></div>`).join('')}</div>
          <div class="row" style="gap: 10px; margin-top: 12px"><span class="btn" style="height: 36px; font-size: 13px">${icon('layers', 16)}Assigner un modèle</span><span class="btn" style="height: 36px; font-size: 13px">${icon('copy', 16)}Copier la semaine d’un autre athlète</span></div>
        </section>
        <section class="card" style="flex: 1 1 auto">${sectionHead('Charge d’entraînement')}${empty('trend', 'Pas encore de données', 'Le graphique de charge apparaît après la première séance réalisée ou synchronisée.')}</section>
      </div>
      <aside style="width: 360px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 16px">
        <section class="card" style="padding: 16px 18px"><div class="row" style="gap: 10px; margin-bottom: 8px"><h2 class="h2" style="flex: 1 1 auto">Ce qu’elle a déclaré</h2><span class="faint" style="font-size: 12px">à l’inscription</span></div><div style="font-size: 13.5px">${[['Objectif', '10 km de Lyon · 28 sept. · viser < 50 min'], ['Référence', '10 km en 54:20 (mars 2026)'], ['Jours disponibles', 'Mar · Jeu · Sam · Dim'], ['Sports', 'Course · un peu de renfo'], ['Blessures', 'Périostite en 2025, guérie']].map(([l, v]) => `<div class="row" style="gap: 12px; padding: 8px 0; border-top: 1px solid ${T.line}"><span class="muted" style="width: 120px; flex: 0 0 auto">${l}</span><span>${v}</span></div>`).join('')}</div></section>
        <section class="card" style="padding: 16px 18px; flex: 1 1 auto"><div class="row" style="gap: 10px; margin-bottom: 8px"><h2 class="h2" style="flex: 1 1 auto">Notes</h2><a style="font-size: 13px; font-weight: 500">Ajouter</a></div>${empty('note', 'Aucune note', 'Vos observations privées sur Inès. Elle ne les voit pas.')}</section>
      </aside>
    </div>`, '24px 32px 24px'));

  // ---------- Coach mobile · Athlètes vide ----------
  const MobileAthletesVide = page('Kadro — Athlètes · vide (mobile coach)', phone(`
  <div style="padding: 60px 20px 0; display: flex; flex-direction: column; gap: 14px; flex: 1 1 auto">
    <div class="row" style="gap: 12px"><h1 class="h1" style="flex: 1 1 auto; font-size: 28px">Athlètes</h1><span class="icon-btn">${icon('bell', 20)}</span></div>
    <div style="flex: 1 1 auto; display: flex; flex-direction: column; justify-content: center; gap: 16px; padding-bottom: 80px">
      ${empty('users', 'Aucun athlète pour l’instant', 'Partagez votre code. Vos athlètes installent l’app, l’entrent, et apparaissent ici.')}
      <div class="card" style="padding: 16px; text-align: center"><div class="label">Votre code coach</div><div class="num" style="font-size: 30px; font-weight: 600; letter-spacing: 0.1em; margin: 6px 0 12px">KDR-7K2M</div><div class="row" style="gap: 8px">${primaryBtn('Partager le lien', 'link')}<span class="icon-btn" style="width: 48px; height: 48px; border-radius: 12px">${icon('qr', 20)}</span></div></div>
      <div class="faint" style="font-size: 12.5px; text-align: center; line-height: 1.45">2 invitations envoyées par e-mail sont en attente : Inès B., Marc T.</div>
    </div>
  </div>`, tabBar(COACH_TABS, 'Athlètes')));

  // ---------- Athlète · Profil à l’inscription (étape 2) ----------
  const opt = (l, on, sub = '') => `<div class="row" style="gap: 12px; padding: 12px 14px; border-radius: 12px; border: 1.5px solid ${on ? T.accent : T.line}; background: ${T.surface}"><span style="width: 18px; height: 18px; border-radius: 99px; border: 1.5px solid ${on ? T.accent : T.lineStrong}; display: inline-flex; align-items: center; justify-content: center">${on ? `<span style="width: 9px; height: 9px; border-radius: 99px; background: ${T.accent}"></span>` : ''}</span><div style="flex: 1 1 auto; line-height: 1.3"><div style="font-weight: 500; font-size: 14px">${l}</div>${sub ? `<div class="muted" style="font-size: 12.5px">${sub}</div>` : ''}</div></div>`;
  const dayChip = (d, on) => `<span style="flex: 1 1 0; height: 40px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; background: ${on ? T.btnPrimaryBg : T.surface}; color: ${on ? T.btnPrimaryInk : T.ink2}; border: 1px solid ${on ? T.btnPrimaryBg : T.line}">${d}</span>`;
  const AthleteProfilSetup = page('Kadro — Ton profil (athlète, inscription)', phone(`
  <div style="padding: 60px 24px 0; display: flex; flex-direction: column; gap: 18px; flex: 1 1 auto; min-height: 0">
    <div class="row" style="gap: 8px"><span class="icon-btn" style="border: 0; background: transparent; width: 32px; margin-left: -8px">${icon('back', 22, T.ink)}</span><span class="faint" style="font-size: 13px">Étape 2 sur 3</span></div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px">${[1, 1, 0].map((d) => `<div style="height: 4px; border-radius: 99px; background: ${d ? T.accent : T.neutralSoft}"></div>`).join('')}</div>
    <div><h1 class="h1" style="font-size: 26px">Ton profil de coureuse</h1><div class="muted" style="margin-top: 6px; font-size: 14px; line-height: 1.45">Marc s’en sert pour calculer tes allures. Tu pourras tout modifier plus tard.</div></div>
    <div class="col" style="gap: 8px"><span class="label">Ta VMA</span>${opt('Je la connais', true, '16,5 km/h · test de mars 2026')}${opt('Je ne la connais pas', false, 'Marc te programmera un test (demi-Cooper, 6 min)')}</div>
    <div class="col" style="gap: 8px"><span class="label">Ton objectif</span><div class="input" style="color: ${T.ink}; height: 44px; border-radius: 12px">${icon('flag', 16, T.ink3)}<span style="flex: 1 1 auto">Marathon de Paris · 12 avr. 2027 · 3 h 15</span>${icon('chevron', 16, T.ink3)}</div></div>
    <div class="col" style="gap: 8px"><span class="label">Jours où tu peux t’entraîner</span><div class="row" style="gap: 6px">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => dayChip(d, [1, 0, 1, 1, 1, 0, 1][i])).join('')}</div></div>
  </div>
  ${stickyBar(primaryBtn('Continuer'), 0)}`));

  // ---------- Athlète · Jour de repos ----------
  const AthleteRepos = page('Kadro — Aujourd’hui · repos (athlète)', phone(`
  <div style="padding: 60px 20px 0; display: flex; flex-direction: column; gap: 16px">
    <div class="row" style="gap: 12px"><div style="flex: 1 1 auto"><div class="faint" style="font-size: 13px">Samedi 30 août</div><h1 class="h1" style="font-size: 28px; margin-top: 2px">Bonjour Léa</h1></div>${avatar('LM', 40)}</div>
    <section class="card" style="padding: 14px 16px"><div class="row" style="gap: 12px">${dot('good', 12)}<div style="flex: 1 1 auto; line-height: 1.3"><div style="font-weight: 600">Check-in envoyé · Bien</div><div class="muted" style="font-size: 12.5px">Sommeil 7 h 45 · courbatures 2 / 5 · Marc l’a vu</div></div><a style="font-size: 13px; font-weight: 500">Modifier</a></div></section>
    <section class="card" style="padding: 20px 16px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px"><span style="width: 48px; height: 48px; border-radius: 14px; background: ${T.neutralSoft}; display: inline-flex; align-items: center; justify-content: center; color: ${T.ink2}">${icon('moon', 24)}</span><div style="font-size: 20px; font-weight: 600; letter-spacing: -0.02em; margin-top: 4px">Repos aujourd’hui</div><div class="muted" style="font-size: 13.5px; line-height: 1.45; max-width: 280px">Le tendon a besoin de souffler avant la sortie longue de demain. Marche, mobilité, et une bonne nuit.</div><div class="row" style="gap: 8px; margin-top: 8px"><span class="btn" style="height: 40px">${icon('plus', 16)}Ajouter une activité libre</span></div></section>
    <section class="card" style="padding: 14px 16px"><div class="row" style="gap: 10px">${accentPill('Demain', 'run')}<span style="flex: 1 1 auto"></span><span class="faint num" style="font-size: 12.5px">1 h 45 · Z2</span></div><div style="font-size: 17px; font-weight: 600; margin-top: 8px">Sortie longue 1 h 45</div><div class="muted" style="font-size: 13px; margin-top: 2px">18 – 20 km · 5:30 – 5:50 /km · fin progressive si les jambes vont bien</div><div class="row" style="gap: 8px; margin-top: 10px"><a style="font-size: 13px; font-weight: 500">Voir le détail</a></div></section>
    <section class="card" style="padding: 14px 16px"><div class="row" style="gap: 10px; margin-bottom: 12px"><h2 class="h2" style="flex: 1 1 auto">Ma semaine</h2><span class="muted num" style="font-size: 12.5px">4 / 5 · 41,2 km</span></div>${miniWeek(WEEK.map((w, i) => i === 4 ? { ...w, today: false, s: [{ ...w.s[0], st: 'done' }] } : i === 5 ? { ...w, today: true } : w))}</section>
  </div>`, tabBar(ATH_TABS, 'Aujourd’hui')));

  // ---------- Coach mobile · Créer une séance (course) ----------
  const seg2 = (l, on, ic) => `<div class="row" style="flex: 1 1 0; height: 40px; justify-content: center; gap: 8px; border-radius: 9px; font-size: 13.5px; font-weight: 500; background: ${on ? T.btnPrimaryBg : 'transparent'}; color: ${on ? T.btnPrimaryInk : T.ink2}">${icon(ic, 16, on ? T.btnPrimaryInk : T.ink3)}${l}</div>`;
  const mField = (l, v, ic = '') => `<div class="col" style="gap: 6px; flex: 1 1 0; min-width: 0"><span class="label">${l}</span><div class="input" style="color: ${T.ink}; height: 44px; border-radius: 12px">${ic ? icon(ic, 16, T.ink3) : ''}<span class="ellip" style="flex: 1 1 auto">${v}</span>${icon('chevronD', 16, T.ink3)}</div></div>`;
  const mBlock = (t, d, m, rep = '') => `<div class="row" style="gap: 10px; padding: 10px 12px; border-radius: 12px; border: 1px solid ${T.line}; background: ${T.surface}">${icon('drag', 16, T.ink3)}<div style="width: 5px; height: 32px; border-radius: 99px; background: ${m}"></div><div style="flex: 1 1 auto; min-width: 0; line-height: 1.3"><div style="font-weight: 600; font-size: 14px">${t}</div><div class="muted ellip" style="font-size: 12.5px">${d}</div></div>${rep ? accentPill(rep, 'repeat') : icon('chevron', 16, T.ink3)}</div>`;
  const MobileCreerSeance = page('Kadro — Créer une séance (mobile coach)', phone(`
  <div style="${top('display: flex; flex-direction: column; gap: 14px; flex: 1 1 auto; min-height: 0')}">
    ${mHeader('Nouvelle séance', `<span style="font-size: 14px; font-weight: 500; color: ${T.ink2}">Annuler</span>`, false)}
    <div class="row" style="gap: 4px; padding: 4px; border-radius: 12px; background: ${T.neutralSoft}">${seg2('Course', true, 'run')}${seg2('Muscu', false, 'dumbbell')}</div>
    <div class="row" style="gap: 10px">${mField('Nom', 'Seuil 3 × 8′', 'edit')}${mField('Intensité', 'Seuil')}${mField('Difficulté', '7 / 10')}</div>
    <div class="col" style="gap: 8px"><div class="row" style="gap: 10px"><span class="label" style="flex: 1 1 auto">Blocs</span><span class="faint num" style="font-size: 12px">≈ 52 min · 11 km</span></div>${mBlock('Échauffement · 15′', 'Z1 – Z2 · trot + lignes droites', T.lineStrong)}${mBlock('8′ à allure seuil', '85 – 88 % VMA · récup 2′ trot', T.accent, '× 3')}${mBlock('Retour au calme · 10′', 'Z1 · marche puis étirements', T.lineStrong)}<div class="row" style="gap: 8px"><span class="btn" style="flex: 1 1 0; height: 40px; justify-content: center; font-size: 13px; border-style: dashed">${icon('plus', 16)}Bloc</span><span class="btn" style="flex: 1 1 0; height: 40px; justify-content: center; font-size: 13px; border-style: dashed">${icon('repeat', 16)}Répétition</span><span class="btn" style="flex: 1 1 0; height: 40px; justify-content: center; font-size: 13px; border-style: dashed">${icon('library', 16)}Modèle</span></div></div>
    <div class="col" style="gap: 8px"><span class="label">Assigner à</span><div class="row" style="gap: 8px; flex-wrap: wrap">${[['LM', 'Léa'], ['TB', 'Théo'], ['CL', 'Clara']].map(([i, n]) => `<span class="pill" style="height: 34px; padding: 0 12px 0 4px; background: ${T.surface}; border: 1px solid ${T.line}; color: ${T.ink}; font-size: 13px">${avatar(i, 26)}${n}${icon('x', 14, T.ink3)}</span>`).join('')}<span class="pill" style="height: 34px; padding: 0 12px; background: ${T.neutralSoft}; color: ${T.ink2}; font-size: 13px">${icon('plus', 14)}Ajouter</span></div></div>
    <div class="row" style="gap: 10px; padding: 10px 12px; border-radius: 12px; background: ${T.surface2}; font-size: 12.5px; color: ${T.ink2}">${icon('target', 16, T.ink3)}<span style="flex: 1 1 auto">Léa verra <b class="num" style="font-weight: 600; color: ${T.ink}">4:18 – 4:25 /km</b> · Théo <b class="num" style="font-weight: 600; color: ${T.ink}">4:05 – 4:12</b></span></div>
  </div>
  ${stickyBar(`${primaryBtn('Assigner · sam. 30 août', 'check')}`, 0)}`));

  // ---------- Desktop · Planning vue mois (Léa) ----------
  const monthCell = (n, sessions, muted = false, today = false, race = '') => `<div style="border-left: 1px solid ${T.line}; border-top: 1px solid ${T.line}; padding: 8px; display: flex; flex-direction: column; gap: 5px; min-height: 0; background: ${today ? (T.mode === 'dark' ? '#171B27' : '#F7F6FE') : muted ? T.surface2 : 'transparent'}"><div class="row" style="gap: 6px"><span class="num" style="font-size: 12.5px; font-weight: ${today ? 700 : 500}; color: ${muted ? T.ink3 : today ? T.accentInk : T.ink}">${n}</span>${race ? `<span class="pill" style="height: 18px; padding: 0 6px; font-size: 10.5px; background: ${T.accentSoft}; color: ${T.accentInk}">${icon('flag', 10, T.accentInk)}${race}</span>` : ''}</div>${sessions.map((s) => `<div class="row" style="gap: 5px; padding: 4px 7px; border-radius: 7px; font-size: 11px; font-weight: 500; min-width: 0; ${chipStyle(s.st)}">${chipIcon(s, 12)}<span class="ellip">${s.t}</span></div>`).join('')}</div>`;
  const S = (t, st = 'planned', k = 'run') => ({ t, st, k });
  const SEPT = [
    // week 1: 1–7 (Sept 1 = lundi dans la fiction)
    [[1, [S('Footing 50′')]], [2, []], [3, [S('Seuil 3×8′')]], [4, [S('Renfo bas', 'planned', 'dumbbell')]], [5, [S('Footing 45′')]], [6, []], [7, [S('SL 1 h 50')]]],
    [[8, [S('Footing 50′')]], [9, []], [10, [S('VMA 10×400')]], [11, [S('Renfo haut', 'planned', 'dumbbell')]], [12, [S('Footing 45′')]], [13, []], [14, [S('SL 2 h')]]],
    [[15, [S('Footing 50′')]], [16, []], [17, [S('Seuil 2×15′')]], [18, [S('Renfo bas', 'planned', 'dumbbell')]], [19, [S('Footing 40′')]], [20, [S('Test VMA')]], [21, []]],
    [[22, [S('Footing 45′')]], [23, []], [24, [S('Allure marathon 30′')]], [25, [S('Renfo haut', 'planned', 'dumbbell')]], [26, [S('Footing 45′')]], [27, []], [28, [S('SL 2 h 10')]]],
    [[29, [S('Footing 50′')]], [30, []], [1, [S('Seuil 3×10′')]], [2, [S('Renfo bas', 'planned', 'dumbbell')]], [3, []], [4, []], [5, [S('10 km de Lyon · Karim')]]],
  ];
  const PlanningMois = page('Kadro — Planning · vue mois', shell('planning', `
    <header class="row" style="gap: 16px"><div style="flex: 1 1 auto"><h1 class="h1">Planning</h1><div class="muted" style="margin-top: 4px">Septembre 2026 · Léa Martin · 22 séances prévues · 2 semaines de développement puis test VMA</div></div><div class="row" style="border: 1px solid ${T.lineStrong}; border-radius: 10px; overflow: hidden; height: 40px"><span class="row" style="padding: 0 14px; height: 100%; font-weight: 500; color: ${T.ink2}">Semaine</span><span class="row" style="padding: 0 14px; height: 100%; font-weight: 500; background: ${T.navActive}">Mois</span></div><div class="row" style="gap: 4px"><span class="icon-btn">${icon('chevronL', 18)}</span><span class="btn">Aujourd’hui</span><span class="icon-btn">${icon('chevron', 18)}</span></div><span class="btn">${icon('layers', 18)}Assigner un modèle</span>${primary('Nouvelle séance')}</header>
    <div class="row" style="gap: 10px"><span class="pill" style="height: 34px; padding: 0 12px 0 4px; background: ${T.surface}; border: 1px solid ${T.line}; color: ${T.ink}; font-size: 13px">${avatar('LM', 26)}Léa Martin${icon('chevronD', 14, T.ink3)}</span>${softPill('Toute l’équipe')}<span style="flex: 1 1 auto"></span><span class="faint" style="font-size: 12.5px">Phase : développement général · sem. 7 – 10 / 32</span></div>
    <section class="card" style="flex: 1 1 auto; overflow: hidden; display: flex; flex-direction: column">
      <div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); background: ${T.surface2}">${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d, i) => `<div style="padding: 8px 10px; font-size: 12px; font-weight: 500; color: ${T.ink2}; ${i ? `border-left: 1px solid ${T.line}` : ''}">${d}</div>`).join('')}</div>
      ${SEPT.map((week, wi) => `<div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); flex: 1 1 0; min-height: 0">${week.map(([n, s], di) => monthCell(n, s, wi === 4 && di >= 2, false, wi === 0 && di === 6 ? 'Semi Lyon · Nora' : wi === 4 && di === 6 ? '' : '')).join('')}</div>`).join('')}
    </section>`));

  // ---------- Coach mobile · Notifications ----------
  const notif = (i, lv, text, time, unread = false, ic = '') => `<div class="row" style="gap: 12px; padding: 12px 14px; border-top: 1px solid ${T.line}; background: ${unread ? (T.mode === 'dark' ? '#171B27' : '#FAFAFE') : 'transparent'}; align-items: flex-start"><span style="position: relative; flex: 0 0 auto">${avatar(i, 36)}${lv ? `<span class="dot" style="position: absolute; right: -2px; bottom: -2px; width: 12px; height: 12px; border: 2px solid ${T.surface}; background: ${L.LEVEL[lv][1]}"></span>` : ''}</span><div style="flex: 1 1 auto; min-width: 0; line-height: 1.35; font-size: 13.5px">${text}<div class="faint" style="font-size: 11.5px; margin-top: 3px">${time}</div></div>${unread ? `<span class="dot" style="background: ${T.accent}; margin-top: 6px"></span>` : ''}</div>`;
  const MobileNotifications = page('Kadro — Notifications (mobile coach)', phone(`
  <div style="padding: 60px 0 0; display: flex; flex-direction: column; gap: 12px; flex: 1 1 auto; min-height: 0">
    <div class="row" style="gap: 12px; padding: 0 20px"><h1 class="h1" style="flex: 1 1 auto; font-size: 28px">Notifications</h1><a style="font-size: 13px; font-weight: 500">Tout marquer lu</a></div>
    <div class="row" style="gap: 8px; padding: 0 20px">${['Tout', 'Forme', 'Séances', 'Messages'].map((l, i) => `<span class="pill" style="height: 30px; padding: 0 12px; font-size: 12.5px; background: ${i === 0 ? T.btnPrimaryBg : T.surface}; color: ${i === 0 ? T.btnPrimaryInk : T.ink2}; border: 1px solid ${i === 0 ? T.btnPrimaryBg : T.line}">${l}</span>`).join('')}</div>
    <div style="flex: 1 1 auto; overflow: hidden; background: ${T.surface}; border-top: 1px solid ${T.line}">
      <div class="label" style="padding: 10px 14px 4px">Aujourd’hui</div>
      ${notif('LM', 'bad', '<b style="font-weight: 600">Léa Martin</b> signale une fatigue pour le 2ᵉ jour · sommeil 5 h 30', '07:42', true).replace('border-top: 1px solid ' + T.line, 'border-top: 0')}
      ${notif('NS', 'good', '<b style="font-weight: 600">Nora Saidi</b> a terminé <b style="font-weight: 600">Allure semi 20′</b> · 4:24 /km · ressenti 4 / 5', '08:15', true)}
      ${notif('LM', '', '<b style="font-weight: 600">Léa Martin</b> : « Ok pour alléger, je fais 30′ tranquille. »', '09:12', true)}
      ${notif('TB', 'good', '<b style="font-weight: 600">Théo Bernard</b> a synchronisé Strava · Footing 1 h · 12,8 km', '09:40')}
      <div class="label" style="padding: 14px 14px 4px">Hier</div>
      ${notif('KD', 'warn', '<b style="font-weight: 600">Karim Diallo</b> n’a pas réalisé <b style="font-weight: 600">Seuil 3 × 8′</b> · 3ᵉ jour sans activité', 'Jeu 21:00')}
      ${notif('SR', '', '<b style="font-weight: 600">Sofia Rossi</b> : « Je peux décaler les côtes à dimanche ? »', 'Jeu 18:22')}
      ${notif('JL', 'warn', '<b style="font-weight: 600">Jules Lefebvre</b> a un ressenti de 2 / 5 sur <b style="font-weight: 600">Rando-course 3 h</b>', 'Jeu 16:05')}
      ${notif('IB', '', '<b style="font-weight: 600">Inès Bernard</b> a rejoint votre équipe avec le code KDR-7K2M', 'Jeu 12:30')}
    </div>
  </div>`, tabBar(COACH_TABS, 'Aperçu')));

  return { ApercuVide, FicheVide, MobileAthletesVide, AthleteProfilSetup, AthleteRepos, MobileCreerSeance, PlanningMois, MobileNotifications };
}
