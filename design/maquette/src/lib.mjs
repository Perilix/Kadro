// Shared tokens, icons and primitives for the Kadro artboards. Theme-parametric.

export const THEMES = {
  light: {
    mode: 'light',
    bg: '#F6F6F3', surface: '#FFFFFF', surface2: '#F6F6F3', line: '#E8E8E3', lineStrong: '#D8D8D1',
    ink: '#101820', ink2: '#5A6370', ink3: '#8C949D',
    accent: '#5B4FE9', accentSoft: '#ECEAFD', accentInk: '#4338CA',
    good: '#1E9E5A', goodSoft: '#E4F5EB', warn: '#D4890A', warnSoft: '#FBF1DC', bad: '#D93B2E', badSoft: '#FCE7E4',
    neutralSoft: '#EFEFEB', darkCard: '#101820', darkCardBar: '#3A4756', darkCardInk2: '#AEB6BF',
    btnPrimaryBg: '#101820', btnPrimaryInk: '#FFFFFF', navActive: '#EDEDE8',
    av: { LM: ['#E4E1FB', '#4338CA'], KD: ['#E3F1E6', '#1E7A46'], NS: ['#FCE9D9', '#B8561E'], TB: ['#EFE4FA', '#6B3FA0'], SR: ['#FDF0C9', '#946B00'], AP: ['#DDEFF5', '#1E6F86'], MO: ['#F4E2E2', '#A8362E'], JL: ['#E6E9EE', '#4A5560'], MR: ['#101820', '#FFFFFF'], CL: ['#E6E9EE', '#4A5560'], YA: ['#E3F1E6', '#1E7A46'], IB: ['#FCE9D9', '#B8561E'] },
  },
  dark: {
    mode: 'dark',
    bg: '#0E1216', surface: '#161B21', surface2: '#1C2229', line: '#252C34', lineStrong: '#343D47',
    ink: '#F2F4F6', ink2: '#A7B0BA', ink3: '#717B86',
    accent: '#8B82FF', accentSoft: '#26235A', accentInk: '#B4AEFF',
    good: '#3DBA76', goodSoft: '#12301F', warn: '#E6A23C', warnSoft: '#3A2A0E', bad: '#F0655A', badSoft: '#3F1A17',
    neutralSoft: '#222931', darkCard: '#1C2430', darkCardBar: '#3A4756', darkCardInk2: '#AEB6BF',
    btnPrimaryBg: '#F2F4F6', btnPrimaryInk: '#101820', navActive: '#222931',
    av: { LM: ['#26235A', '#B4AEFF'], KD: ['#173424', '#7ED8A4'], NS: ['#3E2415', '#F3B58C'], TB: ['#2E1F45', '#C9A8F0'], SR: ['#3A2E0C', '#F0D27A'], AP: ['#153039', '#8AD0E8'], MO: ['#3E1C1C', '#F2A3A3'], JL: ['#2A323B', '#B8C2CC'], MR: ['#F2F4F6', '#101820'], CL: ['#2A323B', '#B8C2CC'], YA: ['#173424', '#7ED8A4'], IB: ['#3E2415', '#F3B58C'] },
  },
};

// Accent candidates: [name, light{accent,soft,ink}, dark{accent,soft,ink}, darkCardAccent?]
export const ACCENTS = {
  Indigo: { name: 'Indigo', light: ['#5B4FE9', '#ECEAFD', '#4338CA'], dark: ['#8B82FF', '#26235A', '#B4AEFF'] },
  Petrole: { name: 'Bleu pétrole', light: ['#0E8A8A', '#E0F4F3', '#0B6B6B'], dark: ['#3FC1C0', '#0F3535', '#7EDCDB'] },
  Encre: { name: 'Encre (monochrome)', light: ['#101820', '#E6E6E1', '#101820'], dark: ['#F2F4F6', '#2A323C', '#F2F4F6'], darkCardAccent: '#AEB6BF' },
  Framboise: { name: 'Framboise', light: ['#D6336C', '#FCE6EE', '#A61E4D'], dark: ['#F06595', '#4A1A2B', '#FF9FC0'] },
  Lime: { name: 'Lime acide', light: ['#8FD400', '#EEF9D4', '#3F6A00'], dark: ['#B7F542', '#2A3A10', '#D4FF7A'] },
};
export function withAccent(base, acc) {
  const [accent, accentSoft, accentInk] = base.mode === 'dark' ? acc.dark : acc.light;
  const av = { ...base.av, LM: base.mode === 'dark' ? [accentSoft, accentInk] : [accentSoft, accentInk] };
  return { ...base, accent, accentSoft, accentInk, av, darkCardAccent: acc.darkCardAccent || accent };
}

