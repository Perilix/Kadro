import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { Conversation, Notification, Page as ApiPage, AthleteListItem } from '@kadro/shared';
import { ApiClient } from '../core/api-client';
import { AuthStore } from '../core/auth-store';
import { IconComponent } from '../ui/icon.component';
import { AvatarComponent } from '../ui/avatar.component';

@Component({
  selector: 'app-shell-page',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, AvatarComponent],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="logo row">
          <span class="logo-mark"><ui-icon name="logo" [size]="16" [sw]="2.2" /></span>
          <span class="logo-text">Kadro</span>
        </div>
        <nav class="col">
          <a class="nav row" routerLink="/apercu" routerLinkActive="active">
            <ui-icon name="grid" /><span>Aperçu</span>
          </a>
          <a class="nav row" routerLink="/athletes" routerLinkActive="active">
            <ui-icon name="users" /><span>Athlètes</span>
            @if (athleteCount() > 0) {
              <span class="pill count num">{{ athleteCount() }}</span>
            }
          </a>
          <a class="nav row" routerLink="/planning" routerLinkActive="active">
            <ui-icon name="calendar" /><span>Planning</span>
          </a>
          <a class="nav row" routerLink="/bibliotheque" routerLinkActive="active">
            <ui-icon name="library" /><span>Bibliothèque</span>
          </a>
          <a class="nav row" routerLink="/messages" routerLinkActive="active">
            <ui-icon name="message" /><span>Messages</span>
            @if (unread() > 0) {
              <span class="pill count num">{{ unread() }}</span>
            }
          </a>
        </nav>
        <div class="spacer"></div>
        <div class="col bottom">
          <a class="nav row" routerLink="/integrations" routerLinkActive="active">
            <ui-icon name="sync" /><span>Intégrations</span>
          </a>
          <a class="nav row" routerLink="/equipe" routerLinkActive="active">
            <ui-icon name="settings" /><span>Équipe & réglages</span>
          </a>
          <div class="who row">
            <ui-avatar [name]="fullName()" [size]="32" />
            <div class="who-txt">
              <div class="who-name">{{ auth.user()?.firstName }}</div>
              <div class="faint who-sub">Coach · {{ auth.team()?.name }}</div>
            </div>
            <button class="icon-btn out" type="button" (click)="logout()" title="Déconnexion">
              <ui-icon name="logout" [size]="17" />
            </button>
          </div>
        </div>
      </aside>
      <main class="content">
        <router-outlet />
      </main>
      <div class="bell-wrap">
        <button class="icon-btn bell" type="button" (click)="bellOpen.set(!bellOpen())">
          <ui-icon name="bell" [size]="20" />
          @if (unreadNotifs() > 0) {
            <span class="bell-badge num">{{ unreadNotifs() }}</span>
          }
        </button>
        @if (bellOpen()) {
          <div class="card bell-panel">
            <div class="row bp-head">
              <h2>Notifications</h2>
              @if (unreadNotifs() > 0) {
                <button class="link-btn" type="button" (click)="markAllRead()">Tout marquer lu</button>
              }
            </div>
            @for (n of notifications(); track n.id) {
              <div class="row bp-row" [class.unread]="!n.readAt">
                <span class="bp-dot" [class.on]="!n.readAt"></span>
                <div class="bp-txt">
                  <div class="bp-t">{{ notifLabel(n) }}</div>
                  <div class="faint bp-time">{{ notifTime(n.createdAt) }}</div>
                </div>
              </div>
            }
            @if (notifications().length === 0) {
              <p class="muted bp-empty">Rien pour l'instant — les check-ins rouges, séances réalisées et messages arriveront ici.</p>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .layout { display: grid; grid-template-columns: 240px 1fr; min-height: 100dvh; }
    .sidebar {
      display: flex; flex-direction: column;
      border-right: 1px solid var(--line); background: var(--surface);
      padding: 20px 16px; position: sticky; top: 0; height: 100dvh;
    }
    .logo { gap: 10px; padding: 4px 12px 24px; }
    .logo-mark { display: inline-flex; width: 28px; height: 28px; border-radius: 8px; background: var(--btn-primary-bg); color: var(--btn-primary-ink); align-items: center; justify-content: center; }
    .logo-text { font-weight: 700; font-size: 16px; letter-spacing: -0.02em; }
    nav, .bottom { gap: 2px; }
    .nav { gap: 12px; height: 40px; padding: 0 12px; border-radius: 10px; font-weight: 500; color: var(--ink2); }
    .nav ui-icon { color: var(--ink3); }
    .nav span:not(.pill) { flex: 1 1 auto; }
    .nav:hover { color: var(--ink); }
    .nav.active { background: var(--nav-active); color: var(--ink); }
    .nav.active ui-icon { color: var(--ink); }
    .spacer { flex: 1 1 auto; }
    .who { gap: 12px; padding: 12px 12px 4px; margin-top: 8px; border-top: 1px solid var(--line); }
    .who-txt { line-height: 1.2; flex: 1 1 auto; min-width: 0; }
    .who-name { font-weight: 600; font-size: 13px; }
    .who-sub { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .out { width: 30px; height: 30px; border: none; background: transparent; }
    .out:hover { color: var(--bad); }
    .content { padding: 28px 32px; min-width: 0; display: flex; flex-direction: column; }
    .bell-wrap { position: fixed; top: 24px; right: 32px; z-index: 50; }
    .bell { position: relative; }
    .bell-badge { position: absolute; top: -5px; right: -5px; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 999px; background: var(--accent); color: #fff; font-size: 10.5px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }
    .bell-panel { position: absolute; top: 48px; right: 0; width: 340px; max-height: 420px; overflow-y: auto; padding: 6px 0; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12); }
    .bp-head { padding: 10px 16px; gap: 10px; }
    .bp-head h2 { flex: 1 1 auto; }
    .link-btn { background: none; border: none; color: var(--accent-ink); font-family: inherit; font-size: 12.5px; cursor: pointer; padding: 0; }
    .bp-row { gap: 10px; padding: 10px 16px; border-top: 1px solid var(--line); }
    .bp-dot { width: 7px; height: 7px; border-radius: 999px; background: transparent; flex: 0 0 auto; }
    .bp-dot.on { background: var(--accent); }
    .bp-txt { flex: 1 1 auto; line-height: 1.3; min-width: 0; }
    .bp-t { font-size: 13px; }
    .bp-row.unread .bp-t { font-weight: 600; }
    .bp-time { font-size: 11.5px; }
    .bp-empty { padding: 10px 16px 14px; margin: 0; font-size: 13px; }
  `,
})
export class ShellPage implements OnInit {
  readonly auth = inject(AuthStore);
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);
  readonly athleteCount = signal(0);
  readonly unread = signal(0);
  readonly notifications = signal<Notification[]>([]);
  readonly bellOpen = signal(false);
  readonly unreadNotifs = computed(() => this.notifications().filter((n) => !n.readAt).length);

  fullName(): string {
    const u = this.auth.user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  }

  async ngOnInit(): Promise<void> {
    const [roster, conversations, notifs] = await Promise.all([
      this.api.get<ApiPage<AthleteListItem>>('/athletes?limit=100').catch(() => null),
      this.api.get<Conversation[]>('/conversations').catch(() => []),
      this.api.get<ApiPage<Notification>>('/notifications?limit=20').catch(() => null),
    ]);
    this.athleteCount.set(roster?.items.length ?? 0);
    this.unread.set(conversations.reduce((sum, c) => sum + c.unread, 0));
    this.notifications.set(notifs?.items ?? []);
  }

  notifLabel(n: Notification): string {
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

  notifTime(iso: string): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days === 0) return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
    if (days === 1) return 'Hier';
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(iso));
  }

  async markAllRead(): Promise<void> {
    await this.api.post('/notifications/read', {});
    this.notifications.update((list) => list.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/connexion']);
  }
}
