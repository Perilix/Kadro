import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AthleteListItem, Page } from '@kadro/shared';
import { api } from '../../lib/api';
import { radius, useTheme } from '../../lib/theme';
import { Card, Input, StatusPill } from '../../lib/ui';

export default function CoachAthletesScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [roster, setRoster] = useState<AthleteListItem[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'attention'>('all');

  useFocusEffect(
    useCallback(() => {
      void api
        .get<Page<AthleteListItem>>('/athletes?limit=100&sort=form')
        .then((p) => setRoster(p.items))
        .catch(() => undefined);
    }, []),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roster.filter((a) => {
      if (filter === 'attention' && a.formStatus !== 'warn' && a.formStatus !== 'bad') return false;
      if (q && !`${a.firstName} ${a.lastName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [roster, query, filter]);

  const attention = roster.filter((a) => a.formStatus === 'warn' || a.formStatus === 'bad').length;

  const chip = (label: string, on: boolean, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      style={{
        height: 32,
        paddingHorizontal: 12,
        borderRadius: 999,
        justifyContent: 'center',
        backgroundColor: on ? t.btnPrimaryBg : t.surface,
        borderWidth: 1,
        borderColor: on ? t.btnPrimaryBg : t.line,
      }}
    >
      <Text style={{ color: on ? t.btnPrimaryInk : t.ink2, fontSize: 13, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, gap: 14 }}>
      <Text style={{ color: t.ink, fontSize: 28, fontWeight: '600', letterSpacing: -0.5 }}>Athlètes</Text>
      <Input value={query} onChangeText={setQuery} placeholder="Rechercher" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {chip(`Tous · ${roster.length}`, filter === 'all', () => setFilter('all'))}
        {chip(`À traiter · ${attention}`, filter === 'attention', () => setFilter('attention'))}
      </View>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.map((a, i) => (
          <Pressable
            key={a.id}
            onPress={() => router.push({ pathname: '/athlete/[id]', params: { id: a.id } })}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 66,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderTopWidth: i ? 1 : 0,
              borderTopColor: t.line,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600' }}>{a.firstName} {a.lastName}</Text>
              <Text style={{ color: t.ink2, fontSize: 12.5 }} numberOfLines={1}>
                {a.goalLabel ?? 'Sans objectif'}{a.nextSessionDate ? ` · prochaine ${a.nextSessionDate.slice(8)}/${a.nextSessionDate.slice(5, 7)}` : ''}
              </Text>
            </View>
            <StatusPill level={a.formStatus as 'good' | 'warn' | 'bad' | 'none'} />
          </Pressable>
        ))}
        {filtered.length === 0 ? (
          <Text style={{ color: t.ink2, fontSize: 13, padding: 16 }}>
            Aucun athlète. Partagez votre code d'équipe (onglet Plus).
          </Text>
        ) : null}
      </Card>
    </ScrollView>
  );
}
