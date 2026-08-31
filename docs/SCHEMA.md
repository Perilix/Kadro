# Kadro — Schéma de données MongoDB (boucle v1)

Proposé le 30 août 2026, à valider avant toute ligne de code produit. Couvre la boucle centrale :
invitation par code → profil athlète + montre → séance (course / muscu) individualisée avec difficulté attendue →
envoi sur montre → réalisé → check-in de forme → alertes « À traiter » → analyse → chat → abonnement.

## Principes

- **Ids** : `ObjectId` partout. Les champs `*Id` sont des références (pas de populate profond : une requête par collection, agrégation côté API).
- **Dates** : `Date` (instant UTC) pour les événements ; **`string` `YYYY-MM-DD`** pour les notions de *jour calendaire dans le fuseau de l'athlète* (check-in, séance planifiée, métriques santé). C'est ce qui évite les bugs « séance du vendredi qui s'affiche jeudi ».
- **Multi-tenant** : l'entité payante est `teams` (1 coach en Solo/Coach, jusqu'à 3 en Structure). Presque toutes les collections portent `teamId`, indexé en tête.
- **Prescription vs réalisé** : la séance planifiée stocke la prescription **relative** (% VMA, % 1RM) *et* un instantané **résolu** par athlète (allures, kg) figé au moment de l'envoi — ce que l'athlète a vu ne doit pas changer rétroactivement si sa VMA change.
- **Champs dérivés** : les caches (forme, adhérence, ratio A/C, 1RM estimés, non-lus) sont marqués `// cache` : recalculables à tout moment par un job, jamais source de vérité.
- **i18n** : aucun texte généré par le système n'est stocké en français ; on stocke des clés + paramètres (`i18nKey`, `params`), le client (FR/DE/EN) traduit. Les textes saisis par les humains (consignes, messages) restent tels quels.
- **Flux seconde par seconde** : jamais dans `completed_sessions` — collection dédiée `activity_streams` (un doc par activité, colonnes en tableaux), voir §12.

---

## 1. `users` — comptes (coachs et athlètes)

```ts
{
  _id: ObjectId,
  email: string,                 // unique, lowercase
  passwordHash: string,          // argon2id
  role: 'coach' | 'athlete',     // v1 : un compte = un rôle (premium auto-coaché = v2)
  firstName: string,
  lastName: string,
  locale: 'fr' | 'de' | 'en',
  timezone: string,              // IANA, ex. 'Europe/Paris'
  notificationPrefs: {
    push: boolean, email: boolean,
    checkinReminder: string | null,   // 'HH:mm' local, athlète — ex. '07:30'
  },
  refreshTokenHash: string | null,
  createdAt: Date, lastLoginAt: Date | null,
}
```
Index : `{ email: 1 }` unique.

## 2. `teams` — l'espace de travail du coach (entité payante)

```ts
{
  _id: ObjectId,
  name: string,                  // 'Équipe de Marc'
  ownerId: ObjectId,             // -> users (coach)
  coachIds: ObjectId[],          // owner inclus ; ≤ coachLimit
  inviteCode: string,            // 'KDR-7K2M' — stable, unique, régénérable
  subscription: {
    plan: 'trial' | 'solo' | 'coach' | 'structure',
    status: 'trialing' | 'active' | 'past_due' | 'canceled',
    athleteLimit: number,        // 5 / 25 / 80 (trial : 25)
    coachLimit: number,          // 1 / 1 / 3
    interval: 'month' | 'year' | null,
    trialEndsAt: Date | null,
    currentPeriodEnd: Date | null,
    stripeCustomerId: string | null,
    stripeSubscriptionId: string | null,
    extraAthletes: number,       // cache — facturés 1,50 €/mois au-delà du palier
  },
  alertDefaults: AlertThresholds,        // §10 — défauts d'équipe, surchargés par athlète
  watchPush: {
    enabled: boolean,            // envoyer chaque séance sur la montre
    sendLocalTime: string,       // 'HH:mm' — la veille, défaut '20:00'
    resendOnUpdate: boolean,     // renvoyer si la séance est modifiée
    autoImportCompleted: boolean,
  },
  createdAt: Date,
}
```
Index : `{ inviteCode: 1 }` unique · `{ coachIds: 1 }`.

