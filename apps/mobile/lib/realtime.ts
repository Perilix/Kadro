import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import type { Message, Notification } from '@kadro/shared';
import { API_URL } from './api';

type Listener<T> = (payload: T) => void;

const messageListeners = new Set<Listener<Message>>();
const readListeners = new Set<Listener<{ conversationId: string; by: string }>>();
const notificationListeners = new Set<Listener<Notification>>();
let socket: Socket | null = null;

export function connectRealtime(): void {
  if (socket) return;
  socket = io(API_URL.replace(/\/v1$/, ''), {
    path: '/ws',
    transports: ['websocket'],
    auth: (cb) => {
      void AsyncStorage.getItem('kadro.access').then((token) => cb({ token: token ?? '' }));
    },
  });
  socket.on('message.new', (m: Message) => messageListeners.forEach((l) => l(m)));
  socket.on('message.read', (r: { conversationId: string; by: string }) =>
    readListeners.forEach((l) => l(r)),
  );
  socket.on('notification.new', (n: Notification) => notificationListeners.forEach((l) => l(n)));
  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      setTimeout(() => socket?.connect(), 3000);
    }
  });
}

export function disconnectRealtime(): void {
  socket?.close();
  socket = null;
}

export function onMessage(listener: Listener<Message>): () => void {
  messageListeners.add(listener);
  return () => messageListeners.delete(listener);
}

export function onRead(listener: Listener<{ conversationId: string; by: string }>): () => void {
  readListeners.add(listener);
  return () => readListeners.delete(listener);
}

export function onNotification(listener: Listener<Notification>): () => void {
  notificationListeners.add(listener);
  return () => notificationListeners.delete(listener);
}
