// Assembles every screen (light + dark) into one navigable HTML prototype.
import { writeFileSync, readFileSync } from 'node:fs';
import { THEMES, make } from './lib.mjs';
import { coachDesktop } from './coach-desktop.mjs';
import { coachMobile } from './coach-mobile.mjs';
import { athlete } from './athlete.mjs';
import { muscu } from './muscu.mjs';
import { extras } from './extras.mjs';
import { pricing } from './pricing.mjs';
import { analyse } from './analyse.mjs';

const light = make(THEMES.light), dark = make(THEMES.dark);
const build = (L) => ({ ...coachDesktop(L), ...coachMobile(L), ...athlete(L), ...muscu(L), ...extras(L), ...pricing(L), ...analyse(L) });
const LS = build(light), DS = build(dark);
const canvas = JSON.parse(readFileSync('canvas.json', 'utf8'));
const PAGE_NAME = Object.fromEntries(canvas.pages.map((p) => [p.id, p.name.replace(/^\d+ · /, '')]));
const META = canvas.artboards.filter((a) => a.file !== 'Systeme.dc.html' && a.file !== 'PrixMarche.dc.html' && !a.file.startsWith('Dark')).map((a) => ({ id: a.file.replace('.dc.html', ''), title: a.title, group: PAGE_NAME[a.page], mobile: a.w === 390 }));

const split = (html) => ({ css: html.match(/<style>([\s\S]*?)<\/style>/)[1], body: html.split('</helmet>')[1].split('</x-dc>')[0] });
function scope(css, cls) {
  css = css.replace(/@import[^;]+;/g, '');
  return css.split('}').map((rule) => {
    if (!rule.trim()) return '';
    const [sel, decl] = rule.split('{');
    const sels = sel.split(',').map((x) => x.trim()).map((x) => x === 'body' ? `.${cls} .stage` : x === '*' ? `.${cls} .stage *` : `.${cls} .stage ${x}`);
    return `${sels.join(', ')} {${decl}}`;
  }).join('\n');
}
const lightCss = scope(split(LS.Main).css, 'm-light'), darkCss = scope(split(DS.Main).css, 'm-dark');

const screens = META.map((m) => `<section class="screen" data-id="${m.id}" data-mobile="${m.mobile}" hidden>
  <div class="v m-light"><div class="stage">${split(LS[m.id]).body}</div></div>
  <div class="v m-dark"><div class="stage">${split(DS[m.id]).body}</div></div>
</section>`).join('\n');

