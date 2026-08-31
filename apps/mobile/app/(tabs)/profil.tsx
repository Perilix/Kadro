import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Athlete, AuthorizeUrl, Connection } from '@kadro/shared';
import { ApiError, api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { Button, Card, StatusDot } from '../../lib/ui';

const PROVIDER_LABELS: Record<string, string> = {
  garmin: 'Garmin',
  coros: 'COROS',
  polar: 'Polar',
  suunto: 'Suunto',
  apple: 'Apple Santé',
  wahoo: 'Wahoo',
  strava: 'Strava',
  zwift: 'Zwift',
  withings: 'Withings',
};

export default function ProfilScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user, athlete, logout } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [me, setMe] = useState<Athlete | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [conns, profile] = await Promise.all([
      api.get<Connection[]>('/me/connections').catch(() => []),
      api.get<Athlete>('/me/profile').catch(() => null),
    ]);
    setConnections(conns);
    setMe(profile);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const connect = async (provider: string) => {
    setError(null);
    try {
      const { url } = await api.get<AuthorizeUrl>(`/connections/${provider}/authorize`);
      await Linking.openURL(url);
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === 'connection.provider_not_configured'
          ? `${PROVIDER_LABELS[provider]} n’est pas encore configuré côté serveur.`
          : `Connexion à ${PROVIDER_LABELS[provider]} impossible pour le moment.`,
      );
    }
  };

  const disconnect = async (provider: string) => {
    await api.delete(`/me/connections/${provider}`);
    await load();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, gap: 14 }}>
      <Text style={{ color: t.ink, fontSize: 24, fontWeight: '700' }}>Profil</Text>
      <Card>
        <Text style={{ color: t.ink, fontSize: 17, fontWeight: '700' }}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={{ color: t.ink2, fontSize: 13, marginTop: 4 }}>{user?.email}</Text>
        {athlete ? (
          <Text style={{ color: t.ink2, fontSize: 13, marginTop: 8 }}>Coaché·e par {athlete.coachName}</Text>
        ) : null}
      </Card>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: t.surface2 }}>
          <Text style={{ color: t.ink3, fontSize: 11.5 }}>VMA</Text>
          <Text style={{ color: t.ink, fontSize: 16, fontWeight: '600' }}>
            {me?.profile.vmaKmh != null ? String(me.profile.vmaKmh).replace('.', ',') + ' km/h' : '—'}
          </Text>
        </View>
        <View style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: t.surface2 }}>
          <Text style={{ color: t.ink3, fontSize: 11.5 }}>FC max</Text>
          <Text style={{ color: t.ink, fontSize: 16, fontWeight: '600' }}>{me?.profile.hrMaxBpm ?? '—'}</Text>
        </View>
        <View style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: t.surface2 }}>
          <Text style={{ color: t.ink3, fontSize: 11.5 }}>Poids</Text>
          <Text style={{ color: t.ink, fontSize: 16, fontWeight: '600' }}>
            {me?.profile.weightKg != null ? me.profile.weightKg + ' kg' : '—'}
          </Text>
        </View>
      </View>
      {me?.goal ? (
        <Card>
          <Text style={{ color: t.ink3, fontSize: 12, fontWeight: '500', marginBottom: 6 }}>Objectif</Text>
          <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600' }}>{me.goal.label}</Text>
          <Text style={{ color: t.ink2, fontSize: 13, marginTop: 2 }}>
            {me.goal.date ?? ''}{me.goal.targetTime ? ' · objectif ' + me.goal.targetTime : ''}
          </Text>
        </Card>
      ) : null}
      <Card>
        <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', marginBottom: 10 }}>
          Montres & connexions
        </Text>
        {connections.map((c) => (
          <View
            key={c.provider}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}
          >
            <View style={{ gap: 2 }}>
              <Text style={{ color: t.ink, fontWeight: '600' }}>{PROVIDER_LABELS[c.provider] ?? c.provider}</Text>
              <StatusDot
                level={c.status === 'connected' ? 'good' : 'bad'}
                label={c.status === 'connected' ? 'Connecté' : 'Erreur'}
              />
            </View>
            <Button label="Déconnecter" ghost onPress={() => void disconnect(c.provider)} />
          </View>
        ))}
        <View style={{ marginTop: connections.length ? 8 : 0, gap: 8 }}>
          {!connections.some((c) => c.provider === 'strava') ? (
            <Button label="Connecter Strava" onPress={() => void connect('strava')} />
          ) : null}
          {!connections.some((c) => c.provider === 'polar') ? (
            <Button label="Connecter Polar" ghost onPress={() => void connect('polar')} />
          ) : null}
        </View>
        {error ? <Text style={{ color: t.bad, fontSize: 13, marginTop: 8 }}>{error}</Text> : null}
        <Text style={{ color: t.ink3, fontSize: 12, marginTop: 10 }}>
          Garmin, COROS et Suunto arrivent — vos activités remonteront automatiquement.
        </Text>
      </Card>
      <View>
        <Button
          label="Déconnexion"
          ghost
          onPress={() => {
            void logout().then(() => router.replace('/connexion'));
          }}
        />
      </View>
    </ScrollView>
  );
}
