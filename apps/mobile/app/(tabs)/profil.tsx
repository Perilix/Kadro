import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { Button, Card } from '../../lib/ui';

export default function ProfilScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user, athlete, logout } = useAuth();

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, gap: 14 }}>
      <Text style={{ color: t.ink, fontSize: 24, fontWeight: '700' }}>Profil</Text>
      <Card>
        <Text style={{ color: t.ink, fontSize: 17, fontWeight: '700' }}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={{ color: t.ink2, fontSize: 13, marginTop: 4 }}>{user?.email}</Text>
        {athlete ? (
          <Text style={{ color: t.ink2, fontSize: 13, marginTop: 8 }}>Coach : {athlete.coachName}</Text>
        ) : null}
      </Card>
      <Card>
        <Text style={{ color: t.ink, fontSize: 15, fontWeight: '600', marginBottom: 4 }}>Montres & connexions</Text>
        <Text style={{ color: t.ink2, fontSize: 13 }}>
          Garmin, Coros, Polar, Suunto… La connexion des montres arrive bientôt.
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
