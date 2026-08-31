# Kadro — Contrat d'API v1

Pendant de `docs/SCHEMA.md`. REST JSON sous `/v1`, temps réel WebSocket pour le chat.
Tous les DTOs sont des schémas **zod** dans `packages/shared` (source unique : l'API les valide,
web et mobile les réutilisent, les types TS en sont inférés).

## Conventions

- **Auth** : JWT Bearer. Access 15 min, refresh 30 j (rotation, hash en base). `POST /auth/refresh` avec le refresh token.
- **Rôles** : deux gardes NestJS — `CoachGuard` (membre de `team.coachIds`) et `AthleteGuard` (le dossier `athletes` du token). Un coach n'accède qu'à sa team ; un athlète qu'à ses propres données. Les routes coach sont préfixées par la team implicite du token (pas de `:teamId` dans l'URL en v1).
- **Erreurs** : `{ statusCode, error, code, params? }` où `code` est une clé i18n (`'auth.invalid_credentials'`, `'invite.code_unknown'`, `'billing.athlete_limit_reached'`…). Jamais de message français en dur.
- **Pagination** : par curseur — `?limit=&cursor=` → `{ items, nextCursor }`. Listes datées : `?from=YYYY-MM-DD&to=YYYY-MM-DD`.
- **Dates** : instants en ISO 8601 UTC ; jours calendaires en `YYYY-MM-DD` (fuseau de l'athlète).
- **Idempotence** : les webhooks passent par `webhook_events` ; `POST /sessions/assign` accepte un header `Idempotency-Key`.

## Nommage zod (packages/shared/src/dto)

`zX` = schéma, `X = z.infer<typeof zX>`. Par ressource : `zXCreate`, `zXUpdate` (entrées),
`zX` (sortie API). Ex. `zCheckinCreate`, `zPlannedSession`, `zAthleteListItem`.
Les briques du schéma de données sont partagées : `zRunBlock`, `zRunTarget`, `zStrengthItem`,
`zAlertThresholds`, `zProvider`, `zFormStatus`…

---

## 1. AuthModule

| Méthode | Route | Corps (zod) | Réponse | Notes |
|---|---|---|---|---|
| POST | `/auth/register-coach` | `zRegisterCoach` `{ email, password, firstName, lastName, locale, timezone, teamName? }` | `zAuthSession` `{ user, accessToken, refreshToken }` | Crée `users` + `teams` (trial 14 j, code généré) |
| POST | `/auth/login` | `zLogin` `{ email, password }` | `zAuthSession` | |
| POST | `/auth/refresh` | `{ refreshToken }` | `zAuthSession` | Rotation |
| POST | `/auth/logout` | — | 204 | Invalide le refresh |
| GET | `/auth/me` | — | `zMe` `{ user, team? , athlete? }` | Contexte de démarrage des apps |
| PATCH | `/auth/me` | `zUserUpdate` (nom, locale, timezone, notificationPrefs) | `zUser` | |
| POST | `/auth/password` | `{ current, next }` | 204 | |

L'inscription **athlète** passe par InviteModule (jamais d'athlète sans code).

## 2. InviteModule — rejoindre par code

| Méthode | Route | Corps | Réponse | Notes |
|---|---|---|---|---|
| GET | `/invite/preview/:code` | — | `zInvitePreview` `{ coachName, teamName, athleteCount, sports }` | Public — la carte « Marc · 18 athlètes » |
| POST | `/invite/join` | `zJoin` `{ code, account: { email, password, firstName, lastName, locale, timezone }, profile: zAthleteProfileSetup, goal?: zGoal }` | `zAuthSession` | Crée `users` + `athletes`, marque l'invitation e-mail acceptée le cas échéant. Refus `billing.athlete_limit_reached` si palier atteint |
| GET | `/team/invite-code` | — | `{ code, joinUrl }` | Coach |
| POST | `/team/invite-code/rotate` | — | `{ code, joinUrl }` | Coach — régénère |
| GET | `/team/invitations` | — | `zInvitation[]` | En attente / acceptées |
| POST | `/team/invitations` | `{ email, name? }` | `zInvitation` | Envoie l'e-mail |
| POST | `/team/invitations/:id/remind` | — | `zInvitation` | « Relancer » |
| DELETE | `/team/invitations/:id` | — | 204 | Révoque |

