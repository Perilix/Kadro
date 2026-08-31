import { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Message, Page } from '@kadro/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { radius, useTheme } from '../../lib/theme';
import { Button, Input } from '../../lib/ui';

export default function ConversationScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const page = await api.get<Page<Message>>(`/conversations/${id}/messages?limit=100`).catch(() => null);
    if (page) setMessages([...page.items].reverse());
    await api.post(`/conversations/${id}/read`).catch(() => undefined);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
      const timer = setInterval(() => void load(), 10_000);
      return () => clearInterval(timer);
    }, [load]),
  );

  const send = async () => {
    if (!id || !draft.trim()) return;
    setSending(true);
    try {
      const message = await api.post<Message>(`/conversations/${id}/messages`, { type: 'text', text: draft.trim() });
      setMessages((list) => [...list, message]);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, paddingTop: insets.top + 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 }}>
          <Pressable onPress={() => router.back()} style={{ paddingVertical: 4, paddingRight: 6 }}>
            <Text style={{ color: t.ink, fontSize: 22 }}>‹</Text>
          </Pressable>
          <Text style={{ color: t.ink, fontSize: 17, fontWeight: '600', flex: 1 }}>{name ?? 'Conversation'}</Text>
        </View>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const mine = item.senderId === user?.id;
            return (
              <View style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                <View
                  style={{
                    maxWidth: '78%',
                    backgroundColor: mine ? t.btnPrimaryBg : t.surface,
                    borderColor: mine ? 'transparent' : t.line,
                    borderWidth: mine ? 0 : 1,
                    borderRadius: 16,
                    borderBottomRightRadius: mine ? 6 : 16,
                    borderBottomLeftRadius: mine ? 16 : 6,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ color: mine ? t.btnPrimaryInk : t.ink, fontSize: 14, lineHeight: 20 }}>
                    {item.text ?? `[${item.type}]`}
                  </Text>
                  <Text style={{ color: mine ? t.btnPrimaryInk : t.ink3, opacity: mine ? 0.7 : 1, fontSize: 11, marginTop: 2 }}>
                    {new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.sentAt))}
                    {mine && item.readAt ? ' · lu' : ''}
                  </Text>
                </View>
              </View>
            );
          }}
        />
        <View style={{ flexDirection: 'row', gap: 8, padding: 12, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: t.line, backgroundColor: t.surface }}>
          <Input value={draft} onChangeText={setDraft} placeholder="Écrire…" style={{ flex: 1, borderRadius: radius.control + 2 }} />
          <Button label="Envoyer" onPress={() => void send()} disabled={sending || !draft.trim()} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
