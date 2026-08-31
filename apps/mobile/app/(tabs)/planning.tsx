import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PlannedSession } from '@kadro/shared';
import { api } from '../../lib/api';
import { useTheme } from '../../lib/theme';
import { Card, StatusDot } from '../../lib/ui';

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function PlanningScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<PlannedSession[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const from = ymd(new Date());
        const to = ymd(new Date(Date.now() + 13 * 24 * 3600 * 1000));
        setSessions(await api.get<PlannedSession[]>(`/sessions?from=${from}&to=${to}`));
      })();
    }, []),
  );

  const byDate = new Map<string, PlannedSession[]>();
  for (const s of sessions ?? []) {
    byDate.set(s.date, [...(byDate.get(s.date) ?? []), s]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, gap: 12 }}>
      <Text style={{ color: t.ink, fontSize: 24, fontWeight: '700' }}>Planning</Text>
      {sessions == null ? (
        <Text style={{ color: t.ink2 }}>Chargement…</Text>
      ) : byDate.size === 0 ? (
        <Card>
          <Text style={{ color: t.ink2 }}>Rien de planifié sur les 14 prochains jours.</Text>
        </Card>
      ) : (
        [...byDate.entries()].map(([date, list]) => (
          <View key={date} style={{ gap: 8 }}>
            <Text style={{ color: t.ink2, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }}>
              {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(
                new Date(`${date}T12:00:00`),
              )}
            </Text>
            {list.map((s) => (
              <Card key={s.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600' }}>{s.name}</Text>
                  {s.status === 'completed' ? (
                    <StatusDot level="good" label="Réalisée" />
                  ) : s.status === 'missed' ? (
                    <StatusDot level="bad" label="Manquée" />
                  ) : (
                    <Text style={{ color: t.ink3, fontSize: 12 }}>{s.type === 'run' ? 'Course' : 'Renfo'}</Text>
                  )}
                </View>
              </Card>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}