## 3. TeamModule — équipe, groupes, réglages

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| GET | `/team` | — | `zTeam` (sans secrets Stripe) |
| PATCH | `/team` | `zTeamUpdate` (name, alertDefaults, watchPush) | `zTeam` |
| GET | `/team/dashboard` | — | `zCoachDashboard` `{ kpis: { athleteCount, activeThisWeek, sessionsDone, sessionsPlanned, adherence7d, adherenceDelta, openAlerts }, today: zTodayItem[], weeklyVolumeKm: { week, km }[] }` |
| GET | `/groups` | — | `zGroup[]` |
| POST | `/groups` | `{ name }` | `zGroup` |
| PATCH | `/groups/:id` | `{ name?, order? }` | `zGroup` |
| DELETE | `/groups/:id` | — | 204 (retire le groupe des athlètes) |
| POST | `/team/coaches` | `{ email }` | `zInvitation` (Structure uniquement) |

## 4. AthleteModule — roster et fiche

| Méthode | Route | Corps / query | Réponse |
|---|---|---|---|
| GET | `/athletes` | `?groupId&formStatus&needsAttention&q&sort&cursor` | `zPage<zAthleteListItem>` — tout le tableau roster vient de `athletes.snapshot` (1 requête) |
| GET | `/athletes/:id` | — | `zAthlete` (profil, goal, records, snapshot, connexions résumées) |
| PATCH | `/athletes/:id` | `zAthleteUpdate` (profile, goal, groupIds, coachId, alertOverrides) | `zAthlete` |
| POST | `/athletes/:id/archive` · `/unarchive` | — | `zAthlete` |
| GET | `/athletes/:id/overview` | `?weeks=8` | `zAthleteOverview` `{ loadByWeek, acuteChronicRatio, week: zWeekSession[], recentSessions, checkins7d, currentAlert? }` — l'onglet Aperçu en un appel |
| GET | `/athletes/:id/monitoring` | `?weeks=8` | `zMonitoring` `{ days: { date, sleepMin, restingHrBpm, hrvRmssdMs, weightKg, checkinLevel }[], summary7d, thresholds }` |
| GET | `/athletes/:id/tests` | `?kind` | `zTest[]` |
| POST | `/athletes/:id/tests` | `zTestCreate` | `zTest` (une VMA nouvelle met à jour `profile.vmaKmh`) |
| GET | `/athletes/:id/paces` | — | `zPaceTable` (Z2, seuil, VMA… depuis shared) |
| GET | `/athletes/:id/notes` · POST · PATCH `/notes/:noteId` · DELETE | `zNoteCreate` | `zNote[]` — coach uniquement |
| GET | `/athletes/:id/strength-stats` | — | `zExerciseStats[]` (1RM estimés, charges 8 sem., tonnage) |

Côté athlète, les mêmes lectures existent en `/me/*` (`/me/overview`, `/me/monitoring`, `/me/paces`,
`/me/progression?sport=run|strength`) — mêmes DTOs, garde `AthleteGuard`, `athleteId` implicite.

