// Renforcement musculaire — coach (desktop + mobile) et athlète (mobile).
export function muscu(L) {
  const { T, icon, page, avatar, statusPill, dot, softPill, accentPill, donePill, sidebar, searchBox, barChart, metric, mMetric, sectionHead, tabs, tabBar, COACH_TABS, ATH_TABS, phone, mHeader, stickyBar, ATHLETES } = L;
  const shell = (active, inner, pad = '24px 32px 24px') => `<div style="width: 1440px; height: 900px; display: flex; background: ${T.bg}; overflow: hidden">${sidebar(active)}<main style="flex: 1 1 auto; min-width: 0; padding: ${pad}; display: flex; flex-direction: column; gap: 18px">${inner}</main></div>`;
  const primary = (l, ic = 'plus') => `<span class="btn primary">${icon(ic, 18, T.btnPrimaryInk, 2)}${l}</span>`;
  const primaryBtn = (l, ic) => `<span class="btn primary" style="flex: 1 1 0; height: 48px; justify-content: center; border-radius: 12px">${ic ? icon(ic, 18, T.btnPrimaryInk, 2) : ''}${l}</span>`;
  const top = (extra = '') => `padding: 56px 20px 0; ${extra}`;
  const thumb = (size = 40) => `<span style="width: ${size}px; height: ${size}px; border-radius: 10px; background: ${T.neutralSoft}; display: inline-flex; align-items: center; justify-content: center; color: ${T.ink2}; flex: 0 0 auto">${icon('dumbbell', Math.round(size * 0.45))}</span>`;

  const EX = [
    { n: 'Squat arrière', g: 'Quadriceps · fessiers', sets: '4 × 6', pct: '70 % 1RM', kg: '60 kg', rest: '2′30', rm: 85, hist: [50, 52, 55, 55, 57, 60, 60, 60] },
    { n: 'Soulevé de terre roumain', g: 'Ischios · chaîne postérieure', sets: '3 × 8', pct: '55 % 1RM', kg: '50 kg', rest: '2′', rm: 95, hist: [40, 42, 45, 45, 47, 50, 50, 50] },
    { n: 'Fentes marchées', g: 'Quadriceps · fessiers', sets: '3 × 12 / jambe', pct: 'haltères', kg: '2 × 12 kg', rest: '1′30', rm: null, hist: [8, 8, 10, 10, 10, 12, 12, 12] },
    { n: 'Hip thrust', g: 'Fessiers', sets: '3 × 10', pct: '65 % 1RM', kg: '60 kg', rest: '2′', rm: 90, hist: [45, 50, 50, 55, 55, 55, 60, 60] },
    { n: 'Mollets debout', g: 'Mollets', sets: '3 × 15', pct: 'poids du corps', kg: '—', rest: '1′', rm: null, hist: [] },
    { n: 'Gainage frontal', g: 'Tronc', sets: '3 × 45″', pct: '—', kg: '—', rest: '1′', rm: null, hist: [] },
  ];
  const spark = (vals, w = 96, h = 24) => vals.length ? `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display: block">${vals.map((v, i) => { const mx = Math.max(...vals), bw = (w - (vals.length - 1) * 3) / vals.length, bh = Math.max(3, (v / mx) * h); return `<rect x="${i * (bw + 3)}" y="${h - bh}" width="${bw}" height="${bh}" rx="1.5" fill="${i === vals.length - 1 ? T.accent : T.lineStrong}"/>`; }).join('')}</svg>` : `<span class="faint" style="font-size: 12px">—</span>`;

  // ---------- Desktop · Éditeur de séance muscu ----------
  const field = (l, v, w, ic = '') => `<div class="col" style="gap: 6px; ${w}"><span class="label">${l}</span><div class="input" style="color: ${T.ink}">${ic ? icon(ic, 16, T.ink3) : ''}<span style="flex: 1 1 auto">${v}</span>${ic ? '' : icon('chevronD', 16, T.ink3)}</div></div>`;
  const exRow = (e, i, on = false) => `
  <div style="display: grid; grid-template-columns: 24px 40px 1.6fr 0.8fr 0.8fr 0.9fr 0.7fr 32px; gap: 12px; align-items: center; padding: 10px 12px; border-radius: 12px; border: 1px solid ${on ? T.accent : T.line}; background: ${T.surface}">
    ${icon('drag', 18, T.ink3)}${thumb(40)}
    <div style="line-height: 1.3; min-width: 0"><div class="ellip" style="font-weight: 600">${i + 1}. ${e.n}</div><div class="faint ellip" style="font-size: 12px">${e.g}</div></div>
    <div class="num" style="font-weight: 600">${e.sets}</div>
    <div class="muted num" style="font-size: 13px">${e.pct}</div>
    <div>${e.kg !== '—' ? accentPill('Léa : ' + e.kg) : softPill('—')}</div>
    <div class="muted num" style="font-size: 13px">${icon('clock', 13, T.ink3)} ${e.rest}</div>
    <span class="icon-btn" style="width: 32px; height: 32px; border: 0; background: transparent">${icon('more', 18)}</span>
  </div>`;
  const libRow = (n, g) => `<div class="row" style="gap: 10px; padding: 8px 10px; border-radius: 10px">${thumb(32)}<div style="flex: 1 1 auto; min-width: 0; line-height: 1.25"><div class="ellip" style="font-weight: 500; font-size: 13px">${n}</div><div class="faint ellip" style="font-size: 11.5px">${g}</div></div><span class="icon-btn" style="width: 28px; height: 28px; border-radius: 8px">${icon('plus', 14)}</span></div>`;
  const EditeurMuscu = page('Kadro — Éditeur de séance muscu', shell('bib', `
    <div class="row" style="gap: 6px; font-size: 13px; color: ${T.ink3}"><a style="color: ${T.ink2}">Bibliothèque</a>${icon('chevron', 14)}<span style="color: ${T.ink}">Renfo bas du corps</span></div>
    <header class="row" style="gap: 16px"><div style="flex: 1 1 auto"><h1 class="h1">Renfo bas du corps</h1><div class="muted" style="margin-top: 4px">Modèle de renforcement · 6 exercices · ≈ 45 min · barre, haltères</div></div><span class="btn">Annuler</span><span class="btn">${icon('library', 18)}Enregistrer comme modèle</span>${primary('Assigner', 'check')}</header>
    <div style="display: flex; gap: 20px; flex: 1 1 auto; min-height: 0">
      <section class="card" style="flex: 1 1 auto; min-width: 0; padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; overflow: hidden">
        <div class="row" style="gap: 14px">${field('Nom', 'Renfo bas du corps', 'flex: 1 1 auto', 'edit')}${field('Type', 'Renforcement', 'width: 180px')}${field('Charges', '% du 1RM estimé', 'width: 180px')}${field('Difficulté attendue', '7 / 10', 'width: 150px')}${field('Durée estimée', '45 min', 'width: 120px', 'clock')}</div>
        <div style="display: grid; grid-template-columns: 24px 40px 1.6fr 0.8fr 0.8fr 0.9fr 0.7fr 32px; gap: 12px; padding: 0 12px; font-size: 11.5px; font-weight: 500; color: ${T.ink3}"><span></span><span></span><span>Exercice</span><span>Séries × reps</span><span>Intensité</span><span>Charge individualisée</span><span>Repos</span><span></span></div>
        <div class="col" style="gap: 8px; flex: 1 1 auto; min-height: 0">${EX.map((e, i) => exRow(e, i, i === 0)).join('')}</div>
        <div class="row" style="gap: 10px"><span class="btn" style="height: 36px; font-size: 13px">${icon('plus', 16)}Exercice</span><span class="btn" style="height: 36px; font-size: 13px">${icon('repeat', 16)}Superset</span><span style="flex: 1 1 auto"></span><span class="faint" style="font-size: 12px">La charge affichée à chaque athlète est calculée depuis son 1RM estimé, comme les allures depuis la VMA.</span></div>
      </section>
      <aside style="width: 360px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 16px">
        <section class="card" style="padding: 14px 14px 8px; flex: 1 1 auto; overflow: hidden">
          <div class="row" style="gap: 10px; margin-bottom: 10px"><h2 class="h2" style="flex: 1 1 auto">Bibliothèque d’exercices</h2><span class="faint num" style="font-size: 12px">142</span></div>
          ${searchBox(330, 'Rechercher un exercice')}
          <div class="row" style="gap: 6px; margin: 10px 0 6px; flex-wrap: wrap">${softPill('Bas du corps')}${softPill('Tronc')}${softPill('Haut du corps')}${softPill('Pliométrie')}${softPill('Mobilité')}</div>
          ${libRow('Squat bulgare', 'Quadriceps · fessiers · haltères')}${libRow('Step-up', 'Quadriceps · box')}${libRow('Nordic hamstring', 'Ischios · poids du corps')}${libRow('Mollets excentriques', 'Mollets · tendon d’Achille')}${libRow('Pont fessier unilatéral', 'Fessiers · poids du corps')}${libRow('Gainage latéral', 'Tronc · poids du corps')}
        </section>
        <section class="card" style="padding: 14px 16px">
          <div class="row" style="gap: 10px; margin-bottom: 6px"><h2 class="h2" style="flex: 1 1 auto">Aperçu · Léa Martin</h2><span class="faint" style="font-size: 12px">1RM estimés</span></div>
          <div style="font-size: 13px">
            <div class="row" style="justify-content: space-between; padding: 7px 0; border-top: 1px solid ${T.line}"><span class="muted">Squat · 1RM 85 kg → 70 %</span><span class="num" style="font-weight: 600">60 kg</span></div>
            <div class="row" style="justify-content: space-between; padding: 7px 0; border-top: 1px solid ${T.line}"><span class="muted">SDT roumain · 1RM 95 kg → 55 %</span><span class="num" style="font-weight: 600">50 kg</span></div>
            <div class="row" style="justify-content: space-between; padding: 7px 0; border-top: 1px solid ${T.line}"><span class="muted">Hip thrust · 1RM 90 kg → 65 %</span><span class="num" style="font-weight: 600">60 kg</span></div>
            <div class="row" style="justify-content: space-between; padding: 7px 0; border-top: 1px solid ${T.line}"><span class="muted">Tonnage estimé</span><span class="num" style="font-weight: 600">4,4 t</span></div>
          </div>
        </section>
      </aside>
    </div>`));

  // ---------- Desktop · Fiche athlète · onglet Muscu ----------
  const chargeRow = (e) => `<div style="display: grid; grid-template-columns: 1.6fr 0.7fr 0.9fr 110px 0.8fr; gap: 12px; align-items: center; padding: 9px 16px; border-top: 1px solid ${T.line}; font-size: 13.5px"><div class="row" style="gap: 10px">${thumb(30)}<div style="line-height: 1.25"><div style="font-weight: 500">${e.n}</div><div class="faint" style="font-size: 11.5px">${e.g}</div></div></div><span class="num muted">${e.rm ? e.rm + ' kg' : '—'}</span><span class="num" style="font-weight: 600">${e.kg}</span>${spark(e.hist)}<span class="muted num" style="font-size: 12.5px">${e.hist.length ? (e.hist[7] > e.hist[0] ? `<span style="color: ${T.good}">+${e.hist[7] - e.hist[0]} kg</span> en 8 sem.` : 'stable') : '—'}</span></div>`;
  const setLine = (n, plan, done, ok = true) => `<div class="row" style="gap: 10px; padding: 6px 0; font-size: 13px; border-top: 1px solid ${T.line}"><span class="faint num" style="width: 20px">${n}</span><span class="muted num" style="width: 110px">${plan}</span>${ok ? icon('check', 14, T.good, 2.25) : icon('x', 14, T.bad, 2.25)}<span class="num" style="font-weight: 500; color: ${ok ? T.ink : T.bad}">${done}</span></div>`;
  const FicheMuscu = page('Kadro — Fiche athlète · Muscu', shell('athletes', `
    <div class="row" style="gap: 6px; font-size: 13px; color: ${T.ink3}"><a style="color: ${T.ink2}">Athlètes</a>${icon('chevron', 14)}<span style="color: ${T.ink}">Léa Martin</span></div>
    <header class="row" style="gap: 18px">${avatar('LM', 56)}<div style="flex: 1 1 auto"><h1 class="h1">Léa Martin</h1><div class="row" style="gap: 8px; margin-top: 6px; font-size: 13.5px; color: ${T.ink2}">${statusPill('bad')}<span>Marathon de Paris · objectif 3 h 15</span><span class="faint">·</span><span>Renfo 2 × / semaine</span><span class="faint">·</span><span>Squat 1RM est. 85 kg</span></div></div><span class="btn">${icon('message', 18)}Message</span>${primary('Planifier une séance')}</header>
    ${tabs(['Aperçu', 'Planning', 'Séances', 'Muscu', 'Monitoring', 'Tests', 'Notes'], 'Muscu')}
    <div style="display: flex; gap: 20px; flex: 1 1 auto; min-height: 0">
      <div style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 16px">
        <section class="card" style="padding: 16px 18px 10px">
          <div class="row" style="gap: 10px; margin-bottom: 10px"><h2 class="h2" style="flex: 1 1 auto">Volume de renforcement</h2><span class="faint" style="font-size: 12.5px">8 semaines · tonnage (kg soulevés)</span></div>
          <div class="row" style="gap: 28px; margin-bottom: 6px">${metric('Cette semaine', '4,4 t')}${metric('Séances 8 sem.', '15 <span style="font-size: 12px; font-weight: 500; color: ' + T.ink3 + '">/ 16</span>')}${metric('Exercices suivis', '9')}${metric('RPE moyen', '7,6')}</div>
          ${barChart({ values: [3.1, 3.4, 3.6, 2.8, 4.0, 4.2, 4.6, 4.4], labels: ['S28', 'S29', 'S30', 'S31', 'S32', 'S33', 'S34', 'S35'], w: 700, h: 120, max: 6, grid: [0, 3, 6] })}
        </section>
        <section class="card" style="flex: 1 1 auto; overflow: hidden">
          ${sectionHead('Charges de travail par exercice', '<a style="font-size: 13px; font-weight: 500">Tous les exercices</a>', '12px 16px')}
          <div style="display: grid; grid-template-columns: 1.6fr 0.7fr 0.9fr 110px 0.8fr; gap: 12px; padding: 6px 16px; font-size: 11.5px; font-weight: 500; color: ${T.ink3}; background: ${T.surface2}; border-top: 1px solid ${T.line}"><span>Exercice</span><span>1RM estimé</span><span>Charge actuelle</span><span>8 semaines</span><span>Évolution</span></div>
          ${EX.slice(0, 4).map(chargeRow).join('')}
        </section>
      </div>
      <aside style="width: 380px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 16px">
        <section class="card" style="padding: 16px 18px">
          <div class="row" style="gap: 10px; margin-bottom: 2px"><h2 class="h2" style="flex: 1 1 auto">Dernière séance</h2>${donePill('Jeu 28')}</div>
          <div class="muted" style="font-size: 13px; margin-bottom: 8px">Renfo bas du corps · 42 min · RPE 8 / 10 · ressenti 3 / 5</div>
          <div style="font-weight: 500; font-size: 13px; margin-top: 6px">Squat arrière · 4 × 6 @ 60 kg</div>
          ${setLine(1, '6 × 60 kg', '6 × 60 kg')}${setLine(2, '6 × 60 kg', '6 × 60 kg')}${setLine(3, '6 × 60 kg', '6 × 60 kg')}${setLine(4, '6 × 60 kg', '5 × 60 kg', false)}
          <div style="font-weight: 500; font-size: 13px; margin-top: 10px">Hip thrust · 3 × 10 @ 60 kg</div>
          ${setLine(1, '10 × 60 kg', '10 × 60 kg')}${setLine(2, '10 × 60 kg', '10 × 60 kg')}${setLine(3, '10 × 60 kg', 'non faite', false)}
          <div style="margin-top: 12px; padding: 10px 12px; border-radius: 10px; background: ${T.warnSoft}; color: ${T.warn}; font-size: 12.5px; font-weight: 500; line-height: 1.4">« Gêne au tendon droit sur les fentes, j’ai arrêté le hip thrust. »</div>
        </section>
        <section class="card" style="padding: 16px 18px; flex: 1 1 auto">
          <div class="row" style="gap: 10px; margin-bottom: 8px"><h2 class="h2" style="flex: 1 1 auto">Records · 1RM estimés</h2><span class="faint" style="font-size: 12px">formule Epley</span></div>
          <div class="row" style="gap: 8px">${mMetric('Squat', '85 kg')}${mMetric('SDT roumain', '95 kg')}${mMetric('Hip thrust', '90 kg')}</div>
          <div class="faint" style="font-size: 12px; margin-top: 10px; line-height: 1.4">Recalculés à chaque série validée. Un test 3RM peut être programmé depuis l’onglet Tests.</div>
        </section>
      </aside>
    </div>`));

  // ---------- Coach mobile · Créer une séance muscu ----------
  const seg2 = (l, on, ic) => `<div class="row" style="flex: 1 1 0; height: 40px; justify-content: center; gap: 8px; border-radius: 9px; font-size: 13.5px; font-weight: 500; background: ${on ? T.btnPrimaryBg : 'transparent'}; color: ${on ? T.btnPrimaryInk : T.ink2}">${icon(ic, 16, on ? T.btnPrimaryInk : T.ink3)}${l}</div>`;
  const mField = (l, v, ic = '') => `<div class="col" style="gap: 6px"><span class="label">${l}</span><div class="input" style="color: ${T.ink}; height: 44px; border-radius: 12px">${ic ? icon(ic, 16, T.ink3) : ''}<span style="flex: 1 1 auto">${v}</span>${icon('chevronD', 16, T.ink3)}</div></div>`;
  const mEx = (e, i) => `<div class="row" style="gap: 10px; padding: 10px 12px; border-radius: 12px; border: 1px solid ${T.line}; background: ${T.surface}">${icon('drag', 16, T.ink3)}<div style="flex: 1 1 auto; min-width: 0; line-height: 1.3"><div class="ellip" style="font-weight: 600; font-size: 14px">${i + 1}. ${e.n}</div><div class="muted num ellip" style="font-size: 12.5px">${e.sets} · ${e.pct} · repos ${e.rest}</div></div>${icon('chevron', 16, T.ink3)}</div>`;
  const assignChips = () => `<div class="row" style="gap: 8px; flex-wrap: wrap">${[['LM', 'Léa'], ['TB', 'Théo'], ['CL', 'Clara']].map(([i, n]) => `<span class="pill" style="height: 34px; padding: 0 12px 0 4px; background: ${T.surface}; border: 1px solid ${T.line}; color: ${T.ink}; font-size: 13px">${avatar(i, 26)}${n}${icon('x', 14, T.ink3)}</span>`).join('')}<span class="pill" style="height: 34px; padding: 0 12px; background: ${T.neutralSoft}; color: ${T.ink2}; font-size: 13px">${icon('plus', 14)}Ajouter</span></div>`;
  const MobileCreerMuscu = page('Kadro — Créer une séance muscu (mobile coach)', phone(`
  <div style="${top('display: flex; flex-direction: column; gap: 14px; flex: 1 1 auto; min-height: 0')}">
    ${mHeader('Nouvelle séance', `<span style="font-size: 14px; font-weight: 500; color: ${T.ink2}">Annuler</span>`, false)}
    <div class="row" style="gap: 4px; padding: 4px; border-radius: 12px; background: ${T.neutralSoft}">${seg2('Course', false, 'run')}${seg2('Muscu', true, 'dumbbell')}</div>
    ${mField('Nom', 'Renfo bas du corps', 'edit')}
    <div class="col" style="gap: 8px"><div class="row" style="gap: 10px"><span class="label" style="flex: 1 1 auto">Exercices</span><span class="faint num" style="font-size: 12px">6 · ≈ 45 min</span></div>${EX.slice(0, 4).map(mEx).join('')}<span class="btn" style="height: 44px; border-radius: 12px; justify-content: center; border-style: dashed">${icon('plus', 16)}Ajouter un exercice</span></div>
    <div class="col" style="gap: 8px"><span class="label">Assigner à</span>${assignChips()}</div>
  </div>
  ${stickyBar(`${primaryBtn('Assigner · sam. 30 août', 'check')}`, 0)}`));

  // ---------- Coach mobile · Retour de séance muscu ----------
  const exDone = (e, sets, note = '') => `<div style="padding: 10px 0; border-top: 1px solid ${T.line}"><div class="row" style="gap: 10px"><div style="flex: 1 1 auto; line-height: 1.25"><div style="font-weight: 600; font-size: 14px">${e.n}</div><div class="muted num" style="font-size: 12px">prévu ${e.sets} · ${e.kg}</div></div>${sets.every((s) => s.ok) ? donePill(sets.length + ' / ' + sets.length) : `<span class="pill" style="background: ${T.warnSoft}; color: ${T.warn}">${sets.filter((s) => s.ok).length} / ${sets.length}</span>`}</div><div class="row" style="gap: 6px; margin-top: 8px; flex-wrap: wrap">${sets.map((s) => `<span class="pill num" style="height: 24px; padding: 0 8px; background: ${s.ok ? T.surface2 : T.badSoft}; color: ${s.ok ? T.ink : T.bad}; font-size: 11.5px">${s.t}</span>`).join('')}</div>${note ? `<div style="font-size: 12.5px; color: ${T.warn}; margin-top: 6px">${note}</div>` : ''}</div>`;
  const MobileMuscuRetour = page('Kadro — Retour de séance muscu (mobile coach)', phone(`
  <div style="${top('display: flex; flex-direction: column; gap: 12px; flex: 1 1 auto; min-height: 0')}">
    ${mHeader('Léa Martin', `<span class="icon-btn" style="border: 0; background: transparent">${icon('more', 22, T.ink)}</span>`)}
    <div class="row" style="gap: 10px">${thumb(44)}<div style="flex: 1 1 auto; line-height: 1.25"><div style="font-size: 18px; font-weight: 600; letter-spacing: -0.01em">Renfo bas du corps</div><div class="muted" style="font-size: 12.5px">Jeu 28 août · 42 min · 5 / 6 exercices complets</div></div></div>
    <div class="row" style="gap: 8px">${mMetric('RPE', '8 / 10', T.warn)}${mMetric('Ressenti', '3 / 5', T.warn)}${mMetric('Tonnage', '4,1 t')}</div>
    <section class="card" style="padding: 4px 14px 2px; flex: 1 1 auto; overflow: hidden">
      ${exDone(EX[0], [{ t: '6 × 60', ok: true }, { t: '6 × 60', ok: true }, { t: '6 × 60', ok: true }, { t: '5 × 60', ok: false }]).replace('border-top: 1px solid ' + T.line, 'border-top: 0')}
      ${exDone(EX[1], [{ t: '8 × 50', ok: true }, { t: '8 × 50', ok: true }, { t: '8 × 50', ok: true }])}
      ${exDone(EX[2], [{ t: '12 × 12', ok: true }, { t: '12 × 12', ok: true }, { t: '12 × 12', ok: true }], 'Gêne au tendon droit signalée ici')}
      ${exDone(EX[3], [{ t: '10 × 60', ok: true }, { t: '10 × 60', ok: true }, { t: 'non faite', ok: false }])}
    </section>
  </div>
  ${stickyBar(`<span class="btn" style="flex: 1 1 0; height: 48px; justify-content: center; border-radius: 12px">${icon('message', 18)}Répondre</span>${primaryBtn('Ajuster la prochaine', 'edit')}`, 0)}`));

  // ---------- Athlète · Séance muscu du jour (avant) ----------
  const aEx = (e, i) => `<div class="row" style="gap: 12px; padding: 11px 0; border-top: 1px solid ${T.line}">${thumb(40)}<div style="flex: 1 1 auto; min-width: 0; line-height: 1.3"><div style="font-weight: 600; font-size: 14px">${e.n}</div><div class="muted num" style="font-size: 12.5px">${e.sets} · repos ${e.rest}</div></div><div style="text-align: right; line-height: 1.25"><div class="num" style="font-weight: 600; font-size: 15px; color: ${e.kg === '—' ? T.ink3 : T.ink}">${e.kg}</div><div class="faint" style="font-size: 11px">${e.pct}</div></div></div>`;
  const AthleteMuscuSeance = page('Kadro — Séance muscu (athlète)', phone(`
  <div style="${top('display: flex; flex-direction: column; gap: 14px; flex: 1 1 auto; min-height: 0')}">
    ${mHeader('Samedi 30 août', `<span class="icon-btn" style="border: 0; background: transparent">${icon('more', 22, T.ink)}</span>`)}
    <div><div class="row" style="gap: 8px">${accentPill('Renforcement', 'dumbbell')}${softPill('Prévue')}</div><div style="font-size: 24px; font-weight: 600; letter-spacing: -0.02em; margin-top: 10px">Renfo bas du corps</div><div class="muted" style="font-size: 13.5px; margin-top: 4px">6 exercices · ≈ 45 min · barre, haltères</div></div>
    <section class="card" style="padding: 2px 16px 4px; overflow: hidden">${EX.map(aEx).join('').replace('border-top: 1px solid ' + T.line, 'border-top: 0')}</section>
    <section class="card" style="padding: 12px 16px"><div class="row" style="gap: 10px; margin-bottom: 6px">${avatar('MR', 26)}<span style="font-weight: 600; font-size: 13px">Le mot de Marc</span></div><div style="font-size: 13px; line-height: 1.45">Tes charges sont calées sur tes derniers 1RM. Si le tendon tire sur les fentes, remplace-les par des step-ups.</div></section>
  </div>
  ${stickyBar(`${primaryBtn('Commencer la séance', 'play')}`)}`, tabBar(ATH_TABS, 'Planning')));

  // ---------- Athlète · Enregistrement série par série ----------
  const stepper = (v, unit) => `<div class="row" style="gap: 0; border: 1px solid ${T.line}; border-radius: 12px; overflow: hidden; background: ${T.surface}; flex: 1 1 0"><span class="row" style="width: 44px; height: 52px; justify-content: center; color: ${T.ink2}">${icon('minus', 16)}</span><div style="flex: 1 1 auto; text-align: center; line-height: 1.1"><div class="num" style="font-size: 22px; font-weight: 600">${v}</div><div class="faint" style="font-size: 11px">${unit}</div></div><span class="row" style="width: 44px; height: 52px; justify-content: center; color: ${T.ink2}">${icon('plus', 16)}</span></div>`;
  const setRow = (n, t, st) => `<div class="row" style="gap: 12px; padding: 10px 0; border-top: 1px solid ${T.line}; font-size: 14px"><span class="num" style="width: 26px; height: 26px; border-radius: 99px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; background: ${st === 'done' ? T.good : st === 'now' ? T.btnPrimaryBg : T.neutralSoft}; color: ${st === 'done' || st === 'now' ? (st === 'now' ? T.btnPrimaryInk : '#fff') : T.ink2}">${st === 'done' ? icon('check', 13, '#fff', 3) : n}</span><span class="num" style="flex: 1 1 auto; font-weight: ${st === 'now' ? 600 : 400}; color: ${st === 'todo' ? T.ink3 : T.ink}">${t}</span>${st === 'done' ? `<span class="faint" style="font-size: 12px">RPE 7</span>` : ''}</div>`;
  const AthleteMuscuLog = page('Kadro — Séance muscu en cours (athlète)', phone(`
  <div style="${top('display: flex; flex-direction: column; gap: 12px; flex: 1 1 auto; min-height: 0')}">
    <div class="row" style="gap: 10px"><span class="icon-btn" style="border: 0; background: transparent; width: 32px; margin-left: -8px">${icon('x', 22, T.ink)}</span><div style="flex: 1 1 auto; text-align: center; line-height: 1.2"><div style="font-weight: 600; font-size: 15px">Renfo bas du corps</div><div class="faint num" style="font-size: 12px">12:34 · exercice 1 / 6</div></div><span class="icon-btn" style="border: 0; background: transparent">${icon('more', 22, T.ink)}</span></div>
    <div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 4px">${[1, 0, 0, 0, 0, 0].map((d, i) => `<div style="height: 4px; border-radius: 99px; background: ${i === 0 ? T.accent : T.neutralSoft}"></div>`).join('')}</div>
    <section class="card" style="padding: 14px 16px">
      <div class="row" style="gap: 12px">${thumb(44)}<div style="flex: 1 1 auto; line-height: 1.25"><div style="font-size: 18px; font-weight: 600; letter-spacing: -0.01em">Squat arrière</div><div class="muted num" style="font-size: 12.5px">4 × 6 · 60 kg (70 % 1RM) · repos 2′30</div></div></div>
      <div style="margin-top: 8px">${setRow(1, '6 reps × 60 kg', 'done')}${setRow(2, '6 reps × 60 kg', 'done')}${setRow(3, 'Série en cours', 'now')}${setRow(4, '6 reps × 60 kg', 'todo')}</div>
    </section>
    <section class="card" style="padding: 14px 16px"><div class="label" style="margin-bottom: 8px">Série 3 — qu’as-tu fait ?</div><div class="row" style="gap: 10px">${stepper('6', 'reps')}${stepper('60', 'kg')}</div><div class="row" style="gap: 6px; margin-top: 10px"><span class="label" style="flex: 1 1 auto">Difficulté (RPE)</span>${[6, 7, 8, 9, 10].map((n) => `<span class="num" style="width: 36px; height: 32px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; background: ${n === 8 ? T.btnPrimaryBg : T.surface}; color: ${n === 8 ? T.btnPrimaryInk : T.ink2}; border: 1px solid ${n === 8 ? T.btnPrimaryBg : T.line}">${n}</span>`).join('')}</div></section>
    <div class="row" style="gap: 10px; padding: 12px 14px; border-radius: 12px; background: ${T.accentSoft}; color: ${T.accentInk}; font-size: 13px; font-weight: 500">${icon('clock', 18)}<span style="flex: 1 1 auto">Repos avant la série 4</span><span class="num" style="font-size: 16px; font-weight: 600">2:30</span></div>
    <div class="faint" style="font-size: 12px; text-align: center">Suivant : Soulevé de terre roumain · 3 × 8 · 50 kg</div>
  </div>
  ${stickyBar(`${primaryBtn('Valider la série', 'check')}`, 0)}`));

  // ---------- Athlète · Progression muscu ----------
  const exProg = (e) => `<div class="row" style="gap: 12px; padding: 10px 16px; border-top: 1px solid ${T.line}"><div style="flex: 1 1 auto; min-width: 0; line-height: 1.25"><div class="ellip" style="font-weight: 500; font-size: 14px">${e.n}</div><div class="faint num" style="font-size: 11.5px">1RM est. ${e.rm ? e.rm + ' kg' : '—'}</div></div>${spark(e.hist, 72, 22)}<div style="text-align: right; width: 70px; line-height: 1.2"><div class="num" style="font-weight: 600">${e.kg}</div><div class="num" style="font-size: 11.5px; color: ${e.hist.length && e.hist[7] > e.hist[0] ? T.good : T.ink3}">${e.hist.length ? (e.hist[7] > e.hist[0] ? '+' + (e.hist[7] - e.hist[0]) + ' kg' : 'stable') : ''}</div></div></div>`;
  const AthleteMuscuProgression = page('Kadro — Progression muscu (athlète)', phone(`
  <div style="${top('display: flex; flex-direction: column; gap: 14px')}">
    <div class="row" style="gap: 12px"><h1 class="h1" style="flex: 1 1 auto; font-size: 26px">Progression</h1>${softPill('8 semaines', 'chevronD')}</div>
    <div class="row" style="gap: 4px; padding: 4px; border-radius: 12px; background: ${T.neutralSoft}">${seg2('Course', false, 'run')}${seg2('Muscu', true, 'dumbbell')}</div>
    <section class="card" style="padding: 14px 16px 6px">
      <div class="row" style="gap: 10px; margin-bottom: 6px"><h2 class="h2" style="flex: 1 1 auto">Tonnage hebdo</h2><span class="faint" style="font-size: 12px">tonnes soulevées</span></div>
      <div class="row" style="gap: 8px; margin-bottom: 4px">${metric('Cette semaine', '4,4 t')}${metric('Séances', '15 / 16')}${metric('RPE moyen', '7,6')}</div>
      ${barChart({ values: [3.1, 3.4, 3.6, 2.8, 4.0, 4.2, 4.6, 4.4], labels: ['S28', 'S29', 'S30', 'S31', 'S32', 'S33', 'S34', 'S35'], w: 318, h: 104, max: 6, grid: [0, 3, 6] })}
    </section>
    <section class="card" style="overflow: hidden">${sectionHead('Mes charges', '<span class="faint" style="font-size: 12px">charge de travail</span>', '12px 16px 6px')}${EX.slice(0, 4).map(exProg).join('')}</section>
    <div class="row" style="gap: 8px">${mMetric('Squat 1RM', '85 kg')}${mMetric('SDT 1RM', '95 kg')}${mMetric('Hip thrust', '90 kg')}</div>
  </div>`, tabBar(ATH_TABS, 'Progression')));

  return { EditeurMuscu, FicheMuscu, MobileCreerMuscu, MobileMuscuRetour, AthleteMuscuSeance, AthleteMuscuLog, AthleteMuscuProgression };
}
