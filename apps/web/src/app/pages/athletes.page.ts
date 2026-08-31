import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { AthleteListItem, InviteCodeInfo, Page } from '@kadro/shared';
import { ApiClient } from '../core/api-client';

const FORM_LABELS: Record<string, string> = {
  good: 'En forme',
  warn: 'À surveiller',
  bad: 'Signal rouge',
  none: '—',
};

@Component({
  selector: 'app-athletes-page',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="head">
      <h1>Athlètes</h1>
      @if (invite(); as info) {
        <div class="invite">
          Code d'équipe : <span class="badge">{{ info.code }}</span>
        </div>
      }
    </div>
    <div class="toolbar">
      <input
        class="input search"
        type="search"
        placeholder="Rechercher un athlète…"
        [ngModel]="query()"
        (ngModelChange)="search($event)"
      />
    </div>
    <section class="card">
      @if (items(); as list) {
        @if (list.length === 0) {
          <p class="muted">
            Aucun athlète. Partagez le code
            @if (invite(); as info) {
              <strong>{{ info.code }}</strong>
            }
            ou le lien d'invitation pour démarrer.
          </p>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Forme</th>
                <th>Adhérence 7 j</th>
                <th>Ratio A:C</th>
                <th>Volume 7 j</th>
                <th>Prochaine séance</th>
              </tr>
            </thead>
            <tbody>
              @for (a of list; track a.id) {
                <tr [routerLink]="['/athletes', a.id]">
                  <td>
                    <strong>{{ a.firstName }} {{ a.lastName }}</strong>
                    @if (a.goalLabel) {
                      <div class="muted goal">{{ a.goalLabel }}</div>
                    }
                  </td>
                  <td><span class="status status-{{ a.formStatus }}">{{ formLabel(a.formStatus) }}</span></td>
                  <td>{{ a.adherence7d != null ? a.adherence7d + ' %' : '—' }}</td>
                  <td>{{ a.acuteChronicRatio ?? '—' }}</td>
                  <td>{{ a.volume7dKm != null ? a.volume7dKm + ' km' : '—' }}</td>
                  <td>{{ a.nextSessionDate ?? '—' }}</td>
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
    .head { display: flex; align-items: baseline; justify-content: space-between; }
    .invite { font-size: 13px; color: var(--ink2); }
    .toolbar { margin-bottom: 14px; }
    .search { max-width: 320px; }
    .goal { font-size: 12px; }
  `,
})
export class AthletesPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly items = signal<AthleteListItem[] | null>(null);
  readonly invite = signal<InviteCodeInfo | null>(null);
  readonly query = signal('');
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    await this.load();
    this.invite.set(await this.api.get<InviteCodeInfo>('/team/invite-code'));
  }

  search(value: string): void {
    this.query.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.load(), 250);
  }

  formLabel(status: string): string {
    return FORM_LABELS[status] ?? '—';
  }

  private async load(): Promise<void> {
    const q = this.query().trim();
    const page = await this.api.get<Page<AthleteListItem>>(
      `/athletes${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    );
    this.items.set(page.items);
  }
}
