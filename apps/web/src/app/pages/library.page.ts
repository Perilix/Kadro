import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { SessionTemplate } from '@kadro/shared';
import { ApiClient } from '../core/api-client';

export const CATEGORY_LABELS: Record<string, string> = {
  endurance: 'Endurance',
  vma: 'VMA',
  threshold: 'Seuil',
  race_pace: 'Allure course',
  hills: 'Côtes',
  strength: 'Renfo',
  other: 'Autre',
};

@Component({
  selector: 'app-library-page',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="head">
      <h1>Bibliothèque</h1>
      <a class="btn" routerLink="/bibliotheque/nouvelle">Nouvelle séance</a>
    </div>
    <div class="toolbar">
      <select class="input select" [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)">
        <option value="">Tous les types</option>
        <option value="run">Course</option>
        <option value="strength">Renfo</option>
      </select>
      <input
        class="input search"
        type="search"
        placeholder="Rechercher un modèle…"
        [ngModel]="query()"
        (ngModelChange)="query.set($event)"
      />
    </div>
    <section class="card">
      @if (filtered(); as list) {
        @if (list.length === 0) {
          <p class="muted">Aucun modèle. Créez votre première séance : elle sera réutilisable pour tous vos athlètes.</p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Catégorie</th>
                <th>Difficulté</th>
                <th>Utilisée</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (t of list; track t.id) {
                <tr>
                  <td><strong>{{ t.name }}</strong></td>
                  <td>{{ t.type === 'run' ? 'Course' : 'Renfo' }}</td>
                  <td>{{ categoryLabel(t.category) }}</td>
                  <td>{{ t.expectedDifficulty }}/10</td>
                  <td>{{ t.usageCount }} fois</td>
                  <td class="actions">
                    <button class="btn btn-ghost small" type="button" (click)="duplicate(t)">Dupliquer</button>
                    <button class="btn btn-ghost small" type="button" (click)="archive(t)">Archiver</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      } @else {
        <p class="muted">Chargement…</p>
      }
    </section>
  `,
  styles: `
    .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .head h1 { margin: 0; }
    .toolbar { display: flex; gap: 10px; margin: 14px 0; }
    .select { width: 170px; }
    .search { max-width: 300px; }
    .actions { text-align: right; white-space: nowrap; }
    .small { padding: 5px 10px; font-size: 12px; }
    .table tbody tr { cursor: default; }
  `,
})
export class LibraryPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly templates = signal<SessionTemplate[] | null>(null);
  readonly typeFilter = signal('');
  readonly query = signal('');

  readonly filtered = computed(() => {
    const list = this.templates();
    if (!list) return null;
    const q = this.query().trim().toLowerCase();
    return list.filter(
      (t) =>
        (!this.typeFilter() || t.type === this.typeFilter()) &&
        (!q || t.name.toLowerCase().includes(q)),
    );
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  categoryLabel(category: string): string {
    return CATEGORY_LABELS[category] ?? category;
  }

  async duplicate(template: SessionTemplate): Promise<void> {
    await this.api.post(`/templates/${template.id}/duplicate`);
    await this.load();
  }

  async archive(template: SessionTemplate): Promise<void> {
    await this.api.patch(`/templates/${template.id}`, { archived: true });
    await this.load();
  }

  private async load(): Promise<void> {
    this.templates.set(await this.api.get<SessionTemplate[]>('/templates'));
  }
}
