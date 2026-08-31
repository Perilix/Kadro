import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AthleteListItem, Page, PlannedSession } from '@kadro/shared';
import { api } from '../../lib/api';
import { radius, useTheme } from '../../lib/theme';
import { IconArrow } from '../../lib/ui';

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

const DAY_NAMES = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

export default function CoachPlanningScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [weekStart, setWeekStart] = useState(mondayOf(new Date()));
  const [sessions, setSessions] = useState<PlannedSession[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());

  const load = useCallback(async (start: Date) => {
    const from = ymd(start);
    const to = ymd(addDays(start, 6));
    const [list, roster] = await Promise.all([
      api.get<PlannedSession[]>(`/sessions?from=${from}&to=${to}`).catch(() => []),
      api.get<Page<AthleteListItem>>('/athletes?limit=100').catch(() => null),
    ]);
    setSessions(list);
    setNames(new Map((roster?.items ?? []).map((a) => [a.id, `${a.firstName} ${a.lastName}`])));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(weekStart);
    }, [load, weekStart]),
  );

  const shift = (delta: number) => {
    const next = addDays(weekStart, delta * 7);
    setWeekStart(next);
  };

  const today = ymd(new Date());
  const done = sessions.filter((s) => s.status === 'completed').length;
  const weekLabel = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(weekStart);

  const chipColors = (s: PlannedSession, isToday: boolean) => {
    if (s.status === 'completed') return { bg: t.surface, border: t.line, ink: t.ink, dashed: false };
    if (s.status === 'missed') return { bg: t.badSoft, border: t.badSoft, ink: t.bad, dashed: false };
    if (isToday) return { bg: t.accentSoft, border: t.accent, ink: t.accentInk, dashed: false };
    return { bg: t.surface, border: t.lineStrong, ink: t.ink2, dashed: true };
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, gap: 12 }}>
      <Text style={{ color: t.ink, fontSize: 28, fontWeight: '600', letterSpacing: -0.5 }}>Planning</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable onPress={() => shift(-1)} style={{ width: 36, height: 36, borderRadius: radius.control, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' }}>
          <IconArrow dir="left" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600' }}>Semaine du {weekLabel}</Text>
          <Text style={{ color: t.ink3, fontSize: 12 }}>{done} / {sessions.length} réalisées</Text>
        </View>
        <Pressable onPress={() => shift(1)} style={{ width: 36, height: 36, borderRadius: radius.control, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' }}>
          <IconArrow dir="right" />
        </Pressable>
      </View>

      {DAY_NAMES.map((label, i) => {
        const date = ymd(addDays(weekStart, i));
        const isToday = date === today;
        const daySessions = sessions.filter((s) => s.date === date);
        return (
          <View key={date} style={{ flexDirection: 'row', gap: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.line }}>
            <View style={{ width: 40, alignItems: 'center', paddingTop: 4 }}>
              <Text style={{ color: isToday ? t.accentInk : t.ink3, fontSize: 11, fontWeight: '600' }}>{label}</Text>
              <Text style={{ color: isToday ? t.accentInk : t.ink, fontSize: 20, fontWeight: '600', marginTop: 2 }}>
                {Number(date.slice(8, 10))}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              {daySessions.map((s) => {
                const c = chipColors(s, isToday);
                return (
                  <View
                    key={s.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: c.bg,
                      borderWidth: 1,
                      borderColor: c.border,
                      borderStyle: c.dashed ? 'dashed' : 'solid',
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: c.ink, fontSize: 14, fontWeight: '600' }}>{s.name}</Text>
                      <Text style={{ color: c.ink, fontSize: 12, opacity: 0.8 }} numberOfLines={1}>
                        {names.get(s.athleteId) ?? ''}
                        {s.status === 'completed' ? ' · réalisée' : s.status === 'missed' ? ' · manquée' : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
              {daySessions.length === 0 ? (
                <View style={{ height: 42, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: t.line }}>
                  <Text style={{ color: t.ink3, fontSize: 13 }}>Repos</Text>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