const PATHS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.8 0 4.5 2 4.5 4.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  library: '<path d="M4 4.5h5.5A2.5 2.5 0 0 1 12 7v13a2 2 0 0 0-2-2H4zM20 4.5h-5.5A2.5 2.5 0 0 0 12 7v13a2 2 0 0 1 2-2h6z"/>',
  message: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17H6.5A2.5 2.5 0 0 1 4 14.5z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21h4"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  chevronL: '<path d="M15 6l-6 6 6 6"/>',
  chevronD: '<path d="M6 9l6 6 6-6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  alert: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4M12 17v.5"/>',
  run: '<path d="M4 17l6-4-1-6 3 3 4 1M13 4.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zM10 13l-3 7M11 12l4 3v6"/>',
  dumbbell: '<path d="M2.5 12h3M18.5 12h3M8 8v8M16 8v8M5.5 9.5v5M18.5 9.5v5M8 12h8"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  heart: '<path d="M12 20.5s-8-4.9-8-11A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5c0 6.1-8 11-8 11z"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  play: '<path d="M7 5l12 7-12 7z"/>',
  sync: '<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3"/><path d="M20 4v4.3h-4.3M4 20v-4.3h4.3"/>',
  note: '<path d="M6 3.5h9l4 4V20.5H6z"/><path d="M15 3.5v4h4M9 12h6M9 16h4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>',
  home: '<path d="M4 11l8-7 8 7v9.5h-5.5V14h-5v6.5H4z"/>',
  logo: '<path d="M6 4v16M6 12l10-8M6 12l10 8"/>',
  drag: '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
  repeat: '<path d="M17 3l3 3-3 3"/><path d="M4 11V9a3 3 0 0 1 3-3h13"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v2a3 3 0 0 1-3 3H4"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  edit: '<path d="M4 20h4l11-11-4-4L4 16z"/><path d="M13 7l4 4"/>',
  send: '<path d="M21 3L10.5 13.5M21 3l-7 18-3.5-7.5L3 10z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 14h2M14 19v2M19 19h2v2"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z"/><path d="M9 12l2 2 4-4"/>',
  flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
  medal: '<circle cx="12" cy="14" r="5.5"/><path d="M8.5 9L6 3h5l1 3 1-3h5l-2.5 6"/>',
  layers: '<path d="M12 4l9 5-9 5-9-5z"/><path d="M3 14l9 5 9-5"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7M12 17v.5"/>',
  logout: '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l5 4-5 4M20 12H9"/>',
  mountain: '<path d="M3 20l6-10 4 6 2-3 6 7z"/>',
  bike: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-8h5l3 8M10 8l4 8M13 5h3"/>',
  swim: '<path d="M3 18c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5"/><path d="M5 13l5-6 3 3 4-1"/><circle cx="17" cy="6" r="1.5"/>',
};