## 3. `invitations` — invitations e-mail nominatives

Le **code d'équipe** suffit pour rejoindre (flux principal). Cette collection ne trace que les
invitations envoyées par e-mail, pour l'écran « Invitations en attente · Relancer ».

```ts
{
  _id: ObjectId,
  teamId: ObjectId,
  email: string, name: string | null,      // 'Inès B.'
  status: 'pending' | 'accepted' | 'revoked',
  sentAt: Date, remindedAt: Date | null,
  acceptedByAthleteId: ObjectId | null, acceptedAt: Date | null,
}
```
Index : `{ teamId: 1, status: 1 }` · `{ teamId: 1, email: 1 }` unique.

## 4. `athletes` — l'athlète dans une équipe (profil sportif + caches de liste)

Sépare le compte (`users`) du dossier sportif. Toutes les listes coach lisent cette collection seule.

```ts
{
  _id: ObjectId,
  userId: ObjectId,              // -> users
  teamId: ObjectId,
  coachId: ObjectId,             // coach référent (Structure : un des coachIds)
  groupIds: ObjectId[],
  status: 'active' | 'archived',
  profile: {
    vmaKmh: number | null,       // null => cibles affichées en zones de ressenti
    vmaSource: 'declared' | 'test' | null, vmaUpdatedAt: Date | null,
    hrMaxBpm: number | null, hrRestBpm: number | null,
    weightKg: number | null,
    availableDays: number[],     // 0=lundi … 6=dimanche
    sports: ('run' | 'trail' | 'strength')[],
    injuriesNote: string | null, // déclaré à l'inscription — 'Périostite en 2025, guérie'
  },
  goal: {                        // objectif principal (v1 : un seul)
    label: string,               // 'Marathon de Paris'
    date: string | null,         // 'YYYY-MM-DD'
    targetTime: string | null,   // '3:15:00'
    referenceTime: string | null,// '3:31 (Nantes 2025)'
    planWeeks: number | null, currentPhase: 'general' | 'specific' | 'race' | 'taper' | null,
  } | null,
  personalRecords: { distance: '10k' | 'half' | 'marathon' | string, time: string, when: string }[],
  alertOverrides: Partial<AlertThresholds> | null,   // §10
  // ---- caches (recalculés par jobs, jamais saisis) ----
  snapshot: {
    formStatus: 'good' | 'warn' | 'bad' | 'none',    // dernier check-in + seuils
    formStatusSince: string | null,                  // 'YYYY-MM-DD' — pour « 2 j de suite »
    adherence7d: number | null, adherence28d: number | null,   // % séances réalisées
    load7dUa: number | null, acuteChronicRatio: number | null,
    volume7dKm: number | null, sleepAvg7dMin: number | null,
    lastActivityAt: Date | null, nextSessionDate: string | null,
    updatedAt: Date,
  },
  joinedAt: Date,
}
```
Index : `{ teamId: 1, status: 1 }` · `{ userId: 1 }` unique · `{ teamId: 1, 'snapshot.formStatus': 1 }`.

## 5. `groups` — groupes d'entraînement

```ts
{ _id: ObjectId, teamId: ObjectId, name: string, order: number, createdAt: Date }
```
Les membres vivent sur `athletes.groupIds`. Index : `{ teamId: 1 }`.

## 6. `exercises` — bibliothèque d'exercices de renfo

Globale (fournie par Kadro, `teamId: null`) + exercices propres à l'équipe.

```ts
{
  _id: ObjectId,
  teamId: ObjectId | null,       // null = catalogue Kadro (~142 exercices)
  nameKey: string | null,        // i18n pour le catalogue ; null pour un exo d'équipe
  name: string,                  // nom affiché (catalogue : nom FR par défaut)
  muscleGroups: string[],        // 'quadriceps', 'glutes', 'hamstrings', 'core'…
  equipment: string[],           // 'barbell', 'dumbbell', 'bodyweight', 'box'…
  loadType: 'weight' | 'bodyweight' | 'duration',  // kg / PDC / gainage 45″
  unilateral: boolean,
  archived: boolean,
}
```
Index : `{ teamId: 1, archived: 1 }` · text/`name` pour la recherche.

