import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CheckinToday, PlannedSession, PlannedSessionDetail } from '@kadro/shared';
import { formatPace } from '@kadro/shared';
import { api } from '../../lib/api';
import { radius, useTheme } from '../../lib/theme';
import { Button, Card, Input, StatusDot } from '../../lib/ui';

const FEELINGS: [number, string][] = [
  [1, 'Épuisé·e'],
  [2, 'Fatigué·e'],
  [3, 'Moyen'],
  [4, 'Bien'],
  [5, 'Au top'],
];

const LEVEL_LABELS: Record<string, string> = { good: 'En forme', warn: 'À surveiller', bad: 'Signal rouge' };

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AujourdhuiScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [checkin, setCheckin] = useState<CheckinToday | null>(null);
  const [session, setSession] = useState<PlannedSessionDetail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [durationMin, setDurationMin] = useState('');
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async () => {
    const today = todayYmd();
    const [checkinToday, sessions] = await Promise.all([
      api.get<CheckinToday>('/me/checkin-today'),
      api.get<PlannedSession[]>(`/sessions?from=${today}&to=${today}`),
    ]);
    setCheckin(checkinToday);
    setSession(sessions[0] ? await api.get<PlannedSessionDetail>(`/sessions/${sessions[0].id}`) : null);
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
      <Text style={{ color: t.ink, fontSize: 24, fontWeight: '700', textTransform: 'capitalize' }}>{dateLabel}</Text>

      <Card>
        <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', marginBottom: 10 }}>Comment ça va ce matin ?</Text>
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
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderRadius: radius.control,
                  borderWidth: 1,
                  borderColor: t.lineStrong,
                  backgroundColor: pressed ? t.neutralSoft : t.surface,
                })}
              >
                <Text style={{ color: t.ink, fontSize: 16, fontWeight: '700' }}>{value}</Text>
                <Text style={{ color: t.ink2, fontSize: 10, marginTop: 2 }}>{label}</Text>
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
