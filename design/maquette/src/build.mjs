// Builds every Kadro artboard + canvas.json.
import { writeFileSync } from 'node:fs';
import { THEMES, make } from './lib.mjs';
import { coachDesktop } from './coach-desktop.mjs';
import { coachMobile } from './coach-mobile.mjs';
import { athlete } from './athlete.mjs';
import { systemSheet } from './system.mjs';
import { muscu } from './muscu.mjs';
import { extras } from './extras.mjs';
import { pricing } from './pricing.mjs';
import { analyse } from './analyse.mjs';

const light = make(THEMES.light), dark = make(THEMES.dark);
const lightScreens = { ...coachDesktop(light), ...coachMobile(light), ...athlete(light), ...muscu(light), ...extras(light), ...pricing(light), ...analyse(light) };
const darkAll = { ...coachDesktop(dark), ...coachMobile(dark), ...athlete(dark), ...muscu(dark), ...extras(dark), ...pricing(dark), ...analyse(dark) };
const DARK_SET = ['Main', 'FicheAthlete', 'Planning', 'MobileAthletes', 'MobilePlanning', 'MobileAujourdhui', 'AthleteProgression', 'AthleteCoach', 'EditeurMuscu', 'AthleteMuscuLog', 'MobileNotifications', 'Tarifs', 'AnalyseSeance', 'AthleteAnalyse', 'Integrations'];

// ---- write files ----
const files = { Systeme: systemSheet(), ...lightScreens };
for (const k of DARK_SET) files['Dark' + k] = darkAll[k];
for (const [name, html] of Object.entries(files)) writeFileSync(`${name}.dc.html`, html);

