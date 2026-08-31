import { Component, OnInit, inject, signal } from '@angular/core';
import type { PlannedSession } from '@kadro/shared';
import { ApiClient } from '../core/api-client';

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-me-planning-page',
  template: `
    <h1>Planning</h1>
    @if (groups(); as list) {
      @if (list.length === 0) {
        <section class="card"><p class="muted">Rien de planifié sur les 14 prochains jours.</p></section>
      }
      @for (g of list; track g.date) {
        <h2 class="day muted">{{ g.label }}</h2>
        @for (s of g.sessions; track s.id) {
          <section class="card session">
            <strong>{{ s.name }}</strong>
            @if (s.status === 'completed') {
              <span class="status status-good">Réalisée</span>
            } @else if (s.status === 'missed') {
              <span class="status status-bad">Manquée</span>
            } @else {
              <span class="muted">{{ s.type === 'run' ? 'Course' : 'Renfo' }}</span>
            }
          </section>
        }
      }
    } @else {
      <p class="muted">Chargement…</p>
    }
  `,
  styles: `
    .day { font-size: 13px; text-transform: capitalize; margin: 18px 0 8px; }
    .session { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; margin-bottom: 8px; }
  `,
})
export class MePlanningPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly groups = signal<{ date: string; label: string; sessions: PlannedSession[] }[] | null>(null);

  async ngOnInit(): Promise<void> {
    const from = ymd(new Date());
    const to = ymd(new Date(Date.now() + 13 * 24 * 3600 * 1000));
    const sessions = await this.api.get<PlannedSession[]>(`/sessions?from=${from}&to=${to}`);
    const byDate = new Map<string, PlannedSession[]>();
    for (const s of sessions) byDate.set(s.date, [...(byDate.get(s.date) ?? []), s]);
    this.groups.set(
      [...byDate.entries()].map(([date, list]) => ({
        date,
        label: new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(
          new Date(`${date}T12:00:00`),
        ),
        sessions: list,
      })),
    );
  }
}
