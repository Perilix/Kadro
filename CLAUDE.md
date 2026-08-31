# Kadro

Plateforme de suivi d'athlètes pour coachs (course à pied + renforcement musculaire). Le coach paie, l'athlète est gratuit. Marchés visés : France, Suisse, Allemagne (FR / DE / EN).

## État du projet (31 août 2026)

- **Maquette terminée** (64 écrans) : `design/maquette/dist/kadro-canvas.html` (canvas), `kadro-prototype.html` (prototype navigable), `kadro-vs-nolio-truecoach.html` (étude de marché). Sources générées par `design/maquette/src/build.mjs` (`node build.mjs` puis `node proto.mjs`).
- **Schéma de données validé** : `docs/SCHEMA.md` (22 collections) + contrat d'API `docs/API.md`. Toute évolution de modèle passe par ces docs d'abord.
- **Monorepo en place** (pnpm workspaces) : `apps/api` (NestJS — étapes 1 à 5 du contrat livrées : auth/invite, athlètes/groupes, bibliothèque, planning avec résolution allures/charges, check-ins/alertes/dashboard, chat WS + notifications, activités), `apps/web` (Angular 20 — app coach complète : auth, aperçu, roster/fiche, éditeur de séance avec aperçu individualisé, planning semaine, messages temps réel), `apps/mobile` (Expo SDK 54 + expo-router — athlète : rejoindre par code, aujourd'hui/check-in/séance, muscu série par série, planning, progression, chat, profil ; **coach** : aperçu/à traiter, athlètes + fiche, planning semaine, messages, plus — routage par rôle), `packages/shared` (DTOs zod + règles métier testées), `packages/tokens` (généré depuis `design/maquette/src/lib.mjs`, ne pas éditer `dist/`).
- **Déployé sur Render** (blueprint `render.yaml`, région Frankfurt) : `kadro-api` (Docker — `apps/api/Dockerfile`, contexte racine) sur https://kadro-api.onrender.com (santé : `/v1/health`) et `kadro-web` (statique). Base : MongoDB Atlas (cluster0, Network Access ouvert 0.0.0.0/0). Node figé par `.node-version` (le build statique Render prend la dernière version sinon ; `corepack enable` y échoue — pnpm s'installe via npm). Comptes et mise en route : `docs/SETUP.md`.
- Décisions et contexte complet : `docs/DECISIONS.md`. Lis-le avant de proposer quoi que ce soit.

## Stack décidée

- `apps/api` — **NestJS + Mongoose** (MongoDB Atlas), TypeScript strict, JWT, WebSocket (chat), `@nestjs/schedule` (envoi des séances sur montre). Hébergé sur Render.
- `apps/web` — **Angular** (coach, desktop-first). Site statique Render.
- `apps/mobile` — **Expo / React Native** (athlète + coach mobile), iOS + Android, EAS.
- `packages/shared` — types, schémas zod, client API, règles métier (VMA → allures, 1RM → charges, ratio aigu/chronique, seuils d'alerte). **Sans framework** : pas de RxJS, pas de hooks.
- `packages/tokens` — une source → variables CSS (web) + objet TS (mobile).

## Système visuel (à respecter tel quel)

- Clair : fond `#F6F6F3`, surface `#FFFFFF`, filet `#E8E8E3`, encre `#101820` / `#5A6370` / `#8C949D`.
- Sombre : fond `#0E1216`, surface `#161B21`, filet `#252C34`, encre `#F2F4F6` / `#A7B0BA` / `#717B86`.
- **Accent unique indigo** `#5B4FE9` (sombre `#8B82FF`), doux `#ECEAFD` / `#26235A`, texte `#4338CA` / `#B4AEFF`. Il ne sert qu'à « aujourd'hui », aux données, badges et liens.
- Statuts de forme réservés : vert `#1E9E5A`, ambre `#D4890A`, rouge `#D93B2E` — jamais la couleur seule, toujours un point/icône + un mot.
- Boutons principaux **noirs** (blancs en sombre). Police **Geist**, chiffres tabulaires. Icônes au trait 1,75 px. Rayons 14 px (cartes) / 10 px (contrôles). Pas de dégradé, pas d'emoji.
- Toutes les valeurs exactes sont dans `design/maquette/src/lib.mjs` (`THEMES`).

## Conventions

- Français dans l'UI ; code et identifiants en anglais ; commits en anglais au format conventional commits (`feat(scope): detail`). Pas de commentaires dans le code.
- Coach de démo : Marc ; athlète de démo : Léa Martin. Code coach d'exemple : `KDR-7K2M`. appId : `com.kadro.app`. Domaines : `kadro.app`, `kadro-app.com`.
- Ne pas réintroduire quoi que ce soit de Trainwise (marque, TrainCoins, IA génératrice de plans).