## 5. LibraryModule — modèles et exercices

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| GET | `/templates` | `?type&category&q&archived` | `zSessionTemplate[]` |
| POST | `/templates` | `zSessionTemplateCreate` | `zSessionTemplate` |
| GET / PATCH / DELETE | `/templates/:id` | `zSessionTemplateUpdate` | `zSessionTemplate` |
| POST | `/templates/:id/duplicate` | — | `zSessionTemplate` |
| GET | `/exercises` | `?q&muscleGroup&equipment` | `zExercise[]` (catalogue + équipe) |
| POST | `/exercises` | `zExerciseCreate` | `zExercise` |
| PATCH / DELETE | `/exercises/:id` | | (exercices d'équipe uniquement) |

## 6. PlanningModule — séances planifiées

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| POST | `/sessions/assign` | `zAssign` `{ session: zSessionTemplateCreate \| { templateId }, athleteIds: ObjectId[], date, saveAsTemplate? }` | `zPlannedSession[]` — 1 doc/athlète, `assignmentId` commun, jobs d'envoi montre créés |
| POST | `/sessions/preview` | `{ blocks \| exercises, athleteId }` | `zResolvedPreview` (allures/charges/FC/charge estimée — l'encart « Aperçu · Léa ») |
| GET | `/sessions` | `?athleteId&groupId&from&to` | `zPlannedSession[]` — planning semaine/mois, équipe ou athlète |
| GET | `/sessions/:id` | — | `zPlannedSessionDetail` (avec `resolved` et état d'envoi) |
| PATCH | `/sessions/:id` | `zPlannedSessionUpdate` (blocs, date, nom, difficulté, consigne, `applyToAssignment?`) | `zPlannedSession` — pose `modification`, re-résout, replanifie l'envoi si `resendOnUpdate` |
| DELETE | `/sessions/:id` | `?scope=one\|assignment` | 204 (annule les push jobs) |
| POST | `/sessions/:id/push` | — | `zWatchPushJob` (renvoi manuel) |
| POST | `/sessions/:id/complete-manual` | `zManualComplete` (durée, distance?, sets?…) | `zCompletedSession` (athlète sans montre — « Marquer réalisée ») |

## 7. ActivityModule — réalisé et analyse

| Méthode | Route | Corps / query | Réponse |
|---|---|---|---|
| GET | `/activities` | `?athleteId&sport&from&to&cursor` | `zPage<zActivityListItem>` |
| GET | `/activities/:id` | — | `zActivityDetail` — résumé, laps prévu/réalisé, splits, zones, bestEfforts, feedback, muscu série par série, `comparison` (même séance précédente) |
| GET | `/activities/:id/streams` | `?points=600&series=hr,pace,alt` | `zStreams` (décimé par défaut) |
| POST | `/activities/:id/feedback` | `zFeedback` `{ rpe, feeling, comment? }` | `zActivityDetail` — athlète ; déclenche notification coach |
| POST | `/activities/:id/link` | `{ plannedSessionId }` | — | rattacher une activité libre |
| POST | `/activities/:id/unlink` | — | — |

## 8. CheckinModule

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| POST | `/checkins` | `zCheckinCreate` `{ date, feeling, sleepMin?, soreness?, fatigue?, mood?, comment? }` | `zCheckin` — upsert du jour ; met à jour `snapshot.formStatus`, évalue les alertes |
| GET | `/checkins` | `?athleteId&from&to` | `zCheckin[]` |
| GET | `/me/checkin-today` | — | `zCheckinToday` `{ checkin?, prefill: { sleepMin? } }` (pré-rempli montre) |

## 9. AlertModule — « À traiter »

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| GET | `/alerts` | `?status=open&athleteId&cursor` | `zPage<zAlert>` |
| POST | `/alerts/:id/resolve` · `/dismiss` | — | `zAlert` |

Les seuils se règlent via `PATCH /team` (`alertDefaults`) et `PATCH /athletes/:id` (`alertOverrides`).

## 10. ChatModule

REST :

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| GET | `/conversations` | — | `zConversation[]` (coach : toutes ; athlète : la sienne) |
| GET | `/conversations/:id/messages` | `?cursor&limit=50` | `zPage<zMessage>` |
| POST | `/conversations/:id/messages` | `zMessageCreate` `{ type, text?, ref? }` | `zMessage` |
| POST | `/conversations/:id/read` | — | 204 |

WebSocket (`/ws`, auth par token) : serveur → `message.new`, `message.read`, `notification.new` ;
client → `typing`. Le mobile reçoit aussi les push (Expo) via NotificationModule.

## 11. ConnectionModule — montres et services

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| GET | `/me/connections` | — | `zConnection[]` (athlète — sans tokens) |
| GET | `/connections/:provider/authorize` | — | `{ url }` — OAuth du fournisseur |
| GET | `/connections/:provider/callback` | query provider | redirect app (deep link) |
| DELETE | `/me/connections/:provider` | — | 204 (révoque chez le fournisseur) |
| POST | `/me/connections/:provider/primary` | — | `zConnection[]` — bascule l'unique `isPrimaryPush` |
| POST | `/me/connections/:provider/sync` | — | 202 — resynchro manuelle |
| GET | `/team/connections` | — | `zTeamConnections` `{ kpis, providers: { provider, athleteCount, status }[], issues: zConnectionIssue[] }` — l'écran Intégrations coach |
| GET | `/team/watch-pushes` | `?status&from&to` | `zWatchPushJob[]` |
| POST | `/watch-pushes/:id/retry` | — | `zWatchPushJob` |

Webhooks entrants (publics, vérifiés par signature, idempotents via `webhook_events`) :
`POST /webhooks/garmin` · `/webhooks/strava` · `/webhooks/polar` · `/webhooks/coros` · `/webhooks/suunto` · `/webhooks/withings` · `/webhooks/stripe`.
Apple Santé n'a pas de webhook : l'app mobile pousse via `POST /me/health-samples` (`zHealthSamples`).

## 12. BillingModule

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| GET | `/billing` | — | `zBilling` `{ plan, status, athleteLimit, athleteCount, extraAthletes, trialEndsAt?, currentPeriodEnd?, amounts }` |
| POST | `/billing/checkout` | `{ plan: 'solo'\|'coach'\|'structure', interval: 'month'\|'year' }` | `{ url }` — Stripe Checkout |
| POST | `/billing/portal` | — | `{ url }` — Stripe Customer Portal (carte, factures, résiliation) |

Le webhook Stripe met à jour `teams.subscription` ; le compteur `extraAthletes` est reporté en usage-based à chaque période.

## 13. NotificationModule

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| GET | `/notifications` | `?kind&cursor` | `zPage<zNotification>` |
| POST | `/notifications/read` | `{ ids?: ObjectId[] }` | 204 (sans `ids` : tout) |
| POST | `/me/push-tokens` | `{ expoToken, platform }` | 204 |

## Jobs planifiés (`@nestjs/schedule`)

| Cron | Rôle |
|---|---|
| toutes les 5 min | dépiler `watch_push_jobs` échus (envoi la veille à 20 h locale, retries) |
| toutes les 15 min | pull fournisseurs sans webhook fiable (fallback), refresh des tokens proches d'expirer |
| horaire | recalcul des `athletes.snapshot` modifiés, évaluation des alertes santé (RHR/HRV/sommeil) |
| 02:00 locale équipe | marquer `missed` les séances de la veille sans réalisé, alertes `no_activity` / `no_checkin`, `usageCount` modèles |
| quotidien | rappel check-in (push athlète à `checkinReminder`), alertes `race_soon` |

## Ordre d'implémentation proposé (étape 2+)

1. Auth + Invite + Team/Groups (la boucle d'entrée) — c'est le module livré au squelette.
2. Athletes + Library + Planning + preview des allures/charges (shared).
3. Checkins + Alerts + dashboard coach.
4. Chat (WS) + Notifications.
5. Activities + streams + saisie manuelle (l'analyse s'enrichit connecteur par connecteur).
6. Connections : Strava + Polar d'abord (accès immédiat), Garmin/Coros/Suunto dès approbation.
7. Billing.
