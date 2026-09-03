import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  AthleteListItem,
  Exercise,
  Page,
  RunBlock,
  RunStep,
  SessionTemplateCreate,
  StrengthItem,
} from '@kadro/shared';
import { zSessionTemplateCreate } from '@kadro/shared';
import { api } from '../lib/api';
import { radius, useTheme } from '../lib/theme';
import { Button, Card, Input, Label } from '../lib/ui';

interface StepDraft {
  kind: 'warmup' | 'work' | 'recovery' | 'cooldown';
  mode: 'duration' | 'distance';
  durationMin: number;
  distanceM: number;
  targetType: 'vmaPct' | 'zone' | 'pace' | 'racePace' | 'free';
  minPct: number;
  maxPct: number;
  zone: number;
  minPace: string;
  maxPace: string;
  race: '10k' | 'half' | 'marathon';
}

interface BlockDraft {
  repeat: boolean;
  count: number;
  steps: StepDraft[];
}

interface ExerciseDraft {
  exerciseId: string;
  sets: number;
  mode: 'reps' | 'duration';
  reps: number;
  durationSec: number;
  loadType: 'pctRm' | 'absolute' | 'bodyweight';
  pct: number;
  kg: number;
  restSec: number;
}

const KIND_OPTIONS: [StepDraft['kind'], string][] = [
  ['warmup', 'Éch.'],
  ['work', 'Travail'],
  ['recovery', 'Récup.'],
  ['cooldown', 'Calme'],
];

const TARGET_OPTIONS: [StepDraft['targetType'], string][] = [
  ['vmaPct', '% VMA'],
  ['zone', 'Zone'],
  ['pace', 'Allure'],
  ['racePace', 'Course'],
  ['free', 'Libre'],
];

const RACE_OPTIONS: [StepDraft['race'], string][] = [
  ['10k', '10 km'],
  ['half', 'Semi'],
  ['marathon', 'Marathon'],
];

const CATEGORY_OPTIONS: [SessionTemplateCreate['category'], string][] = [
  ['endurance', 'Endurance'],
  ['vma', 'VMA'],
  ['threshold', 'Seuil'],
  ['race_pace', 'Allure course'],
  ['hills', 'Côtes'],
  ['strength', 'Renfo'],
  ['other', 'Autre'],
];

function newStep(kind: StepDraft['kind']): StepDraft {
  return {
    kind,
    mode: 'duration',
    durationMin: kind === 'warmup' ? 20 : kind === 'cooldown' ? 10 : 10,
    distanceM: 400,
    targetType: kind === 'work' ? 'vmaPct' : kind === 'recovery' ? 'free' : 'zone',
    minPct: 95,
    maxPct: 100,
    zone: 2,
    minPace: '',
    maxPace: '',
    race: '10k',
  };
}

function newBlock(repeat: boolean): BlockDraft {
  return { repeat, count: 10, steps: repeat ? [newStep('work'), newStep('recovery')] : [newStep('work')] };
}

function newExercise(exerciseId: string): ExerciseDraft {
  return { exerciseId, sets: 3, mode: 'reps', reps: 10, durationSec: 45, loadType: 'pctRm', pct: 70, kg: 40, restSec: 90 };
}

function parsePace(value: string): number | null {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function toStep(draft: StepDraft): RunStep | null {
  const durationSec = draft.mode === 'duration' ? Math.round(draft.durationMin * 60) : null;
  const distanceM = draft.mode === 'distance' ? draft.distanceM : null;
  if (!durationSec && !distanceM) return null;
  let target: RunStep['target'];
  switch (draft.targetType) {
    case 'vmaPct':
      target = { type: 'vmaPct', minPct: draft.minPct, maxPct: draft.maxPct };
      break;
    case 'zone':
      target = { type: 'zone', zone: draft.zone };
      break;
    case 'pace': {
      const min = parsePace(draft.minPace);
      const max = parsePace(draft.maxPace);
      if (min == null || max == null) return null;
      target = { type: 'pace', minSecPerKm: min, maxSecPerKm: max };
      break;
    }
    case 'racePace':
      target = { type: 'racePace', race: draft.race };
      break;
    default:
      target = { type: 'free' };
  }
  return { kind: draft.kind, durationSec, distanceM, target, note: null };
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function NumInput({ value, onChange, width = 60 }: { value: number; onChange: (n: number) => void; width?: number }) {
  const t = useTheme();
  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText((prev) => (Number(prev.replace(',', '.')) === value ? prev : String(value).replace('.', ',')));
  }, [value]);
  return (
    <TextInput
      keyboardType="decimal-pad"
      value={text}
      onChangeText={(v) => {
        setText(v);
        const n = Number(v.replace(',', '.'));
        if (Number.isFinite(n) && v.trim() !== '') onChange(n);
      }}
      style={{
        width,
        backgroundColor: t.surface,
        color: t.ink,
        borderColor: t.lineStrong,
        borderWidth: 1,
        borderRadius: radius.control,
        paddingHorizontal: 10,
        paddingVertical: 7,
        fontSize: 14,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
      }}
    />
  );
}

