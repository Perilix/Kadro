import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Athlete, Exercise, PlannedSessionDetail, RunBlock, RunStep } from '@kadro/shared';
import { formatPace } from '@kadro/shared';
import { api } from '../../lib/api';
import { radius, useTheme } from '../../lib/theme';
import { Button, Card } from '../../lib/ui';

const KIND_LABELS: Record<RunStep['kind'], string> = {
  warmup: 'Échauffement',
  work: 'Travail',
  recovery: 'Récupération',
  cooldown: 'Retour au calme',
};

const STATUS_LABELS: Record<PlannedSessionDetail['status'], string> = {
  planned: 'Prévue',
  completed: 'Réalisée',
  missed: 'Manquée',
  canceled: 'Annulée',
};

function targetLabel(target: RunStep['target']): string {
  switch (target.type) {
    case 'vmaPct':
      return `${target.minPct}–${target.maxPct} % VMA`;
    case 'zone':
      return `Z${target.zone}`;
    case 'pace':
      return `${formatPace(target.minSecPerKm)}–${formatPace(target.maxSecPerKm)}`;
    case 'racePace':
      return target.race === '10k' ? 'Allure 10 km' : target.race === 'half' ? 'Allure semi' : 'Allure marathon';
    default:
      return 'Libre';
  }
}

