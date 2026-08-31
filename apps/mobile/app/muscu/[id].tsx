import { useCallback, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Exercise, PlannedSessionDetail } from '@kadro/shared';
import { api } from '../../lib/api';
import { radius, useTheme } from '../../lib/theme';
import { Button, Card } from '../../lib/ui';

interface SetDraft {
  reps: string;
  kg: string;
  done: boolean;
}

interface ExerciseDraft {
  exerciseId: string;
  name: string;
  prescribed: string;
  sets: SetDraft[];
}

export default function MuscuScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<PlannedSessionDetail | null>(null);
  const [drafts, setDrafts] = useState<ExerciseDraft[]>([]);
  const [durationMin, setDurationMin] = useState('45');
  const [sending, setSending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      void (async () => {
        const detail = await api.get<PlannedSessionDetail>(`/sessions/${id}`).catch(() => null);
        if (!detail?.exercises) return;
        setSession(detail);
        const catalog = await api.get<Exercise[]>('/exercises').catch(() => [] as Exercise[]);
        const nameById = new Map(catalog.map((e) => [e.id, e.name]));
        const loadById = new Map((detail.resolved?.loads ?? []).map((l) => [l.exerciseId, l.kg]));
        setDrafts(
          detail.exercises.map((e) => {
            const kg = e.load.type === 'absolute' ? e.load.kg : loadById.get(e.exerciseId);
            return {
              exerciseId: e.exerciseId,
              name: nameById.get(e.exerciseId) ?? 'Exercice',
              prescribed: `${e.sets} × ${e.reps ?? `${e.durationSec}″`}${kg != null ? ` à ${kg} kg` : e.load.type === 'bodyweight' ? ' au poids du corps' : ''}`,
              sets: Array.from({ length: e.sets }, () => ({
                reps: e.reps != null ? String(e.reps) : '',
                kg: kg != null ? String(kg) : '',
                done: false,
              })),
            };
          }),
        );
      })();
    }, [id]),
  );

  const patchSet = (ei: number, si: number, patch: Partial<SetDraft>) => {
    setDrafts((list) =>
      list.map((e, i) =>
        i === ei ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : e,
      ),
    );
  };

  const doneCount = drafts.reduce((sum, e) => sum + e.sets.filter((s) => s.done).length, 0);
  const totalSets = drafts.reduce((sum, e) => sum + e.sets.length, 0);

  const submit = async () => {
    if (!id) return;
    setSending(true);
    try {
      await api.post(`/sessions/${id}/complete-manual`, {
        durationSec: Math.max(60, Math.round(Number(durationMin || '45') * 60)),
        strength: drafts.map((e) => ({
          exerciseId: e.exerciseId,
          sets: e.sets.map((s) => ({
            reps: s.reps ? Number(s.reps) : null,
            kg: s.kg ? Number(s.kg) : null,
            durationSec: null,
            rpe: null,
            done: s.done,
          })),
        })),
      });
      router.back();
    } finally {
      setSending(false);
    }
  };

  const input = (value: string, onChange: (v: string) => void, ph: string) => (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={ph}
      placeholderTextColor={t.ink3}
      keyboardType="decimal-pad"
      style={{
        width: 64,
        height: 38,
        borderRadius: radius.control,
        borderWidth: 1,
        borderColor: t.lineStrong,
        backgroundColor: t.surface,
        color: t.ink,
        textAlign: 'center',
        fontSize: 14,
      }}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 120, gap: 14 }}>
        <Pressable onPress={() => router.back()} style={{ paddingVertical: 6 }}>
          <Text style={{ color: t.ink2, fontSize: 14 }}>← Retour</Text>
        </Pressable>
        <View>
          <Text style={{ color: t.ink, fontSize: 24, fontWeight: '600', letterSpacing: -0.4 }}>
            {session?.name ?? 'Séance renfo'}
          </Text>
          <Text style={{ color: t.ink2, fontSize: 13, marginTop: 4 }}>
            {doneCount} / {totalSets} séries validées
          </Text>
        </View>
        {drafts.map((e, ei) => (
          <Card key={e.exerciseId + ei}>
            <Text style={{ color: t.ink, fontSize: 16, fontWeight: '600' }}>{e.name}</Text>
            <Text style={{ color: t.ink2, fontSize: 12.5, marginTop: 2, marginBottom: 10 }}>Prescrit : {e.prescribed}</Text>
            {e.sets.map((s, si) => (
              <View
                key={si}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: t.line }}
              >
                <Text style={{ color: t.ink3, fontSize: 13, width: 50 }}>Série {si + 1}</Text>
                {input(s.reps, (v) => patchSet(ei, si, { reps: v }), 'reps')}
                <Text style={{ color: t.ink3, fontSize: 13 }}>×</Text>
                {input(s.kg, (v) => patchSet(ei, si, { kg: v }), 'kg')}
                <Text style={{ color: t.ink3, fontSize: 13 }}>kg</Text>
                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={() => patchSet(ei, si, { done: !s.done })}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.control,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: s.done ? t.good : t.surface,
                    borderWidth: 1,
                    borderColor: s.done ? t.good : t.lineStrong,
                  }}
                >
                  <Text style={{ color: s.done ? '#fff' : t.ink3, fontSize: 16, fontWeight: '700' }}>✓</Text>
                </Pressable>
              </View>
            ))}
          </Card>
        ))}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ color: t.ink, fontSize: 14, fontWeight: '500', flex: 1 }}>Durée totale</Text>
            {input(durationMin, setDurationMin, '45')}
            <Text style={{ color: t.ink3, fontSize: 13 }}>min</Text>
          </View>
        </Card>
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: insets.bottom + 12, backgroundColor: t.bg }}>
        <Button label="Terminer la séance" onPress={() => void submit()} disabled={sending || doneCount === 0} />
      </View>
    </View>
  );
}
