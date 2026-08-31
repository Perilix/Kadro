import { Injectable, inject } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import type { Message, Notification } from '@kadro/shared';
import { environment } from '../../environments/environment';
import { ApiClient } from './api-client';

type Listener<T> = (payload: T) => void;

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly api = inject(ApiClient);
  private socket: Socket | null = null;
  private readonly messageListeners = new Set<Listener<Message>>();
  private readonly readListeners = new Set<Listener<{ conversationId: string; by: string }>>();
  private readonly notificationListeners = new Set<Listener<Notification>>();

  connect(): void {
    if (this.socket || !this.api.currentAccessToken) return;
    this.socket = io(environment.apiUrl.replace(/\/v1$/, ''), {
      path: '/ws',
      auth: { token: this.api.currentAccessToken },
      transports: ['websocket'],
    });
    this.socket.on('message.new', (m: Message) => this.messageListeners.forEach((l) => l(m)));
    this.socket.on('message.read', (r: { conversationId: string; by: string }) =>
      this.readListeners.forEach((l) => l(r)),
    );
    this.socket.on('notification.new', (n: Notification) =>
      this.notificationListeners.forEach((l) => l(n)),
    );
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  onMessage(listener: Listener<Message>): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onRead(listener: Listener<{ conversationId: string; by: string }>): () => void {
    this.readListeners.add(listener);
    return () => this.readListeners.delete(listener);
  }

  onNotification(listener: Listener<Notification>): () => void {
    this.notificationListeners.add(listener);
    return () => this.notificationListeners.delete(listener);
  }
}
