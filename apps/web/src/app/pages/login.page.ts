import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../core/auth-store';
import { ApiError } from '../core/api-client';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  template: `
    <main class="auth-wrap">
      <form class="card auth-card" (ngSubmit)="submit()">
        <div class="brand">Kadro</div>
        <h1>Connexion</h1>
        <label class="label" for="email">E-mail</label>
        <input class="input" id="email" type="email" name="email" [(ngModel)]="email" required autocomplete="email" />
        <label class="label" for="password">Mot de passe</label>
        <input class="input" id="password" type="password" name="password" [(ngModel)]="password" required autocomplete="current-password" />
        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        <button class="btn auth-submit" type="submit" [disabled]="busy()">Se connecter</button>
        <p class="muted alt">Pas encore de compte ? <a routerLink="/inscription">Créer un compte coach</a></p>
      </form>
    </main>
  `,
  styles: `
    .auth-wrap { min-height: 100dvh; display: grid; place-items: center; padding: 24px; }
    .auth-card { width: 380px; padding: 32px; }
    .brand { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 20px; }
    .auth-submit { width: 100%; justify-content: center; margin-top: 20px; }
    .alt { margin: 16px 0 0; font-size: 13px; }
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  async submit(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.auth.login({ email: this.email, password: this.password });
      await this.router.navigate(['/apercu']);
    } catch (err) {
      this.error.set(
        err instanceof ApiError && err.code === 'auth.invalid_credentials'
          ? 'E-mail ou mot de passe incorrect.'
          : 'Connexion impossible. Réessayez.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