## 7. `session_templates` — bibliothèque de séances (modèles)

```ts
{
  _id: ObjectId,
  teamId: ObjectId, createdById: ObjectId,
  type: 'run' | 'strength',
  name: string,
  category: 'endurance' | 'vma' | 'threshold' | 'race_pace' | 'hills' | 'strength' | 'other',
  expectedDifficulty: number,    // 1–10 — comparée au RPE après séance
  instructions: string | null,   // consigne affichée à l'athlète
  estDurationMin: number | null, estDistanceKm: number | null,
  blocks: RunBlock[] | null,     // type 'run'
  exercises: StrengthItem[] | null,  // type 'strength'
  usageCount: number, lastUsedAt: Date | null,   // cache
  archived: boolean, createdAt: Date, updatedAt: Date,
}
```
Index : `{ teamId: 1, type: 1, archived: 1 }`.

### `RunBlock` — bloc de course (récursif, profondeur 2 max en v1)

```ts
type RunBlock =
  | {
      kind: 'warmup' | 'work' | 'recovery' | 'cooldown',
      durationSec: number | null, distanceM: number | null,   // l'un des deux
      target: RunTarget,
      note: string | null,       // 'trot lent + 3 lignes droites'
    }
  | { kind: 'repeat', count: number, children: RunBlock[] };  // '× 10'

type RunTarget =
  | { type: 'vmaPct', minPct: number, maxPct: number }        // 85–88 % VMA
  | { type: 'zone', zone: 1 | 2 | 3 | 4 | 5 }                 // Z1–Z5 (allure ou ressenti si pas de VMA)
  | { type: 'pace', minSecPerKm: number, maxSecPerKm: number }// allure absolue
  | { type: 'racePace', race: '10k' | 'half' | 'marathon' }
  | { type: 'free' };                                          // allure libre / marche
```

### `StrengthItem` — exercice prescrit

```ts
{
  exerciseId: ObjectId,
  order: number,
  sets: number,
  reps: number | null, durationSec: number | null, perSide: boolean,   // 3×12/jambe, gainage 45″
  load:
    | { type: 'pctRm', pct: number }         // 70 % du 1RM estimé -> kg par athlète
    | { type: 'absolute', kg: number }
    | { type: 'bodyweight' },
  restSec: number,
  supersetGroup: number | null,
  note: string | null,
}
```

## 8. `planned_sessions` — séances planifiées (1 doc par athlète et par assignation)

Un modèle assigné à 3 athlètes crée 3 documents (individualisation, statut et envoi montre par athlète),
reliés par `assignmentId` pour l'édition groupée.

