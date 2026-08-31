import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { Athlete, Conversation, Message, Page } from '@kadro/shared';
import { ApiClient } from '../core/api-client';
import { AuthStore } from '../core/auth-store';
import { RealtimeService } from '../core/realtime.service';
import { AvatarComponent } from '../ui/avatar.component';
import { IconComponent } from '../ui/icon.component';
import { StatusPillComponent, FORM_LEVELS } from '../ui/status-pill.component';

@Component({
  selector: 'app-messages-page',
  imports: [FormsModule, RouterLink, AvatarComponent, IconComponent, StatusPillComponent],
  template: `
    <div class="chat card" [class.with-aside]="isCoach && selectedAthlete()">
      <aside class="convs col">
        <div class="c-head row"><h2>Messages</h2></div>
        @if (conversations(); as list) {
          @if (list.length === 0) {
            <p class="muted empty">Vos conversations apparaîtront quand vos athlètes auront rejoint l'équipe.</p>
          }
          @for (c of list; track c.id) {
            <button type="button" class="conv row" [class.on]="c.id === selectedId()" (click)="select(c)">
              <ui-avatar [name]="c.name" [size]="40" />
              <div class="conv-txt">
                <div class="row"><span class="ellip conv-name" [class.unread-strong]="c.unread > 0">{{ c.name }}</span>
                  <span class="faint num conv-time">{{ timeAgo(c.lastMessageAt) }}</span>
                </div>
                <div class="row"><span class="ellip muted conv-last" [class.unread-ink]="c.unread > 0">{{ c.lastMessagePreview || 'Aucun message' }}</span>
                  @if (c.unread > 0) {
                    <span class="pill count num">{{ c.unread }}</span>
                  }
                </div>
              </div>
            </button>
          }
        } @else {
          <p class="muted empty">Chargement…</p>
        }
      </aside>
      <section class="thread col">
        @if (selectedConv(); as conv) {
          <div class="row t-head">
            <ui-avatar [name]="conv.name" [size]="40" />
            <div class="t-id">
              <div class="t-name">{{ conv.name }}</div>
              @if (selectedAthlete(); as sa) {
                <div class="row t-sub muted">
                  <span class="dot" [style.background]="lvColor(sa.snapshot.formStatus)"></span>
                  {{ lvLabel(sa.snapshot.formStatus) }}{{ sa.snapshot.nextSessionDate ? ' · prochaine séance ' + sa.snapshot.nextSessionDate.slice(8) + '/' + sa.snapshot.nextSessionDate.slice(5, 7) : '' }}
                </div>
              }
            </div>
            @if (isCoach && selectedAthlete(); as sa) {
              <a class="btn small" [routerLink]="['/athletes', sa.id]"><ui-icon name="user" [size]="16" />Voir la fiche</a>
            }
          </div>
          <div class="scroll col" #scroll>
            @for (m of messages(); track m.id; let i = $index) {
              @if (daySeparator(i)) {
                <div class="faint sep">{{ daySeparator(i) }}</div>
              }
              <div class="b-row" [class.mine]="m.senderId === myId">
                <div class="bubble" [class.mine]="m.senderId === myId">
                  {{ m.text ?? '[' + m.type + ']' }}
                </div>
                <span class="faint b-time num">{{ time(m.sentAt) }}{{ m.senderId === myId && m.readAt ? ' · lu' : '' }}</span>
              </div>
            }
          </div>
          <form class="composer row" (ngSubmit)="send()">
            <input class="input grow" name="draft" [(ngModel)]="draft" placeholder="Écrire un message…" autocomplete="off" />
            <button class="icon-btn send" type="submit" [disabled]="!draft.trim() || sending()">
              <ui-icon name="send" [size]="18" />
            </button>
          </form>
        } @else {
          <p class="muted empty center">Choisissez une conversation.</p>
        }
      </section>
      @if (isCoach && selectedAthlete(); as sa) {
        <aside class="side col">
          <div class="col side-id">
            <ui-avatar [name]="sa.firstName + ' ' + sa.lastName" [size]="64" />
            <div class="side-name">{{ sa.firstName }} {{ sa.lastName }}</div>
            <div class="muted side-meta">
              {{ sa.goal?.label ?? 'Sans objectif' }}{{ sa.profile.vmaKmh != null ? ' · VMA ' + sa.profile.vmaKmh : '' }}
            </div>
            <ui-status-pill [level]="sa.snapshot.formStatus" />
          </div>
          <div class="col facts">
            <div class="row fact"><span class="muted">Sommeil 7 j</span><span class="num strong">{{ sa.snapshot.sleepAvg7dMin != null ? sleep(sa.snapshot.sleepAvg7dMin) : '—' }}</span></div>
            <div class="row fact"><span class="muted">Charge 7 j</span><span class="num strong">{{ sa.snapshot.load7dUa != null ? sa.snapshot.load7dUa + ' UA' : '—' }}</span></div>
            <div class="row fact"><span class="muted">Adhérence</span><span class="num strong">{{ sa.snapshot.adherence7d != null ? sa.snapshot.adherence7d + ' %' : '—' }}</span></div>
            <div class="row fact"><span class="muted">Ratio A:C</span><span class="num strong">{{ sa.snapshot.acuteChronicRatio ?? '—' }}</span></div>
          </div>
          <div class="col share">
            <span class="label">Raccourcis</span>
            <a class="btn left" [routerLink]="['/athletes', sa.id]"><ui-icon name="user" [size]="18" />Fiche athlète</a>
            <a class="btn left" routerLink="/planning"><ui-icon name="calendar" [size]="18" />Planning</a>
            <a class="btn left" routerLink="/bibliotheque/nouvelle"><ui-icon name="run" [size]="18" />Nouvelle séance</a>
          </div>
        </aside>
      }
    </div>
  `,
  styles: `
    .chat { display: grid; grid-template-columns: 300px 1fr; padding: 0; overflow: hidden; height: calc(100dvh - 120px); }
    .chat.with-aside { grid-template-columns: 300px 1fr 280px; }
    .convs { border-right: 1px solid var(--line); overflow-y: auto; padding: 16px 10px; gap: 2px; }
    .c-head { padding: 0 10px 10px; }
    .conv { gap: 12px; padding: 12px 12px; border-radius: 12px; background: transparent; border: none; font-family: inherit; cursor: pointer; text-align: left; color: var(--ink); width: 100%; }
    .conv.on, .conv:hover { background: var(--nav-active); }
    .conv-txt { flex: 1 1 auto; min-width: 0; line-height: 1.3; }
    .conv-name { font-weight: 500; flex: 1 1 auto; }
    .unread-strong { font-weight: 600; }
    .conv-time { font-size: 11.5px; }
    .conv-last { font-size: 13px; flex: 1 1 auto; }
    .unread-ink { color: var(--ink); }
    .thread { min-width: 0; }
    .t-head { gap: 12px; padding: 14px 20px; border-bottom: 1px solid var(--line); }
    .t-id { flex: 1 1 auto; line-height: 1.25; min-width: 0; }
    .t-name { font-weight: 600; font-size: 15px; }
    .t-sub { gap: 6px; font-size: 12.5px; }
    .t-sub .dot { width: 7px; height: 7px; }
    .scroll { flex: 1 1 auto; overflow-y: auto; padding: 20px; gap: 10px; }
    .sep { text-align: center; font-size: 12px; padding: 6px 0; }
    .b-row { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
    .b-row.mine { align-items: flex-end; }
    .bubble { max-width: 78%; padding: 10px 14px; border-radius: 16px; border-bottom-left-radius: 6px; font-size: 14px; line-height: 1.4; background: var(--surface2); border: 1px solid var(--line); white-space: pre-wrap; }
    .bubble.mine { background: var(--btn-primary-bg); color: var(--btn-primary-ink); border: none; border-radius: 16px; border-bottom-right-radius: 6px; }
    .b-time { font-size: 11px; padding: 0 4px; }
    .composer { gap: 8px; padding: 14px 20px; border-top: 1px solid var(--line); }
    .grow { flex: 1 1 auto; height: 44px; border-radius: 12px; }
    .send { width: 44px; height: 44px; border-radius: 12px; background: var(--btn-primary-bg); color: var(--btn-primary-ink); border-color: var(--btn-primary-bg); }
    .side { border-left: 1px solid var(--line); padding: 24px 18px; gap: 18px; overflow-y: auto; }
    .side-id { align-items: center; gap: 8px; text-align: center; }
    .side-name { font-weight: 600; font-size: 16px; }
    .side-meta { font-size: 12.5px; }
    .facts { font-size: 13px; }
    .fact { justify-content: space-between; padding: 9px 0; border-top: 1px solid var(--line); }
    .fact:last-child { border-bottom: 1px solid var(--line); }
    .strong { font-weight: 600; }
    .share { gap: 8px; }
    .btn.left { justify-content: flex-start; }
    .empty { padding: 16px; margin: 0; font-size: 13px; }
    .empty.center { align-self: center; margin: auto; }
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
  readonly selectedAthlete = signal<Athlete | null>(null);
  draft = '';
  myId = '';
  readonly isCoach = false as boolean;
  private unsubscribes: (() => void)[] = [];
  private shouldScroll = false;

  readonly selectedConv = computed(
    () => this.conversations()?.find((c) => c.id === this.selectedId()) ?? null,
  );

  constructor() {
    this.isCoach = this.auth.user()?.role === 'coach';
  }

  async ngOnInit(): Promise<void> {
    this.myId = this.auth.user()?.id ?? '';
    this.realtime.connect();
    this.unsubscribes.push(
      this.realtime.onMessage((m) => void this.onIncoming(m)),
      this.realtime.onRead((r) => this.onRead(r)),
    );
    await this.loadConversations();
    const first = this.conversations()?.[0];
    if (first && !this.isCoach) await this.select(first);
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
    if (this.isCoach) {
      this.selectedAthlete.set(
        await this.api.get<Athlete>(`/athletes/${conversation.athleteId}`).catch(() => null),
      );
    }
    const page = await this.api.get<Page<Message>>(`/conversations/${conversation.id}/messages?limit=100`);
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
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  }

  timeAgo(iso: string | null): string {
    if (!iso) return '';
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days === 0) return this.time(iso);
    if (days === 1) return 'Hier';
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(new Date(iso));
  }

  daySeparator(index: number): string | null {
    const list = this.messages();
    const current = list[index];
    if (!current) return null;
    const day = current.sentAt.slice(0, 10);
    const previous = list[index - 1];
    if (previous && previous.sentAt.slice(0, 10) === day) return null;
    const today = new Date().toISOString().slice(0, 10);
    if (day === today) return "Aujourd'hui";
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(
      new Date(current.sentAt),
    );
  }

  lvColor(level: string): string {
    return FORM_LEVELS[level]?.color ?? 'var(--ink3)';
  }

  lvLabel(level: string): string {
    return FORM_LEVELS[level]?.label ?? '';
  }

  sleep(minutes: number): string {
    return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
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
        lastMessageAt: message.sentAt,
        unread: 0,
      });
    } else {
      const existing = this.conversations()?.find((c) => c.id === message.conversationId);
      if (existing) {
        this.patchConversation(message.conversationId, {
          lastMessagePreview: message.text ?? `[${message.type}]`,
          lastMessageAt: message.sentAt,
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
