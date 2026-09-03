import { useCallback, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ActivityDetail, Conversation } from '@kadro/shared';
import { formatDuration, formatPace } from '@kadro/shared';
import { api } from '../../lib/api';
import { radius, useTheme } from '../../lib/theme';
import { Button, Card } from '../../lib/ui';

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Saisie manuelle',
  strava: 'Strava',
  polar: 'Polar',
  garmin: 'Garmin',
  coros: 'COROS',
  suunto: 'Suunto',
  apple: 'Apple Santé',
  wahoo: 'Wahoo',
  zwift: 'Zwift',
};

const SPORT_LABELS: Record<string, string> = {
  run: 'Course',
  trail: 'Trail',
  strength: 'Renfo',
  bike: 'Vélo',
  other: 'Autre',
};

export default function CoachActivityScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [failed, setFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      void api
        .get<ActivityDetail>(`/activities/${id}`)
        .then(setActivity)
        .catch(() => setFailed(true));
    }, [id]),
  );

  const reply = async () => {
    if (!activity) return;
    const convs = await api.get<Conversation[]>('/conversations').catch(() => [] as Conversation[]);
    const conv = convs.find((c) => c.athleteId === activity.athleteId);
    if (conv) router.push({ pathname: '/conversation/[id]', params: { id: conv.id, name: conv.name } });
    else router.push('/(coach)/messages');
  };

  const kpi = (value: string, caption: string) => (
    <View key={caption} style={{ flexBasis: '31%', flexGrow: 1, padding: 12, borderRadius: radius.control, backgroundColor: t.surface2 }}>
      <Text style={{ color: t.ink, fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{value}</Text>
      <Text style={{ color: t.ink3, fontSize: 11.5, marginTop: 2 }}>{caption}</Text>
    </View>
  );

  const dateLabel = (iso: string) =>
    new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 110, gap: 14 }}>
        <Pressable onPress={() => router.back()} style={{ paddingVertical: 6 }}>
          <Text style={{ color: t.ink2, fontSize: 14 }}>← Retour</Text>
        </Pressable>
        {activity ? (
          <>
            <View>
              <Text style={{ color: t.ink, fontSize: 24, fontWeight: '600', letterSpacing: -0.4 }}>
                {activity.name ?? (activity.sport === 'strength' ? 'Renfo libre' : 'Sortie libre')}
              </Text>
              <Text style={{ color: t.ink2, fontSize: 13, marginTop: 4 }}>
                {dateLabel(activity.startedAt)} · {SPORT_LABELS[activity.sport] ?? activity.sport} ·{' '}
                {SOURCE_LABELS[activity.source] ?? activity.source}
                {activity.deviceName ? ` · ${activity.deviceName}` : ''}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {kpi(formatDuration(activity.durationSec), 'Durée')}
              {activity.distanceM ? kpi(`${(activity.distanceM / 1000).toFixed(2)} km`, 'Distance') : null}
              {activity.avgPaceSecPerKm ? kpi(formatPace(activity.avgPaceSecPerKm), 'Allure moy.') : null}
              {activity.avgHrBpm
                ? kpi(`${activity.avgHrBpm} bpm`, `FC moy.${activity.maxHrBpm ? ` · max ${activity.maxHrBpm}` : ''}`)
                : null}
              {activity.elevGainM ? kpi(`${activity.elevGainM} m`, 'Dénivelé +') : null}
              {activity.loadUa != null ? kpi(`${activity.loadUa} UA`, 'Charge') : null}
            </View>

            <Card>
              <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', marginBottom: 8 }}>Ressenti de l'athlète</Text>
              {activity.feedback ? (
                <View style={{ gap: 8 }}>
                  {activity.feedback.rpe != null ? (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: t.ink2, fontSize: 13 }}>Difficulté ressentie</Text>
                      <Text style={{ color: t.ink, fontSize: 13.5, fontWeight: '600' }}>
                        {activity.feedback.rpe}/10
                        {activity.expectedDifficulty != null ? (
                          <Text style={{ color: t.ink3, fontWeight: '400' }}> · attendue {activity.expectedDifficulty}/10</Text>
                        ) : null}
                      </Text>
                    </View>
                  ) : null}
                  {activity.feedback.rpe != null &&
                  activity.expectedDifficulty != null &&
                  activity.feedback.rpe - activity.expectedDifficulty >= 2 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.warn }} />
                      <Text style={{ color: t.warn, fontSize: 12.5, fontWeight: '500' }}>Plus dur que prévu</Text>
                    </View>
                  ) : null}
                  {activity.feedback.feeling != null ? (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: t.ink2, fontSize: 13 }}>Sensation</Text>
                      <Text style={{ color: t.ink, fontSize: 13.5, fontWeight: '600' }}>{activity.feedback.feeling}/5</Text>
                    </View>
                  ) : null}
                  {activity.feedback.comment ? (
                    <Text style={{ color: t.ink, fontSize: 13.5, lineHeight: 19 }}>« {activity.feedback.comment} »</Text>
                  ) : null}
                </View>
              ) : (
                <Text style={{ color: t.ink2, fontSize: 13 }}>Pas encore de compte-rendu.</Text>
              )}
            </Card>

            {activity.comparison ? (
              <Card>
                <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', marginBottom: 8 }}>
                  Comparaison · même séance précédente
                </Text>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: t.ink2, fontSize: 13 }}>Date</Text>
                    <Text style={{ color: t.ink, fontSize: 13.5, fontWeight: '600' }}>
                      {activity.comparison.startedAt.slice(0, 10)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: t.ink2, fontSize: 13 }}>Durée</Text>
                    <Text style={{ color: t.ink, fontSize: 13.5, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                      {formatDuration(activity.comparison.durationSec)}
                      <Text style={{ color: t.ink3, fontWeight: '400' }}> vs {formatDuration(activity.durationSec)}</Text>
                    </Text>
                  </View>
                  {activity.comparison.avgPaceSecPerKm && activity.avgPaceSecPerKm ? (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: t.ink2, fontSize: 13 }}>Allure</Text>
                      <Text style={{ color: t.ink, fontSize: 13.5, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                        {formatPace(activity.comparison.avgPaceSecPerKm)}
                        <Text style={{ color: t.ink3, fontWeight: '400' }}> vs {formatPace(activity.avgPaceSecPerKm)}</Text>
                      </Text>
                    </View>
                  ) : null}
                  {activity.comparison.avgHrBpm && activity.avgHrBpm ? (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: t.ink2, fontSize: 13 }}>FC moyenne</Text>
                      <Text style={{ color: t.ink, fontSize: 13.5, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                        {activity.comparison.avgHrBpm}
                        <Text style={{ color: t.ink3, fontWeight: '400' }}> vs {activity.avgHrBpm} bpm</Text>
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Card>
            ) : null}

            {activity.strength ? (
              <Card>
                <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', marginBottom: 4 }}>Renfo · série par série</Text>
                {activity.strength.exercises.map((e, i) => (
                  <View key={`${e.exerciseId}-${i}`} style={{ paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: t.line }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                      <Text style={{ color: t.ink, fontSize: 14, fontWeight: '600', flexShrink: 1 }}>{e.name}</Text>
                      {e.prescribed ? (
                        <Text style={{ color: t.ink3, fontSize: 12 }}>
                          prescrit {e.prescribed.sets} × {e.prescribed.reps ?? '—'}
                          {e.prescribed.kg != null ? ` à ${e.prescribed.kg} kg` : ''}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {e.sets.map((set, j) => (
                        <View
                          key={j}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            paddingHorizontal: 10,
                            height: 26,
                            borderRadius: 999,
                            backgroundColor: set.done ? t.goodSoft : t.badSoft,
                          }}
                        >
                          <View style={{ width: 6, height: 6, borderRadius: 4, backgroundColor: set.done ? t.good : t.bad }} />
                          <Text
                            style={{
                              color: set.done ? t.good : t.bad,
                              fontSize: 12,
                              fontWeight: '500',
                              fontVariant: ['tabular-nums'],
                              textDecorationLine: set.done ? 'none' : 'line-through',
                            }}
                          >
                            {set.reps != null ? `${set.reps} reps` : `${set.durationSec} s`}
                            {set.kg != null ? ` · ${set.kg} kg` : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                    {e.note ? <Text style={{ color: t.warn, fontSize: 12.5, marginTop: 6 }}>Gêne signalée : {e.note}</Text> : null}
                  </View>
                ))}
                <Text style={{ color: t.ink2, fontSize: 13, marginTop: 8 }}>
                  Tonnage total :{' '}
                  <Text style={{ color: t.ink, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                    {activity.strength.tonnageKg} kg
                  </Text>
                </Text>
              </Card>
            ) : null}

            {activity.kmSplits?.length ? (
              <Card>
                <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', marginBottom: 4 }}>Splits</Text>
                <View style={{ flexDirection: 'row', paddingVertical: 6 }}>
                  <Text style={{ color: t.ink3, fontSize: 12, width: 44 }}>Km</Text>
                  <Text style={{ color: t.ink3, fontSize: 12, flex: 1 }}>Allure</Text>
                  <Text style={{ color: t.ink3, fontSize: 12, width: 60, textAlign: 'right' }}>FC</Text>
                </View>
                {activity.kmSplits.map((split) => (
                  <View key={split.km} style={{ flexDirection: 'row', paddingVertical: 7, borderTopWidth: 1, borderTopColor: t.line }}>
                    <Text style={{ color: t.ink2, fontSize: 13, width: 44, fontVariant: ['tabular-nums'] }}>{split.km}</Text>
                    <Text style={{ color: t.ink, fontSize: 13, flex: 1, fontWeight: '500', fontVariant: ['tabular-nums'] }}>
                      {formatPace(split.paceSecPerKm)}
                    </Text>
                    <Text style={{ color: t.ink2, fontSize: 13, width: 60, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
                      {split.avgHrBpm ?? '—'}
                    </Text>
                  </View>
                ))}
              </Card>
            ) : null}
          </>
        ) : (
          <Text style={{ color: t.ink2 }}>{failed ? 'Activité introuvable.' : 'Chargement…'}</Text>
        )}
      </ScrollView>
      {activity ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: insets.bottom + 12, backgroundColor: t.bg }}>
          <Button label="Répondre" onPress={() => void reply()} />
        </View>
      ) : null}
    </View>
  );
}
