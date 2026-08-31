import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { Conversation } from '@kadro/shared';
import { ApiClient } from '../core/api-client';
import { AuthStore } from '../core/auth-store';
import { AvatarComponent } from '../ui/avatar.component';
import { IconComponent } from '../ui/icon.component';

@Component({
  selector: 'app-athlete-shell-page',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, AvatarComponent],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="logo row">
          <span class="logo-mark"><ui-icon name="logo" [size]="16" [sw]="2.2" /></span>
          <span class="logo-text">Kadro</span>
        </div>
        <nav class="col">
          <a class="nav row" routerLink="/moi" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="active">
            <ui-icon name="home" /><span>Aujourd'hui</span>
          </a>
          <a class="nav row" routerLink="/moi/planning" routerLinkActive="active">
            <ui-icon name="calendar" /><span>Planning</span>
          </a>
          <a class="nav row" routerLink="/moi/progression" routerLinkActive="active">
            <ui-icon name="trend" /><span>Progression</span>
          </a>
          <a class="nav row" routerLink="/moi/messages" routerLinkActive="active">
            <ui-icon name="message" /><span>Mon coach</span>
            @if (unread() > 0) {
              <span class="pill count num">{{ unread() }}</span>
            }
          </a>
        </nav>
        <div class="spacer"></div>
        <div class="col bottom">
          <a class="nav row" routerLink="/moi/profil" routerLinkActive="active">
            <ui-icon name="user" /><span>Profil</span>
          </a>
          <div class="who row">
            <ui-avatar [name]="fullName()" [size]="32" />
            <div class="who-txt">
              <div class="who-name">{{ auth.user()?.firstName }} {{ auth.user()?.lastName }}</div>
              <div class="faint who-sub">Coaché·e par {{ auth.athlete()?.coachName || 'votre coach' }}</div>
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
    .who-name { font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .who-sub { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .out { width: 30px; height: 30px; border: none; background: transparent; }
    .out:hover { color: var(--bad); }
    .content { padding: 28px 32px; min-width: 0; display: flex; flex-direction: column; }
  `,
})
export class AthleteShellPage implements OnInit {
  readonly auth = inject(AuthStore);
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);
  readonly unread = signal(0);

  fullName(): string {
    const u = this.auth.user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  }

  async ngOnInit(): Promise<void> {
    const conversations = await this.api.get<Conversation[]>('/conversations').catch(() => []);
    this.unread.set(conversations.reduce((sum, c) => sum + c.unread, 0));
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/connexion']);
  }
}
