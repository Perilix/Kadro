// Analyse de séance, monitoring et connecteurs montres — coach (desktop) et athlète (mobile).
export function analyse(L) {
  const { T, icon, page, avatar, statusPill, dot, softPill, accentPill, donePill, sidebar, barChart, lineChart, metric, mMetric, sectionHead, tabs, tabBar, COACH_TABS, ATH_TABS, phone, mHeader, stickyBar } = L;
  const shell = (active, inner, pad = '24px 32px 24px') => `<div style="width: 1440px; height: 900px; display: flex; background: ${T.bg}; overflow: hidden">${sidebar(active)}<main style="flex: 1 1 auto; min-width: 0; padding: ${pad}; display: flex; flex-direction: column; gap: 16px">${inner}</main></div>`;
  const primary = (l, ic = 'plus') => `<span class="btn primary">${icon(ic, 18, T.btnPrimaryInk, 2)}${l}</span>`;
  const primaryBtn = (l, ic) => `<span class="btn primary" style="flex: 1 1 0; height: 48px; justify-content: center; border-radius: 12px">${ic ? icon(ic, 18, T.btnPrimaryInk, 2) : ''}${l}</span>`;
  const top = (extra = '') => `padding: 56px 20px 0; ${extra}`;
  const ZONES = T.mode === 'dark' ? ['#26235A', '#3A357F', '#5A52B5', '#7B72E0', '#8B82FF'] : ['#ECEAFD', '#CFC9FA', '#A79EF4', '#7C70EE', '#5B4FE9'];

  // ---------- synthetic session: VMA 10 × 400 m (58 min) ----------
  const pts = []; // { t (min), pace (s/km), hr, cad }
  const push = (t, pace, hr, cad) => pts.push({ t, pace, hr, cad });
  for (let t = 0; t < 15; t += 0.25) push(t, 355 - t * 1.2 + Math.sin(t * 3) * 6, 118 + t * 1.6 + Math.sin(t) * 2, 168 + Math.sin(t * 2));
  const REP = [218, 217, 219, 219, 221, 221, 225, 228, 232, 236]; // s/km per rep (1:27 target = 217.5)
  let t = 15;
  REP.forEach((p, i) => { for (let k = 0; k < 1.45; k += 0.125) push(t + k, p + Math.sin(k * 9) * 3, 158 + i * 2 + k * 14, 186 + Math.sin(k * 7)); t += 1.45; for (let k = 0; k < 1; k += 0.125) push(t + k, 420 - k * 20, 172 + i * 1.5 - k * 18, 160); t += 1; });
  for (let k = 0; k < 10; k += 0.25) push(t + k, 370 + Math.sin(k) * 8, 150 - k * 2, 166); t += 10;
  const TOTAL = t;

  const fmtPace = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  function lineSeries({ w = 760, h = 150, key, yMin, yMax, invert = false, bands = null, shade = true, label = (v) => v, ticks = 3, color = T.accent }) {
    const padL = 42, padR = 10, padT = 10, padB = 22, iw = w - padL - padR, ih = h - padT - padB;
    const x = (tt) => padL + (tt / TOTAL) * iw;
    const y = (v) => { const r = (v - yMin) / (yMax - yMin); return padT + (invert ? r : 1 - r) * ih; };
    let out = `<svg width="100%" viewBox="0 0 ${w} ${h}" style="display: block; font-family: inherit">`;
    if (bands) bands.forEach(([lo, hi], i) => { const y1 = y(Math.min(hi, yMax)), y2 = y(Math.max(lo, yMin)); out += `<rect x="${padL}" y="${Math.min(y1, y2)}" width="${iw}" height="${Math.abs(y2 - y1)}" fill="${ZONES[i]}" opacity="${T.mode === 'dark' ? 0.22 : 0.28}"/><text x="${w - padR - 4}" y="${Math.min(y1, y2) + 11}" text-anchor="end" font-size="10" font-weight="600" fill="${T.ink3}">Z${i + 1}</text>`; });
    if (shade) { let tt = 15; REP.forEach(() => { out += `<rect x="${x(tt)}" y="${padT}" width="${x(tt + 1.45) - x(tt)}" height="${ih}" fill="${T.accentSoft}" opacity="${bands ? 0 : 0.9}"/>`; tt += 2.45; }); }
    for (let i = 0; i <= ticks; i++) { const v = yMin + (yMax - yMin) * i / ticks; out += `<line x1="${padL}" x2="${w - padR}" y1="${y(v)}" y2="${y(v)}" stroke="${T.line}"/><text x="${padL - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="${T.ink3}">${label(v)}</text>`; }
    out += `<polyline fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" points="${pts.map((p) => `${x(p.t).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ')}"/>`;
    [0, 15, 30, 45, Math.floor(TOTAL)].forEach((m) => { out += `<text x="${x(m)}" y="${h - 6}" text-anchor="middle" font-size="11" fill="${T.ink3}">${m}′</text>`; });
    return out + `</svg>`;
  }
  const zoneBar = (parts) => `<div style="display: flex; height: 14px; border-radius: 99px; overflow: hidden; gap: 2px; background: ${T.surface}">${parts.map((p, i) => `<div style="width: ${p}%; background: ${ZONES[i]}"></div>`).join('')}</div><div class="row" style="justify-content: space-between; margin-top: 6px; font-size: 11.5px; color: ${T.ink2}">${parts.map((p, i) => `<span class="row" style="gap: 5px"><span style="width: 8px; height: 8px; border-radius: 2px; background: ${ZONES[i]}"></span>Z${i + 1} <b class="num" style="font-weight: 600; color: ${T.ink}">${p} %</b></span>`).join('')}</div>`;
  const repRow = (i, p) => { const d = Math.round(p - 217.5); const c = Math.abs(d) <= 2 ? T.good : Math.abs(d) <= 6 ? T.warn : T.bad; const rec = 150 + i * 2 + (i > 5 ? 4 : 0); return `<div style="display: grid; grid-template-columns: 28px 1fr 1fr 0.8fr 0.9fr 1fr; gap: 8px; align-items: center; padding: 6px 0; border-top: 1px solid ${T.line}; font-size: 13px"><span class="faint num">${i + 1}</span><span class="num" style="font-weight: 600">${fmtPace(p * 0.4)}</span><span class="num muted">${fmtPace(p)} /km</span><span class="num muted">${160 + i * 2 + 10}</span><span class="num" style="color: ${rec >= 160 ? T.warn : T.ink2}">${rec}</span><span class="row num" style="gap: 6px; color: ${c}; font-weight: 500">${dot(Math.abs(d) <= 2 ? 'good' : Math.abs(d) <= 6 ? 'warn' : 'bad', 7)}${d > 0 ? '+' : ''}${Math.round(d * 0.4)} s</span></div>`; };
  const best = (l, v, note = '', pr = false) => `<div class="row" style="gap: 10px; padding: 8px 0; border-top: 1px solid ${T.line}; font-size: 13px"><span style="flex: 1 1 auto">${l}</span><span class="num" style="font-weight: 600">${v}</span>${pr ? `<span class="pill" style="height: 20px; padding: 0 7px; font-size: 11px; background: ${T.goodSoft}; color: ${T.good}">${icon('medal', 11, T.good)}Record</span>` : note ? `<span class="faint" style="font-size: 11.5px">${note}</span>` : ''}</div>`;

  // ---------- Desktop · Analyse de séance (VMA) ----------
  const AnalyseSeance = page('Kadro — Analyse de séance', shell('athletes', `
    <div class="row" style="gap: 6px; font-size: 13px; color: ${T.ink3}"><a style="color: ${T.ink2}">Athlètes</a>${icon('chevron', 14)}<a style="color: ${T.ink2}">Léa Martin</a>${icon('chevron', 14)}<span style="color: ${T.ink}">VMA 10 × 400 m</span></div>
    <header class="row" style="gap: 16px"><div style="flex: 1 1 auto"><div class="row" style="gap: 8px; margin-bottom: 6px">${accentPill('VMA', 'run')}${donePill('Réalisée')}<span class="faint" style="font-size: 12.5px">Mer 27 août · Garmin Forerunner 265 · synchronisée à 18:42</span></div><h1 class="h1">VMA 10 × 400 m</h1></div><span class="btn">${icon('message', 18)}Répondre</span><span class="btn">${icon('chevronL', 18)}Séance précédente</span>${primary('Ajuster la prochaine', 'edit')}</header>
    <div style="display: flex; gap: 12px">
      ${[['Distance', '12,1 km'], ['Durée', '58:12'], ['Allure moy.', '4:48 /km'], ['FC moy. · max', '168 · 186'], ['Cadence', '178 ppm'], ['D+', '45 m'], ['Charge', '61 UA'], ['Difficulté · attendue', '8 · 8 / 10']].map(([l, v], i) => `<div class="card" style="flex: 1 1 0; padding: 10px 14px; display: flex; flex-direction: column; gap: 2px; ${i === 7 ? `border-color: ${T.good}` : ''}"><span class="faint" style="font-size: 11.5px">${l}</span><span class="num" style="font-size: 17px; font-weight: 600; letter-spacing: -0.01em; color: ${i === 7 ? T.good : T.ink}">${v}</span></div>`).join('')}
    </div>
    <div style="display: flex; gap: 20px; flex: 1 1 auto; min-height: 0">
      <div style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 14px">
        <section class="card" style="padding: 14px 18px 8px">
          <div class="row" style="gap: 10px; margin-bottom: 4px"><h2 class="h2" style="flex: 1 1 auto">Allure</h2><span class="row" style="gap: 6px; font-size: 12px; color: ${T.ink2}"><span style="width: 12px; height: 12px; border-radius: 3px; background: ${T.accentSoft}; border: 1px solid ${T.line}"></span>répétitions prévues</span></div>
          ${lineSeries({ key: 'pace', yMin: 200, yMax: 440, invert: true, label: (v) => fmtPace(v), ticks: 3, h: 124 })}
        </section>
        <section class="card" style="padding: 14px 18px 8px">
          <div class="row" style="gap: 10px; margin-bottom: 4px"><h2 class="h2" style="flex: 1 1 auto">Fréquence cardiaque</h2><span class="faint" style="font-size: 12px">zones calées sur FC max 192</span></div>
          ${lineSeries({ key: 'hr', yMin: 110, yMax: 195, bands: [[110, 134], [134, 154], [154, 165], [165, 178], [178, 195]], shade: false, label: (v) => Math.round(v), ticks: 3, h: 116, color: T.ink })}
          <div style="margin-top: 8px">${zoneBar([14, 22, 18, 31, 15])}</div>
        </section>
        <section class="card" style="padding: 14px 18px; flex: 1 1 auto; overflow: hidden">
          <div class="row" style="gap: 10px; margin-bottom: 4px"><h2 class="h2" style="flex: 1 1 auto">Les 10 × 400 m — prévu vs réalisé</h2><span class="faint num" style="font-size: 12px">cible 1:27 · 3:38 /km · récup 1′ trot</span><span class="faint">·</span><span class="num" style="font-size: 12px; color: ${T.ink2}">régularité <b style="font-weight: 600; color: ${T.warn}">± 3 s</b> · 6 / 10 dans la cible</span></div>
          <div style="display: grid; grid-template-columns: 28px 1fr 1fr 0.8fr 0.9fr 1fr; gap: 8px; font-size: 11.5px; color: ${T.ink3}; padding: 4px 0"><span>#</span><span>Temps</span><span>Allure</span><span>FC fin</span><span>FC après récup</span><span>Écart</span></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; column-gap: 28px">${[0, 1, 2, 3, 4].map((i) => repRow(i, REP[i])).join('')}${[5, 6, 7, 8, 9].map((i) => repRow(i, REP[i])).join('')}</div>
        </section>
      </div>
      <aside style="width: 340px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 14px">
        <section class="card" style="padding: 14px 16px">
          <div class="row" style="gap: 10px; margin-bottom: 10px"><h2 class="h2" style="flex: 1 1 auto">Difficulté</h2>${donePill('Conforme')}</div>
          <div class="row" style="gap: 4px; margin-bottom: 8px">${[1,2,3,4,5,6,7,8,9,10].map((n) => `<span class="num" style="flex: 1 1 0; height: 30px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; ${n === 8 ? `background: ${T.btnPrimaryBg}; color: ${T.btnPrimaryInk}` : n <= 8 ? `background: ${T.accentSoft}; color: ${T.accentInk}` : `background: ${T.surface2}; color: ${T.ink3}`}">${n}</span>`).join('')}</div>
          <div class="row" style="justify-content: space-between; font-size: 12.5px; color: ${T.ink2}"><span>Attendue par Marc : <b class="num" style="font-weight: 600; color: ${T.ink}">8 / 10</b></span><span>Ressentie par Léa : <b class="num" style="font-weight: 600; color: ${T.ink}">8 / 10</b></span></div>
          <div style="font-size: 13px; line-height: 1.45; padding: 10px 12px; border-radius: 10px; background: ${T.surface2}; margin-top: 10px">${avatar('LM', 22)} « Les 2 derniers étaient très durs, jambes lourdes. Gêne légère au tendon droit. » <span class="faint">· ressenti 2 / 5</span></div>
        </section>
        <section class="card" style="padding: 14px 16px 6px">
          <div class="row" style="gap: 10px; margin-bottom: 2px"><h2 class="h2" style="flex: 1 1 auto">Meilleurs efforts détectés</h2></div>
          ${best('400 m', '1:26', '', false)}${best('1 km', '3:41', 'record : 3:39')}${best('5 km', '21:10', '', true)}
        </section>
        <section class="card" style="padding: 14px 16px 6px">
          <div class="row" style="gap: 10px; margin-bottom: 2px"><h2 class="h2" style="flex: 1 1 auto">Vs. la VMA du 13 août</h2><span class="faint" style="font-size: 12px">même séance</span></div>
          ${[['Rep moyenne', '1:27 → 1:28', T.warn], ['FC après récup (moy.)', '152 → 157', T.warn], ['Difficulté ressentie', '7 → 8', T.warn], ['Sommeil la veille', '7 h 40 → 6 h 10', T.bad]].map(([l, v, c]) => `<div class="row" style="justify-content: space-between; padding: 7px 0; border-top: 1px solid ${T.line}; font-size: 13px"><span class="muted">${l}</span><span class="num" style="font-weight: 600; color: ${c}">${v}</span></div>`).join('')}
        </section>
        <section class="card" style="padding: 12px 16px; flex: 1 1 auto">
          <div class="row" style="gap: 10px; margin-bottom: 6px"><h2 class="h2" style="flex: 1 1 auto">Lecture du coach</h2><span class="btn" style="height: 30px; padding: 0 10px; font-size: 12.5px">${icon('repeat', 14)}Réduire à 8 × 400</span></div>
          <div style="font-size: 12.5px; line-height: 1.45; color: ${T.ink2}">Dans la cible jusqu’au 6ᵉ, puis la FC ne redescend plus sous 160 entre les reps : la récup d’1′ est trop courte à ce niveau de fatigue. Et le tendon.</div>
        </section>
      </aside>
    </div>`));

  // ---------- Desktop · Analyse trail (sortie longue) ----------
  const N = 80, KM = 20.4;
  const prof = []; for (let i = 0; i <= N; i++) { const x = i / N; prof.push(120 + 380 * Math.max(0, Math.sin(x * Math.PI * 1.1)) ** 1.4 + 60 * Math.sin(x * 12) * (x > 0.15 && x < 0.85 ? 1 : 0.2)); }
  const grade = prof.map((v, i) => i ? (v - prof[i - 1]) / (KM * 1000 / N) * 100 : 0);
  const paceRaw = grade.map((g) => Math.min(620, Math.max(295, 350 + (g > 0 ? g * 22 : g * 8) + Math.sin(g * 3) * 6)));
  const paceGap = paceRaw.map((p, i) => 341 + Math.sin(i * 0.7) * 9 + (i > 60 ? 8 : 0));
  const hrD = grade.map((g, i) => 140 + Math.max(0, g) * 1.8 + Math.min(0, g) * 0.6 + Math.sin(i * 0.5) * 3 + (i > 60 ? 6 : 0));
  function distSeries({ w = 760, h = 118, series, yMin, yMax, invert = false, label = (v) => v, bands = null, area = false, ticks = 2, axis = true }) {
    const padL = 42, padR = 34, padT = 10, padB = axis ? 20 : 8, iw = w - padL - padR, ih = h - padT - padB;
    const x = (i) => padL + (i / N) * iw, y = (v) => { const r = (v - yMin) / (yMax - yMin); return padT + (invert ? r : 1 - r) * ih; };
    let out = `<svg width="100%" viewBox="0 0 ${w} ${h}" style="display: block; font-family: inherit">`;
    if (bands) bands.forEach(([lo, hi], i) => { const y1 = y(Math.min(hi, yMax)), y2 = y(Math.max(lo, yMin)); out += `<rect x="${padL}" y="${Math.min(y1, y2)}" width="${iw}" height="${Math.abs(y2 - y1)}" fill="${ZONES[i]}" opacity="${T.mode === 'dark' ? 0.22 : 0.28}"/><text x="${w - padR - 4}" y="${Math.min(y1, y2) + 11}" text-anchor="end" font-size="10" font-weight="600" fill="${T.ink3}">Z${i + 1}</text>`; });
    out += `<rect x="${x(22)}" y="${padT}" width="${x(44) - x(22)}" height="${ih}" fill="${T.accentSoft}" opacity="${bands ? 0 : 0.55}"/>`;
    for (let i = 0; i <= ticks; i++) { const v = yMin + (yMax - yMin) * i / ticks; out += `<line x1="${padL}" x2="${w - padR}" y1="${y(v)}" y2="${y(v)}" stroke="${T.line}"/><text x="${padL - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="${T.ink3}">${label(v)}</text>`; }
    series.forEach(({ data, color, width = 2, dash = '' }) => { const pts2 = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' '); if (area) out += `<path d="M${x(0)} ${padT + ih} L${pts2.split(' ').map((p) => p.replace(',', ' ')).join(' L')} L${x(N)} ${padT + ih} z" fill="${T.accentSoft}"/>`; out += `<polyline fill="none" stroke="${color}" stroke-width="${width}" ${dash ? `stroke-dasharray="${dash}"` : ''} stroke-linejoin="round" points="${pts2}"/>`; });
    if (axis) [0, 5, 10, 15, 20].map((k) => { out += `<text x="${x(k / KM * N)}" y="${h - 6}" text-anchor="middle" font-size="11" fill="${T.ink3}">${k} km</text>`; });
    return out + `</svg>`;
  }
  const legend = (items) => `<span class="row" style="gap: 14px; font-size: 12px; color: ${T.ink2}">${items.map(([c, l, dash]) => `<span class="row" style="gap: 6px"><span style="width: 16px; height: 0; border-top: 2px ${dash ? 'dashed' : 'solid'} ${c}"></span>${l}</span>`).join('')}</span>`;
  const splitRow = (km, pace, gap, dplus, hr) => `<div style="display: grid; grid-template-columns: 34px 1fr 1fr 1fr 1fr; gap: 8px; align-items: center; padding: 4px 0; border-top: 1px solid ${T.line}; font-size: 12.5px"><span class="faint num">${km}</span><span class="num" style="font-weight: 500">${pace}</span><span class="num" style="font-weight: 600; color: ${T.accentInk}">${gap}</span><span class="num muted">${dplus}</span><span class="num muted">${hr}</span></div>`;
  const AnalyseTrail = page('Kadro — Analyse trail', shell('athletes', `
    <div class="row" style="gap: 6px; font-size: 13px; color: ${T.ink3}"><a style="color: ${T.ink2}">Athlètes</a>${icon('chevron', 14)}<a style="color: ${T.ink2}">Sofia Rossi</a>${icon('chevron', 14)}<span style="color: ${T.ink}">Trail 2 h 30</span></div>
    <header class="row" style="gap: 16px"><div style="flex: 1 1 auto"><div class="row" style="gap: 8px; margin-bottom: 6px">${accentPill('Trail', 'mountain')}${donePill('Réalisée')}<span class="faint" style="font-size: 12.5px">Dim 31 août · Coros Pace 3 · synchronisée à 12:05</span></div><h1 class="h1">Trail 2 h 30 · Bauges</h1></div><span class="btn">${icon('message', 18)}Répondre</span>${primary('Ajuster la prochaine', 'edit')}</header>
    <div style="display: flex; gap: 12px">
      ${[['Distance', '20,4 km'], ['Durée', '2:28:40'], ['D+ · D−', '980 · 975 m'], ['Allure', '7:17 /km'], ['Allure ajustée pente', '5:41 /km'], ['Vitesse ascens.', '842 m/h'], ['FC moy. · max', '152 · 178'], ['Difficulté · attendue', '7 · 7 / 10']].map(([l, v], i) => `<div class="card" style="flex: 1 1 0; padding: 10px 14px; display: flex; flex-direction: column; gap: 2px; ${i === 7 ? `border-color: ${T.good}` : ''}"><span class="faint" style="font-size: 11.5px">${l}</span><span class="num" style="font-size: 17px; font-weight: 600; letter-spacing: -0.01em; color: ${i === 4 ? T.accentInk : i === 7 ? T.good : T.ink}">${v}</span></div>`).join('')}
    </div>
    <div style="display: flex; gap: 20px; flex: 1 1 auto; min-height: 0">
      <div style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 10px">
        <section class="card" style="padding: 12px 18px 8px; display: flex; flex-direction: column; gap: 6px">
          <div class="row" style="gap: 10px"><h2 class="h2" style="flex: 1 1 auto; font-size: 14px">Profil</h2><span class="row" style="gap: 6px; font-size: 12px; color: ${T.ink2}"><span style="width: 12px; height: 12px; border-radius: 3px; background: ${T.accentSoft}; border: 1px solid ${T.line}"></span>montée principale · 4,1 km · +410 m</span></div>
          ${distSeries({ series: [{ data: prof, color: T.accent }], yMin: 100, yMax: 560, label: (v) => v + ' m', area: true, h: 108, axis: false })}
          <div class="row" style="gap: 10px; padding-top: 6px; border-top: 1px solid ${T.line}"><h2 class="h2" style="flex: 1 1 auto; font-size: 14px">Allure</h2>${legend([[T.ink3, 'réelle', true], [T.accent, 'ajustée à la pente']])}</div>
          ${distSeries({ series: [{ data: paceRaw, color: T.ink3, width: 1.5, dash: '3 3' }, { data: paceGap, color: T.accent }], yMin: 280, yMax: 640, invert: true, label: (v) => fmtPace(v), h: 108, axis: false })}
          <div class="row" style="gap: 10px; padding-top: 6px; border-top: 1px solid ${T.line}"><h2 class="h2" style="flex: 1 1 auto; font-size: 14px">Fréquence cardiaque</h2><span class="faint" style="font-size: 12px">zones sur FC max 188</span></div>
          ${distSeries({ series: [{ data: hrD, color: T.ink }], yMin: 110, yMax: 190, label: (v) => Math.round(v), bands: [[110, 132], [132, 150], [150, 161], [161, 173], [173, 190]], h: 120 })}
        </section>
        <section class="card" style="padding: 12px 18px; flex: 1 1 auto; overflow: hidden">
          <div class="row" style="gap: 10px; margin-bottom: 2px"><h2 class="h2" style="flex: 1 1 auto; font-size: 14px">Par kilomètre</h2><span class="faint" style="font-size: 12px">l’allure ajustée rend les km de montée comparables aux km plats</span></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; column-gap: 28px">
            <div><div style="display: grid; grid-template-columns: 34px 1fr 1fr 1fr 1fr; gap: 8px; font-size: 11px; color: ${T.ink3}; padding: 2px 0"><span>km</span><span>Allure</span><span>Ajustée</span><span>D+</span><span>FC</span></div>${[['1', '5:58', '5:50', '+12', '138'], ['2', '6:05', '5:52', '+18', '142'], ['3', '6:40', '5:48', '+55', '149'], ['4', '9:12', '5:36', '+128', '158'], ['5', '10:05', '5:31', '+146', '163']].map((r) => splitRow(...r)).join('')}</div>
            <div><div style="display: grid; grid-template-columns: 34px 1fr 1fr 1fr 1fr; gap: 8px; font-size: 11px; color: ${T.ink3}; padding: 2px 0"><span>km</span><span>Allure</span><span>Ajustée</span><span>D+</span><span>FC</span></div>${[['6', '9:40', '5:38', '+131', '165'], ['7', '8:10', '5:44', '+92', '160'], ['9', '5:15', '6:02', '−48', '146'], ['10', '4:58', '6:05', '−70', '144'], ['16', '5:20', '5:57', '−51', '146']].map((r) => splitRow(...r)).join('')}</div>
          </div>
        </section>
      </div>
      <aside style="width: 340px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 14px">
        <section class="card" style="padding: 14px 16px">
          <div class="row" style="gap: 10px; margin-bottom: 10px"><h2 class="h2" style="flex: 1 1 auto">Difficulté</h2>${donePill('Conforme')}</div>
          <div class="row" style="gap: 4px; margin-bottom: 8px">${[1,2,3,4,5,6,7,8,9,10].map((n) => `<span class="num" style="flex: 1 1 0; height: 30px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; ${n === 7 ? `background: ${T.btnPrimaryBg}; color: ${T.btnPrimaryInk}` : n <= 7 ? `background: ${T.accentSoft}; color: ${T.accentInk}` : `background: ${T.surface2}; color: ${T.ink3}`}">${n}</span>`).join('')}</div>
          <div class="row" style="justify-content: space-between; font-size: 12.5px; color: ${T.ink2}"><span>Attendue : <b class="num" style="font-weight: 600; color: ${T.ink}">7 / 10</b></span><span>Ressentie : <b class="num" style="font-weight: 600; color: ${T.ink}">7 / 10</b></span></div>
          <div style="font-size: 13px; line-height: 1.45; padding: 10px 12px; border-radius: 10px; background: ${T.surface2}; margin-top: 10px">${avatar('SR', 22)} « Montée gérée, j’ai pu relancer au sommet. Descente prudente, sol gras. » <span class="faint">· ressenti 4 / 5</span></div>
        </section>
        <section class="card" style="padding: 14px 16px 6px"><div class="row" style="gap: 10px; margin-bottom: 2px"><h2 class="h2" style="flex: 1 1 auto">Meilleurs efforts</h2></div>${best('Montée principale', '31:40', '+410 m · 776 m/h')}${best('Vitesse ascens. 20′', '905 m/h', '', true)}${best('Descente 3 km', '14:20', '5 % de mieux qu’en juin')}</section>
        <section class="card" style="padding: 14px 16px; flex: 1 1 auto"><div class="row" style="gap: 10px; margin-bottom: 8px"><h2 class="h2" style="flex: 1 1 auto">Temps par zone FC</h2></div>${zoneBar([12, 38, 30, 17, 3])}<div class="faint" style="font-size: 12px; margin-top: 12px; line-height: 1.45">Puissance, balance gauche / droite et W′bal apparaissent avec un capteur de puissance (vélo) — v2.</div></section>
      </aside>
    </div>`));

  // ---------- Desktop · Fiche athlète · onglet Monitoring ----------
  const small = (title, unit, values, min, max, fmt = (v) => v, color = T.accent) => { const w = 330, h = 110, padL = 36, padR = 8, padT = 12, padB = 20, iw = w - padL - padR, ih = h - padT - padB; const x = (i) => padL + (i / (values.length - 1)) * iw, y = (v) => padT + (1 - (v - min) / (max - min)) * ih; return `<section class="card" style="padding: 12px 14px 6px"><div class="row" style="gap: 8px; margin-bottom: 2px"><h2 class="h2" style="flex: 1 1 auto; font-size: 14px">${title}</h2><span class="num" style="font-size: 15px; font-weight: 600">${fmt(values[values.length - 1])}</span><span class="faint" style="font-size: 11.5px">${unit}</span></div><svg width="100%" viewBox="0 0 ${w} ${h}" style="display: block; font-family: inherit">${[min, (min + max) / 2, max].map((g) => `<line x1="${padL}" x2="${w - padR}" y1="${y(g)}" y2="${y(g)}" stroke="${T.line}"/><text x="${padL - 6}" y="${y(g) + 4}" text-anchor="end" font-size="10.5" fill="${T.ink3}">${fmt(g)}</text>`).join('')}<polyline fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" points="${values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}"/><circle cx="${x(values.length - 1)}" cy="${y(values[values.length - 1])}" r="4" fill="${color}" stroke="${T.surface}" stroke-width="2"/>${['S28', 'S30', 'S32', 'S34'].map((l, k) => `<text x="${x(k * 14)}" y="${h - 6}" text-anchor="middle" font-size="10.5" fill="${T.ink3}">${l}</text>`).join('')}</svg></section>`; };
  const gen = (base, amp, n = 56, drift = 0, seed = 1) => Array.from({ length: n }, (_, i) => +(base + drift * i / n + amp * Math.sin(i * 0.9 + seed) + amp * 0.5 * Math.sin(i * 2.3 + seed * 2)).toFixed(1));
  const sleep = gen(7.3, 0.6, 56, -0.6, 1).map((v, i) => i > 50 ? v - 1.2 : v);
  const rhr = gen(48, 1.5, 56, 0, 2).map((v, i) => i > 50 ? v + 5 : v);
  const weight = gen(58.6, 0.3, 56, -0.6, 3);
  const hrv = gen(72, 6, 56, 0, 4).map((v, i) => i > 50 ? v - 18 : v);
  const Monitoring = page('Kadro — Fiche athlète · Monitoring', shell('athletes', `
    <div class="row" style="gap: 6px; font-size: 13px; color: ${T.ink3}"><a style="color: ${T.ink2}">Athlètes</a>${icon('chevron', 14)}<span style="color: ${T.ink}">Léa Martin</span></div>
    <header class="row" style="gap: 18px">${avatar('LM', 56)}<div style="flex: 1 1 auto"><h1 class="h1">Léa Martin</h1><div class="row" style="gap: 8px; margin-top: 6px; font-size: 13.5px; color: ${T.ink2}">${statusPill('bad')}<span>Marathon de Paris · objectif 3 h 15</span><span class="faint">·</span><span>Garmin Forerunner 265 · sommeil et FC repos synchronisés chaque matin</span></div></div><span class="btn">${icon('message', 18)}Message</span>${primary('Planifier une séance')}</header>
    ${tabs(['Aperçu', 'Planning', 'Séances', 'Muscu', 'Monitoring', 'Tests', 'Notes'], 'Monitoring')}
    <div style="display: flex; gap: 20px; flex: 1 1 auto; min-height: 0">
      <div style="flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 14px">
        <div class="row" style="gap: 10px; padding: 12px 14px; border-radius: 10px; background: ${T.badSoft}; color: ${T.bad}; font-size: 13px; font-weight: 500; line-height: 1.35">${icon('alert', 18, T.bad)}<span style="flex: 1 1 auto">Depuis 5 jours : sommeil −1 h 10, FC repos +5, HRV −25 %. Le ressenti confirme. Signature classique d’une fatigue à ne pas empiler.</span><span class="btn" style="height: 30px; font-size: 12.5px; background: transparent; border-color: ${T.bad}; color: ${T.bad}">Alléger la semaine</span></div>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px">
          ${small('Sommeil', 'h · 8 semaines', sleep, 5, 9, (v) => String(v).replace('.', ','))}
          ${small('FC de repos', 'bpm · au réveil', rhr, 42, 58, (v) => Math.round(v))}
          ${small('Variabilité cardiaque', 'ms · RMSSD', hrv, 40, 90, (v) => Math.round(v))}
          ${small('Poids', 'kg · déclaré ou balance connectée', weight, 57, 60, (v) => String(v).replace('.', ','))}
        </div>
        <section class="card" style="padding: 12px 14px 10px; flex: 1 1 auto"><div class="row" style="gap: 8px; margin-bottom: 8px"><h2 class="h2" style="flex: 1 1 auto; font-size: 14px">Check-in de forme</h2><span class="faint" style="font-size: 11.5px">8 semaines · un point par jour</span></div><div style="display: grid; grid-template-columns: repeat(56, minmax(0, 1fr)); gap: 3px">${Array.from({ length: 56 }, (_, i) => { const lv = i > 52 ? 'bad' : i > 50 ? 'warn' : i % 9 === 4 ? 'warn' : i % 13 === 7 ? 'none' : 'good'; return `<span style="height: 18px; border-radius: 4px; background: ${L.LEVEL[lv][1]}; opacity: ${lv === 'none' ? 0.35 : 1}"></span>`; }).join('')}</div><div class="row" style="justify-content: space-between; font-size: 11px; color: ${T.ink3}; margin-top: 6px"><span>S28</span><span>S30</span><span>S32</span><span>S34</span><span>aujourd’hui</span></div></section>
      </div>
      <aside style="width: 340px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 14px">
        <section class="card" style="padding: 14px 16px"><div class="row" style="gap: 10px; margin-bottom: 6px"><h2 class="h2" style="flex: 1 1 auto">Cette semaine</h2></div>${[['Sommeil moyen', '6 h 10', T.bad], ['FC repos', '53 bpm', T.warn], ['HRV', '54 ms', T.bad], ['Poids', '58,2 kg', T.ink], ['Check-ins', '7 / 7', T.good]].map(([l, v, c]) => `<div class="row" style="justify-content: space-between; padding: 8px 0; border-top: 1px solid ${T.line}; font-size: 13px"><span class="muted">${l}</span><span class="num" style="font-weight: 600; color: ${c}">${v}</span></div>`).join('')}</section>
        <section class="card" style="padding: 14px 16px; flex: 1 1 auto"><div class="row" style="gap: 10px; margin-bottom: 6px"><h2 class="h2" style="flex: 1 1 auto">Seuils d’alerte</h2><a style="font-size: 13px; font-weight: 500">Modifier</a></div>${[['Ressenti rouge', '2 jours de suite'], ['FC repos', '+ 5 bpm vs 4 sem.'], ['Sommeil', '< 6 h sur 3 jours'], ['HRV', '− 20 % vs 4 sem.'], ['Charge', 'ratio > 1,3']].map(([l, v]) => `<div class="row" style="justify-content: space-between; padding: 8px 0; border-top: 1px solid ${T.line}; font-size: 13px"><span class="muted">${l}</span><span class="num">${v}</span></div>`).join('')}<div class="faint" style="font-size: 12px; margin-top: 10px; line-height: 1.45">Chaque seuil franchi crée une ligne « À traiter » sur votre aperçu. Réglable par athlète.</div></section>
      </aside>
    </div>`));

  // ---------- Desktop · Intégrations (coach) ----------
  const DEVICES = [
    ['Garmin', 'Connect', 11, 'good', 'Séances envoyées sur la montre · données de sommeil et FC repos'],
    ['Coros', 'Training Hub', 3, 'good', 'Séances envoyées sur la montre · données de sommeil'],
    ['Polar', 'Flow', 2, 'good', 'Séances envoyées · Nightly Recharge'],
    ['Suunto', 'App', 0, 'none', 'Séances envoyées · récupération'],
    ['Apple Watch', 'Santé', 1, 'good', 'Import des activités et du sommeil · pas d’envoi de séance'],
    ['Wahoo', 'ELEMNT', 0, 'none', 'Vélo · séances envoyées'],
    ['Strava', '', 16, 'good', 'Import des activités · partage des séances réalisées'],
    ['Zwift', '', 0, 'none', 'Vélo indoor · séances envoyées (.zwo)'],
  ];
  const devRow = ([n, sub, count, lv, what]) => `<div class="row" style="gap: 14px; padding: 12px 16px; border-top: 1px solid ${T.line}"><span style="width: 40px; height: 40px; border-radius: 10px; background: ${T.neutralSoft}; display: inline-flex; align-items: center; justify-content: center; color: ${T.ink2}; font-weight: 700; font-size: 13px">${n.slice(0, 2)}</span><div style="flex: 1 1 auto; line-height: 1.3"><div style="font-weight: 600">${n} <span class="faint" style="font-weight: 400; font-size: 12.5px">${sub}</span></div><div class="muted" style="font-size: 12.5px">${what}</div></div><span class="num muted" style="font-size: 13px; width: 110px; text-align: right">${count ? count + ' athlète' + (count > 1 ? 's' : '') : '—'}</span>${count ? donePill('Actif') : softPill('Disponible')}</div>`;
  const Integrations = page('Kadro — Intégrations & montres', shell('team', `
    <div class="row" style="gap: 6px; font-size: 13px; color: ${T.ink3}"><a style="color: ${T.ink2}">Équipe & réglages</a>${icon('chevron', 14)}<span style="color: ${T.ink}">Intégrations</span></div>
    <header class="row" style="gap: 16px"><div style="flex: 1 1 auto"><h1 class="h1">Intégrations & montres</h1><div class="muted" style="margin-top: 4px">Chaque athlète connecte sa propre montre depuis son profil. Vous voyez ici qui est relié, et ce qui part vers les montres.</div></div></header>
    <div style="display: flex; gap: 16px">${[['Athlètes reliés à une montre', '16 / 18', T.ink], ['Séances envoyées cette semaine', '58', T.ink], ['Échecs d’envoi', '1', T.warn], ['Sans aucune connexion', '2', T.bad]].map(([l, v, c]) => `<div class="card" style="flex: 1 1 0; padding: 14px 18px; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 13px; color: ${T.ink2}; font-weight: 500">${l}</span><span class="num" style="font-size: 26px; font-weight: 600; letter-spacing: -0.02em; color: ${c}">${v}</span></div>`).join('')}</div>
    <div style="display: flex; gap: 20px; flex: 1 1 auto; min-height: 0">
      <section class="card" style="flex: 1 1 auto; min-width: 0; overflow: hidden">${sectionHead('Montres et services', softPill('8 connecteurs'))}${DEVICES.map(devRow).join('')}</section>
      <aside style="width: 380px; flex: 0 0 auto; display: flex; flex-direction: column; gap: 14px">
        <section class="card" style="padding: 16px 18px"><h2 class="h2" style="margin-bottom: 8px">Envoi des séances</h2>${[['Envoyer chaque séance sur la montre', true], ['Allures et charges converties par athlète', true], ['Envoyer la veille à 20 h', true], ['Renvoyer si la séance est modifiée', true], ['Importer automatiquement le réalisé', true]].map(([l, on]) => `<div class="row" style="gap: 12px; padding: 9px 0; border-top: 1px solid ${T.line}; font-size: 13.5px"><span style="flex: 1 1 auto">${l}</span><span style="width: 36px; height: 20px; border-radius: 99px; background: ${on ? T.accent : T.lineStrong}; position: relative"><span style="position: absolute; top: 2px; ${on ? 'right: 2px' : 'left: 2px'}; width: 16px; height: 16px; border-radius: 99px; background: #fff"></span></span></div>`).join('')}</section>
        <section class="card" style="padding: 16px 18px; flex: 1 1 auto"><h2 class="h2" style="margin-bottom: 8px">À traiter</h2>${[['AP', 'Adrien Petit', 'Aucune montre ni Strava · saisie manuelle', 'Relancer'], ['KD', 'Karim Diallo', 'Garmin déconnecté depuis 3 jours', 'Relancer'], ['JL', 'Jules Lefebvre', 'Échec d’envoi · Rando-course 3 h', 'Renvoyer']].map(([i, n, w, a]) => `<div class="row" style="gap: 10px; padding: 9px 0; border-top: 1px solid ${T.line}">${avatar(i, 30)}<div style="flex: 1 1 auto; min-width: 0; line-height: 1.3"><div style="font-weight: 500; font-size: 13.5px">${n}</div><div class="muted ellip" style="font-size: 12px">${w}</div></div><span class="btn" style="height: 30px; padding: 0 10px; font-size: 12.5px">${a}</span></div>`).join('')}</section>
      </aside>
    </div>`));

  // ---------- Athlète · Analyse de séance (mobile) ----------
  const AthleteAnalyse = page('Kadro — Ma séance (athlète)', phone(`
  <div style="${top('display: flex; flex-direction: column; gap: 12px; flex: 1 1 auto; min-height: 0')}">
    ${mHeader('Mer 27 août', `<span class="icon-btn" style="border: 0; background: transparent">${icon('more', 22, T.ink)}</span>`)}
    <div><div class="row" style="gap: 8px">${accentPill('VMA', 'run')}${donePill('Synchronisée')}</div><div style="font-size: 22px; font-weight: 600; letter-spacing: -0.02em; margin-top: 8px">VMA 10 × 400 m</div><div class="muted" style="font-size: 12.5px; margin-top: 2px">Forerunner 265 · 12,1 km · 58:12 · FC moy 168</div></div>
    <section class="card" style="padding: 12px 12px 6px"><div class="row" style="gap: 8px; margin-bottom: 2px"><h2 class="h2" style="flex: 1 1 auto; font-size: 14px">Allure</h2><span class="faint" style="font-size: 11.5px">reps en surbrillance</span></div>${lineSeries({ w: 340, h: 120, key: 'pace', yMin: 200, yMax: 440, invert: true, label: (v) => fmtPace(v), ticks: 2 })}</section>
    <section class="card" style="padding: 12px 12px 6px"><div class="row" style="gap: 8px; margin-bottom: 2px"><h2 class="h2" style="flex: 1 1 auto; font-size: 14px">Fréquence cardiaque</h2><span class="faint" style="font-size: 11.5px">zones</span></div>${lineSeries({ w: 340, h: 110, key: 'hr', yMin: 110, yMax: 195, bands: [[110, 134], [134, 154], [154, 165], [165, 178], [178, 195]], shade: false, label: (v) => Math.round(v), ticks: 2, color: T.ink })}<div style="margin: 6px 0 4px">${zoneBar([14, 22, 18, 31, 15])}</div></section>
    <section class="card" style="padding: 12px 14px 4px"><div class="row" style="gap: 8px"><h2 class="h2" style="flex: 1 1 auto; font-size: 14px">Tes 10 × 400 m</h2><span class="faint num" style="font-size: 11.5px">cible 1:27</span></div><div class="row" style="gap: 4px; align-items: flex-end; margin-top: 8px; height: 52px">${REP.map((p, i) => `<div style="flex: 1 1 0; height: ${Math.round((p - 190) / 50 * 100)}%; border-radius: 3px 3px 0 0; background: ${Math.abs(p - 217.5) <= 2 ? T.accent : Math.abs(p - 217.5) <= 6 ? T.warn : T.bad}"></div>`).join('')}</div><div class="row" style="justify-content: space-between; font-size: 11px; color: ${T.ink3}; margin: 4px 0 8px"><span>1 · 1:26</span><span>6 · 1:28</span><span style="color: ${T.bad}">10 · 1:35</span></div>${best('1 km', '3:41', 'record : 3:39')}${best('5 km', '21:10', '', true)}</section>
    <div class="row" style="gap: 10px; padding: 10px 12px; border-radius: 12px; background: ${T.surface2}; font-size: 12.5px">${avatar('MR', 24)}<span style="flex: 1 1 auto; line-height: 1.4"><b style="font-weight: 600">Marc</b> a vu la séance · « Les 6 premiers sont nickel, on parle des 4 derniers demain. »</span></div>
  </div>`, tabBar(ATH_TABS, 'Planning')));

  // ---------- Athlète · Monitoring (mobile) ----------
  const mSmall = (title, v, unit, values, min, max, c = T.accent) => { const w = 150, h = 54, padL = 0, iw = w, ih = h - 6; const x = (i) => padL + (i / (values.length - 1)) * iw, y = (val) => 3 + (1 - (val - min) / (max - min)) * ih; return `<div class="card" style="padding: 12px 14px; display: flex; flex-direction: column; gap: 6px"><div class="faint" style="font-size: 11.5px">${title}</div><div class="row" style="gap: 4px; align-items: baseline"><span class="num" style="font-size: 20px; font-weight: 600; letter-spacing: -0.02em; color: ${c === T.accent ? T.ink : c}">${v}</span><span class="faint" style="font-size: 11px">${unit}</span></div><svg width="100%" viewBox="0 0 ${w} ${h}" style="display: block"><polyline fill="none" stroke="${T.accent}" stroke-width="1.75" stroke-linejoin="round" points="${values.slice(-28).map((val, i, a) => `${(i / (a.length - 1)) * iw},${y(val)}`).join(' ')}"/><circle cx="${iw}" cy="${y(values[values.length - 1])}" r="3.5" fill="${T.accent}" stroke="${T.surface}" stroke-width="2"/></svg></div>`; };
  const AthleteMonitoring = page('Kadro — Ma forme (athlète)', phone(`
  <div style="${top('display: flex; flex-direction: column; gap: 14px')}">
    <div class="row" style="gap: 12px"><h1 class="h1" style="flex: 1 1 auto; font-size: 26px">Ma forme</h1>${softPill('4 semaines', 'chevronD')}</div>
    <div class="row" style="gap: 10px; padding: 12px 14px; border-radius: 12px; background: ${T.badSoft}; color: ${T.bad}; font-size: 13px; font-weight: 500; line-height: 1.4">${icon('alert', 18, T.bad)}<span>Ton corps dit la même chose que toi : sommeil court, cœur plus rapide au réveil. Marc a allégé ta semaine.</span></div>
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">${mSmall('Sommeil', '6 h 10', 'moy. 7 j', sleep, 5, 9, T.bad)}${mSmall('FC de repos', '53', 'bpm', rhr, 42, 58, T.warn)}${mSmall('Variabilité (HRV)', '54', 'ms', hrv, 40, 90, T.bad)}${mSmall('Poids', '58,2', 'kg', weight, 57, 60)}</div>
    <section class="card" style="padding: 12px 14px"><div class="row" style="gap: 8px; margin-bottom: 8px"><h2 class="h2" style="flex: 1 1 auto; font-size: 14px">Tes check-ins</h2><span class="faint" style="font-size: 11.5px">4 semaines</span></div><div style="display: grid; grid-template-columns: repeat(14, minmax(0, 1fr)); gap: 4px">${Array.from({ length: 28 }, (_, i) => { const lv = i > 24 ? 'bad' : i > 22 ? 'warn' : i % 9 === 4 ? 'warn' : 'good'; return `<span style="height: 16px; border-radius: 4px; background: ${L.LEVEL[lv][1]}"></span>`; }).join('')}</div></section>
    <section class="card" style="padding: 12px 14px"><div class="row" style="gap: 10px"><span style="width: 36px; height: 36px; border-radius: 10px; background: ${T.neutralSoft}; display: inline-flex; align-items: center; justify-content: center; color: ${T.ink2}">${icon('sync', 18)}</span><div style="flex: 1 1 auto; line-height: 1.3"><div style="font-weight: 600; font-size: 13.5px">Forerunner 265 · synchronisée ce matin 07:12</div><div class="muted" style="font-size: 12px">Sommeil, FC repos et HRV viennent de ta montre. Le poids, de toi.</div></div>${icon('chevron', 16, T.ink3)}</div></section>
  </div>`, tabBar(ATH_TABS, 'Progression')));

  // ---------- Athlète · Connexions (mobile) ----------
  const conn = (n, sub, st, action = '') => `<div class="row" style="gap: 12px; height: 62px; padding: 0 16px; border-top: 1px solid ${T.line}"><span style="width: 38px; height: 38px; border-radius: 10px; background: ${T.neutralSoft}; display: inline-flex; align-items: center; justify-content: center; color: ${T.ink2}; font-weight: 700; font-size: 12px">${n.slice(0, 2)}</span><div style="flex: 1 1 auto; min-width: 0; line-height: 1.3"><div style="font-weight: 600; font-size: 14px">${n}</div><div class="muted ellip" style="font-size: 12px">${sub}</div></div>${st === 'on' ? donePill('Connectée') : st === 'warn' ? `<span class="pill" style="background: ${T.warnSoft}; color: ${T.warn}">${action}</span>` : `<span class="btn" style="height: 32px; padding: 0 12px; font-size: 13px">Connecter</span>`}</div>`;
  const AthleteConnexions = page('Kadro — Montres & connexions (athlète)', phone(`
  <div style="${top('display: flex; flex-direction: column; gap: 14px')}">
    ${mHeader('Montres & connexions')}
    <div class="card" style="padding: 14px 16px"><div class="row" style="gap: 12px"><span style="width: 44px; height: 44px; border-radius: 12px; background: ${T.accentSoft}; display: inline-flex; align-items: center; justify-content: center; color: ${T.accentInk}">${icon('clock', 22)}</span><div style="flex: 1 1 auto; line-height: 1.3"><div style="font-weight: 600">Tes séances arrivent sur ta montre</div><div class="muted" style="font-size: 12.5px">Chaque soir à 20 h, avec tes allures. Le réalisé revient tout seul.</div></div></div><div class="row" style="gap: 8px; margin-top: 12px">${mMetric('Envoyées', '12 / 12')}${mMetric('Dernière synchro', '07:12')}</div></div>
    <section class="card" style="overflow: hidden"><div class="label" style="padding: 12px 16px 6px">Montres</div>${conn('Garmin', 'Forerunner 265 · séances + sommeil + FC repos', 'on').replace('border-top: 1px solid ' + T.line, 'border-top: 0')}${conn('Coros', 'Séances + sommeil', 'off')}${conn('Polar', 'Séances + Nightly Recharge', 'off')}${conn('Suunto', 'Séances + récupération', 'off')}${conn('Apple Watch', 'Activités + sommeil (pas d’envoi de séance)', 'off')}</section>
    <section class="card" style="overflow: hidden"><div class="label" style="padding: 12px 16px 6px">Services</div>${conn('Strava', 'Import + partage des séances réalisées', 'on').replace('border-top: 1px solid ' + T.line, 'border-top: 0')}${conn('Zwift', 'Vélo indoor', 'off')}${conn('Withings', 'Balance · poids automatique', 'warn', 'Reconnecter')}</section>
    <div class="faint" style="font-size: 12px; line-height: 1.45; padding: 0 4px">Une seule montre reçoit les séances. Les autres services ne font qu’importer.</div>
  </div>`, tabBar(ATH_TABS, 'Profil')));

  return { AnalyseSeance, AnalyseTrail, Monitoring, Integrations, AthleteAnalyse, AthleteMonitoring, AthleteConnexions };
}