// ---- canvas layout ----
const D = (file, title, x, y, page) => ({ file: `${file}.dc.html`, title, x, y, w: 1440, h: 900, page });
const M = (file, title, x, y, page) => ({ file: `${file}.dc.html`, title, x, y, w: 390, h: 844, page });
const P = { sys: 'page-1', cd: 'page-2', cm: 'page-3', ath: 'page-4', muscu: 'page-6', start: 'page-7', prix: 'page-8', ana: 'page-9', dark: 'page-5' };
const row = (list, prefix, y, page) => list.map((s, i) => { const [f, t] = s.split(':'); return M(f, prefix + t, i * 490, y, page); });
const artboards = [
  { file: 'Systeme.dc.html', title: 'Palette & système visuel', x: 0, y: 0, w: 1440, h: 2150, page: P.sys },
  D('Main', 'Coach · Aperçu', 0, 0, P.cd), D('Athletes', 'Coach · Athlètes', 1540, 0, P.cd), D('FicheAthlete', 'Coach · Fiche athlète', 3080, 0, P.cd), D('Planning', 'Coach · Planning équipe', 4620, 0, P.cd),
  D('Bibliotheque', 'Coach · Bibliothèque', 0, 1040, P.cd), D('Editeur', 'Coach · Éditeur de séance', 1540, 1040, P.cd), D('Messages', 'Coach · Messages', 3080, 1040, P.cd), D('Equipe', 'Coach · Équipe & réglages', 4620, 1040, P.cd),
  ...row(['MobileApercu:Aperçu', 'MobileAthletes:Athlètes', 'MobileFicheAthlete:Fiche athlète', 'MobilePlanning:Planning', 'MobileMessages:Conversation', 'MobilePlus:Plus'], 'Coach mobile · ', 0, P.cm),
  ...row(['AthleteOnboarding:Rejoindre son coach', 'MobileAujourdhui:Aujourd’hui', 'AthleteSeance:Détail de séance', 'AthleteCompteRendu:Compte-rendu', 'AthletePlanning:Planning', 'AthleteProgression:Progression', 'AthleteCoach:Mon coach', 'AthleteProfil:Profil'], 'Athlète · ', 0, P.ath),
  D('AthleteWeb', 'Athlète · Web (tableau de bord)', 0, 984, P.ath),
  D('PlanningMois', 'Coach · Planning · vue mois', 6160, 0, P.cd),
  ...row(['MobileCreerSeance:Créer une séance', 'MobileNotifications:Notifications'], 'Coach mobile · ', 0, P.cm).map((a, i) => ({ ...a, x: (6 + i) * 490 })),
  // Analyse, monitoring & montres
  D('AnalyseSeance', 'Coach · Analyse de séance (VMA)', 0, 0, P.ana), D('AnalyseTrail', 'Coach · Analyse trail (profil, allure ajustée pente)', 1540, 0, P.ana), D('Monitoring', 'Coach · Fiche athlète, onglet Monitoring', 3080, 0, P.ana), D('Integrations', 'Coach · Intégrations & montres', 4620, 0, P.ana),
  ...row(['AthleteAnalyse:Athlète · Ma séance analysée', 'AthleteMonitoring:Athlète · Ma forme', 'AthleteConnexions:Athlète · Montres & connexions'], 'Montres · ', 1040, P.ana),
  // Tarifs
  { file: 'PrixMarche.dc.html', title: 'Positionnement prix face au marché', x: 0, y: 0, w: 1440, h: 1080, page: P.prix },
  D('Tarifs', 'Coach · Tarifs (web)', 1540, 0, P.prix), M('MobileTarifs', 'Coach mobile · Tarifs', 3080, 0, P.prix),
  // Renforcement musculaire
  D('EditeurMuscu', 'Muscu · Éditeur de séance (coach web)', 0, 0, P.muscu), D('FicheMuscu', 'Muscu · Fiche athlète, onglet Muscu (coach web)', 1540, 0, P.muscu),
  ...row(['MobileCreerMuscu:Coach · Créer une séance muscu', 'MobileMuscuRetour:Coach · Retour de séance', 'AthleteMuscuSeance:Athlète · Séance du jour', 'AthleteMuscuLog:Athlète · Enregistrement série par série', 'AthleteMuscuProgression:Athlète · Progression des charges'], 'Muscu · ', 1040, P.muscu),
  // Premiers pas & états vides
  D('ApercuVide', 'Premiers pas · Aperçu coach à J0', 0, 0, P.start), D('FicheVide', 'Premiers pas · Nouvel athlète sans données', 1540, 0, P.start),
  ...row(['MobileAthletesVide:Coach · Aucun athlète', 'AthleteProfilSetup:Athlète · Profil à l’inscription', 'AthleteRepos:Athlète · Jour de repos'], 'Premiers pas · ', 1040, P.start),
  D('DarkMain', 'Sombre · Coach Aperçu', 0, 0, P.dark), D('DarkFicheAthlete', 'Sombre · Fiche athlète', 1540, 0, P.dark), D('DarkPlanning', 'Sombre · Planning équipe', 3080, 0, P.dark),
  ...row(['DarkMobileAthletes:Coach Athlètes', 'DarkMobilePlanning:Coach Planning', 'DarkMobileAujourdhui:Athlète Aujourd’hui', 'DarkAthleteProgression:Athlète Progression', 'DarkAthleteCoach:Athlète Mon coach', 'DarkAthleteMuscuLog:Athlète Muscu en cours', 'DarkMobileNotifications:Coach Notifications'], 'Sombre · ', 1040, P.dark),
  D('DarkEditeurMuscu', 'Sombre · Éditeur muscu', 4620, 0, P.dark), D('DarkTarifs', 'Sombre · Tarifs', 6160, 0, P.dark), D('DarkAnalyseSeance', 'Sombre · Analyse de séance', 7700, 0, P.dark), D('DarkIntegrations', 'Sombre · Intégrations', 9240, 0, P.dark),
  ...row(['DarkAthleteAnalyse:Athlète Ma séance'], 'Sombre · ', 1040, P.dark).map((a) => ({ ...a, x: 7 * 490 })),
];
const canvas = {
  pages: [
    { id: 'page-1', name: '1 · Palette & système' }, { id: 'page-2', name: '2 · Coach · Desktop' }, { id: 'page-3', name: '3 · Coach · Mobile' },
    { id: 'page-4', name: '4 · Athlète' }, { id: 'page-6', name: '5 · Renforcement musculaire' }, { id: 'page-9', name: '6 · Analyse, monitoring & montres' }, { id: 'page-7', name: '7 · Premiers pas & états vides' }, { id: 'page-8', name: '8 · Tarifs' }, { id: 'page-5', name: '9 · Mode sombre' },
  ],
  artboards,
  annotations: [
    { id: 'ana-note', x: 0, y: -240, w: 640, page: P.ana, text: 'Décision du 29 août 2026 : les connecteurs montres passent en priorité (Garmin, Coros, Polar, Suunto, Apple Watch, Wahoo, Strava, Zwift) — envoi de la séance sur la montre avec les allures de l’athlète, retour automatique du réalisé, sommeil / FC repos / HRV.\n\nAnalyse de séance « à la Nolio, mais moins » : allure et FC dans le temps avec les répétitions en surbrillance, temps par zone, prévu vs réalisé rep par rep, meilleurs efforts détectés, allure ajustée à la pente et vitesse ascensionnelle en trail. Puissance / balance G-D / W′bal : v2, avec capteur de puissance.\n\nMonitoring : sommeil, FC repos, HRV, poids, check-ins — avec des seuils d’alerte qui alimentent « À traiter ».' },
    { id: 'v2-note', x: 700, y: -240, w: 420, page: P.ana, text: 'À garder pour la V2 (noté, pas dessiné) : un Premium athlète auto-coaché — planifier ses propres séances, bibliothèque, analyse et monitoring sans coach. Julien est lui-même dans ce cas. Tarif à définir (Nolio : 6,90 €/mois).' },
    { id: 'prix-note', x: 0, y: -200, w: 620, page: P.prix, text: 'Grille proposée : Solo 19 € (5 athlètes) · Coach 39 € (25) · Structure 89 € (80, 3 coachs), HT, −2 mois en annuel, 1,50 € par athlète au-delà du palier, essai 14 jours sans carte. Athlète toujours gratuit.\n\nÀ gauche : le relevé concurrence d’août 2026 qui justifie ces chiffres. Les prix en dollars sont indicatifs — à reconfirmer avant d’imprimer quoi que ce soit.' },
    { id: 'muscu-note', x: 0, y: -220, w: 620, page: P.muscu, text: 'Renforcement musculaire, même logique que la course : le coach écrit la séance une fois en % du 1RM, chaque athlète voit SA charge en kg. L’athlète enregistre série par série (reps, kg, RPE) avec le chrono de repos ; le coach reçoit le retour séries faites / prévues et la progression des charges par exercice.' },
    { id: 'start-note', x: 0, y: -220, w: 620, page: P.start, text: 'Ce que voit un coach le premier jour, et un athlète qui vient d’arriver : pas de VMA, pas de Strava, pas de check-in. Chaque manque a une action à côté. C’est là qu’une app tient la route en démo devant un vrai coach.\n\nModèle économique acté : le coach paie (essai 14 jours, puis abonnement par palier d’athlètes) ; l’athlète est gratuit, tout passe par son coach.' },
    { id: 'cd-note', x: 0, y: -200, w: 560, page: P.cd, text: 'Parcours coach (web) : Aperçu → il voit ce qu’il doit traiter · Athlètes → la liste qui remplace le tableur · Fiche → tout sur un athlète · Planning → la semaine de toute l’équipe · Bibliothèque + Éditeur → il écrit une séance une fois, chaque athlète reçoit ses propres allures · Messages → le chat qui remplace WhatsApp · Équipe → invitation par code, groupes, abonnement.' },
    { id: 'cm-note', x: 0, y: -180, w: 480, page: P.cm, text: 'Coach sur mobile = la version « sur le terrain » : consulter, réagir, écrire. La création de séances et le planning d’équipe restent surtout sur le web.' },
    { id: 'ath-note', x: 0, y: -200, w: 560, page: P.ath, text: 'Athlète = gratuit, tout passe par son coach (modèle acté). Parcours : rejoindre son coach avec un code → chaque matin, check-in de forme + séance du jour → détail de la séance avec ses allures → après la séance, compte-rendu (Strava + ressenti + RPE) envoyé au coach → planning, progression, chat, profil.\n\nEn bas : la même chose sur le web pour l’athlète qui préfère l’ordinateur.' },
    { id: 'dark-note', x: 0, y: -180, w: 520, page: P.dark, text: 'Mode sombre : mêmes écrans, mêmes jetons. Fond #0E1216, surfaces #161B21, accent éclairci #5B8CFF, statuts éclaircis sur fonds profonds. Le bouton principal passe en blanc.' },
  ],
  launch: { view: 'canvas', page: 'page-1' },
};
writeFileSync('canvas.json', JSON.stringify(canvas, null, 2));
writeFileSync('artboards.txt', Object.keys(files).map((n) => `${n}.dc.html`).join('\n'));
console.log('written', Object.keys(files).length, 'artboards');
