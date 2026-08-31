import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../core/auth-store';
import { ApiError } from '../core/api-client';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink],
  template: `
    <main class="auth-wrap">
      <form class="card auth-card" (ngSubmit)="submit()">
        <div class="brand">Kadro</div>
        <h1>Créer un compte coach</h1>
        <p class="muted">Essai gratuit 14 jours, sans carte. Vos athlètes ne paient jamais.</p>
        <div class="row">
          <div>
            <label class="label" for="firstName">Prénom</label>
            <input class="input" id="firstName" name="firstName" [(ngModel)]="firstName" required />
          </div>
          <div>
            <label class="label" for="lastName">Nom</label>
            <input class="input" id="lastName" name="lastName" [(ngModel)]="lastName" required />
          </div>
        </div>
        <label class="label" for="email">E-mail</label>
        <input class="input" id="email" type="email" name="email" [(ngModel)]="email" required autocomplete="email" />
        <label class="label" for="password">Mot de passe</label>
        <input class="input" id="password" type="password" name="password" [(ngModel)]="password" required minlength="8" autocomplete="new-password" />
        <label class="label" for="teamName">Nom de votre équipe <span class="muted">(optionnel)</span></label>
        <input class="input" id="teamName" name="teamName" [(ngModel)]="teamName" placeholder="Team Marc" />
        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        <button class="btn auth-submit" type="submit" [disabled]="busy()">Créer mon compte</button>
        <p class="muted alt">Déjà inscrit ? <a routerLink="/connexion">Se connecter</a></p>
      </form>
    </main>
  `,
  styles: `
    .auth-wrap { min-height: 100dvh; display: grid; place-items: center; padding: 24px; }
    .auth-card { width: 420px; padding: 32px; }
    .brand { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 20px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .auth-submit { width: 100%; justify-content: center; margin-top: 20px; }
    .alt { margin: 16px 0 0; font-size: 13px; }
    p.muted { margin: 0; font-size: 13px; }
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  teamName = '';
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  async submit(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.auth.register({
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        password: this.password,
        locale: 'fr',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...(this.teamName.trim() ? { teamName: this.teamName.trim() } : {}),
      });
      await this.router.navigate(['/apercu']);
    } catch (err) {
      this.error.set(
        err instanceof ApiError && err.code === 'auth.email_taken'
          ? 'Un compte existe déjà avec cet e-mail.'
          : 'Inscription impossible. Vérifiez les champs et réessayez.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
