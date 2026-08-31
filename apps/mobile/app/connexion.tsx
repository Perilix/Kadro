import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Button, Card, Input, Label } from '../lib/ui';

export default function ConnexionScreen() {
  const t = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/aujourdhui');
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === 'auth.invalid_credentials'
          ? 'E-mail ou mot de passe incorrect.'
          : 'Connexion impossible. Réessayez.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
        <Card>
          <Text style={{ color: t.ink, fontSize: 20, fontWeight: '700', marginBottom: 4 }}>Kadro</Text>
          <Text style={{ color: t.ink, fontSize: 24, fontWeight: '700', marginBottom: 8 }}>Connexion</Text>
          <Label>E-mail</Label>
          <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Label>Mot de passe</Label>
          <Input value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
          {error ? <Text style={{ color: t.bad, marginTop: 10, fontSize: 13 }}>{error}</Text> : null}
          <View style={{ marginTop: 20, gap: 10 }}>
            <Button label="Se connecter" onPress={() => void submit()} disabled={busy} />
            <Link href="/rejoindre" asChild>
              <Text style={{ color: t.accentInk, textAlign: 'center', fontSize: 14, paddingVertical: 8 }}>
                J'ai un code coach — rejoindre une équipe
              </Text>
            </Link>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
