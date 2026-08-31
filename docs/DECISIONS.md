# Kadro — décisions et contexte

Journal des décisions prises avec Julien les 29 et 30 août 2026, pour repartir sans rien perdre.

## Le produit

- **Pour qui** : les coachs de course à pied / trail (et leur prépa physique) qui suivent 5 à 80 athlètes aujourd'hui sur Excel + WhatsApp. Cibles : France d'abord, puis Suisse et Allemagne.
- **Promesse** : « une séance écrite une fois, chaque athlète reçoit ses allures et ses charges, et vous voyez qui va mal avant la séance ».
- **Boucle centrale** : le coach invite (code) → l'athlète rejoint et relie sa montre → le coach écrit une séance (course ou muscu) avec allures / charges individualisées et une **difficulté attendue sur 10** → la séance part sur la montre → le réalisé remonte → check-in de forme chaque matin → « À traiter » sur l'aperçu coach → analyse de séance (allure, FC, zones, prévu vs réalisé rep par rep, difficulté attendue vs ressentie) → chat.
- **Modèle** : le coach paie, l'athlète est gratuit. Grille proposée (non validée) : Solo 19 € (5 athlètes) · Coach 39 € (25) · Structure 89 € (80, 3 coachs), HT, −2 mois en annuel, 1,50 €/athlète au-delà, essai 14 j sans carte.
- **V2, notée** : Premium athlète auto-coaché (planifier ses séances sans coach — Julien est dans ce cas) ; encaissement des athlètes par le coach (Stripe) ; puissance / balance G-D / W′bal avec capteur vélo.

## Ce qui est dessiné (64 écrans, `design/maquette`)

1. Palette & système · 2. Coach web (Aperçu, Athlètes, Fiche, Planning semaine + mois, Bibliothèque, Éditeur, Messages, Équipe & réglages) · 3. Coach mobile (Aperçu, Athlètes, Fiche, Planning, Conversation, Plus, Créer une séance, Notifications) · 4. Athlète (rejoindre par code, profil à l'inscription, Aujourd'hui, jour de repos, détail séance, compte-rendu, planning, progression, chat, profil, + web) · 5. Renforcement (éditeur % 1RM → kg par athlète, fiche onglet Muscu, créer muscu mobile, retour coach, séance du jour, enregistrement série par série, progression des charges) · 6. Analyse, monitoring & montres (analyse VMA, analyse trail, onglet Monitoring, Intégrations & montres, ma séance, ma forme, montres & connexions) · 7. Premiers pas & états vides · 8. Tarifs (+ positionnement face au marché) · 9. Mode sombre.

## Priorités techniques

1. **Connecteurs montres dès la v1** : Garmin, Coros, Polar, Suunto, Apple Watch, Wahoo, Strava, Zwift. Envoi de la séance structurée sur la montre (allures converties par athlète), retour automatique du réalisé, sommeil / FC repos / HRV. Ce sont des **API cloud** : tout vit dans `apps/api`. **Chemin critique : la demande au Garmin Developer Program (semaines d'approbation), Coros et Suunto sur candidature ; Polar AccessLink et Strava immédiats.**
2. Analyse de séance « à la Nolio mais moins » : un modèle de charge lisible (ratio aigu/chronique), pas trois.
3. Muscu au même niveau que la course : 1RM estimé (Epley) → charges, enregistrement série par série, tonnage, progression par exercice.
4. États vides et premiers pas soignés (c'est ce qui tient en démo).

## Stack (décidée le 30 août)

Monorepo TypeScript : `apps/api` NestJS + Mongoose · `apps/web` Angular · `apps/mobile` Expo React Native · `packages/shared` (types, zod, client API, règles métier, sans framework) · `packages/tokens`. MongoDB Atlas, Render (API + web statique), EAS pour le mobile, GitHub `Perilix/Kadro`.

Ce que Julien crée en son nom : Atlas, Render, comptes Garmin Developer / Coros / Strava API / Apple Developer / Google Play, domaines `kadro.app` + `kadro-app.com`, dépôt de marque KADRO (INPI / EUIPO / Swissreg, classes 9, 41, 42 — recherche encore à faire).

## Marché (étude du 29 août, `design/maquette/dist/kadro-vs-nolio-truecoach.html`)

- **Nolio** (FR, ≈ 1 500 coachs, 30 000 sportifs, FFA + FFC jusqu'en 2028, 6-9 salariés, CA estimé 0,8–1,2 M€) : fort sur montres et analyse ; **pas de suivi des charges muscu** (« en discussion » sur leur roadmap) ; trop de données pour les non-experts ; Premium athlète 6,90 € = friction.
- **TrueCoach** (US, 20 000 coachs, racheté par Xplor 2020) : fort en muscu ; **zéro endurance**, anglais seul, app coach 1,8/5.
- Kadro en plus : course + muscu même logique, suivi des charges, athlète jamais payant, écran « À traiter », check-in en 3 tapes. En retard : connecteurs, analyse fine, distribution, encaissement, vidéos d'exercices.

## Nom

Kadro (30 août 2026). Kadro = « l'effectif, le groupe » en turc. Aucune app fitness/coaching de ce nom ; existants hors sport : Kadro Solutions (agence e-commerce US, `kadro.com`), une app turque de foot à 5. Recherche de marque à faire. Historique : Trainwise Pro → Cadence (nom de travail) → Kadence (tout pris) → Kadro.

## Prochaine étape

Schéma de données + contrat d'API de la boucle v1, puis squelette du monorepo. Ne pas coder d'écran avant que le schéma soit posé.
