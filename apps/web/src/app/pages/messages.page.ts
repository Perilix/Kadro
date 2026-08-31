import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Conversation, Message, Page } from '@kadro/shared';
import { ApiClient } from '../core/api-client';
import { AuthStore } from '../core/auth-store';
import { RealtimeService } from '../core/realtime.service';

@Component({
  selector: 'app-messages-page',
  imports: [FormsModule],
  template: `
    <h1>Messages</h1>
    <div class="chat card">
      <aside class="convs">
        @if (conversations(); as list) {
          @if (list.length === 0) {
            <p class="muted empty">Vos conversations apparaîtront quand vos athlètes auront rejoint l'équipe.</p>
          }
          @for (c of list; track c.id) {
            <button
              type="button"
              class="conv"
              [class.active]="c.id === selectedId()"
              (click)="select(c)"
            >
              <div class="conv-top">
                <span class="conv-name">{{ c.name }}</span>
                @if (c.unread > 0) {
                  <span class="unread">{{ c.unread }}</span>
                }
              </div>
              <div class="conv-preview muted">{{ c.lastMessagePreview || 'Aucun message' }}</div>
            </button>
          }
        } @else {
          <p class="muted empty">Chargement…</p>
        }
      </aside>
      <section class="thread">
        @if (selectedId()) {
          <div class="scroll" #scroll>
            @for (m of messages(); track m.id) {
              <div class="bubble-row" [class.mine]="m.senderId === myId">
                <div class="bubble">
                  @if (m.text) {
                    <div class="text">{{ m.text }}</div>
                  } @else {
                    <div class="text muted">[{{ m.type }}]</div>
                  }
                  <div class="time muted">
                    {{ time(m.sentAt) }}
                    @if (m.senderId === myId && m.readAt) {
                      · lu
                    }
                  </div>
                </div>
              </div>
            }
          </div>
          <form class="composer" (ngSubmit)="send()">
            <input
              class="input"
              name="draft"
              [(ngModel)]="draft"
              placeholder="Écrire un message…"
              autocomplete="off"
            />
            <button class="btn" type="submit" [disabled]="!draft.trim() || sending()">Envoyer</button>
          </form>
        } @else {
          <p class="muted empty">Choisissez une conversation.</p>
        }
      </section>
    </div>
  `,
  styles: `
    .chat { display: grid; grid-template-columns: 260px 1fr; padding: 0; overflow: hidden; height: calc(100dvh - 140px); }
    .convs { border-right: 1px solid var(--line); overflow-y: auto; }
    .conv { display: block; width: 100%; text-align: left; background: none; border: none; border-bottom: 1px solid var(--line); padding: 12px 14px; cursor: pointer; font-family: inherit; color: var(--ink); }
    .conv.active { background: var(--nav-active); }
    .conv-top { display: flex; justify-content: space-between; align-items: center; }
    .conv-name { font-size: 13px; font-weight: 600; }
    .unread { background: var(--accent); color: #fff; border-radius: 999px; font-size: 11px; font-weight: 600; padding: 1px 7px; }
    .conv-preview { font-size: 12px; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .thread { display: flex; flex-direction: column; }
    .scroll { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .bubble-row { display: flex; }
    .bubble-row.mine { justify-content: flex-end; }
    .bubble { max-width: 70%; background: var(--surface2); border: 1px solid var(--line); border-radius: var(--radius-control); padding: 8px 12px; }
    .mine .bubble { background: var(--accent-soft); border-color: transparent; }
    .text { font-size: 14px; line-height: 1.4; white-space: pre-wrap; }
    .time { font-size: 11px; margin-top: 3px; }
    .composer { display: flex; gap: 8px; border-top: 1px solid var(--line); padding: 12px; }
    .empty { padding: 16px; }
  `,
})
export class MessagesPage implements OnInit, OnDestroy, AfterViewChecked {
  private readonly api = inject(ApiClient);
  private readonly auth = inject(AuthStore);
  private readonly realtime = inject(RealtimeService);

  @ViewChild('scroll') private scrollRef?: ElementRef<HTMLDivElement>;

  readonly conversations = signal<Conversation[] | null>(null);
  readonly selectedId = signal<string | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly sending = signal(false);
  draft = '';
  myId = '';
  private unsubscribes: (() => void)[] = [];
  private shouldScroll = false;

  async ngOnInit(): Promise<void> {
    this.myId = this.auth.user()?.id ?? '';
    this.realtime.connect();
    this.unsubscribes.push(
      this.realtime.onMessage((m) => void this.onIncoming(m)),
      this.realtime.onRead((r) => this.onRead(r)),
    );
    await this.loadConversations();
  }

  ngOnDestroy(): void {
    this.unsubscribes.forEach((u) => u());
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.scrollRef) {
      this.scrollRef.nativeElement.scrollTop = this.scrollRef.nativeElement.scrollHeight;
      this.shouldScroll = false;
    }
  }

  async select(conversation: Conversation): Promise<void> {
    this.selectedId.set(conversation.id);
    const page = await this.api.get<Page<Message>>(
      `/conversations/${conversation.id}/messages?limit=100`,
    );
    this.messages.set([...page.items].reverse());
    this.shouldScroll = true;
    if (conversation.unread > 0) {
      await this.api.post(`/conversations/${conversation.id}/read`);
      this.patchConversation(conversation.id, { unread: 0 });
    }
  }

  async send(): Promise<void> {
    const id = this.selectedId();
    const text = this.draft.trim();
    if (!id || !text) return;
    this.sending.set(true);
    try {
      await this.api.post<Message>(`/conversations/${id}/messages`, { type: 'text', text });
      this.draft = '';
    } finally {
      this.sending.set(false);
    }
  }

  time(iso: string): string {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    );
  }

  private async onIncoming(message: Message): Promise<void> {
    if (message.conversationId === this.selectedId()) {
      if (!this.messages().some((m) => m.id === message.id)) {
        this.messages.update((list) => [...list, message]);
        this.shouldScroll = true;
      }
      if (message.senderId !== this.myId) {
        await this.api.post(`/conversations/${message.conversationId}/read`);
      }
      this.patchConversation(message.conversationId, {
        lastMessagePreview: message.text ?? `[${message.type}]`,
        unread: 0,
      });
    } else {
      const existing = this.conversations()?.find((c) => c.id === message.conversationId);
      if (existing) {
        this.patchConversation(message.conversationId, {
          lastMessagePreview: message.text ?? `[${message.type}]`,
          unread: message.senderId === this.myId ? existing.unread : existing.unread + 1,
        });
      } else {
        await this.loadConversations();
      }
    }
  }

  private onRead(event: { conversationId: string }): void {
    if (event.conversationId !== this.selectedId()) return;
    const now = new Date().toISOString();
    this.messages.update((list) =>
      list.map((m) => (m.senderId === this.myId && !m.readAt ? { ...m, readAt: now } : m)),
    );
  }

  private patchConversation(id: string, patch: Partial<Conversation>): void {
    this.conversations.update((list) =>
      list ? list.map((c) => (c.id === id ? { ...c, ...patch } : c)) : list,
    );
  }

  private async loadConversations(): Promise<void> {
    this.conversations.set(await this.api.get<Conversation[]>('/conversations'));
  }
}