// label → screen (resolved in JS on click, by trimmed text of the clicked control)
const LINKS = {
  // coach web
  'Nouvelle séance': 'Editeur', 'Planifier une séance': 'Editeur', 'Planifier': 'MobileCreerSeance', 'Assigner un modèle': 'Bibliotheque', 'Nouveau modèle': 'EditeurMuscu',
  'Voir la fiche': 'FicheAthlete', 'Ouvrir le planning': 'Planning', 'Tout voir': 'Athletes', 'Toutes': 'FicheAthlete', 'Tous les exercices': 'FicheMuscu',
  'Inviter un athlète': 'Equipe', 'Inviter': 'Equipe', 'Partager mon code': 'Equipe', 'Voir les modèles': 'Bibliotheque', 'Modifier': 'Editeur', 'Dupliquer': 'Editeur',
  'Assigner à…': 'Editeur', 'Assigner': 'Planning', 'Enregistrer comme modèle': 'Bibliotheque', 'Annuler': 'Bibliotheque', 'Mois': 'PlanningMois', 'Semaine': 'Planning',
  'Adapter la séance': 'Editeur', 'Écrire': 'Messages', 'Valider': 'FicheAthlete', 'Message': 'Messages', 'Muscu': 'FicheMuscu', 'Aperçu': 'FicheAthlete', 'Séances': 'FicheAthlete', 'Tests': 'FicheAthlete', 'Notes': 'FicheAthlete',
  'Programmer un test': 'Editeur', 'Saisir une valeur': 'FicheAthlete', 'Copier la semaine d’un autre athlète': 'Planning',
  'Monitoring': 'Monitoring', 'Intégrations': 'Integrations', 'Séance précédente': 'AnalyseTrail', 'Renvoyer': 'Integrations', 'Toutes': 'AnalyseSeance', 'Montres & connexions': 'AthleteConnexions', 'Ma forme': 'AthleteMonitoring', 'Voir la séance': 'AthleteAnalyse',
  'Voir les tarifs': 'Tarifs', 'Gérer': 'Tarifs', 'Passer à Coach': 'Equipe', 'Choisir Solo': 'Equipe', 'Choisir Structure': 'Equipe',
  // coach mobile
  'Répondre': 'MobileMessages', 'Ajuster la prochaine': 'MobileCreerMuscu', 'Partager le lien': 'MobilePlus', 'Inviter un athlète ': 'MobilePlus',
  'Bloc': 'MobileCreerSeance', 'Répétition': 'MobileCreerSeance', 'Modèle': 'MobileCreerSeance', 'Ajouter un exercice': 'MobileCreerMuscu',
  // athlète
  'Démarrer': 'AthleteSeance', 'Voir le détail': 'AthleteSeance', 'Démarrer la séance': 'AthleteCompteRendu', 'Envoyer à Marc': 'MobileAujourdhui', 'Commencer la séance': 'AthleteMuscuLog',
  'Valider la série': 'AthleteMuscuLog', 'Continuer': 'AthleteProfilSetup', 'Marquer réalisée': 'AthleteCompteRendu', 'Strava': 'AthleteProfil', 'Synchroniser Strava': 'AthleteWeb', 'Course': 'AthleteProgression',
};
// per-screen overrides (same label, different destination)
const OVERRIDES = {
  AthleteProfilSetup: { 'Continuer': 'MobileAujourdhui' }, MobileCreerSeance: { 'Muscu': 'MobileCreerMuscu', 'Annuler': 'MobileApercu' }, MobileCreerMuscu: { 'Course': 'MobileCreerSeance', 'Annuler': 'MobileApercu' },
  AthleteProgression: { 'Muscu': 'AthleteMuscuProgression' }, AthleteMuscuProgression: { 'Course': 'AthleteProgression' }, AthleteMuscuLog: { 'Valider la série': 'MobileMuscuRetour' },
  MobileAujourdhui: { 'Démarrer': 'AthleteSeance' }, AthleteRepos: { 'Voir le détail': 'AthleteSeance' }, AthleteSeance: { 'Démarrer la séance': 'AthleteCompteRendu' },
  Planning: { 'Nouvelle séance': 'Editeur' }, PlanningMois: { 'Semaine': 'Planning' }, Editeur: { 'Assigner': 'Planning', 'Annuler': 'Bibliotheque' }, EditeurMuscu: { 'Assigner': 'Planning', 'Annuler': 'Bibliotheque', 'Exercice': 'EditeurMuscu' },
  ApercuVide: { 'Inviter': 'Equipe', 'Voir les modèles': 'Bibliotheque' }, FicheVide: { 'Assigner un modèle': 'Bibliotheque' }, MobileAthletesVide: { 'Partager le lien': 'MobilePlus' }, MobileTarifs: { 'Passer à Coach': 'MobilePlus', 'Choisir Solo': 'MobilePlus', 'Choisir Structure': 'MobilePlus' }, MobilePlus: { 'Coach Pro': 'MobileTarifs' }, FicheAthlete: { 'Toutes': 'AnalyseSeance', 'Muscu': 'FicheMuscu' }, FicheMuscu: { 'Aperçu': 'FicheAthlete' }, Monitoring: { 'Aperçu': 'FicheAthlete', 'Muscu': 'FicheMuscu' }, AthleteProgression: { 'Muscu': 'AthleteMuscuProgression', 'Ma forme': 'AthleteMonitoring' }, AthleteProfil: { 'Strava': 'AthleteConnexions', 'Garmin': 'AthleteConnexions' }, AthleteCompteRendu: { 'Envoyer à Marc': 'AthleteAnalyse' },
  MobileMuscuRetour: { 'Répondre': 'MobileMessages' }, AthleteWeb: { 'Voir le détail': 'AthleteWeb', 'Marquer réalisée': 'AthleteWeb' },
  Bibliotheque: { 'Modifier': 'Editeur', 'Assigner à…': 'Editeur', 'Nouveau modèle': 'EditeurMuscu' },
};
const ATHLETE_TO_FICHE = ['Léa Martin', 'Karim Diallo', 'Nora Saidi', 'Théo Bernard', 'Sofia Rossi', 'Adrien Petit', 'Maya Okafor', 'Jules Lefebvre', 'Clara Lopez', 'Yanis Amrani', 'Inès Bernard'];