export default function CreerSeanceScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { athleteId } = useLocalSearchParams<{ athleteId?: string }>();

  const [type, setType] = useState<'run' | 'strength'>('run');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SessionTemplateCreate['category']>('endurance');
  const [difficulty, setDifficulty] = useState(5);
  const [instructions, setInstructions] = useState('');
  const [blocks, setBlocks] = useState<BlockDraft[]>([newBlock(false)]);
  const [exercises, setExercises] = useState<ExerciseDraft[]>([]);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [roster, setRoster] = useState<AthleteListItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(athleteId ? [athleteId] : []));
  const [date, setDate] = useState(ymd(new Date()));
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const [cat, r] = await Promise.all([
          api.get<Exercise[]>('/exercises').catch(() => []),
          api.get<Page<AthleteListItem>>('/athletes?limit=100&sort=name').catch(() => null),
        ]);
        setCatalog(cat);
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
            i === 0 ? 'Auj.' : new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' }).format(d),
        };
      }),
    [],
  );

  const pickerResults = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const pool = catalog.filter((e) => !e.archived);
    return (q ? pool.filter((e) => e.name.toLowerCase().includes(q)) : pool).slice(0, 25);
  }, [catalog, pickerQuery]);

  const exerciseName = (id: string) => catalog.find((e) => e.id === id)?.name ?? 'Exercice';

  const switchType = (next: 'run' | 'strength') => {
    setType(next);
    setError(null);
    if (next === 'strength' && category !== 'strength') setCategory('strength');
    if (next === 'run' && category === 'strength') setCategory('endurance');
  };

  const patchBlock = (bi: number, patch: Partial<BlockDraft>) =>
    setBlocks((list) => list.map((b, i) => (i === bi ? { ...b, ...patch } : b)));

  const patchStep = (bi: number, si: number, patch: Partial<StepDraft>) =>
    setBlocks((list) =>
      list.map((b, i) => (i === bi ? { ...b, steps: b.steps.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : b)),
    );

  const moveBlock = (bi: number, delta: number) =>
    setBlocks((list) => {
      const to = bi + delta;
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      const [item] = next.splice(bi, 1);
      next.splice(to, 0, item!);
      return next;
    });

  const patchExercise = (ei: number, patch: Partial<ExerciseDraft>) =>
    setExercises((list) => list.map((e, i) => (i === ei ? { ...e, ...patch } : e)));

  const moveExercise = (ei: number, delta: number) =>
    setExercises((list) => {
      const to = ei + delta;
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      const [item] = next.splice(ei, 1);
      next.splice(to, 0, item!);
      return next;
    });

  const toggleAthlete = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const buildDto = (): SessionTemplateCreate | null => {
    const base = {
      type,
      name: name.trim(),
      category,
      expectedDifficulty: difficulty,
      instructions: instructions.trim() || null,
      estDurationMin: null,
      estDistanceKm: null,
    };
    if (type === 'run') {
      if (blocks.length === 0) return null;
      const built: RunBlock[] = [];
      for (const draft of blocks) {
        const steps = draft.steps.map(toStep);
        if (steps.some((s) => s == null)) return null;
        if (draft.repeat) built.push({ kind: 'repeat', count: draft.count, children: steps as RunStep[] });
        else built.push((steps as RunStep[])[0]!);
      }
      return { ...base, blocks: built, exercises: null } as SessionTemplateCreate;
    }
    if (exercises.length === 0 || exercises.some((e) => !e.exerciseId)) return null;
    const items: StrengthItem[] = exercises.map((e, i) => ({
      exerciseId: e.exerciseId,
      order: i,
      sets: e.sets,
      reps: e.mode === 'reps' ? e.reps : null,
      durationSec: e.mode === 'duration' ? e.durationSec : null,
      perSide: false,
      load:
        e.loadType === 'pctRm'
          ? { type: 'pctRm', pct: e.pct }
          : e.loadType === 'absolute'
            ? { type: 'absolute', kg: e.kg }
            : { type: 'bodyweight' },
      restSec: e.restSec,
      supersetGroup: null,
      note: null,
    }));
    return { ...base, blocks: null, exercises: items } as SessionTemplateCreate;
  };

  const validated = (): SessionTemplateCreate | null => {
    setError(null);
    const dto = buildDto();
    if (!dto) {
      setError('Complétez la séance : chaque bloc a besoin d’une durée ou d’une distance, chaque exercice d’un choix.');
      return null;
    }
    const parsed = zSessionTemplateCreate.safeParse(dto);
    if (!parsed.success) {
      setError(name.trim() ? 'Séance incomplète — vérifiez les blocs et cibles.' : 'Donnez un nom à la séance.');
      return null;
    }
    return parsed.data;
  };

  const assign = async () => {
    const dto = validated();
    if (!dto || selected.size === 0) return;
    setBusy(true);
    try {
      await api.post('/sessions/assign', { session: dto, athleteIds: [...selected], date, saveAsTemplate });
      router.back();
    } catch {
      setError('Assignation impossible. Réessayez.');
    } finally {
      setBusy(false);
    }
  };

  const saveTemplateOnly = async () => {
    const dto = validated();
    if (!dto) return;
    setBusy(true);
    try {
      await api.post('/templates', dto);
      router.back();
    } catch {
      setError('Enregistrement impossible. Réessayez.');
    } finally {
      setBusy(false);
    }
  };

  const chip = (label: string, on: boolean, onPress: () => void, key: string, small = false) => (
    <Pressable
      key={key}
      onPress={onPress}
      style={{
        paddingHorizontal: small ? 10 : 12,
        height: small ? 32 : 36,
        borderRadius: radius.control,
        justifyContent: 'center',
        backgroundColor: on ? t.btnPrimaryBg : t.surface,
        borderWidth: 1,
        borderColor: on ? t.btnPrimaryBg : t.line,
      }}
    >
      <Text style={{ color: on ? t.btnPrimaryInk : t.ink2, fontSize: small ? 12.5 : 13, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );

  const arrowBtn = (label: string, onPress: () => void, disabled: boolean) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 30,
        height: 30,
        borderRadius: radius.control,
        borderWidth: 1,
        borderColor: t.line,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Text style={{ color: t.ink2, fontSize: 14, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );

  const stepEditor = (block: BlockDraft, bi: number, step: StepDraft, si: number) => (
    <View key={si} style={{ gap: 8, paddingTop: si ? 10 : 0, borderTopWidth: si ? 1 : 0, borderTopColor: t.line }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {KIND_OPTIONS.map(([kind, label]) => chip(label, step.kind === kind, () => patchStep(bi, si, { kind }), kind, true))}
        {block.repeat && block.steps.length > 1 ? (
          <Pressable
            onPress={() => patchBlock(bi, { steps: block.steps.filter((_, j) => j !== si) })}
            style={{ marginLeft: 'auto', paddingHorizontal: 8, height: 32, justifyContent: 'center' }}
          >
            <Text style={{ color: t.bad, fontSize: 12.5, fontWeight: '500' }}>retirer</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {chip('Durée', step.mode === 'duration', () => patchStep(bi, si, { mode: 'duration' }), 'duration', true)}
        {chip('Distance', step.mode === 'distance', () => patchStep(bi, si, { mode: 'distance' }), 'distance', true)}
        {step.mode === 'duration' ? (
          <>
            <NumInput value={step.durationMin} onChange={(n) => patchStep(bi, si, { durationMin: n })} />
            <Text style={{ color: t.ink2, fontSize: 13 }}>min</Text>
          </>
        ) : (
          <>
            <NumInput value={step.distanceM} onChange={(n) => patchStep(bi, si, { distanceM: n })} width={72} />
            <Text style={{ color: t.ink2, fontSize: 13 }}>m</Text>
          </>
        )}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {TARGET_OPTIONS.map(([target, label]) =>
          chip(label, step.targetType === target, () => patchStep(bi, si, { targetType: target }), target, true),
        )}
      </View>
      {step.targetType === 'vmaPct' ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <NumInput value={step.minPct} onChange={(n) => patchStep(bi, si, { minPct: n })} />
          <Text style={{ color: t.ink2, fontSize: 13 }}>–</Text>
          <NumInput value={step.maxPct} onChange={(n) => patchStep(bi, si, { maxPct: n })} />
          <Text style={{ color: t.ink2, fontSize: 13 }}>% VMA</Text>
        </View>
      ) : null}
      {step.targetType === 'zone' ? (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[1, 2, 3, 4, 5].map((z) => chip(`Z${z}`, step.zone === z, () => patchStep(bi, si, { zone: z }), `z${z}`, true))}
        </View>
      ) : null}
      {step.targetType === 'pace' ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Input
            value={step.minPace}
            onChangeText={(v) => patchStep(bi, si, { minPace: v })}
            placeholder="4:10"
            style={{ width: 72, textAlign: 'center', paddingVertical: 7, fontSize: 14 }}
          />
          <Text style={{ color: t.ink2, fontSize: 13 }}>–</Text>
          <Input
            value={step.maxPace}
            onChangeText={(v) => patchStep(bi, si, { maxPace: v })}
            placeholder="4:20"
            style={{ width: 72, textAlign: 'center', paddingVertical: 7, fontSize: 14 }}
          />
          <Text style={{ color: t.ink2, fontSize: 13 }}>/km</Text>
        </View>
      ) : null}
      {step.targetType === 'racePace' ? (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {RACE_OPTIONS.map(([race, label]) => chip(label, step.race === race, () => patchStep(bi, si, { race }), race, true))}
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 140, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={{ paddingVertical: 6 }}>
          <Text style={{ color: t.ink2, fontSize: 14 }}>← Annuler</Text>
        </Pressable>
        <Text style={{ color: t.ink, fontSize: 24, fontWeight: '600', letterSpacing: -0.4 }}>Créer une séance</Text>

        <View style={{ flexDirection: 'row', gap: 6, padding: 4, borderRadius: radius.control, backgroundColor: t.surface2 }}>
          {(
            [
              ['run', 'Course'],
              ['strength', 'Muscu'],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => switchType(value)}
              style={{
                flex: 1,
                height: 36,
                borderRadius: radius.control - 2,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: type === value ? t.surface : 'transparent',
                borderWidth: type === value ? 1 : 0,
                borderColor: t.line,
              }}
            >
              <Text style={{ color: type === value ? t.ink : t.ink2, fontSize: 14, fontWeight: '600' }}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <Card>
          <Text style={{ color: t.ink2, fontSize: 12, fontWeight: '500', marginBottom: 6 }}>Nom de la séance</Text>
          <Input value={name} onChangeText={setName} placeholder={type === 'run' ? 'Seuil 3 × 8′' : 'Renfo bas du corps'} />
          <Label>Catégorie</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {CATEGORY_OPTIONS.map(([value, label]) => chip(label, category === value, () => setCategory(value), value))}
          </ScrollView>
          <Label>Difficulté attendue</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) =>
              chip(String(n), difficulty === n, () => setDifficulty(n), `d${n}`, true),
            )}
          </View>
        </Card>

        {type === 'run' ? (
          <>
            {blocks.map((block, bi) => (
              <Card key={bi} style={block.repeat ? { borderColor: t.accent } : undefined}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  {block.repeat ? (
                    <>
                      <Text style={{ color: t.accentInk, fontSize: 13, fontWeight: '600' }}>Répéter</Text>
                      <NumInput value={block.count} onChange={(n) => patchBlock(bi, { count: n })} width={52} />
                      <Text style={{ color: t.ink2, fontSize: 13 }}>fois</Text>
                    </>
                  ) : (
                    <Text style={{ color: t.ink, fontSize: 13, fontWeight: '600' }}>Bloc {bi + 1}</Text>
                  )}
                  <View style={{ flexDirection: 'row', gap: 6, marginLeft: 'auto' }}>
                    {arrowBtn('↑', () => moveBlock(bi, -1), bi === 0)}
                    {arrowBtn('↓', () => moveBlock(bi, 1), bi === blocks.length - 1)}
                    <Pressable
                      onPress={() => setBlocks((list) => list.filter((_, i) => i !== bi))}
                      style={{ height: 30, paddingHorizontal: 8, justifyContent: 'center' }}
                    >
                      <Text style={{ color: t.bad, fontSize: 12.5, fontWeight: '500' }}>retirer</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={{ gap: 10 }}>{block.steps.map((step, si) => stepEditor(block, bi, step, si))}</View>
                {block.repeat ? (
                  <Pressable
                    onPress={() => patchBlock(bi, { steps: [...block.steps, newStep('recovery')] })}
                    style={{ paddingTop: 12 }}
                  >
                    <Text style={{ color: t.accentInk, fontSize: 13, fontWeight: '500' }}>+ sous-bloc</Text>
                  </Pressable>
                ) : null}
              </Card>
            ))}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button label="+ Bloc" ghost onPress={() => setBlocks((list) => [...list, newBlock(false)])} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="+ Répétition" ghost onPress={() => setBlocks((list) => [...list, newBlock(true)])} />
              </View>
            </View>
          </>
        ) : (
          <>
            {exercises.map((item, ei) => (
              <Card key={ei}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Pressable
                    onPress={() => {
                      setPickerIndex(ei);
                      setPickerQuery('');
                    }}
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <Text style={{ color: item.exerciseId ? t.ink : t.ink3, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
                      {item.exerciseId ? exerciseName(item.exerciseId) : 'Choisir un exercice…'}
                    </Text>
                  </Pressable>
                  {arrowBtn('↑', () => moveExercise(ei, -1), ei === 0)}
                  {arrowBtn('↓', () => moveExercise(ei, 1), ei === exercises.length - 1)}
                  <Pressable
                    onPress={() => setExercises((list) => list.filter((_, i) => i !== ei))}
                    style={{ height: 30, paddingHorizontal: 8, justifyContent: 'center' }}
                  >
                    <Text style={{ color: t.bad, fontSize: 12.5, fontWeight: '500' }}>retirer</Text>
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  <NumInput value={item.sets} onChange={(n) => patchExercise(ei, { sets: n })} width={50} />
                  <Text style={{ color: t.ink2, fontSize: 13 }}>×</Text>
                  {chip('reps', item.mode === 'reps', () => patchExercise(ei, { mode: 'reps' }), 'reps', true)}
                  {chip('sec', item.mode === 'duration', () => patchExercise(ei, { mode: 'duration' }), 'sec', true)}
                  {item.mode === 'reps' ? (
                    <NumInput value={item.reps} onChange={(n) => patchExercise(ei, { reps: n })} width={50} />
                  ) : (
                    <NumInput value={item.durationSec} onChange={(n) => patchExercise(ei, { durationSec: n })} width={56} />
                  )}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 8 }}>
                  {chip('% 1RM', item.loadType === 'pctRm', () => patchExercise(ei, { loadType: 'pctRm' }), 'pctRm', true)}
                  {chip('kg', item.loadType === 'absolute', () => patchExercise(ei, { loadType: 'absolute' }), 'kg', true)}
                  {chip('Poids du corps', item.loadType === 'bodyweight', () => patchExercise(ei, { loadType: 'bodyweight' }), 'bw', true)}
                  {item.loadType === 'pctRm' ? (
                    <>
                      <NumInput value={item.pct} onChange={(n) => patchExercise(ei, { pct: n })} width={54} />
                      <Text style={{ color: t.ink2, fontSize: 13 }}>%</Text>
                    </>
                  ) : null}
                  {item.loadType === 'absolute' ? (
                    <>
                      <NumInput value={item.kg} onChange={(n) => patchExercise(ei, { kg: n })} width={58} />
                      <Text style={{ color: t.ink2, fontSize: 13 }}>kg</Text>
                    </>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 8 }}>
                  <Text style={{ color: t.ink2, fontSize: 13 }}>repos</Text>
                  <NumInput value={item.restSec} onChange={(n) => patchExercise(ei, { restSec: n })} width={58} />
                  <Text style={{ color: t.ink2, fontSize: 13 }}>s</Text>
                </View>
              </Card>
            ))}
            <Button
              label="+ Exercice"
              ghost
              onPress={() => {
                setPickerIndex(-1);
                setPickerQuery('');
              }}
            />
            {pickerIndex != null ? (
              <Card>
                <Text style={{ color: t.ink2, fontSize: 12, fontWeight: '500', marginBottom: 8 }}>
                  Bibliothèque · {catalog.filter((e) => !e.archived).length} exercices
                </Text>
                <Input value={pickerQuery} onChangeText={setPickerQuery} placeholder="Rechercher un exercice" autoFocus />
                <View style={{ marginTop: 8 }}>
                  {pickerResults.map((e, i) => (
                    <Pressable
                      key={e.id}
                      onPress={() => {
                        if (pickerIndex === -1) setExercises((list) => [...list, newExercise(e.id)]);
                        else patchExercise(pickerIndex, { exerciseId: e.id });
                        setPickerIndex(null);
                      }}
                      style={{ paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: t.line }}
                    >
                      <Text style={{ color: t.ink, fontSize: 14, fontWeight: '500' }}>{e.name}</Text>
                      {e.muscleGroups.length ? (
                        <Text style={{ color: t.ink3, fontSize: 12 }}>{e.muscleGroups.join(' · ')}</Text>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={() => setPickerIndex(null)} style={{ paddingTop: 10 }}>
                  <Text style={{ color: t.ink2, fontSize: 13 }}>Fermer</Text>
                </Pressable>
              </Card>
            ) : null}
          </>
        )}

        <Card>
          <Text style={{ color: t.ink2, fontSize: 12, fontWeight: '500', marginBottom: 6 }}>Consigne pour l'athlète</Text>
          <Input
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Tenir une allure régulière, finir plus facile que le premier bloc."
            multiline
            style={{ minHeight: 64, textAlignVertical: 'top' }}
          />
        </Card>

        <Card>
          <Text style={{ color: t.ink2, fontSize: 12, fontWeight: '500', marginBottom: 8 }}>Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {days.map((d) => chip(d.label, date === d.value, () => setDate(d.value), d.value))}
          </ScrollView>
        </Card>

        <Card>
          <Text style={{ color: t.ink2, fontSize: 12, fontWeight: '500', marginBottom: 8 }}>
            Assigner à · {selected.size} sélectionné{selected.size > 1 ? 's' : ''}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {roster.map((a) => chip(`${a.firstName} ${a.lastName}`, selected.has(a.id), () => toggleAthlete(a.id), a.id))}
          </View>
          <Text style={{ color: t.ink3, fontSize: 12.5, marginTop: 10 }}>
            Chaque athlète reçoit la séance convertie dans ses allures et charges, envoyée sur sa montre la veille à 20 h.
          </Text>
          <Pressable
            onPress={() => setSaveAsTemplate((v) => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: saveAsTemplate ? t.btnPrimaryBg : t.lineStrong,
                backgroundColor: saveAsTemplate ? t.btnPrimaryBg : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {saveAsTemplate ? <Text style={{ color: t.btnPrimaryInk, fontSize: 13, fontWeight: '700' }}>✓</Text> : null}
            </View>
            <Text style={{ color: t.ink, fontSize: 13.5 }}>Enregistrer aussi comme modèle</Text>
          </Pressable>
        </Card>

        <Button label="Enregistrer comme modèle seulement" ghost onPress={() => void saveTemplateOnly()} disabled={busy} />
        {error ? <Text style={{ color: t.bad, fontSize: 13 }}>{error}</Text> : null}
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: insets.bottom + 12, backgroundColor: t.bg }}>
        <Button
          label={
            selected.size === 0
              ? 'Assigner — choisissez des athlètes'
              : `Assigner à ${selected.size} athlète${selected.size > 1 ? 's' : ''} · ${new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00Z`))}`
          }
          onPress={() => void assign()}
          disabled={busy || selected.size === 0}
        />
      </View>
    </View>
  );
}
