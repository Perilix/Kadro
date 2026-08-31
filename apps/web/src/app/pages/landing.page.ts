import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  template: `
    <main class="hero">
      <div class="card">
        <div class="brand">Kadro</div>
        <span class="badge">● Bientôt disponible</span>
        <h1>Le suivi de vos athlètes, course et renfo réunis.</h1>
        <p class="muted">
          Plateforme de coaching pour la course à pied et le renforcement musculaire :
          planification, charge d'entraînement, envoi des séances sur la montre.
        </p>
        <div class="actions">
          <a class="btn" routerLink="/inscription">Créer un compte coach</a>
          <a class="btn btn-ghost" routerLink="/connexion">Se connecter</a>
        </div>
      </div>
    </main>
  `,
  styles: `
    .hero { min-height: 100dvh; display: grid; place-items: center; padding: 24px; }
    .card { max-width: 480px; padding: 40px; }
    .brand { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 20px; }
    h1 { font-size: 26px; letter-spacing: -0.02em; line-height: 1.25; margin: 16px 0 8px; }
    p { line-height: 1.55; margin: 0 0 24px; }
    .actions { display: flex; gap: 10px; }
  `,
})
export class LandingPage {}
