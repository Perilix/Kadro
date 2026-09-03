import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { api } from './api';

const PUSH_KEY = 'kadro.pushToken';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
  });
}

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return Constants.easConfig?.projectId ?? extra?.eas?.projectId;
}

export async function registerPush(): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    const id = projectId();
    if (!id) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Général',
        importance: Notifications.AndroidImportance.MAX,
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
    await api.post('/me/push-tokens', {
      expoToken: token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    await AsyncStorage.setItem(PUSH_KEY, token);
  } catch {
    return;
  }
}

export async function unregisterPush(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(PUSH_KEY);
    if (!token) return;
    await api.delete(`/me/push-tokens/${encodeURIComponent(token)}`);
    await AsyncStorage.removeItem(PUSH_KEY);
  } catch {
    return;
  }
}

interface PushData {
  kind?: string;
  conversationId?: string;
  athleteId?: string;
}

let handledResponseId: string | null = null;

export function attachPushNavigation(role: 'coach' | 'athlete'): () => void {
  if (Platform.OS === 'web') return () => undefined;
  const open = (data: PushData) => {
    if (data.conversationId) {
      if (role === 'coach') {
        router.push({ pathname: '/conversation/[id]', params: { id: data.conversationId } });
      } else {
        router.push('/(tabs)/messages');
      }
      return;
    }
    if (data.athleteId && role === 'coach') {
      router.push({ pathname: '/athlete/[id]', params: { id: data.athleteId } });
      return;
    }
    router.push('/notifications');
  };
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    handledResponseId = response.notification.request.identifier;
    open((response.notification.request.content.data ?? {}) as PushData);
  });
  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (!response || response.notification.request.identifier === handledResponseId) return;
    handledResponseId = response.notification.request.identifier;
    open((response.notification.request.content.data ?? {}) as PushData);
  });
  return () => sub.remove();
}
