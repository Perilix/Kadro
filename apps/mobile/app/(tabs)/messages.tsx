import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Conversation, Message, Page } from '@kadro/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { radius, useTheme } from '../../lib/theme';
import { Button, Input } from '../../lib/ui';

export default function MessagesScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const load = useCallback(async () => {
    const convs = await api.get<Conversation[]>('/conversations');
    const conv = convs[0] ?? null;
    setConversation(conv);
    if (conv) {
      const page = await api.get<Page<Message>>(`/conversations/${conv.id}/messages?limit=100`);
      setMessages([...page.items].reverse());
      if (conv.unread > 0) await api.post(`/conversations/${conv.id}/read`);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      const timer = setInterval(() => void load(), 10_000);
      return () => clearInterval(timer);
    }, [load]),
  );

  const send = async () => {
    if (!conversation || !draft.trim()) return;
    setSending(true);
    try {
      const message = await api.post<Message>(`/conversations/${conversation.id}/messages`, {
        type: 'text',
        text: draft.trim(),
      });
      setMessages((list) => [...list, message]);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top + 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.ink, fontSize: 22, fontWeight: '600', letterSpacing: -0.4 }}>
              {conversation ? conversation.name : 'Mon coach'}
            </Text>
            <Text style={{ color: t.ink3, fontSize: 12 }}>Ton coach</Text>
          </View>
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
                    maxWidth: '75%',
                    backgroundColor: mine ? t.accentSoft : t.surface2,
                    borderColor: mine ? 'transparent' : t.line,
                    borderWidth: mine ? 0 : 1,
                    borderRadius: radius.control,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ color: t.ink, fontSize: 14, lineHeight: 20 }}>{item.text ?? `[${item.type}]`}</Text>
                  <Text style={{ color: t.ink3, fontSize: 11, marginTop: 2 }}>
                    {new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(
                      new Date(item.sentAt),
                    )}
                    {mine && item.readAt ? ' · lu' : ''}
                  </Text>
                </View>
              </View>
            );
          }}
        />
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            padding: 12,
            paddingBottom: insets.bottom + 12,
            borderTopWidth: 1,
            borderTopColor: t.line,
          }}
        >
          <Input
            value={draft}
            onChangeText={setDraft}
            placeholder="Écrire à votre coach…"
            style={{ flex: 1 }}
          />
          <Button label="Envoyer" onPress={() => void send()} disabled={sending || !draft.trim()} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
