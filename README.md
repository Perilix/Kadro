# Kadro

Plateforme de suivi d'athlètes pour coachs — course à pied + renforcement musculaire.
Le coach paie, l'athlète est gratuit. FR / DE / EN.

## Structure

```
apps/api          API NestJS + Mongoose (MongoDB Atlas) — auth JWT, invitation par code
apps/web          (à venir) Angular — coach, desktop-first
apps/mobile       (à venir) Expo React Native — athlète + coach
packages/shared   types, DTOs zod, règles métier (VMA → allures, Epley, ratio A/C) — sans framework
packages/tokens   design tokens générés depuis design/maquette/src/lib.mjs (CSS + TS)
design/maquette   la maquette (64 écrans) et ses sources
docs/             DECISIONS.md · SCHEMA.md · API.md · SETUP.md
```

## Démarrer

Prérequis : Node ≥ 20, pnpm (`corepack enable`).

```sh
pnpm install
pnpm build                      # tokens → shared → api
cp apps/api/.env.example apps/api/.env   # puis renseigner MONGODB_URI et les secrets JWT
pnpm dev:api                    # API sur http://localhost:3000/v1 (santé : /v1/health)
pnpm test                       # tests des règles métier (packages/shared)
```

Régénérer les tokens après une retouche de la maquette :

```sh
pnpm --filter @kadro/tokens build
```

## Documents

- `docs/SCHEMA.md` — schéma MongoDB (validé, 22 collections)
- `docs/API.md` — contrat REST/WS et DTOs zod
- `docs/SETUP.md` — comptes à créer (Atlas, Render, Garmin…), config déploiement
- `docs/DECISIONS.md` — journal des décisions
