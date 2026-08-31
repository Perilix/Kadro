import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../core/auth-store';

@Component({
  selector: 'app-shell-page',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">Kadro</div>
        <nav>
          <a routerLink="/apercu" routerLinkActive="active">Aperçu</a>
          <a routerLink="/athletes" routerLinkActive="active">Athlètes</a>
          <a routerLink="/planning" routerLinkActive="active">Planning</a>
          <a routerLink="/bibliotheque" routerLinkActive="active">Bibliothèque</a>
          <span class="soon">Messages</span>
        </nav>
        <div class="footer">
          <div class="who">
            <div class="name">{{ auth.user()?.firstName }} {{ auth.user()?.lastName }}</div>
            <div class="team muted">{{ auth.team()?.name }}</div>
          </div>
          <button class="btn btn-ghost" type="button" (click)="logout()">Déconnexion</button>
        </div>
      </aside>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .layout { display: grid; grid-template-columns: 220px 1fr; min-height: 100dvh; }
    .sidebar {
      display: flex; flex-direction: column; gap: 24px;
      background: var(--surface); border-right: 1px solid var(--line); padding: 20px 14px;
      position: sticky; top: 0; height: 100dvh;
    }
    .brand { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; padding: 0 10px; }
    nav { display: flex; flex-direction: column; gap: 2px; }
    nav a, nav .soon {
      padding: 9px 10px; border-radius: var(--radius-control);
      font-size: 14px; font-weight: 500; color: var(--ink2);
    }
    nav a.active { background: var(--nav-active); color: var(--ink); }
    nav a:hover { color: var(--ink); }
    nav .soon { color: var(--ink3); cursor: default; }
    nav .soon::after { content: 'bientôt'; font-size: 10px; margin-left: 6px; color: var(--ink3); }
    .footer { margin-top: auto; display: flex; flex-direction: column; gap: 10px; padding: 0 10px; }
    .who .name { font-size: 13px; font-weight: 600; }
    .who .team { font-size: 12px; }
    .footer .btn { justify-content: center; font-size: 13px; padding: 7px 12px; }
    .content { padding: 28px 32px; max-width: 1100px; width: 100%; }
  `,
})
export class ShellPage {
  readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/connexion']);
  }
}