function stepLabel(step: RunStep): string {
  const amount = step.durationSec != null ? `${Math.round(step.durationSec / 60)} min` : `${step.distanceM} m`;
  return `${KIND_LABELS[step.kind]} · ${amount} · ${targetLabel(step.target)}`;
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function CoachSessionScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<PlannedSessionDetail | null>(null);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveDate, setMoveDate] = useState(ymd(new Date()));
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      void (async () => {
        const detail = await api.get<PlannedSessionDetail>(`/sessions/${id}`).catch(() => null);
        setSession(detail);
        if (detail) {
          setMoveDate(detail.date);
          const [a, cat] = await Promise.all([
            api.get<Athlete>(`/athletes/${detail.athleteId}`).catch(() => null),
            detail.exercises?.length ? api.get<Exercise[]>('/exercises').catch(() => []) : Promise.resolve([]),
          ]);
          setAthlete(a);
          setCatalog(cat);
        }
      })();
    }, [id]),
  );

  const days = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = new Date(Date.now() + i * 86400000);
        return {
          value: ymd(d),
          label:
            i === 0 ? 'Auj.' : new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' }).format(d),
        };
      }),
    [],
  );

  const exerciseName = (exId: string) => catalog.find((e) => e.id === exId)?.name ?? 'Exercice';

  const move = async () => {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      await api.patch(`/sessions/${session.id}`, { date: moveDate });
      router.back();
    } catch {
      setError('Déplacement impossible. Réessayez.');
      setBusy(false);
    }
  };

  const remove = async (scope: 'one' | 'assignment') => {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      await api.delete(`/sessions/${session.id}?scope=${scope}`);
      router.back();
    } catch {
      setError('Suppression impossible. Réessayez.');
      setBusy(false);
    }
  };

  const chip = (label: string, on: boolean, onPress: () => void, key: string) => (
    <Pressable
      key={key}
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        height: 36,
        borderRadius: radius.control,
        justifyContent: 'center',
        backgroundColor: on ? t.btnPrimaryBg : t.surface,
        borderWidth: 1,
        borderColor: on ? t.btnPrimaryBg : t.line,
      }}
    >
      <Text style={{ color: on ? t.btnPrimaryInk : t.ink2, fontSize: 13, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );

  const renderBlock = (block: RunBlock, i: number) => {
    if ('count' in block && block.kind === 'repeat') {
      return (
        <View key={i} style={{ gap: 4, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: t.line }}>
          <Text style={{ color: t.accentInk, fontSize: 13, fontWeight: '600' }}>Répéter × {block.count}</Text>
          {block.children.map((step, j) => (
            <Text key={j} style={{ color: t.ink2, fontSize: 13.5, paddingLeft: 12 }}>
              {stepLabel(step)}
            </Text>
          ))}
        </View>
      );
    }
    return (
      <Text
        key={i}
        style={{ color: t.ink2, fontSize: 13.5, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: t.line }}
      >
        {stepLabel(block as RunStep)}
      </Text>
    );
  };

  const dateLabel = session
    ? new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
        new Date(`${session.date}T00:00:00Z`),
      )
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40, gap: 14 }}>
        <Pressable onPress={() => router.back()} style={{ paddingVertical: 6 }}>
          <Text style={{ color: t.ink2, fontSize: 14 }}>← Retour</Text>
        </Pressable>
        {session ? (
          <>
            <View>
              <Text style={{ color: t.ink, fontSize: 24, fontWeight: '600', letterSpacing: -0.4 }}>{session.name}</Text>
              <Text style={{ color: t.ink2, fontSize: 13.5, marginTop: 4 }}>
                {athlete ? `${athlete.firstName} ${athlete.lastName} · ` : ''}
                {dateLabel} · {STATUS_LABELS[session.status]}
              </Text>
              <Text style={{ color: t.ink3, fontSize: 12.5, marginTop: 2 }}>
                {session.type === 'run' ? 'Course' : 'Renfo'} · difficulté attendue {session.expectedDifficulty}/10
              </Text>
            </View>

            {session.blocks?.length ? (
              <Card>
                <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', marginBottom: 4 }}>Structure</Text>
                {session.blocks.map(renderBlock)}
              </Card>
            ) : null}

            {session.exercises?.length ? (
              <Card>
                <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', marginBottom: 4 }}>Exercices</Text>
                {session.exercises.map((e, i) => (
                  <View key={i} style={{ paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: t.line }}>
                    <Text style={{ color: t.ink, fontSize: 14, fontWeight: '500' }}>{exerciseName(e.exerciseId)}</Text>
                    <Text style={{ color: t.ink2, fontSize: 12.5, marginTop: 1 }}>
                      {e.sets} × {e.reps != null ? `${e.reps} reps` : `${e.durationSec} s`}
                      {e.load.type === 'pctRm'
                        ? ` · ${e.load.pct} % 1RM`
                        : e.load.type === 'absolute'
                          ? ` · ${e.load.kg} kg`
                          : ' · poids du corps'}
                      {` · repos ${e.restSec} s`}
                    </Text>
                  </View>
                ))}
              </Card>
            ) : null}

            {session.resolved &&
            ((session.resolved.paces?.length ?? 0) > 0 ||
              (session.resolved.loads?.length ?? 0) > 0 ||
              session.resolved.estLoadUa != null) ? (
              <Card>
                <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', marginBottom: 4 }}>
                  Individualisé pour {athlete ? athlete.firstName : "l'athlète"}
                </Text>
                {(session.resolved.paces ?? []).map((p, i) => (
                  <View
                    key={p.blockPath}
                    style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderTopWidth: i ? 1 : 0, borderTopColor: t.line }}
                  >
                    <Text style={{ color: t.ink2, fontSize: 13 }}>Bloc {p.blockPath}</Text>
                    <Text style={{ color: t.ink, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                      {formatPace(p.minSecPerKm)} – {formatPace(p.maxSecPerKm)}
                    </Text>
                  </View>
                ))}
                {(session.resolved.loads ?? []).map((l) => (
                  <View
                    key={l.exerciseId}
                    style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderTopWidth: 1, borderTopColor: t.line }}
                  >
                    <Text style={{ color: t.ink2, fontSize: 13 }}>{exerciseName(l.exerciseId)}</Text>
                    <Text style={{ color: t.ink, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{l.kg} kg</Text>
                  </View>
                ))}
                {session.resolved.estLoadUa != null ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderTopWidth: 1, borderTopColor: t.line }}>
                    <Text style={{ color: t.ink2, fontSize: 13 }}>Charge estimée</Text>
                    <Text style={{ color: t.ink, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                      {session.resolved.estLoadUa} UA
                    </Text>
                  </View>
                ) : null}
              </Card>
            ) : null}

            {session.instructions ? (
              <Card>
                <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', marginBottom: 6 }}>Consigne</Text>
                <Text style={{ color: t.ink2, fontSize: 13.5, lineHeight: 19 }}>{session.instructions}</Text>
              </Card>
            ) : null}

            {session.status === 'completed' && session.completedSessionId ? (
              <Button
                label="Voir le compte-rendu"
                onPress={() =>
                  router.push({ pathname: '/activite/[id]', params: { id: session.completedSessionId! } })
                }
              />
            ) : null}

            {session.status === 'planned' ? (
              <Card>
                <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', marginBottom: 10 }}>Déplacer</Text>
                {moveOpen ? (
                  <>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {days.map((d) => chip(d.label, moveDate === d.value, () => setMoveDate(d.value), d.value))}
                    </ScrollView>
                    <View style={{ marginTop: 12 }}>
                      <Button label="Confirmer le déplacement" onPress={() => void move()} disabled={busy || moveDate === session.date} />
                    </View>
                  </>
                ) : (
                  <Button label="Choisir une nouvelle date" ghost onPress={() => setMoveOpen(true)} />
                )}
              </Card>
            ) : null}

            {session.status === 'planned' ? (
              <Card>
                <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', marginBottom: 10 }}>Supprimer</Text>
                {deleteOpen ? (
                  <View style={{ gap: 10 }}>
                    <Text style={{ color: t.ink2, fontSize: 13 }}>
                      {session.assignmentId
                        ? 'Cette séance a été assignée à plusieurs athlètes.'
                        : 'La séance sera retirée du planning.'}
                    </Text>
                    <Button label="Supprimer cette séance" ghost onPress={() => void remove('one')} disabled={busy} />
                    {session.assignmentId ? (
                      <Button
                        label="Supprimer pour tous les athlètes"
                        ghost
                        onPress={() => void remove('assignment')}
                        disabled={busy}
                      />
                    ) : null}
                  </View>
                ) : (
                  <Button label="Supprimer la séance…" ghost onPress={() => setDeleteOpen(true)} />
                )}
              </Card>
            ) : null}

            {error ? <Text style={{ color: t.bad, fontSize: 13 }}>{error}</Text> : null}
          </>
        ) : (
          <Text style={{ color: t.ink2 }}>Chargement…</Text>
        )}
      </ScrollView>
    </View>
  );
}
