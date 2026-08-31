import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import type { InvitePreview } from '@kadro/shared';
import { ApiError, api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Button, Card, Input, Label } from '../lib/ui';

export default function RejoindreScreen() {
  const t = useTheme();
  const { join } = useAuth();
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vma, setVma] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkCode = async () => {
    setBusy(true);
    setError(null);
    try {
      setPreview(await api.get<InvitePreview>(`/invite/preview/${code.trim().toUpperCase()}`));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? 'Code inconnu. Vérifiez auprès de votre coach.'
          : 'Serveur injoignable — vérifiez votre connexion.',
      );
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const vmaValue = Number(vma.replace(',', '.'));
      await join({
        code: code.trim().toUpperCase(),
        account: {
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          locale: 'fr',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        profile: {
          vmaKmh: vma && !Number.isNaN(vmaValue) ? vmaValue : null,
          hrMaxBpm: null,
          weightKg: null,
          availableDays: [],
          sports: ['run'],
          injuriesNote: null,
        },
      });
      router.replace('/(tabs)/aujourdhui');
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === 'auth.email_taken'
          ? 'Un compte existe déjà avec cet e-mail.'
          : err instanceof ApiError && err.code === 'billing.athlete_limit_reached'
            ? "L'équipe de votre coach est complète — parlez-lui-en."
            : 'Inscription impossible. Vérifiez les champs.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
        <Card>
          <Text style={{ color: t.ink, fontSize: 24, fontWeight: '700', marginBottom: 8 }}>Rejoindre mon coach</Text>
          <Label>Code coach</Label>
          <Input
            value={code}
            onChangeText={setCode}
            placeholder="KDR-7K2M"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {!preview ? (
            <View style={{ marginTop: 16 }}>
              <Button label="Vérifier le code" onPress={() => void checkCode()} disabled={busy || code.trim().length < 8} />
            </View>
          ) : (
            <>
              <View
                style={{
                  backgroundColor: t.accentSoft,
                  borderRadius: 10,
                  padding: 12,
                  marginTop: 14,
                }}
              >
                <Text style={{ color: t.accentInk, fontWeight: '600' }}>{preview.coachName}</Text>
                <Text style={{ color: t.accentInk, fontSize: 13 }}>
                  {preview.teamName} · {preview.athleteCount} athlète{preview.athleteCount > 1 ? 's' : ''}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Label>Prénom</Label>
                  <Input value={firstName} onChangeText={setFirstName} />
                </View>
                <View style={{ flex: 1 }}>
                  <Label>Nom</Label>
                  <Input value={lastName} onChangeText={setLastName} />
                </View>
              </View>
              <Label>E-mail</Label>
              <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <Label>Mot de passe</Label>
              <Input value={password} onChangeText={setPassword} secureTextEntry />
              <Label>VMA (km/h, optionnel)</Label>
              <Input value={vma} onChangeText={setVma} placeholder="16,5" keyboardType="decimal-pad" />
              <View style={{ marginTop: 20 }}>
                <Button label="Rejoindre l'équipe" onPress={() => void submit()} disabled={busy} />
              </View>
            </>
          )}
          {error ? <Text style={{ color: t.bad, marginTop: 10, fontSize: 13 }}>{error}</Text> : null}
          <Link href="/connexion" asChild>
            <Text style={{ color: t.accentInk, textAlign: 'center', fontSize: 14, paddingVertical: 8, marginTop: 12 }}>
              J'ai déjà un compte — me connecter
            </Text>
          </Link>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
