# Kadro — Comptes à créer et mise en route

Ce que Julien crée **en son nom** (comptes propriétaires), dans l'ordre conseillé, avec ce que
chaque service demandera. Les éléments techniques (config, secrets) sont ensuite branchés dans
`apps/api/.env` (dev) et Render (prod).

## 1. Tout de suite (bloquant pour développer / déployer)

### MongoDB Atlas — la base
1. Compte sur mongodb.com/atlas (e-mail perso), organisation « Kadro ».
2. Projet `kadro` → cluster **M0 (gratuit)** pour commencer, région **Frankfurt (eu-central-1)** ou Paris.
3. Database Access : utilisateur `kadro-api` (mot de passe généré, rôle readWriteAnyDatabase).
4. Network Access : en dev, ton IP ; pour Render, `0.0.0.0/0` (ou les IP sortantes Render) — à restreindre plus tard.
5. Récupérer la chaîne `mongodb+srv://…` (Connect > Drivers) → `MONGODB_URI`.

### Render — hébergement API (+ web statique plus tard)
1. Compte sur render.com, connecté au GitHub **Perilix**.
2. New > **Blueprint** → choisir le dépôt `Perilix/Kadro` : `render.yaml` crée le service `kadro-api`.
3. Renseigner `MONGODB_URI` quand le dashboard le demande (les secrets JWT sont générés par Render).
4. Vérifier `https://kadro-api.onrender.com/v1/health`.

### Domaines
- `kadro.app` et `kadro-app.com` (registrar au choix — le `.app` force le HTTPS, très bien).
- Prévoir : `api.kadro.app` → service Render, `kadro-app.com/rejoindre/<code>` → app web.

## 2. Cette semaine (délais d'approbation — chemin critique montres)

### Garmin Developer Program — **le plus long, à déposer en premier**
- developer.garmin.com → « Request Developer Program access ». Compter **plusieurs semaines**.
- Demander les APIs : **Training API** (envoi de séances structurées sur la montre), **Health API**
  (sommeil, FC repos, HRV), **Activity API** (réalisé). Webhooks push inclus.
- Le dossier demande : description du produit (coaching course + renfo, marchés FR/DE/CH), URL du
  site (mettre kadro.app même en page « bientôt »), volumétrie estimée, logo.

### COROS
- coros.com/developer (open platform) → candidature par formulaire. Délai variable (semaines).
- Demander : workout push + activités + données de sommeil.

### Suunto
- apizone.suunto.com → candidature. Même logique.

### Polar AccessLink — immédiat
- admin.polaraccesslink.com → créer un client OAuth (accès immédiat). Activités + Nightly Recharge.

### Strava API — immédiat
- strava.com/settings/api → créer une application (nom Kadro, site kadro.app, callback
  `https://api.kadro.app/v1/connections/strava/callback`). Limite de départ : 100 requêtes/15 min —
  demander l'augmentation quand il y aura des utilisateurs.

## 3. Avant la bêta mobile

### Apple Developer Program — 99 $/an
- developer.apple.com, compte individuel au nom de Julien Dietschy (ou société si créée d'ici là).
- Nécessaire pour TestFlight et l'App Store. appId : `com.kadro.app`.
- Délai : vérification d'identité ~48 h.

### Google Play Console — 25 $ une fois
- play.google.com/console, même identité. Package : `com.kadro.app`.
- Un nouveau compte doit faire tester l'app par 12+ testeurs pendant 14 jours avant la prod (règle
  Google pour les comptes perso) — anticiper.

### Expo / EAS
- expo.dev, compte + organisation `kadro`. Le plan gratuit suffit pour commencer (builds EAS limités).

## 4. Plus tard (ne bloque rien aujourd'hui)

- **Stripe** (au moment du module billing) : compte au nom de la structure — décider avant :
  auto-entrepreneur / société. Les CGV et mentions légales en découlent.
- **Withings, Wahoo, Zwift** : connecteurs secondaires, candidatures courtes.
- **Marque KADRO** : INPI (FR) puis EUIPO/Swissreg, classes 9, 41, 42 — la recherche d'antériorité
  reste à faire (note de DECISIONS.md).
- **E-mail transactionnel** (invitations, relances) : Resend ou Postmark, domaine kadro.app (SPF/DKIM).

## Dev local

```sh
corepack enable
pnpm install && pnpm build
cp apps/api/.env.example apps/api/.env    # MONGODB_URI + 2 secrets (openssl rand -hex 32)
pnpm dev:api                               # http://localhost:3000/v1/health
```

Sans cluster Atlas : `docker run -p 27017:27017 mongo:7` et `MONGODB_URI=mongodb://localhost:27017/kadro`.

## Secrets — règles

- Jamais de secret dans le dépôt : `.env` est ignoré par git, `.env.example` documente.
- Un secret par usage (access ≠ refresh), rotation possible sans redéployer la base.
- Les tokens des montres seront chiffrés en base (AES-GCM) avec une clé dédiée `TOKENS_ENC_KEY`
  (ajoutée quand le module connecteurs arrivera).
