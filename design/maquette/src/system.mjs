// Palette & système visuel — one wide artboard (1440 × 1240), light ground, dark panels painted explicitly.
import { THEMES, make } from './lib.mjs';

export function systemSheet() {
  const L = make(THEMES.light), D = make(THEMES.dark);
  const T = THEMES.light, K = THEMES.dark;
  const { icon, page } = L;

  const sw = (hex, name, w = 88, h = 56, dark = false) => `<div style="display: flex; flex-direction: column; gap: 6px; width: ${w}px"><div style="height: ${h}px; border-radius: 10px; background: ${hex}; border: 1px solid ${dark ? '#2A323C' : T.line}"></div><div style="font-size: 11.5px; font-weight: 500; color: ${dark ? K.ink : T.ink}">${name}</div><div class="num" style="font-size: 11px; color: ${dark ? K.ink3 : T.ink3}">${hex}</div></div>`;
  const h2 = (t, sub = '') => `<div><h2 style="font-size: 18px; font-weight: 600; letter-spacing: -0.02em; margin: 0">${t}</h2>${sub ? `<div class="muted" style="font-size: 13.5px; margin-top: 4px; line-height: 1.45; max-width: 760px">${sub}</div>` : ''}</div>`;
  const btnI = (Th, l, primary) => `<span style="display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 10px; font-weight: 500; font-size: 14px; border: 1px solid ${primary ? Th.btnPrimaryBg : Th.lineStrong}; background: ${primary ? Th.btnPrimaryBg : Th.surface}; color: ${primary ? Th.btnPrimaryInk : Th.ink}">${l}</span>`;
  const cardI = (Th, inner, w = 'auto') => `<div style="width: ${w}; background: ${Th.surface}; border: 1px solid ${Th.line}; border-radius: 14px; padding: 14px 16px">${inner}</div>`;
  const inputI = (Th, l) => `<div style="display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 12px; border-radius: 10px; border: 1px solid ${Th.line}; background: ${Th.surface}; color: ${Th.ink3}; font-size: 14px">${icon('search', 18, Th.ink3)}<span>${l}</span></div>`;

  // one accent candidate with a mini preview
  const candidate = (name, hex, soft, ink, pros, cons, reco = false) => `
  <div style="flex: 1 1 0; border: 1px solid ${reco ? T.ink : T.line}; border-radius: 14px; padding: 14px 14px; background: ${T.surface}; display: flex; flex-direction: column; gap: 10px; min-width: 0">
    <div class="row" style="gap: 10px"><span style="width: 28px; height: 28px; flex: 0 0 auto; border-radius: 8px; background: ${hex}"></span><div style="flex: 1 1 auto; line-height: 1.2"><div style="font-weight: 600; font-size: 15px">${name}</div><div class="num faint" style="font-size: 11.5px">${hex}</div></div>${reco ? `<span class="pill" style="background: ${T.ink}; color: #fff">Retenu</span>` : ''}</div>
    <div class="row" style="gap: 8px; flex-wrap: wrap">
      <span style="display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: 9px; background: ${T.ink}; color: #fff; font-size: 13px; font-weight: 500">${icon('plus', 14, '#fff', 2.2)}Planifier</span>
      <span class="pill" style="background: ${soft}; color: ${ink}">${icon('run', 13, ink)}Séance du jour</span>
      <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 9px; background: ${soft}; border: 1px solid ${hex}; color: ${ink}; font-size: 12px; font-weight: 500">${icon('run', 14, ink)}Footing 45′</span>
    </div>
    <svg width="100%" viewBox="0 0 300 40" style="display: block">${[42, 48, 51, 38, 55, 58, 61].map((v, i) => `<rect x="${i * 43}" y="${40 - v * 0.6}" width="34" height="${v * 0.6}" rx="3" fill="${hex}"/>`).join('')}</svg>
    <div style="font-size: 12.5px; line-height: 1.45"><span style="color: ${T.good}; font-weight: 600">Pour</span> ${pros}<br><span style="color: ${T.bad}; font-weight: 600">Contre</span> ${cons}</div>
  </div>`;

  const typeRow = (l, size, weight, sample) => `<div style="display: grid; grid-template-columns: 200px 1fr; gap: 20px; align-items: baseline; padding: 10px 0; border-top: 1px solid ${T.line}"><div><div style="font-size: 12.5px; font-weight: 500">${l}</div><div class="faint num" style="font-size: 11.5px">Geist · ${size}px · ${weight}</div></div><div style="font-size: ${size}px; font-weight: ${weight}; letter-spacing: ${size >= 22 ? '-0.02em' : '0'}; line-height: 1.2">${sample}</div></div>`;

  const statusI = (Th, lv) => Th === T ? L.statusPill(lv) : D.statusPill(lv);
  const chipsI = (M) => ['done', 'today', 'planned', 'missed'].map((st) => M.chip({ t: { done: 'Footing 50′', today: 'Footing 45′', planned: 'SL 1 h 45', missed: 'Seuil 3×8′' }[st], st, k: 'run' })).join('');

  const modePanel = (M, Th, dark) => `
  <div style="flex: 1 1 0; min-width: 0; border-radius: 16px; background: ${Th.bg}; border: 1px solid ${dark ? '#2A323C' : T.line}; padding: 20px 22px; color: ${Th.ink}; display: flex; flex-direction: column; gap: 16px">
    <div class="row" style="gap: 8px">${icon(dark ? 'moon' : 'sun', 18, Th.ink2)}<span style="font-weight: 600; font-size: 14px">${dark ? 'Mode sombre' : 'Mode clair'}</span><span style="font-size: 12px; color: ${Th.ink3}">· ${dark ? 'fond #0E1216, accent éclairci #8B82FF pour rester lisible' : 'fond blanc cassé #F6F6F3, accent indigo #5B4FE9'}</span></div>
    <div class="row" style="gap: 12px; flex-wrap: wrap">${sw(Th.bg, 'Fond', 84, 44, dark)}${sw(Th.surface, 'Surface', 84, 44, dark)}${sw(Th.line, 'Filet', 84, 44, dark)}${sw(Th.ink, 'Encre', 84, 44, dark)}${sw(Th.ink2, 'Encre 2', 84, 44, dark)}${sw(Th.ink3, 'Encre 3', 84, 44, dark)}${sw(Th.accent, 'Accent', 84, 44, dark)}${sw(Th.accentSoft, 'Accent doux', 84, 44, dark)}</div>
    <div class="row" style="gap: 10px; flex-wrap: wrap">${btnI(Th, 'Planifier une séance', true)}${btnI(Th, 'Message', false)}${inputI(Th, 'Rechercher un athlète')}</div>
    <div class="row" style="gap: 8px; flex-wrap: wrap">${statusI(Th, 'good')}${statusI(Th, 'warn')}${statusI(Th, 'bad')}${statusI(Th, 'none')}</div>
    <div style="display: grid; grid-template-columns: repeat(4, 96px); gap: 8px">${chipsI(M)}</div>
    <div class="row" style="gap: 12px; align-items: flex-start; flex-wrap: wrap">
      ${cardI(Th, `<div style="font-size: 13px; color: ${Th.ink2}; font-weight: 500">Adhérence sur 7 jours</div><div class="num" style="font-size: 28px; font-weight: 600; letter-spacing: -0.03em; line-height: 1.1; margin-top: 4px">86 %</div><div style="font-size: 12px; color: ${Th.good}">+4 pts vs. semaine dernière</div>`, '200px')}
      ${cardI(Th, `<div class="row" style="gap: 10px">${M.avatar('LM', 32)}<div style="line-height: 1.25; flex: 1 1 auto"><div style="font-weight: 600; font-size: 13.5px">Léa Martin</div><div style="font-size: 12px; color: ${Th.ink2}">Marathon · Ven · Footing 45′</div></div>${M.statusPill('bad')}</div>`, '300px')}
      ${cardI(Th, `<div style="font-size: 12px; color: ${Th.ink3}">Charge · 8 sem.</div>${M.barChart({ values: [42, 48, 51, 38, 55, 58, 61, 34], labels: ['S28', '', 'S30', '', 'S32', '', 'S34', 'S35'], w: 220, h: 80, annotate: false })}`, '250px')}
    </div>
  </div>`;

  const body = `
  <div style="width: 1440px; min-height: 2150px; background: ${T.bg}; padding: 40px 48px 48px; display: flex; flex-direction: column; gap: 36px">
    <header class="row" style="gap: 16px"><div style="flex: 1 1 auto"><div class="row" style="gap: 8px; margin-bottom: 8px"><span style="display: inline-flex; width: 26px; height: 26px; border-radius: 7px; background: ${T.ink}; align-items: center; justify-content: center">${icon('logo', 15, '#fff', 2.2)}</span><span style="font-weight: 700; letter-spacing: -0.02em">Kadro</span></div><h1 class="h1" style="font-size: 30px">Palette & système visuel — proposition</h1><div class="muted" style="margin-top: 6px; font-size: 14.5px; line-height: 1.5; max-width: 900px">Le principe : des neutres chauds très calmes, <b style="font-weight: 600; color: ${T.ink}">une seule couleur d’accent</b> pour l’action et la donnée, et trois couleurs de statut réservées à la forme des athlètes. Tout le reste est de l’encre et du blanc. C’est ce qui donne l’effet « pro » : la couleur ne décore jamais, elle signifie.</div></div></header>

    <section class="col" style="gap: 14px">
      ${h2('1 · La couleur d’accent — Indigo, retenu', 'Décision du 29 août 2026. Une seule couleur d’accent, l’indigo #5B4FE9 (#8B82FF en sombre), distinct des apps de sport bleues ou orange. Les boutons principaux restent noirs (blancs en sombre) : l’accent ne sert qu’à « aujourd’hui », aux données, aux badges et aux liens.')}
      <div style="display: flex; gap: 16px; align-items: stretch">
        ${candidate('Indigo', '#5B4FE9', '#ECEAFD', '#4338CA', 'très lisible en clair et en sombre, zéro conflit avec vert / ambre / rouge.', 'teinte fréquente dans les SaaS — la signature vient de l’épure et de la typo.', true)}
        <div style="flex: 2 1 0; display: flex; flex-direction: column; gap: 12px; padding: 14px 16px; border-radius: 14px; background: ${T.surface}; border: 1px solid ${T.line}">
          <div class="label">Jetons</div>
          <div class="row" style="gap: 12px; flex-wrap: wrap">${sw('#5B4FE9', 'Accent · clair', 100, 44)}${sw('#ECEAFD', 'Accent doux · clair', 100, 44)}${sw('#4338CA', 'Accent texte · clair', 100, 44)}<span style="width: 12px"></span>${sw('#8B82FF', 'Accent · sombre', 100, 44)}${sw('#26235A', 'Accent doux · sombre', 100, 44)}${sw('#B4AEFF', 'Accent texte · sombre', 100, 44)}</div>
          <div style="font-size: 12.5px; line-height: 1.5; color: ${T.ink2}"><b style="font-weight: 600; color: ${T.ink}">Où il apparaît :</b> la séance du jour et le jour courant, les barres et courbes des graphiques, le badge « Séance du jour », les blocs d’intensité dans une séance, les liens et le compteur de messages. <b style="font-weight: 600; color: ${T.ink}">Où il n’apparaît jamais :</b> les boutons principaux, les statuts de forme, les textes courants.</div>
        </div>
      </div>
    </section>

    <section class="col" style="gap: 14px">
      ${h2('2 · Statuts de forme', 'Réservés à un seul usage : l’état de l’athlète. Toujours accompagnés d’un point ou d’une icône et d’un mot — jamais la couleur seule (daltonisme, impression, mode sombre).')}
      <div class="row" style="gap: 12px">${sw('#1E9E5A', 'Bonne forme', 120, 48)}${sw('#E4F5EB', 'fond doux', 120, 48)}<span style="width: 24px"></span>${sw('#D4890A', 'À surveiller', 120, 48)}${sw('#FBF1DC', 'fond doux', 120, 48)}<span style="width: 24px"></span>${sw('#D93B2E', 'Fatigue', 120, 48)}${sw('#FCE7E4', 'fond doux', 120, 48)}<span style="width: 24px"></span>${sw('#8C949D', 'Pas de check-in', 120, 48)}</div>
    </section>

    <section class="col" style="gap: 14px">
      ${h2('3 · Clair et sombre', 'Le sombre n’est pas un simple inversé : les surfaces sont décalées de deux crans, l’accent est éclairci pour garder le contraste, les fonds doux des statuts deviennent des teintes profondes. Les mêmes composants, dans les deux modes :')}
      <div style="display: flex; gap: 20px">${modePanel(L, T, false)}${modePanel(D, K, true)}</div>
    </section>

    <section class="col" style="gap: 6px">
      ${h2('4 · Typographie', 'Une seule famille, Geist (Google Fonts, gratuite), chiffres tabulaires partout pour que les colonnes s’alignent. Le contraste vient des graisses et des tailles, pas d’une deuxième police.')}
      ${typeRow('Titre d’écran', 26, 600, 'Bonjour Marc')}${typeRow('Grand chiffre', 30, 600, '<span class="num">86 %</span>')}${typeRow('Titre de carte', 15, 600, 'Charge d’entraînement')}${typeRow('Texte courant', 14, 400, 'Fatigue signalée 2 jours de suite · sommeil 5 h 30')}${typeRow('Secondaire', 12.5, 400, '<span class="muted">Marathon de Paris · 12 avr. 2027 · objectif 3 h 15</span>')}${typeRow('Étiquette', 12, 500, '<span class="faint">ADHÉRENCE 7 J</span>')}
    </section>

    <section class="col" style="gap: 10px">
      ${h2('5 · Règles qui font le « premium »')}
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; font-size: 13.5px; line-height: 1.5">
        <div class="card" style="padding: 14px 16px"><b style="font-weight: 600">Rayons & filets.</b> Cartes 14 px, contrôles 10 px, badges pleins. Filets de 1 px, ombres quasi invisibles. Pas de dégradés.</div>
        <div class="card" style="padding: 14px 16px"><b style="font-weight: 600">Icônes au trait.</b> Une seule famille d’icônes, 1,75 px de trait, jamais d’emoji. Elles se recolorent avec le texte.</div>
        <div class="card" style="padding: 14px 16px"><b style="font-weight: 600">Une action principale par écran.</b> Bouton noir (blanc en sombre). L’accent bleu ne sert qu’à « aujourd’hui », aux données et aux liens.</div>
      </div>
    </section>
  </div>`;
  return page('Kadro — Palette & système', body);
}