export function make(T) {
  const icon = (n, s = 20, color = 'currentColor', sw = 1.75) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="flex: 0 0 auto">${PATHS[n]}</svg>`;

  const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap');
  body { margin: 0; font-family: Geist, "Helvetica Neue", Arial, system-ui, sans-serif; color: ${T.ink}; background: ${T.bg}; font-size: 14px; line-height: 1.4; font-feature-settings: "tnum" 1, "cv11" 1; -webkit-font-smoothing: antialiased; }
  a { color: ${T.accent}; text-decoration: none; } a:hover { color: ${T.accentInk}; }
  * { box-sizing: border-box; }
  .card { background: ${T.surface}; border: 1px solid ${T.line}; border-radius: 14px; box-shadow: 0 1px 2px rgba(0,0,0,${T.mode === 'dark' ? '.25' : '.04'}); }
  .muted { color: ${T.ink2}; } .faint { color: ${T.ink3}; }
  .h1 { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.15; margin: 0; }
  .h2 { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; margin: 0; }
  .num { font-variant-numeric: tabular-nums; }
  .btn { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 10px; font-weight: 500; font-size: 14px; border: 1px solid ${T.lineStrong}; background: ${T.surface}; color: ${T.ink}; white-space: nowrap; }
  .btn.primary { background: ${T.btnPrimaryBg}; color: ${T.btnPrimaryInk}; border-color: ${T.btnPrimaryBg}; }
  .btn.accent { background: ${T.accent}; color: #fff; border-color: ${T.accent}; }
  .pill { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 999px; font-size: 12px; font-weight: 500; white-space: nowrap; }
  .dot { width: 8px; height: 8px; border-radius: 999px; flex: 0 0 auto; }
  .avatar { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; font-weight: 600; flex: 0 0 auto; }
  .row { display: flex; align-items: center; }
  .col { display: flex; flex-direction: column; }
  .icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 10px; border: 1px solid ${T.line}; background: ${T.surface}; color: ${T.ink2}; flex: 0 0 auto; }
  .ellip { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .input { display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 12px; border-radius: 10px; border: 1px solid ${T.line}; background: ${T.surface}; color: ${T.ink3}; font-size: 14px; }
  .label { font-size: 12px; font-weight: 500; color: ${T.ink2}; }
`;

  const page = (title, body, extra = '') => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <title>${title}</title>
  <style>${CSS}${extra}</style>
</helmet>
${body}
</x-dc>
</body>
</html>`;

  const avatar = (ini, size = 36) => { const [bg, fg] = T.av[ini] || [T.neutralSoft, T.ink2]; return `<span class="avatar" style="width: ${size}px; height: ${size}px; background: ${bg}; color: ${fg}; font-size: ${Math.round(size * 0.36)}px">${ini}</span>`; };

  const LEVEL = { good: ['Bonne forme', T.good, T.goodSoft], warn: ['À surveiller', T.warn, T.warnSoft], bad: ['Fatigue', T.bad, T.badSoft], none: ['Pas de check-in', T.ink3, T.neutralSoft] };
  const statusPill = (lv, label) => { const [l, c, s] = LEVEL[lv]; return `<span class="pill" style="background: ${s}; color: ${lv === 'none' ? T.ink2 : c}"><span class="dot" style="background: ${c}"></span>${label || l}</span>`; };
  const dot = (lv, size = 8) => `<span class="dot" style="width: ${size}px; height: ${size}px; background: ${LEVEL[lv][1]}"></span>`;
  const softPill = (text, ic) => `<span class="pill" style="background: ${T.neutralSoft}; color: ${T.ink2}">${ic ? icon(ic, 13) : ''}${text}</span>`;
  const accentPill = (text, ic) => `<span class="pill" style="background: ${T.accentSoft}; color: ${T.accentInk}">${ic ? icon(ic, 13) : ''}${text}</span>`;
  const donePill = (text = 'Réalisée') => `<span class="pill" style="background: ${T.goodSoft}; color: ${T.good}">${icon('check', 13, T.good, 2.25)}${text}</span>`;

  const NAV_GO = { 'Aperçu': 'Main', 'Athlètes': 'Athletes', 'Planning': 'Planning', 'Bibliothèque': 'Bibliotheque', 'Messages': 'Messages', 'Équipe & réglages': 'Equipe', 'Réglages': 'Equipe', 'Aujourd’hui': 'AthleteWeb', 'Progression': 'AthleteWeb', 'Mon coach': 'AthleteWeb', 'Profil': 'AthleteWeb' };
  const navItem = (n, label, active = false, badge = '') => `
  <div class="row" data-go="${NAV_GO[label] || ''}" style="gap: 12px; height: 40px; padding: 0 12px; border-radius: 10px; font-weight: 500; color: ${active ? T.ink : T.ink2}; background: ${active ? T.navActive : 'transparent'}">
    ${icon(n, 20, active ? T.ink : T.ink3)}<span style="flex: 1 1 auto">${label}</span>${badge ? `<span class="pill num" style="height: 20px; padding: 0 7px; background: ${T.accent}; color: #fff; font-size: 11px">${badge}</span>` : ''}
  </div>`;

  const logo = () => `<div class="row" style="gap: 10px; padding: 4px 12px 24px">
      <span style="display: inline-flex; width: 28px; height: 28px; border-radius: 8px; background: ${T.btnPrimaryBg}; align-items: center; justify-content: center">${icon('logo', 16, T.btnPrimaryInk, 2.2)}</span>
      <span style="font-weight: 700; font-size: 16px; letter-spacing: -0.02em">Kadro</span>
    </div>`;

  const sidebar = (active, who = 'coach') => `
  <aside style="width: 240px; flex: 0 0 auto; height: 100%; border-right: 1px solid ${T.line}; background: ${T.surface}; display: flex; flex-direction: column; padding: 20px 16px">
    ${logo()}
    <nav style="display: flex; flex-direction: column; gap: 2px">
      ${who === 'coach' ? `
      ${navItem('grid', 'Aperçu', active === 'apercu')}
      ${navItem('users', 'Athlètes', active === 'athletes', '18')}
      ${navItem('calendar', 'Planning', active === 'planning')}
      ${navItem('library', 'Bibliothèque', active === 'bib')}
      ${navItem('message', 'Messages', active === 'msg', '5')}` : `
      ${navItem('home', 'Aujourd’hui', active === 'today')}
      ${navItem('calendar', 'Planning', active === 'planning')}
      ${navItem('trend', 'Progression', active === 'prog')}
      ${navItem('message', 'Mon coach', active === 'coach', '1')}`}
    </nav>
    <div style="flex: 1 1 auto"></div>
    <div style="display: flex; flex-direction: column; gap: 2px">
      ${who === 'coach' ? navItem('users', 'Équipe & réglages', active === 'team') : navItem('user', 'Profil', active === 'profile')}
      <div class="row" style="gap: 12px; padding: 12px 12px 4px; margin-top: 8px; border-top: 1px solid ${T.line}">
        ${who === 'coach' ? avatar('MR', 32) : avatar('LM', 32)}
        <div style="line-height: 1.2"><div style="font-weight: 600; font-size: 13px">${who === 'coach' ? 'Marc' : 'Léa Martin'}</div><div class="faint" style="font-size: 12px">${who === 'coach' ? 'Coach · Kadro' : 'Coachée par Marc'}</div></div>
      </div>
    </div>
  </aside>`;

  const searchBox = (w = 260, ph = 'Rechercher un athlète') => `<div class="input" style="width: ${w}px">${icon('search', 18)}<span>${ph}</span></div>`;

  // Single-hue bar chart (magnitude). `current` = partial week, lighter.
  function barChart({ w = 560, h = 170, values, labels, current = values.length - 1, max = 70, grid = [0, 35, 70], labelEvery = 1, annotate = true }) {
    const padL = 34, padB = 26, padT = 12, gap = Math.max(6, Math.round(w / values.length * 0.28));
    const iw = w - padL - 8, ih = h - padT - padB;
    const bw = (iw - gap * (values.length - 1)) / values.length;
    const y = (v) => padT + ih - (v / max) * ih;
    let out = `<svg width="100%" viewBox="0 0 ${w} ${h}" style="display: block; font-family: inherit">`;
    for (const g of grid) out += `<line x1="${padL}" x2="${w - 8}" y1="${y(g)}" y2="${y(g)}" stroke="${T.line}" stroke-width="1"/><text x="${padL - 8}" y="${y(g) + 4}" text-anchor="end" font-size="11" fill="${T.ink3}">${g}</text>`;
    const mx = Math.max(...values);
    values.forEach((v, i) => {
      const x = padL + i * (bw + gap), top = y(v), r = Math.min(4, bw / 2);
      const d = `M${x} ${padT + ih} V${top + r} a${r} ${r} 0 0 1 ${r} -${r} h${bw - 2 * r} a${r} ${r} 0 0 1 ${r} ${r} V${padT + ih} z`;
      const cur = i === current;
      out += `<path d="${d}" fill="${cur ? T.accentSoft : T.accent}" ${cur ? `stroke="${T.accent}" stroke-dasharray="3 3" stroke-width="1.25"` : ''}/>`;
      if (annotate && (cur || v === mx)) out += `<text x="${x + bw / 2}" y="${top - 6}" text-anchor="middle" font-size="11" font-weight="500" fill="${T.ink2}">${v}</text>`;
      if (i % labelEvery === 0 || cur) out += `<text x="${x + bw / 2}" y="${h - 8}" text-anchor="middle" font-size="11" fill="${cur ? T.ink : T.ink3}" font-weight="${cur ? 600 : 400}">${labels[i]}</text>`;
    });
    return out + `</svg>`;
  }

  // Line with markers for a handful of test points (VMA history).
  function lineChart({ w = 320, h = 120, points, min, max, fmt = (v) => v }) {
    const padL = 40, padR = 16, padT = 14, padB = 24;
    const iw = w - padL - padR, ih = h - padT - padB;
    const x = (i) => padL + (i / (points.length - 1)) * iw, y = (v) => padT + ih - ((v - min) / (max - min)) * ih;
    let out = `<svg width="100%" viewBox="0 0 ${w} ${h}" style="display: block; font-family: inherit">`;
    for (const g of [min, (min + max) / 2, max]) out += `<line x1="${padL}" x2="${w - padR}" y1="${y(g)}" y2="${y(g)}" stroke="${T.line}"/><text x="${padL - 8}" y="${y(g) + 4}" text-anchor="end" font-size="11" fill="${T.ink3}">${fmt(g)}</text>`;
    out += `<polyline fill="none" stroke="${T.accent}" stroke-width="2" stroke-linejoin="round" points="${points.map((p, i) => `${x(i)},${y(p.v)}`).join(' ')}"/>`;
    points.forEach((p, i) => { out += `<circle cx="${x(i)}" cy="${y(p.v)}" r="4.5" fill="${T.accent}" stroke="${T.surface}" stroke-width="2"/><text x="${x(i)}" y="${h - 6}" text-anchor="middle" font-size="11" fill="${T.ink3}">${p.l}</text>`; if (i === points.length - 1) out += `<text x="${x(i)}" y="${y(p.v) - 10}" text-anchor="middle" font-size="11" font-weight="600" fill="${T.ink}">${fmt(p.v)}</text>`; });
    return out + `</svg>`;
  }

  // Week data shared by coach & athlete views (Léa, semaine 35).
  const WEEK = [
    { d: 'Lun', n: 25, s: [{ t: 'Footing 50′', short: 'Footing 50′', st: 'done', k: 'run', sub: 'Réalisée · 8,4 km · 5:52/km' }] },
    { d: 'Mar', n: 26, s: [] },
    { d: 'Mer', n: 27, s: [{ t: 'VMA 10 × 400 m', short: 'VMA 400 m', st: 'done', k: 'run', sub: 'Réalisée · 3:38/km · ressenti 2/5' }] },
    { d: 'Jeu', n: 28, s: [{ t: 'Renfo bas du corps', short: 'Renfo bas', st: 'done', k: 'dumbbell', sub: 'Réalisée · 42 min' }] },
    { d: 'Ven', n: 29, s: [{ t: 'Footing 45′ Z2', short: 'Footing 45′', st: 'today', k: 'run', sub: 'Aujourd’hui · 5:45–6:00 /km · Z2' }], today: true },
    { d: 'Sam', n: 30, s: [] },
    { d: 'Dim', n: 31, s: [{ t: 'Sortie longue 1 h 45', short: 'SL 1 h 45', st: 'planned', k: 'run', sub: 'Prévue · Z2 · 18–20 km' }] },
  ];
  const chipStyle = (st) => ({
    done: `background: ${T.surface}; border: 1px solid ${T.line}; color: ${T.ink}`,
    today: `background: ${T.accentSoft}; border: 1px solid ${T.accent}; color: ${T.accentInk}`,
    planned: `background: ${T.surface}; border: 1px dashed ${T.lineStrong}; color: ${T.ink2}`,
    missed: `background: ${T.badSoft}; border: 1px solid ${T.badSoft}; color: ${T.bad}`,
  }[st]);
  const chipIcon = (s, size = 14) => s.st === 'done' ? icon('check', size, T.good, 2.25) : s.st === 'missed' ? icon('x', size, T.bad, 2.25) : icon(s.k, size);
  const chip = (s) => `<div style="display: flex; flex-direction: column; gap: 5px; padding: 8px 7px; border-radius: 9px; font-size: 11.5px; letter-spacing: -0.01em; font-weight: 500; line-height: 1.2; min-width: 0; ${chipStyle(s.st)}">${chipIcon(s)}<span class="ellip">${s.short || s.t}</span></div>`;
  const weekStrip = (week = WEEK) => `
  <div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px">
    ${week.map((w) => `
      <div style="display: flex; flex-direction: column; gap: 8px; min-height: 84px; padding: 10px 6px; min-width: 0; border-radius: 12px; background: ${w.today ? T.surface : 'transparent'}; border: 1px solid ${w.today ? T.line : 'transparent'}">
        <div class="row" style="gap: 6px; font-size: 12px; color: ${w.today ? T.ink : T.ink3}"><span style="font-weight: 600">${w.d}</span><span class="num">${w.n}</span></div>
        ${w.s.length ? w.s.map(chip).join('') : `<div style="font-size: 12px; color: ${T.ink3}; padding: 8px 2px">Repos</div>`}
      </div>`).join('')}
  </div>`;
  const mDay = (w) => `<div style="display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1 1 0"><span style="font-size: 11px; color: ${w.today ? T.ink : T.ink3}; font-weight: ${w.today ? 600 : 400}">${w.d.slice(0, 1)}</span>
  <span style="width: 34px; height: 34px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; ${w.s.length ? chipStyle(w.s[0].st) : `background: transparent; border: 1px solid ${T.line}; color: ${T.ink3}`}">${w.s.length ? chipIcon(w.s[0], 16) : `<span style="width: 4px; height: 4px; border-radius: 99px; background: ${T.lineStrong}"></span>`}</span></div>`;
  const miniWeek = (week = WEEK) => `<div class="row" style="gap: 4px">${week.map(mDay).join('')}</div>`;

  const checkinDay = (d, lv, on = false) => `<div style="display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1 1 0"><span class="dot" style="width: 18px; height: 18px; background: ${LEVEL[lv][1]}; ${on ? `box-shadow: 0 0 0 3px ${T.surface}, 0 0 0 4.5px ${LEVEL[lv][1]}` : ''}"></span><span style="font-size: 11px; color: ${on ? T.ink : T.ink3}; font-weight: ${on ? 600 : 400}">${d}</span></div>`;
  const metric = (l, v, c = T.ink) => `<div style="display: flex; flex-direction: column; gap: 3px; flex: 1 1 0"><span class="faint" style="font-size: 12px">${l}</span><span class="num" style="font-size: 17px; font-weight: 600; color: ${c}; letter-spacing: -0.01em">${v}</span></div>`;
  const mMetric = (l, v, c = T.ink) => `<div style="display: flex; flex-direction: column; gap: 2px; flex: 1 1 0; padding: 10px 12px; border-radius: 10px; background: ${T.surface2}"><span class="faint" style="font-size: 11.5px">${l}</span><span class="num" style="font-size: 16px; font-weight: 600; color: ${c}">${v}</span></div>`;
  const kpi = (label, value, sub, subColor = T.ink3) => `
  <div class="card" style="padding: 18px 20px; display: flex; flex-direction: column; gap: 6px; flex: 1 1 0">
    <div style="font-size: 13px; color: ${T.ink2}; font-weight: 500">${label}</div>
    <div class="num" style="font-size: 30px; font-weight: 600; letter-spacing: -0.03em; line-height: 1">${value}</div>
    <div style="font-size: 12px; color: ${subColor}">${sub}</div>
  </div>`;
  const sectionHead = (title, right = '', pad = '14px 16px') => `<div class="row" style="padding: ${pad}; gap: 10px"><h2 class="h2" style="flex: 1 1 auto">${title}</h2>${right}</div>`;
  const tab = (l, on) => `<span style="padding: 10px 2px; margin-right: 22px; font-weight: 500; color: ${on ? T.ink : T.ink2}; border-bottom: 2px solid ${on ? T.ink : 'transparent'}">${l}</span>`;
  const tabs = (list, active) => `<div class="row" style="border-bottom: 1px solid ${T.line}; font-size: 14px">${list.map((l) => tab(l, l === active)).join('')}</div>`;

  // mobile shell
  const tabBar = (items, active) => `
  <nav style="position: absolute; left: 0; right: 0; bottom: 0; height: 84px; padding: 8px 8px 24px; background: ${T.surface}; border-top: 1px solid ${T.line}; display: grid; grid-template-columns: repeat(${items.length}, minmax(0, 1fr)); gap: 4px">
    ${items.map(([n, l]) => `<div data-go="${TAB_GO[l] || ''}" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; height: 48px; border-radius: 10px; font-size: 10.5px; font-weight: 500; color: ${l === active ? T.ink : T.ink3}">${icon(n, 22, l === active ? T.ink : T.ink3, l === active ? 2 : 1.75)}<span>${l}</span></div>`).join('')}
  </nav>`;
  const TAB_GO = { 'Aperçu': 'MobileApercu', 'Athlètes': 'MobileAthletes', 'Planning': 'MobilePlanning', 'Messages': 'MobileMessages', 'Plus': 'MobilePlus', 'Aujourd’hui': 'MobileAujourdhui', 'Progression': 'AthleteProgression', 'Coach': 'AthleteCoach', 'Profil': 'AthleteProfil' };
  const COACH_TABS = [['grid', 'Aperçu'], ['users', 'Athlètes'], ['calendar', 'Planning'], ['message', 'Messages'], ['more', 'Plus']];
  const ATH_TABS = [['home', 'Aujourd’hui'], ['calendar', 'Planning'], ['trend', 'Progression'], ['message', 'Coach'], ['user', 'Profil']];
  const phone = (inner, tabsHtml = '') => `
<div style="position: relative; width: 390px; height: 844px; background: ${T.bg}; overflow: hidden; display: flex; flex-direction: column">
  ${inner}
  ${tabsHtml}
</div>`;
  const mHeader = (title, right = '', back = true) => `<div class="row" style="gap: 8px; height: 40px">${back ? `<span class="icon-btn" style="border: 0; background: transparent; width: 32px; margin-left: -8px">${icon('back', 22, T.ink)}</span>` : ''}<span style="flex: 1 1 auto; font-weight: 600; font-size: 17px; ${back ? 'text-align: center' : ''}">${title}</span>${right || (back ? '<span style="width: 24px"></span>' : '')}</div>`;
  const stickyBar = (inner, bottom = 84) => `<div style="position: absolute; left: 0; right: 0; bottom: ${bottom}px; padding: 12px 20px; display: flex; gap: 10px; background: linear-gradient(180deg, rgba(0,0,0,0), ${T.bg} 40%)">${inner}</div>`;

  const bubble = (text, mine, time) => `<div style="display: flex; flex-direction: column; align-items: ${mine ? 'flex-end' : 'flex-start'}; gap: 4px"><div style="max-width: 78%; padding: 10px 14px; border-radius: 16px; border-${mine ? 'bottom-right' : 'bottom-left'}-radius: 6px; font-size: 14px; line-height: 1.4; background: ${mine ? T.btnPrimaryBg : T.surface}; color: ${mine ? T.btnPrimaryInk : T.ink}; ${mine ? '' : `border: 1px solid ${T.line}`}">${text}</div><span class="faint" style="font-size: 11px; padding: 0 4px">${time}</span></div>`;
  const sessionCard = (name, meta, st = 'today') => `<div class="row" style="gap: 10px; padding: 10px 12px; border-radius: 12px; ${chipStyle(st)}; max-width: 78%; font-size: 13px">${st === 'done' ? icon('check', 18, T.good, 2.25) : icon('run', 18)}<div style="line-height: 1.3"><div style="font-weight: 600">${name}</div><div style="opacity: .8; font-size: 12px">${meta}</div></div></div>`;
  const composer = (ph = 'Écrire à Léa…') => `<div class="row" style="gap: 8px"><span class="icon-btn">${icon('plus', 20)}</span><div class="input" style="flex: 1 1 auto; height: 44px; border-radius: 12px"><span>${ph}</span></div><span class="icon-btn" style="background: ${T.btnPrimaryBg}; color: ${T.btnPrimaryInk}; border-color: ${T.btnPrimaryBg}; width: 44px; height: 44px; border-radius: 12px">${icon('send', 18, T.btnPrimaryInk)}</span></div>`;

  const ATHLETES = [
    { i: 'LM', n: 'Léa Martin', g: 'Marathon', lv: 'bad', adh: 92, next: 'Ven · Footing 45′', last: 'Hier, 12,1 km', sleep: '6 h 10', load: 34, race: 'Marathon de Paris · J-226' },
    { i: 'KD', n: 'Karim Diallo', g: '10 km', lv: 'warn', adh: 71, next: 'Sam · Seuil 3 × 8′', last: 'Il y a 3 j, 6,8 km', sleep: '6 h 45', load: 22, race: '10 km de Lyon · J-30' },
    { i: 'NS', n: 'Nora Saidi', g: 'Semi', lv: 'good', adh: 96, next: 'Ven · Allure semi 20′', last: 'Hier, 9,5 km', sleep: '7 h 30', load: 48, race: 'Semi de Lyon · J-9' },
    { i: 'TB', n: 'Théo Bernard', g: 'Marathon', lv: 'good', adh: 88, next: 'Dim · Sortie longue 2 h', last: 'Hier, 14,0 km', sleep: '7 h 50', load: 61, race: 'Marathon de Paris · J-226' },
    { i: 'SR', n: 'Sofia Rossi', g: 'Trail', lv: 'good', adh: 84, next: 'Sam · Côtes 12 × 45″', last: 'Il y a 2 j, 11,2 km', sleep: '8 h 05', load: 55, race: 'Trail des Bauges · J-44' },
    { i: 'AP', n: 'Adrien Petit', g: '10 km', lv: 'none', adh: 65, next: 'Ven · Footing 40′', last: 'Il y a 5 j, 5,0 km', sleep: '—', load: 12, race: '—' },
    { i: 'MO', n: 'Maya Okafor', g: 'Semi', lv: 'good', adh: 90, next: 'Sam · Footing 1 h', last: 'Hier, 10,3 km', sleep: '7 h 15', load: 44, race: 'Semi de Lyon · J-9' },
    { i: 'JL', n: 'Jules Lefebvre', g: 'Trail', lv: 'warn', adh: 78, next: 'Dim · Rando-course 3 h', last: 'Il y a 2 j, 16,8 km', sleep: '6 h 20', load: 58, race: 'Trail des Bauges · J-44' },
    { i: 'CL', n: 'Clara Lopez', g: 'Marathon', lv: 'good', adh: 94, next: 'Ven · Seuil 2 × 15′', last: 'Hier, 13,2 km', sleep: '7 h 40', load: 63, race: 'Marathon de Paris · J-226' },
    { i: 'YA', n: 'Yanis Amrani', g: '10 km', lv: 'good', adh: 82, next: 'Sam · VMA 8 × 300 m', last: 'Il y a 2 j, 7,4 km', sleep: '7 h 00', load: 30, race: '10 km de Lyon · J-30' },
  ];
  const adhBar = (p) => `<div class="row" style="gap: 10px"><div style="width: 72px; height: 6px; border-radius: 999px; background: ${T.neutralSoft}; overflow: hidden"><div style="width: ${p}%; height: 100%; background: ${p < 75 ? T.warn : T.ink}"></div></div><span class="num" style="width: 36px; color: ${T.ink2}">${p} %</span></div>`;

  return { T, icon, page, avatar, LEVEL, statusPill, dot, softPill, accentPill, donePill, navItem, logo, sidebar, searchBox, barChart, lineChart, WEEK, chipStyle, chipIcon, chip, weekStrip, mDay, miniWeek, checkinDay, metric, mMetric, kpi, sectionHead, tab, tabs, tabBar, COACH_TABS, ATH_TABS, phone, mHeader, stickyBar, bubble, sessionCard, composer, ATHLETES, adhBar };
}
