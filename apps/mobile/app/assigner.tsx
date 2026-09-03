import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AthleteListItem, Page, SessionTemplate } from '@kadro/shared';
import { api } from '../lib/api';
import { radius, useTheme } from '../lib/theme';
import { Button, Card } from '../lib/ui';

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function AssignerScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { athleteId } = useLocalSearchParams<{ athleteId?: string }>();
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [roster, setRoster] = useState<AthleteListItem[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(athleteId ? [athleteId] : []));
  const [date, setDate] = useState(ymd(new Date()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const [tpls, r] = await Promise.all([
          api.get<SessionTemplate[]>('/templates').catch(() => []),
          api.get<Page<AthleteListItem>>('/athletes?limit=100&sort=name').catch(() => null),
        ]);
        setTemplates(tpls);
        setRoster(r?.items ?? []);
      })();
    }, []),
  );

  const days = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = new Date(Date.now() + i * 86400000);
        return {
          value: ymd(d),
          label:
            i === 0
              ? "Auj."
              : new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' }).format(d),
        };
      }),
    [],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await api.post('/sessions/assign', {
        session: { templateId },
        athleteIds: [...selected],
        date,
      });
      router.back();
    } catch {
      setError('Assignation impossible. Réessayez.');
    } finally {
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

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 120, gap: 14 }}>
        <Pressable onPress={() => router.back()} style={{ paddingVertical: 6 }}>
          <Text style={{ color: t.ink2, fontSize: 14 }}>← Annuler</Text>
        </Pressable>
        <Text style={{ color: t.ink, fontSize: 24, fontWeight: '600', letterSpacing: -0.4 }}>Assigner un modèle</Text>

        <Card>
          <Text style={{ color: t.ink2, fontSize: 12, fontWeight: '500', marginBottom: 8 }}>Modèle</Text>
          <View style={{ gap: 6 }}>
            {templates.map((tpl) => (
              <Pressable
                key={tpl.id}
                onPress={() => setTemplateId(tpl.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: 12,
                  borderRadius: radius.control,
                  backgroundColor: templateId === tpl.id ? t.accentSoft : t.surface,
                  borderWidth: 1,
                  borderColor: templateId === tpl.id ? t.accent : t.line,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: templateId === tpl.id ? t.accentInk : t.ink, fontSize: 14, fontWeight: '600' }}>
                    {tpl.name}
                  </Text>
                  <Text style={{ color: templateId === tpl.id ? t.accentInk : t.ink3, fontSize: 12, opacity: 0.85 }}>
                    {tpl.type === 'run' ? 'Course' : 'Renfo'} · difficulté {tpl.expectedDifficulty}/10
                  </Text>
                </View>
              </Pressable>
            ))}
            {templates.length === 0 ? (
              <View style={{ gap: 8 }}>
                <Text style={{ color: t.ink2, fontSize: 13 }}>Aucun modèle pour l'instant.</Text>
                <Pressable onPress={() => router.replace('/creer-seance')} style={{ paddingVertical: 4 }}>
                  <Text style={{ color: t.accentInk, fontSize: 13, fontWeight: '600' }}>Créer une séance →</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </Card>

        <Card>
          <Text style={{ color: t.ink2, fontSize: 12, fontWeight: '500', marginBottom: 8 }}>Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {days.map((d) => chip(d.label, date === d.value, () => setDate(d.value), d.value))}
          </ScrollView>
        </Card>

        <Card>
          <Text style={{ color: t.ink2, fontSize: 12, fontWeight: '500', marginBottom: 8 }}>
            Athlètes · {selected.size} sélectionné{selected.size > 1 ? 's' : ''}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {roster.map((a) => chip(`${a.firstName} ${a.lastName}`, selected.has(a.id), () => toggle(a.id), a.id))}
          </View>
        </Card>

        {error ? <Text style={{ color: t.bad, fontSize: 13 }}>{error}</Text> : null}
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: insets.bottom + 12, backgroundColor: t.bg }}>
        <Button
          label={`Assigner à ${selected.size} athlète${selected.size > 1 ? 's' : ''}`}
          onPress={() => void submit()}
          disabled={busy || !templateId || selected.size === 0}
        />
      </View>
    </View>
  );
}
