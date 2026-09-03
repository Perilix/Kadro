import { useCallback, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Athlete, AthleteOverview, Conversation } from '@kadro/shared';
import { formatDuration } from '@kadro/shared';
import { api } from '../../lib/api';
import { radius, useTheme } from '../../lib/theme';
import { Button, Card, StatusPill } from '../../lib/ui';

export default function CoachAthleteScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [overview, setOverview] = useState<AthleteOverview | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      void (async () => {
        const [a, o] = await Promise.all([
          api.get<Athlete>(`/athletes/${id}`).catch(() => null),
          api.get<AthleteOverview>(`/athletes/${id}/overview`).catch(() => null),
        ]);
        setAthlete(a);
        setOverview(o);
      })();
    }, [id]),
  );

  const daysToRace = () => {
    const date = athlete?.goal?.date;
    if (!date) return null;
    return Math.max(0, Math.round((new Date(`${date}T00:00:00Z`).getTime() - Date.now()) / 86400000));
  };

  const checkins = new Map((overview?.checkins7d ?? []).map((c) => [c.date, c]));
  const days: { label: string; color: string }[] = [];
  const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86400000);
    const level = checkins.get(d.toISOString().slice(0, 10))?.level;
    days.push({
      label: dayNames[d.getUTCDay()] ?? '',
      color: level === 'good' ? t.good : level === 'warn' ? t.warn : level === 'bad' ? t.bad : t.neutralSoft,
    });
  }

  const last = (overview?.checkins7d ?? [])[overview?.checkins7d?.length ? overview.checkins7d.length - 1 : 0];

  const openConversation = async () => {
    const convs = await api.get<Conversation[]>('/conversations').catch(() => [] as Conversation[]);
    const conv = convs.find((c) => c.athleteId === id);
    if (conv) {
      router.push({ pathname: '/conversation/[id]', params: { id: conv.id, name: conv.name } });
    } else {
      router.push('/(coach)/messages');
    }
  };

  const monday = new Date();
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const todayYmd = new Date().toISOString().slice(0, 10);
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    const dYmd = d.toISOString().slice(0, 10);
    const session = (overview?.week ?? []).find((sx) => sx.date === dYmd);
    return { label, today: dYmd === todayYmd, session };
  });
  const weeks = overview?.loadByWeek ?? [];
  const maxLoad = Math.max(1, ...weeks.map((w) => w.loadUa));

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 110, gap: 14 }}>
        <Pressable onPress={() => router.back()} style={{ paddingVertical: 6 }}>
          <Text style={{ color: t.ink2, fontSize: 14 }}>← Retour</Text>
        </Pressable>
        {athlete ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.ink, fontSize: 22, fontWeight: '600', letterSpacing: -0.4 }}>
                  {athlete.firstName} {athlete.lastName}
                </Text>
                <Text style={{ color: t.ink2, fontSize: 13, marginTop: 3 }}>
                  {athlete.goal ? `${athlete.goal.label}${daysToRace() != null ? ` · J-${daysToRace()}` : ''}` : 'Sans objectif'}
                  {athlete.profile.vmaKmh != null ? ` · VMA ${String(athlete.profile.vmaKmh).replace('.', ',')}` : ''}
                </Text>
              </View>
            </View>

            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', flex: 1 }}>Forme</Text>
                <StatusPill level={athlete.snapshot.formStatus as 'good' | 'warn' | 'bad' | 'none'} />
              </View>
              <View style={{ flexDirection: 'row', gap: 4, marginBottom: 12 }}>
                {days.map((d, i) => (
                  <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: d.color }} />
                    <Text style={{ color: t.ink3, fontSize: 11 }}>{d.label}</Text>
                  </View>
                ))}
              </View>
              {last ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1, padding: 10, borderRadius: radius.control, backgroundColor: t.surface2 }}>
                    <Text style={{ color: t.ink3, fontSize: 11.5 }}>Ressenti</Text>
                    <Text style={{ color: t.ink, fontSize: 16, fontWeight: '600' }}>{last.feeling} / 5</Text>
                  </View>
                  <View style={{ flex: 1, padding: 10, borderRadius: radius.control, backgroundColor: t.surface2 }}>
                    <Text style={{ color: t.ink3, fontSize: 11.5 }}>Sommeil</Text>
                    <Text style={{ color: t.ink, fontSize: 16, fontWeight: '600' }}>
                      {last.sleepMin != null ? `${Math.floor(last.sleepMin / 60)} h ${String(last.sleepMin % 60).padStart(2, '0')}` : '—'}
                    </Text>
                  </View>
                  <View style={{ flex: 1, padding: 10, borderRadius: radius.control, backgroundColor: t.surface2 }}>
                    <Text style={{ color: t.ink3, fontSize: 11.5 }}>Courbatures</Text>
                    <Text style={{ color: t.ink, fontSize: 16, fontWeight: '600' }}>
                      {last.soreness != null ? `${last.soreness} / 5` : '—'}
                    </Text>
                  </View>
                </View>
              ) : null}
            </Card>

            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', flex: 1 }}>Cette semaine</Text>
                <Text style={{ color: t.ink3, fontSize: 12.5 }}>
                  {(overview?.week ?? []).filter((sx) => sx.status === 'completed').length} / {(overview?.week ?? []).length} réalisées
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {weekDays.map((d, i) => (
                  <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: d.today ? t.ink : t.ink3, fontSize: 11, fontWeight: d.today ? '600' : '400' }}>{d.label}</Text>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: d.session
                          ? d.session.status === 'completed'
                            ? t.surface
                            : d.session.status === 'missed'
                              ? t.badSoft
                              : d.today
                                ? t.accentSoft
                                : t.surface
                          : 'transparent',
                        borderWidth: 1,
                        borderColor: d.session
                          ? d.session.status === 'missed'
                            ? t.badSoft
                            : d.today && d.session.status === 'planned'
                              ? t.accent
                              : t.line
                          : t.line,
                        borderStyle: d.session && d.session.status === 'planned' && !d.today ? 'dashed' : 'solid',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '700',
                          color: d.session
                            ? d.session.status === 'completed'
                              ? t.good
                              : d.session.status === 'missed'
                                ? t.bad
                                : d.today
                                  ? t.accentInk
                                  : t.ink3
                            : t.lineStrong,
                        }}
                      >
                        {d.session ? (d.session.status === 'completed' ? '✓' : d.session.status === 'missed' ? '✕' : '·') : '·'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', flex: 1 }}>Charge · 8 sem.</Text>
                <Text style={{ color: t.ink3, fontSize: 12.5 }}>
                  ratio {athlete.snapshot.acuteChronicRatio != null ? String(athlete.snapshot.acuteChronicRatio).replace('.', ',') : '—'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 80 }}>
                {weeks.map((w, i) => (
                  <View key={w.week} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <View
                      style={{
                        width: '100%',
                        height: Math.max(2, (w.loadUa / maxLoad) * 70),
                        borderTopLeftRadius: 3,
                        borderTopRightRadius: 3,
                        backgroundColor: i === weeks.length - 1 ? t.accentSoft : t.accent,
                        borderWidth: i === weeks.length - 1 ? 1 : 0,
                        borderColor: t.accent,
                      }}
                    />
                  </View>
                ))}
              </View>
            </Card>

            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', padding: 14 }}>Dernières séances</Text>
              {(overview?.recentSessions ?? []).map((s) => (
                <View
                  key={s.id}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: t.line }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: t.ink, fontSize: 14, fontWeight: '500' }}>
                      {s.name ?? (s.sport === 'strength' ? 'Renfo libre' : 'Sortie libre')}
                    </Text>
                    <Text style={{ color: t.ink2, fontSize: 12.5 }}>
                      {formatDuration(s.durationSec)}
                      {s.distanceM ? ` · ${(s.distanceM / 1000).toFixed(1)} km` : ''}
                      {s.feedbackRpe != null ? ` · RPE ${s.feedbackRpe}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
              {(overview?.recentSessions ?? []).length === 0 ? (
                <Text style={{ color: t.ink2, fontSize: 13, padding: 14, paddingTop: 0 }}>Aucune activité pour l'instant.</Text>
              ) : null}
            </Card>
          </>
        ) : (
          <Text style={{ color: t.ink2 }}>Chargement…</Text>
        )}
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, padding: 16, paddingBottom: insets.bottom + 12, backgroundColor: t.bg }}>
        <View style={{ flex: 1 }}>
          <Button label="Message" ghost onPress={() => void openConversation()} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Planifier" onPress={() => router.push({ pathname: '/assigner', params: { athleteId: String(id) } })} />
        </View>
      </View>
    </View>
  );
}