const groups = [...new Set(META.map((m) => m.group))];
const options = groups.map((g) => `<optgroup label="${g}">${META.filter((m) => m.group === g).map((m) => `<option value="${m.id}">${m.title}</option>`).join('')}</optgroup>`).join('');

const html = `<meta charset="utf-8"><title>Kadro</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap">
<style>
  :root { --bg: #ECECE8; --bar: #FFFFFF; --line: #E0E0DA; --ink: #101820; --ink2: #5A6370; --ink3: #8C949D; --accent: #5B4FE9; --bezel: #101820; }
  :root.m-dark { --bg: #07090C; --bar: #161B21; --line: #252C34; --ink: #F2F4F6; --ink2: #A7B0BA; --ink3: #717B86; --accent: #8B82FF; --bezel: #2A323C; }
  html, body { margin: 0; height: 100%; }
  body { background: var(--bg); color: var(--ink); font-family: Geist, "Helvetica Neue", Arial, system-ui, sans-serif; font-size: 13px; -webkit-font-smoothing: antialiased; overflow: hidden; }
  #bar { position: fixed; inset: 0 0 auto 0; height: 48px; display: flex; align-items: center; gap: 10px; padding: 0 14px; background: var(--bar); border-bottom: 1px solid var(--line); z-index: 10; }
  #bar .brand { display: flex; align-items: center; gap: 8px; font-weight: 700; letter-spacing: -0.02em; font-size: 14px; margin-right: 6px; }
  #bar .brand span.tag { font-weight: 500; color: var(--ink3); font-size: 12px; }
  .seg { display: flex; padding: 3px; border-radius: 9px; background: var(--bg); gap: 2px; }
  .seg button { border: 0; background: transparent; color: var(--ink2); font: inherit; font-weight: 500; padding: 5px 11px; border-radius: 7px; cursor: pointer; }
  .seg button.on { background: var(--bar); color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,.08); }
  .seg button:focus-visible, #pick:focus-visible, .ib:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
  #pick { font: inherit; color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px; max-width: 320px; }
  .ib { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--line); background: transparent; color: var(--ink2); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
  .spacer { flex: 1 1 auto; }
  .hint { color: var(--ink3); font-size: 12px; }
  #root { position: absolute; inset: 48px 0 0 0; overflow: auto; display: flex; align-items: flex-start; justify-content: center; padding: 28px 20px 40px; }
  .screen { display: block; }
  .screen[hidden] { display: none; }
  .v { display: none; } :root.m-light .v.m-light, :root.m-dark .v.m-dark { display: block; }
  .stage { transform-origin: top left; }
  .screen[data-mobile="true"] .stage { border-radius: 44px; overflow: hidden; box-shadow: 0 0 0 10px var(--bezel), 0 30px 60px rgba(0,0,0,.25); }
  .screen[data-mobile="false"] .stage { border-radius: 12px; overflow: hidden; box-shadow: 0 0 0 1px var(--line), 0 24px 60px rgba(0,0,0,.18); }
  .stage [data-go], .stage .btn, .stage .pill, .stage a, .stage .icon-btn { cursor: pointer; }
  .wrap { position: relative; }
  ${lightCss}
  ${darkCss}
  @media (prefers-reduced-motion: no-preference) { .screen { animation: in .18s ease-out; } @keyframes in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } } }
</style>
<div id="bar">
  <div class="brand"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 16v3M12 10v9M18 4v15"/></svg>Kadro <span class="tag">prototype</span></div>
  <div class="seg" id="who"><button data-who="coach" class="on">Coach</button><button data-who="athlete">Athlète</button></div>
  <div class="seg" id="mode"><button data-mode="light" class="on">Clair</button><button data-mode="dark">Sombre</button></div>
  <button class="ib" id="back" title="Retour (←)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>
  <select id="pick">${options}</select>
  <span class="spacer"></span>
  <span class="hint" id="hint">Cliquez dans l’écran : menu, onglets, athlètes, boutons.</span>
</div>
<div id="root">${screens}</div>
<script>
(function () {
  const LINKS = ${JSON.stringify(LINKS)}, OVERRIDES = ${JSON.stringify(OVERRIDES)}, ATH = ${JSON.stringify(ATHLETE_TO_FICHE)};
  const META = ${JSON.stringify(META.map((m) => ({ id: m.id, mobile: m.mobile })))};
  const root = document.documentElement, stack = [];
  let cur = null;
  const isMobile = (id) => (META.find((m) => m.id === id) || {}).mobile;
  function show(id, push = true) {
    const sec = document.querySelector('.screen[data-id="' + id + '"]'); if (!sec) return;
    if (cur && push && cur !== id) stack.push(cur);
    document.querySelectorAll('.screen').forEach((s) => { s.hidden = true; });
    sec.hidden = false; cur = id; document.getElementById('pick').value = id;
    const who = /^(Athlete|MobileAujourdhui)/.test(id) ? 'athlete' : 'coach';
    document.querySelectorAll('#who button').forEach((b) => b.classList.toggle('on', b.dataset.who === who));
    fit(); location.hash = id; document.getElementById('root').scrollTop = 0;
  }
  function fit() {
    const sec = document.querySelector('.screen:not([hidden])'); if (!sec) return;
    const w = sec.dataset.mobile === 'true' ? 390 : 1440, h = sec.dataset.mobile === 'true' ? 844 : 900;
    const avail = window.innerWidth - 40, availH = window.innerHeight - 48 - 60;
    const s = Math.min(1, avail / w, availH / h);
    sec.querySelectorAll('.stage').forEach((st) => { st.style.transform = 'scale(' + s + ')'; st.style.width = w + 'px'; st.style.height = h + 'px'; });
    sec.querySelectorAll('.v').forEach((v) => { v.style.width = (w * s) + 'px'; v.style.height = (h * s) + 'px'; });
  }
  function setMode(m) { root.classList.remove('m-light', 'm-dark'); root.classList.add('m-' + m); document.querySelectorAll('#mode button').forEach((b) => b.classList.toggle('on', b.dataset.mode === m)); try { localStorage.setItem('kadro-mode', m); } catch (e) {} fit(); }
  document.getElementById('mode').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setMode(b.dataset.mode); });
  document.getElementById('who').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; show(b.dataset.who === 'coach' ? 'Main' : 'MobileAujourdhui'); });
  document.getElementById('pick').addEventListener('change', (e) => show(e.target.value));
  document.getElementById('back').addEventListener('click', () => { const p = stack.pop(); if (p) show(p, false); });
  window.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' && !e.target.closest('select')) { const p = stack.pop(); if (p) show(p, false); } });
  window.addEventListener('resize', fit);
  document.getElementById('root').addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]'); if (go && go.dataset.go) { show(go.dataset.go); return; }
    // back / close icons in mobile headers
    const svg = e.target.closest('svg'); if (svg) { const d = svg.innerHTML; if (d.includes('M19 12H5M11 6l-6 6 6 6') || d.includes('M6 6l12 12M18 6L6 18')) { const p = stack.pop(); if (p) show(p, false); return; } }
    // labelled controls
    let el = e.target; for (let i = 0; i < 5 && el && el !== e.currentTarget; i++, el = el.parentElement) {
      const t = (el.textContent || '').trim().replace(/\\s+/g, ' ');
      if (t.length && t.length < 48) { const o = (OVERRIDES[cur] || {})[t]; const target = o || LINKS[t]; if (target) { show(target); return; } }
    }
    // athlete rows → fiche
    el = e.target; for (let i = 0; i < 6 && el && el !== e.currentTarget; i++, el = el.parentElement) {
      const t = (el.textContent || '');
      if (t.length < 260 && ATH.some((n) => t.includes(n)) && !/^(Athlete|MobileAujourdhui)/.test(cur)) {
        if (cur === 'Messages' || cur === 'MobileMessages') return;
        show(isMobile(cur) ? (cur === 'MobilePlus' ? 'MobileAthletes' : 'MobileFicheAthlete') : 'FicheAthlete'); return;
      }
    }
  });
  let m = 'light'; try { m = localStorage.getItem('kadro-mode') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch (e) {}
  setMode(m);
  const start = location.hash.replace('#', ''); show(start && document.querySelector('.screen[data-id="' + start + '"]') ? start : 'Main', false);
})();
</script>`;
writeFileSync('kadro-prototype.html', html);
console.log('prototype:', META.length, 'screens ×2 modes,', Math.round(html.length / 1024), 'KB');
