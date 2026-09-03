import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Notification, NotificationKind, Page } from '@kadro/shared';
import { api } from '../lib/api';
import { useTheme } from '../lib/theme';
import { Button, Card } from '../lib/ui';

const KIND_FALLBACKS: Record<NotificationKind, string> = {
  form: 'Alerte de forme',
  session: 'Séance mise à jour',
  message: 'Nouveau message',
  team: 'Mouvement dans l’équipe',
  billing: 'Abonnement',
};

const FILTERS: [NotificationKind | 'all', string][] = [
  ['all', 'Tout'],
  ['form', 'Forme'],
  ['session', 'Séances'],
  ['message', 'Messages'],
];

function label(n: Notification): string {
  const from = n.params['from'] ? String(n.params['from']) : '';
  switch (n.i18nKey) {
    case 'notification.new_message':
      return `Nouveau message de ${from}`;
    case 'notification.session_feedback':
      return `${from} a envoyé son compte-rendu${n.params['rpe'] != null ? ` — RPE ${n.params['rpe']}/10` : ''}`;
    default:
      return from ? `${KIND_FALLBACKS[n.kind]} — ${from}` : KIND_FALLBACKS[n.kind];
  }
}

export default function NotificationsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [kind, setKind] = useState<NotificationKind | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      void api
        .get<Page<Notification>>('/notifications?limit=50')
        .then((p) => setNotifications(p.items))
        .catch(() => undefined);
    }, []),
  );

  const unread = notifications.filter((n) => !n.readAt).length;
  const visible = useMemo(
    () => (kind === 'all' ? notifications : notifications.filter((n) => n.kind === kind)),
    [notifications, kind],
  );

  const markAll = async () => {
    await api.post('/notifications/read', {});
    setNotifications((list) => list.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  };

  const time = (iso: string) => {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days === 0) return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
    if (days === 1) return 'Hier';
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(iso));
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, gap: 14 }}>
      <Pressable onPress={() => router.back()} style={{ paddingVertical: 6 }}>
        <Text style={{ color: t.ink2, fontSize: 14 }}>← Retour</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ color: t.ink, fontSize: 26, fontWeight: '600', letterSpacing: -0.5, flex: 1 }}>
          Notifications
        </Text>
        {unread > 0 ? <Button label="Tout marquer lu" ghost onPress={() => void markAll()} /> : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {FILTERS.map(([value, name]) => (
          <Pressable
            key={value}
            onPress={() => setKind(value)}
            style={{
              height: 32,
              paddingHorizontal: 12,
              borderRadius: 999,
              justifyContent: 'center',
              backgroundColor: kind === value ? t.btnPrimaryBg : t.surface,
              borderWidth: 1,
              borderColor: kind === value ? t.btnPrimaryBg : t.line,
            }}
          >
            <Text style={{ color: kind === value ? t.btnPrimaryInk : t.ink2, fontSize: 13, fontWeight: '500' }}>{name}</Text>
          </Pressable>
        ))}
      </View>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {visible.map((n, i) => (
          <View
            key={n.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: t.line }}
          >
            <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: n.readAt ? 'transparent' : t.accent }} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: t.ink, fontSize: 13.5, fontWeight: n.readAt ? '400' : '600' }}>{label(n)}</Text>
              <Text style={{ color: t.ink3, fontSize: 11.5, marginTop: 1 }}>{time(n.createdAt)}</Text>
            </View>
          </View>
        ))}
        {visible.length === 0 ? (
          <Text style={{ color: t.ink2, fontSize: 13, padding: 16 }}>
            Rien pour l'instant — check-ins rouges, comptes-rendus et messages arriveront ici.
          </Text>
        ) : null}
      </Card>
    </ScrollView>
  );
}
