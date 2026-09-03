import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Conversation } from '@kadro/shared';
import { api } from '../../lib/api';
import { onMessage } from '../../lib/realtime';
import { useTheme } from '../../lib/theme';
import { Card } from '../../lib/ui';

export default function CoachMessagesScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useFocusEffect(
    useCallback(() => {
      const refresh = () =>
        void api.get<Conversation[]>('/conversations').then(setConversations).catch(() => undefined);
      refresh();
      return onMessage(() => refresh());
    }, []),
  );

  const timeAgo = (iso: string | null) => {
    if (!iso) return '';
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days === 0) return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
    if (days === 1) return 'Hier';
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(new Date(iso));
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, gap: 14 }}>
      <Text style={{ color: t.ink, fontSize: 28, fontWeight: '600', letterSpacing: -0.5 }}>Messages</Text>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {conversations.map((c, i) => (
          <Pressable
            key={c.id}
            onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: c.id, name: c.name } })}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderTopWidth: i ? 1 : 0,
              borderTopColor: t.line,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: t.ink, fontSize: 15, fontWeight: c.unread ? '700' : '500', flex: 1 }} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={{ color: t.ink3, fontSize: 11.5 }}>{timeAgo(c.lastMessageAt)}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <Text style={{ color: c.unread ? t.ink : t.ink2, fontSize: 13, flex: 1 }} numberOfLines={1}>
                  {c.lastMessagePreview || 'Aucun message'}
                </Text>
                {c.unread > 0 ? (
                  <View style={{ minWidth: 18, height: 18, paddingHorizontal: 6, borderRadius: 999, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{c.unread}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Pressable>
        ))}
        {conversations.length === 0 ? (
          <Text style={{ color: t.ink2, fontSize: 13, padding: 16 }}>
            Vos conversations apparaîtront quand vos athlètes auront rejoint l'équipe.
          </Text>
        ) : null}
      </Card>
    </ScrollView>
  );
}
