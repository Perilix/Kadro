import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../core/auth-store';

@Component({
  selector: 'app-athlete-shell-page',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="wrap">
      <header class="topbar">
        <span class="brand">Kadro</span>
        <nav>
          <a routerLink="/moi" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="active">Aujourd'hui</a>
          <a routerLink="/moi/planning" routerLinkActive="active">Planning</a>
          <a routerLink="/moi/progression" routerLinkActive="active">Progression</a>
          <a routerLink="/moi/messages" routerLinkActive="active">Messages</a>
          <a routerLink="/moi/profil" routerLinkActive="active">Profil</a>
        </nav>
        <button class="btn btn-ghost" type="button" (click)="logout()">Déconnexion</button>
      </header>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .wrap { min-height: 100dvh; }
    .topbar {
      display: flex; align-items: center; gap: 24px;
      background: var(--surface); border-bottom: 1px solid var(--line);
      padding: 12px 24px; position: sticky; top: 0; z-index: 10;
    }
    .brand { font-size: 17px; font-weight: 700; letter-spacing: -0.02em; }
    nav { display: flex; gap: 4px; flex: 1; }
    nav a { padding: 7px 12px; border-radius: var(--radius-control); font-size: 14px; font-weight: 500; color: var(--ink2); }
    nav a.active { background: var(--nav-active); color: var(--ink); }
    .topbar .btn { font-size: 13px; padding: 7px 12px; }
    .content { max-width: 960px; margin: 0 auto; padding: 28px 20px; }
  `,
})
export class AthleteShellPage {
  readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/connexion']);
  }
}
