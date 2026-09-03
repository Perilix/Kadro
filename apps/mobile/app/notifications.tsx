import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Notification, Page } from '@kadro/shared';
import { api } from '../lib/api';
import { useTheme } from '../lib/theme';
import { Button, Card } from '../lib/ui';

function label(n: Notification): string {
  const from = n.params['from'] ? String(n.params['from']) : '';
  switch (n.i18nKey) {
    case 'notification.new_message':
      return `Nouveau message de ${from}`;
    case 'notification.session_feedback':
      return `${from} a envoyé son compte-rendu${n.params['rpe'] != null ? ` — RPE ${n.params['rpe']}/10` : ''}`;
    default:
      return n.i18nKey;
  }
}

export default function NotificationsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useFocusEffect(
    useCallback(() => {
      void api
        .get<Page<Notification>>('/notifications?limit=50')
        .then((p) => setNotifications(p.items))
        .catch(() => undefined);
    }, []),
  );

  const unread = notifications.filter((n) => !n.readAt).length;

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
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {notifications.map((n, i) => (
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
        {notifications.length === 0 ? (
          <Text style={{ color: t.ink2, fontSize: 13, padding: 16 }}>
            Rien pour l'instant — check-ins rouges, comptes-rendus et messages arriveront ici.
          </Text>
        ) : null}
      </Card>
    </ScrollView>
  );
}
