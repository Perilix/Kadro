import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Billing, InviteCodeInfo } from '@kadro/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { Button, Card } from '../../lib/ui';

export default function CoachPlusScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [invite, setInvite] = useState<InviteCodeInfo | null>(null);
  const [billing, setBilling] = useState<Billing | null>(null);

  useFocusEffect(
    useCallback(() => {
      void api.get<InviteCodeInfo>('/team/invite-code').then(setInvite).catch(() => undefined);
      void api.get<Billing>('/billing').then(setBilling).catch(() => undefined);
    }, []),
  );

  const shareCode = async () => {
    if (!invite) return;
    await Share.share({
      message: `Rejoins-moi sur Kadro : installe l'app et entre le code ${invite.code} — ${invite.joinUrl}`,
    }).catch(() => undefined);
  };

  const row = (label: string, sub: string, onPress?: () => void) => (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: t.line }}
    >
      <View style={{ flex: 1, paddingVertical: 8 }}>
        <Text style={{ color: t.ink, fontSize: 15, fontWeight: '500' }}>{label}</Text>
        {sub ? <Text style={{ color: t.ink3, fontSize: 12, marginTop: 1 }}>{sub}</Text> : null}
      </View>
      {onPress ? <Text style={{ color: t.ink3, fontSize: 18 }}>›</Text> : null}
    </Pressable>
  );

  const planLabel = billing
    ? `${billing.plan === 'trial' ? 'Essai gratuit' : billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1)} · ${billing.athleteCount} / ${billing.athleteLimit} athlètes`
    : '';

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.ink, fontSize: 20, fontWeight: '600', letterSpacing: -0.4 }}>
            {user?.firstName} {user?.lastName}
          </Text>
          {planLabel ? <Text style={{ color: t.ink2, fontSize: 13, marginTop: 2 }}>{planLabel}</Text> : null}
        </View>
      </View>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Pressable onPress={() => void shareCode()} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 16 }}>
          <View style={{ flex: 1, paddingVertical: 8 }}>
            <Text style={{ color: t.ink, fontSize: 15, fontWeight: '500' }}>Inviter un athlète</Text>
            <Text style={{ color: t.ink3, fontSize: 12, marginTop: 1 }}>
              {invite ? `Code ${invite.code} · toucher pour partager` : '…'}
            </Text>
          </View>
          <Text style={{ color: t.ink3, fontSize: 18 }}>›</Text>
        </Pressable>
        {row('Planning équipe', 'Vue semaine · tous les athlètes', () => router.push('/(coach)/planning'))}
        {row('Athlètes', 'Roster, forme, fiches', () => router.push('/(coach)/athletes'))}
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Pressable
          onPress={() => router.push('/creer-seance')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 16 }}
        >
          <View style={{ flex: 1, paddingVertical: 8 }}>
            <Text style={{ color: t.ink, fontSize: 15, fontWeight: '500' }}>Créer une séance</Text>
            <Text style={{ color: t.ink3, fontSize: 12, marginTop: 1 }}>Course ou muscu · assignation directe</Text>
          </View>
          <Text style={{ color: t.ink3, fontSize: 18 }}>›</Text>
        </Pressable>
        {row('Assigner un modèle', 'Depuis la bibliothèque', () => router.push('/assigner'))}
        {row('Abonnement & réglages', "Gérés depuis l'app web (Équipe & réglages)")}
      </Card>

      <Button
        label="Se déconnecter"
        ghost
        onPress={() => {
          void logout().then(() => router.replace('/connexion'));
        }}
      />
    </ScrollView>
  );
}
