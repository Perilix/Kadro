import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { radius, useTheme } from './theme';

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const t = useTheme();
  return (
    <View
      style={[
        { backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: radius.card, padding: 16 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  ghost,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  ghost?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: ghost ? 'transparent' : t.btnPrimaryBg,
          borderColor: ghost ? t.lineStrong : 'transparent',
          borderWidth: ghost ? 1 : 0,
          borderRadius: radius.control,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text style={{ color: ghost ? t.ink : t.btnPrimaryInk, fontWeight: '600', fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.ink3}
      {...props}
      style={[
        {
          backgroundColor: t.surface,
          color: t.ink,
          borderColor: t.lineStrong,
          borderWidth: 1,
          borderRadius: radius.control,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 15,
        },
        props.style,
      ]}
    />
  );
}

export function Label({ children }: { children: string }) {
  const t = useTheme();
  return <Text style={{ color: t.ink2, fontSize: 13, fontWeight: '500', marginTop: 14, marginBottom: 6 }}>{children}</Text>;
}

export function IconArrow({ dir }: { dir: 'left' | 'right' }) {
  const t = useTheme();
  return (
    <Text style={{ color: t.ink2, fontSize: 18, fontWeight: '600', lineHeight: 20 }}>
      {dir === 'left' ? '‹' : '›'}
    </Text>
  );
}

export function StatusPill({ level }: { level: 'good' | 'warn' | 'bad' | 'none' }) {
  const t = useTheme();
  const map = {
    good: { label: 'Bonne forme', color: t.good, soft: t.goodSoft },
    warn: { label: 'À surveiller', color: t.warn, soft: t.warnSoft },
    bad: { label: 'Fatigue', color: t.bad, soft: t.badSoft },
    none: { label: 'Pas de check-in', color: t.ink3, soft: t.neutralSoft },
  }[level];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 26,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: map.soft,
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: map.color }} />
      <Text style={{ color: level === 'none' ? t.ink2 : map.color, fontSize: 12, fontWeight: '500' }}>
        {map.label}
      </Text>
    </View>
  );
}

export function StatusDot({ level, label }: { level: 'good' | 'warn' | 'bad' | 'none'; label: string }) {
  const t = useTheme();
  const color = level === 'good' ? t.good : level === 'warn' ? t.warn : level === 'bad' ? t.bad : t.ink3;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ color, fontSize: 13, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16 },
});
