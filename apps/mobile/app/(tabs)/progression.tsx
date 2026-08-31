import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Athlete, AthleteOverview, ExerciseStats, PaceTable } from '@kadro/shared';
import { formatPace } from '@kadro/shared';
import { api } from '../../lib/api';
import { radius, useTheme } from '../../lib/theme';
import { Card } from '../../lib/ui';

export default function ProgressionScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [overview, setOverview] = useState<AthleteOverview | null>(null);
  const [paces, setPaces] = useState<PaceTable | null>(null);
  const [strength, setStrength] = useState<ExerciseStats[]>([]);
  const [me, setMe] = useState<Athlete | null>(null);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const [o, p, s, m] = await Promise.all([
          api.get<AthleteOverview>('/me/overview?weeks=12').catch(() => null),
          api.get<PaceTable>('/me/paces').catch(() => null),
          api.get<ExerciseStats[]>('/me/strength-stats').catch(() => []),
          api.get<Athlete>('/me/profile').catch(() => null),
        ]);
        setOverview(o);
        setPaces(p);
        setStrength(s);
        setMe(m);
      })();
    }, []),
  );

  const weeks = overview?.loadByWeek ?? [];
  const maxVol = Math.max(1, ...weeks.map((w) => w.volumeKm));
  const currentVol = weeks[weeks.length - 1]?.volumeKm ?? 0;
  const rows = paces?.rows ?? [];
  const zones = [
    { tag: 'Z2', label: 'Endurance', row: rows.find((r) => r.key === 'easy'), color: t.ink3 },
    { tag: 'Seuil', label: 'Allure seuil', row: rows.find((r) => r.key === 'threshold'), color: t.ink2 },
    { tag: 'VMA', label: 'Intervalles', row: rows.find((r) => r.key === 'vma'), color: t.accent },
  ].filter((z) => z.row);

  const range = (row: { fastSecPerKm: number; slowSecPerKm: number }) =>
    `${formatPace(row.fastSecPerKm).replace(' /km', '')} – ${formatPace(row.slowSecPerKm)}`;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, gap: 14 }}>
      <Text style={{ color: t.ink, fontSize: 26, fontWeight: '600', letterSpacing: -0.5 }}>Progression</Text>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', flex: 1 }}>Volume hebdo</Text>
          <Text style={{ color: t.ink3, fontSize: 12 }}>12 semaines · km</Text>
        </View>
        <Text style={{ color: t.ink, fontSize: 26, fontWeight: '600', marginBottom: 10 }}>
          {String(currentVol).replace('.', ',')} km
          <Text style={{ fontSize: 13, fontWeight: '500', color: t.ink3 }}>  cette semaine</Text>
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 90 }}>
          {weeks.map((w, i) => (
            <View key={w.week} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <View
                style={{
                  width: '100%',
                  height: Math.max(2, (w.volumeKm / maxVol) * 80),
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

      {zones.length > 0 ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', flex: 1 }}>Mes allures</Text>
            <Text style={{ color: t.ink3, fontSize: 12 }}>
              VMA {paces?.vmaKmh != null ? String(paces.vmaKmh).replace('.', ',') : '—'}
            </Text>
          </View>
          {zones.map((z) => (
            <View
              key={z.tag}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: t.line }}
            >
              <View style={{ minWidth: 44, height: 22, borderRadius: 999, backgroundColor: z.color, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{z.tag}</Text>
              </View>
              <Text style={{ color: t.ink2, fontSize: 13, flex: 1 }}>{z.label}</Text>
              <Text style={{ color: t.ink, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{range(z.row!)}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {strength.length > 0 ? (
        <Card>
          <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', marginBottom: 6 }}>Mes charges</Text>
          {strength.map((s) => (
            <View
              key={s.exerciseId}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: t.line }}
            >
              <Text style={{ color: t.ink, fontSize: 14, fontWeight: '500', flex: 1 }}>{s.name}</Text>
              <Text style={{ color: t.ink, fontSize: 14, fontWeight: '600' }}>
                {s.est1RmKg != null ? `1RM ${s.est1RmKg} kg` : '—'}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {(me?.personalRecords ?? []).length > 0 ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(me?.personalRecords ?? []).slice(0, 3).map((r) => (
            <View key={r.distance} style={{ flex: 1, padding: 12, borderRadius: radius.control, backgroundColor: t.surface2 }}>
              <Text style={{ color: t.ink3, fontSize: 11.5 }}>{r.distance}</Text>
              <Text style={{ color: t.ink, fontSize: 17, fontWeight: '600' }}>{r.time}</Text>
              <Text style={{ color: t.ink3, fontSize: 11 }}>{r.when}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
