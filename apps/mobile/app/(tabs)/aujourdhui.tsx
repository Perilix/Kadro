import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ActivityDetail, CheckinToday, PlannedSession, PlannedSessionDetail } from '@kadro/shared';
import { formatPace } from '@kadro/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { radius, useTheme } from '../../lib/theme';
import { Button, Card, Input, StatusDot } from '../../lib/ui';

const FEELINGS: [number, string][] = [
  [1, 'Épuisé·e'],
  [2, 'Fatigué·e'],
  [3, 'Correct'],
  [4, 'Bien'],
  [5, 'Au top'],
];

const EFFORTS: [number, string][] = [
  [1, 'Très facile'],
  [2, 'Facile'],
  [3, 'Correct'],
  [4, 'Dur'],
  [5, 'Très dur'],
];

const LEVEL_LABELS: Record<string, string> = { good: 'En forme', warn: 'À surveiller', bad: 'Signal rouge' };

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AujourdhuiScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [checkin, setCheckin] = useState<CheckinToday | null>(null);
  const [session, setSession] = useState<PlannedSessionDetail | null>(null);
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [durationMin, setDurationMin] = useState('');
  const [completing, setCompleting] = useState(false);
  const [rpe, setRpe] = useState<number | null>(null);
  const [feeling, setFeeling] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const load = useCallback(async () => {
    const today = todayYmd();
    const [checkinToday, sessions] = await Promise.all([
      api.get<CheckinToday>('/me/checkin-today'),
      api.get<PlannedSession[]>(`/sessions?from=${today}&to=${today}`),
    ]);
    setCheckin(checkinToday);
    const detail = sessions[0]
      ? await api.get<PlannedSessionDetail>(`/sessions/${sessions[0].id}`)
      : null;
    setSession(detail);
    setActivity(
      detail?.completedSessionId
        ? await api.get<ActivityDetail>(`/activities/${detail.completedSessionId}`).catch(() => null)
        : null,
    );
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const submitCheckin = async (feeling: number) => {
    await api.post(`/checkins`, { date: todayYmd(), feeling });
    await load();
  };

  const markDone = async () => {
    if (!session) return;
    const minutes = Number(durationMin);
    if (!minutes || minutes < 1) return;
    setCompleting(true);
    try {
      await api.post(`/sessions/${session.id}/complete-manual`, { durationSec: Math.round(minutes * 60) });
      setDurationMin('');
      await load();
    } finally {
      setCompleting(false);
    }
  };

  const sendFeedback = async () => {
    if (!activity || rpe == null || feeling == null) return;
    setSendingFeedback(true);
    try {
      await api.post(`/activities/${activity.id}/feedback`, {
        rpe,
        feeling,
        comment: comment.trim() || null,
      });
      setRpe(null);
      setFeeling(null);
      setComment('');
      await load();
    } finally {
      setSendingFeedback(false);
    }
  };

  const dateLabel = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(),
  );

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, gap: 14 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load().finally(() => setRefreshing(false));
          }}
        />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.ink3, fontSize: 13, textTransform: 'capitalize' }}>{dateLabel}</Text>
          <Text style={{ color: t.ink, fontSize: 28, fontWeight: '600', letterSpacing: -0.5, marginTop: 2 }}>
            Bonjour {user?.firstName}
          </Text>
        </View>
      </View>

      <Card>
        <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600' }}>Comment tu te sens ce matin ?</Text>
        <Text style={{ color: t.ink2, fontSize: 13, marginTop: 2, marginBottom: 12 }}>Ton coach le voit avant ta séance.</Text>
        {checkin?.checkin ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <StatusDot level={checkin.checkin.level} label={LEVEL_LABELS[checkin.checkin.level] ?? ''} />
            <Text style={{ color: t.ink2, fontSize: 13 }}>Check-in envoyé · ressenti {checkin.checkin.feeling}/5</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {FEELINGS.map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => void submitCheckin(value)}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.control,
                  borderWidth: 1,
                  borderColor: t.line,
                  backgroundColor: pressed ? t.neutralSoft : t.surface,
                })}
              >
                <Text style={{ color: t.ink2, fontSize: 11, fontWeight: '500', textAlign: 'center' }}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </Card>

      {!loaded ? (
        <Card>
          <Text style={{ color: t.ink2 }}>Chargement…</Text>
        </Card>
      ) : session ? (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: t.ink, fontSize: 17, fontWeight: '700' }}>{session.name}</Text>
            <Text style={{ color: t.accentInk, fontSize: 12, fontWeight: '600' }}>
              difficulté {session.expectedDifficulty}/10
            </Text>
          </View>
          {session.instructions ? (
            <Text style={{ color: t.ink2, marginTop: 6, fontSize: 13, lineHeight: 19 }}>
              « {session.instructions} »
            </Text>
          ) : null}
          {session.resolved?.paces?.length ? (
            <View style={{ marginTop: 12, gap: 6 }}>
              {session.resolved.paces.map((p) => (
                <View key={p.blockPath} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: t.ink2, fontSize: 13 }}>Bloc {p.blockPath}</Text>
                  <Text style={{ color: t.ink, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                    {formatPace(p.minSecPerKm)} – {formatPace(p.maxSecPerKm)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          {session.resolved?.loads?.length ? (
            <View style={{ marginTop: 12, gap: 6 }}>
              {session.resolved.loads.map((l) => (
                <View key={l.exerciseId} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: t.ink2, fontSize: 13 }}>Charge de travail</Text>
                  <Text style={{ color: t.ink, fontSize: 13, fontWeight: '600' }}>{l.kg} kg</Text>
                </View>
              ))}
            </View>
          ) : null}
          {session.status === 'completed' ? (
            <View style={{ marginTop: 14 }}>
              <StatusDot level="good" label="Réalisée" />
              {activity && !activity.feedback ? (
                <View style={{ marginTop: 14, gap: 10 }}>
                  <Text style={{ color: t.ink, fontSize: 14, fontWeight: '600' }}>
                    C'était comment ? (difficulté sur 10)
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <Pressable
                        key={n}
                        onPress={() => setRpe(n)}
                        style={{
                          width: 34,
                          height: 34,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: radius.control,
                          borderWidth: 1,
                          borderColor: rpe === n ? t.accent : t.lineStrong,
                          backgroundColor: rpe === n ? t.accentSoft : t.surface,
                        }}
                      >
                        <Text style={{ color: rpe === n ? t.accentInk : t.ink, fontWeight: '600' }}>{n}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={{ color: t.ink, fontSize: 14, fontWeight: '600' }}>Sensations</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {EFFORTS.map(([value, label]) => (
                      <Pressable
                        key={value}
                        onPress={() => setFeeling(value)}
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          paddingVertical: 8,
                          borderRadius: radius.control,
                          borderWidth: 1,
                          borderColor: feeling === value ? t.accent : t.lineStrong,
                          backgroundColor: feeling === value ? t.accentSoft : t.surface,
                        }}
                      >
                        <Text style={{ color: feeling === value ? t.accentInk : t.ink2, fontSize: 10 }}>{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Input
                    value={comment}
                    onChangeText={setComment}
                    placeholder="Un mot pour votre coach (optionnel)"
                  />
                  <Button
                    label="Envoyer mon compte-rendu"
                    onPress={() => void sendFeedback()}
                    disabled={sendingFeedback || rpe == null || feeling == null}
                  />
                </View>
              ) : activity?.feedback ? (
                <Text style={{ color: t.ink2, fontSize: 13, marginTop: 8 }}>
                  Compte-rendu envoyé — difficulté {activity.feedback.rpe}/10
                  {session.expectedDifficulty != null ? ` (attendue ${session.expectedDifficulty}/10)` : ''}
                </Text>
              ) : null}
            </View>
          ) : session.type === 'strength' ? (
            <View style={{ marginTop: 14, gap: 8 }}>
              <Button
                label="Enregistrer série par série"
                onPress={() => router.push({ pathname: '/muscu/[id]', params: { id: session.id } })}
              />
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Input
                  value={durationMin}
                  onChangeText={setDurationMin}
                  placeholder="Ou juste la durée (min)"
                  keyboardType="number-pad"
                  style={{ flex: 1 }}
                />
                <Button label="Marquer réalisée" ghost onPress={() => void markDone()} disabled={completing || !durationMin} />
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 14, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Input
                value={durationMin}
                onChangeText={setDurationMin}
                placeholder="Durée (min)"
                keyboardType="number-pad"
                style={{ flex: 1 }}
              />
              <Button label="Marquer réalisée" onPress={() => void markDone()} disabled={completing || !durationMin} />
            </View>
          )}
        </Card>
      ) : (
        <Card>
          <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600' }}>Repos aujourd'hui</Text>
          <Text style={{ color: t.ink2, fontSize: 13, marginTop: 4 }}>Aucune séance planifiée. Profitez-en.</Text>
        </Card>
      )}
    </ScrollView>
  );
}