```ts
{
  _id: ObjectId,
  teamId: ObjectId, athleteId: ObjectId, coachId: ObjectId,
  assignmentId: ObjectId | null, templateId: ObjectId | null,
  date: string,                  // 'YYYY-MM-DD' — jour local athlète
  type: 'run' | 'strength',
  name: string,
  category: SessionTemplate['category'],
  expectedDifficulty: number,    // 1–10
  instructions: string | null,   // « Le mot de Marc »
  blocks: RunBlock[] | null, exercises: StrengthItem[] | null,   // copie figée du modèle (modifiable ensuite)
  resolved: {                    // instantané individualisé, figé à l'envoi montre (ou 1re ouverture)
    vmaKmh: number | null, hrMaxBpm: number | null,
    paces: { blockPath: string, minSecPerKm: number, maxSecPerKm: number }[] | null,
    loads: { exerciseId: ObjectId, kg: number, rmSourceKg: number }[] | null,
    estLoadUa: number | null,    // charge estimée
    resolvedAt: Date,
  } | null,
  status: 'planned' | 'completed' | 'missed' | 'canceled',
  // 'missed' est posé par un job le lendemain si rien n'est venu s'y rattacher
  modification: { modifiedAt: Date, fromName: string } | null,   // « modifiée depuis Footing 45′ »
  watchPush: {                   // état résumé (l'historique vit dans watch_push_jobs)
    state: 'none' | 'scheduled' | 'sent' | 'failed',
    provider: Provider | null, sentAt: Date | null,
  },
  completedSessionId: ObjectId | null,
  createdAt: Date, updatedAt: Date,
}
```
Index : `{ athleteId: 1, date: 1 }` · `{ teamId: 1, date: 1 }` · `{ assignmentId: 1 }` ·
`{ status: 1, date: 1 }` (job « missed » + planificateur d'envoi).

## 9. `completed_sessions` — séances réalisées (résumé + analyse)

Une activité réalisée, rattachée ou non à une séance planifiée (activité libre). Tout ce que les écrans
d'analyse affichent **sans** le tracé fin : les courbes viennent de `activity_streams`.

```ts
{
  _id: ObjectId,
  teamId: ObjectId, athleteId: ObjectId,
  plannedSessionId: ObjectId | null,
  source: Provider | 'manual',   // 'garmin' | 'coros' | 'polar' | 'suunto' | 'apple' | 'wahoo' | 'strava' | 'zwift' | 'manual'
  externalId: string | null,     // id chez le fournisseur — dédoublonnage
  deviceName: string | null,     // 'Forerunner 265'
  sport: 'run' | 'trail' | 'strength' | 'bike' | 'other',
  startedAt: Date, timezone: string, durationSec: number,
  // ---- course ----
  distanceM: number | null, elevGainM: number | null, elevLossM: number | null,
  avgPaceSecPerKm: number | null, gapAvgPaceSecPerKm: number | null,   // allure ajustée pente (trail)
  avgHrBpm: number | null, maxHrBpm: number | null, avgCadenceSpm: number | null,
  ascentSpeedMPerH: number | null,
  hrZonesSec: [number, number, number, number, number] | null,   // temps par zone Z1–Z5
  laps: {                        // prévu vs réalisé rep par rep
    idx: number, kind: 'warmup' | 'work' | 'recovery' | 'cooldown' | 'lap',
    durationSec: number, distanceM: number | null,
    avgPaceSecPerKm: number | null, avgHrBpm: number | null, endHrBpm: number | null,
    targetDeltaSec: number | null,   // écart à la cible (rep) — null si pas de cible
  }[] | null,
  kmSplits: { km: number, paceSecPerKm: number, gapPaceSecPerKm: number | null,
              elevDeltaM: number | null, avgHrBpm: number | null }[] | null,
  bestEfforts: { label: string, valueSec: number, isRecord: boolean, note: string | null }[],
  // ---- muscu ----
  strength: {
    exercises: {
      exerciseId: ObjectId, name: string,          // nom figé
      prescribed: { sets: number, reps: number | null, kg: number | null } | null,
      sets: { reps: number | null, kg: number | null, durationSec: number | null,
              rpe: number | null, done: boolean }[],
      note: string | null,       // 'Gêne au tendon droit signalée ici'
    }[],
    tonnageKg: number,
  } | null,
  // ---- commun ----
  loadUa: number | null,         // charge de la séance (règle dans packages/shared)
  feedback: {                    // compte-rendu athlète
    rpe: number | null,          // 1–10, comparé à expectedDifficulty
    feeling: number | null,      // 1–5 (Très dur … Très facile / ressenti)
    comment: string | null, submittedAt: Date,
  } | null,
  hasStreams: boolean,
  syncedAt: Date, createdAt: Date,
}
```
Index : `{ athleteId: 1, startedAt: -1 }` · `{ teamId: 1, startedAt: -1 }` ·
`{ source: 1, externalId: 1 }` unique partiel (`externalId != null`) · `{ plannedSessionId: 1 }`.

## 10. `checkins` + `health_metrics` + `alerts` — forme et « À traiter »

### `checkins` — check-in du matin (3 tapes)

```ts
{
  _id: ObjectId,
  athleteId: ObjectId, teamId: ObjectId,
  date: string,                  // 'YYYY-MM-DD' local — un par jour
  feeling: 1 | 2 | 3 | 4 | 5,    // Épuisé·e → Au top (obligatoire)
  sleepMin: number | null,       // pré-rempli par la montre, ajustable
  soreness: 1|2|3|4|5 | null, fatigue: 1|2|3|4|5 | null, mood: 1|2|3|4|5 | null,
  comment: string | null,
  level: 'good' | 'warn' | 'bad',   // cache — dérivé de feeling (+ règles shared)
  submittedAt: Date, updatedAt: Date | null,
}
```
Index : `{ athleteId: 1, date: 1 }` unique · `{ teamId: 1, date: 1 }`.

### `health_metrics` — données quotidiennes de la montre / balance

```ts
{
  _id: ObjectId,
  athleteId: ObjectId,
  date: string,                  // 'YYYY-MM-DD'
  sleepMin: number | null, restingHrBpm: number | null,
  hrvRmssdMs: number | null, weightKg: number | null,
  sources: { sleep?: Provider, restingHr?: Provider, hrv?: Provider,
             weight?: Provider | 'manual' },
  syncedAt: Date,
}
```
Index : `{ athleteId: 1, date: 1 }` unique.

### `AlertThresholds` (shape partagée — `teams.alertDefaults`, surcharge `athletes.alertOverrides`)

```ts
{
  redFeelingStreakDays: number,      // défaut 2 — 'bad' N jours de suite
  missedSessionAlert: boolean,       // séance manquée
  noActivityDays: number,            // défaut 3
  noCheckinDays: number,             // défaut 7
  sleepLowMin: number, sleepLowDays: number,      // < 6 h sur 3 jours
  restingHrDeltaBpm: number,         // +5 bpm vs moyenne 4 sem.
  hrvDropPct: number,                // −20 % vs moyenne 4 sem.
  acuteChronicMax: number,           // 1.3
}
```

### `alerts` — lignes « À traiter »

Générées par le moteur de règles (job quotidien + à chaque check-in / synchro). Une alerte ouverte
par (athlète, type) — pas de doublons.

```ts
{
  _id: ObjectId,
  teamId: ObjectId, athleteId: ObjectId,
  kind: 'form_red_streak' | 'missed_session' | 'no_activity' | 'no_checkin'
      | 'sleep_low' | 'resting_hr_up' | 'hrv_drop' | 'acr_high'
      | 'race_soon' | 'no_watch' | 'watch_disconnected' | 'watch_push_failed',
  severity: 'info' | 'warn' | 'critical',
  i18nKey: string, params: Record<string, string | number>,
  // ex. key 'alert.form_red_streak', params { days: 2, sleep: '5 h 30', soreness: '4/5' }
  suggestedAction: 'adapt_session' | 'message' | 'validate_week' | 'resend_push' | 'remind' | null,
  refs: { plannedSessionId?: ObjectId, checkinId?: ObjectId },
  status: 'open' | 'resolved' | 'dismissed',
  createdAt: Date, resolvedAt: Date | null, resolvedById: ObjectId | null,
}
```
Index : `{ teamId: 1, status: 1, createdAt: -1 }` ·
`{ athleteId: 1, kind: 1 }` unique partiel (`status: 'open'`).

## 11. `conversations` + `messages` — chat

```ts
// conversations — un fil coach ↔ athlète
{
  _id: ObjectId,
  teamId: ObjectId, coachId: ObjectId, athleteId: ObjectId,
  lastMessageAt: Date, lastMessagePreview: string,      // cache
  unreadByCoach: number, unreadByAthlete: number,       // cache
}
// messages
{
  _id: ObjectId,
  conversationId: ObjectId, senderId: ObjectId,          // -> users
  type: 'text' | 'session_card' | 'template_card' | 'note_card',
  text: string | null,
  ref: { plannedSessionId?: ObjectId, completedSessionId?: ObjectId, templateId?: ObjectId } | null,
  sentAt: Date, readAt: Date | null,
}
```
Index : conversations `{ coachId: 1, lastMessageAt: -1 }`, `{ athleteId: 1 }`,
`{ teamId: 1, athleteId: 1, coachId: 1 }` unique · messages `{ conversationId: 1, sentAt: -1 }`.
Temps réel : gateway WebSocket (`message.new`, `message.read`, `typing`), REST en repli.

## 12. `activity_streams` — flux seconde par seconde (collection à part)

Un document par activité, **orienté colonnes** (tableaux parallèles échantillonnés à 1 Hz ou au pas du
fournisseur). Jamais chargé dans une liste ; servi décimé (~600 points) pour les graphes, complet sur demande.
Une sortie de 3 h ≈ 10 800 points × 7 séries ≈ bien sous la limite de 16 Mo.

```ts
{
  _id: ObjectId,                 // = completedSessionId (relation 1–1)
  athleteId: ObjectId,
  sampleCount: number,
  tSec: number[],                // offset depuis startedAt
  hrBpm: (number | null)[],
  speedMps: (number | null)[],   // l'allure se dérive ; GAP calculée et stockée pour le trail
  gapSpeedMps: (number | null)[] | null,
  altM: (number | null)[] | null,
  cadenceSpm: (number | null)[] | null,
  latLng: [number, number][] | null,    // v1 : stockée, pas encore de carte
  powerW: (number | null)[] | null,     // v2 (capteur vélo)
  createdAt: Date,
}
```
Les fichiers bruts (FIT/TCX) ne sont pas stockés en v1 (on garde le parsé) ; si besoin plus tard : stockage objet (S3), pas MongoDB.

## 13. `device_connections` — connecteurs montres & services (par athlète)

```ts
{
  _id: ObjectId,
  athleteId: ObjectId, teamId: ObjectId,
  provider: 'garmin' | 'coros' | 'polar' | 'suunto' | 'apple' | 'wahoo' | 'strava' | 'zwift' | 'withings',
  status: 'connected' | 'error' | 'revoked',
  externalUserId: string,
  accessTokenEnc: string, refreshTokenEnc: string | null,   // chiffrés (AES-GCM, clé env)
  tokenExpiresAt: Date | null, scopes: string[],
  capabilities: { pushWorkout: boolean, pullActivities: boolean,
                  pullSleep: boolean, pullHrv: boolean, pullWeight: boolean },
  isPrimaryPush: boolean,        // une seule montre reçoit les séances
  deviceName: string | null,     // 'Forerunner 265'
  lastSyncAt: Date | null, lastError: { at: Date, i18nKey: string } | null,
  connectedAt: Date,
}
```
Index : `{ athleteId: 1, provider: 1 }` unique · `{ teamId: 1, status: 1 }` ·
`{ athleteId: 1, isPrimaryPush: 1 }` unique partiel (`isPrimaryPush: true`).

## 14. `watch_push_jobs` — file et historique des envois sur montre

Alimentée à la planification (la veille à `team.watchPush.sendLocalTime`) et à chaque modification si
`resendOnUpdate`. Un cron `@nestjs/schedule` dépile `queued` dont l'échéance est passée.

```ts
{
  _id: ObjectId,
  plannedSessionId: ObjectId, athleteId: ObjectId, teamId: ObjectId,
  provider: Provider, format: 'fit_workout' | 'provider_json' | 'zwo',
  scheduledFor: Date,            // instant UTC calculé depuis le fuseau de l'athlète
  status: 'queued' | 'sent' | 'failed' | 'canceled' | 'superseded',
  attempts: number, sentAt: Date | null,
  externalWorkoutId: string | null,     // pour mettre à jour / supprimer chez le fournisseur
  error: { at: Date, i18nKey: string, raw: string } | null,
}
```
Index : `{ status: 1, scheduledFor: 1 }` · `{ plannedSessionId: 1 }`.

## 15. `tests` — historique VMA / 1RM / références

```ts
{
  _id: ObjectId,
  athleteId: ObjectId, teamId: ObjectId,
  kind: 'vma' | 'one_rm' | 'race_reference',
  date: string,                  // 'YYYY-MM-DD'
  vmaKmh: number | null,         // kind 'vma'
  oneRm: { exerciseId: ObjectId, kg: number,
           method: 'measured' | 'epley_estimated' } | null,   // kind 'one_rm'
  race: { distance: string, time: string, label: string } | null,
  source: 'manual' | 'session',  // saisi par le coach, ou déduit d'une séance
  note: string | null, createdAt: Date,
}
```
Index : `{ athleteId: 1, kind: 1, date: -1 }`.

## 16. `athlete_exercise_stats` — 1RM estimés et charges (cache)

Recalculé à chaque série validée (Epley dans `packages/shared`) et reconstructible depuis
`completed_sessions`. Alimente « Charges de travail par exercice » et l'individualisation % 1RM.

```ts
{
  _id: ObjectId,
  athleteId: ObjectId, exerciseId: ObjectId,
  est1RmKg: number | null, est1RmAt: Date | null,
  lastWorkingKg: number | null,
  weeklyMaxKg: { week: string, kg: number }[],   // 'YYYY-Www', fenêtre glissante ~16 sem.
  updatedAt: Date,
}
```
Index : `{ athleteId: 1, exerciseId: 1 }` unique.

## 17. `notes` — notes privées du coach sur un athlète

```ts
{
  _id: ObjectId,
  teamId: ObjectId, athleteId: ObjectId, authorId: ObjectId,
  date: string, text: string, createdAt: Date, updatedAt: Date | null,
}
```
Index : `{ athleteId: 1, date: -1 }`. Jamais exposées à l'athlète (garde au niveau API).

## 18. `notifications` — fil de notifications (coach mobile, push)

Fan-out à l'écriture depuis les événements (check-in rouge, séance terminée, message, nouvel athlète…).

```ts
{
  _id: ObjectId,
  userId: ObjectId,              // destinataire
  kind: 'form' | 'session' | 'message' | 'team' | 'billing',   // filtres de l'écran
  i18nKey: string, params: Record<string, string | number>,
  refs: { athleteId?: ObjectId, completedSessionId?: ObjectId,
          conversationId?: ObjectId, alertId?: ObjectId },
  readAt: Date | null, createdAt: Date,
}
```
Index : `{ userId: 1, createdAt: -1 }` · `{ userId: 1, readAt: 1 }`.

## 19. `webhook_events` — idempotence des webhooks entrants

Stripe, Garmin Push, Strava webhook… Un événement déjà vu n'est pas retraité.

```ts
{
  _id: ObjectId,
  provider: 'stripe' | Provider,
  externalEventId: string,
  receivedAt: Date, processedAt: Date | null,
  status: 'received' | 'processed' | 'failed', error: string | null,
}
```
Index : `{ provider: 1, externalEventId: 1 }` unique · TTL sur `receivedAt` (90 j).

---

## Ce qui est volontairement absent de la v1

- **Puissance / balance G-D / W′bal** : champ `powerW` réservé dans les streams, rien d'autre (v2).
- **Premium athlète auto-coaché** : `users.role` reste binaire ; aucun schéma « athlète sans équipe ».
- **Encaissement des athlètes par le coach** : la facturation ne concerne que `teams`.
- **Vidéos d'exercices** : `exercises` n'a pas de champ média (ajout non cassant plus tard).

## Règles métier dans `packages/shared` (pas dans la base)

`paceFromVma(vmaKmh, pct)` · `pacesForBlocks(blocks, profile)` · `epley1Rm(kg, reps)` ·
`loadFromPctRm(est1Rm, pct)` (arrondi au palier de 2,5 kg) · `sessionLoadUa(...)` (charge d'une séance) ·
`acuteChronicRatio(loads7d, loads28d)` · `checkinLevel(checkin)` · `evaluateAlerts(snapshot, thresholds)` ·
zones FC depuis `hrMaxBpm`. Les caches en base ne font qu'enregistrer le résultat de ces fonctions.
