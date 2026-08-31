import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AthleteOverview, ExerciseStats, PaceTable } from '@kadro/shared';
import { formatDuration, formatPace } from '@kadro/shared';
import { ApiClient } from '../core/api-client';

const ZONE_LABELS: Record<string, string> = {
  recovery: 'Récupération',
  easy: 'Endurance fondamentale',
  marathon: 'Allure marathon',
  threshold: 'Seuil',
  vma: 'VMA',
};

@Component({
  selector: 'app-me-progression-page',
  imports: [RouterLink],
  template: `
    <h1>Progression</h1>
    <section class="card">
      <h2>Charge — 8 semaines</h2>
      @if (overview(); as o) {
        <div class="bars">
          @for (w of o.loadByWeek; track w.week) {
            <div class="bar-col">
              <div class="bar" [style.height.px]="barHeight(w.loadUa)"></div>
              <span class="bar-value">{{ w.loadUa || '' }}</span>
              <span class="bar-label muted">{{ w.week.slice(6) }}</span>
            </div>
          }
        </div>
        <p class="muted foot">
          UA par semaine
          @if (o.acuteChronicRatio != null) {
            · ratio aigu/chronique {{ o.acuteChronicRatio }}
          }
        </p>
      }
    </section>
    <div class="grid">
      <section class="card">
        <h2>Mes allures</h2>
        @if (paces(); as p) {
          @if (p.rows.length === 0) {
            <p class="muted">Renseignez votre VMA (ou faites un test avec votre coach) pour voir vos allures.</p>
          } @else {
            <table class="table">
              <thead><tr><th>Zone</th><th>Allure</th></tr></thead>
              <tbody>
                @for (row of p.rows; track row.key) {
                  <tr>
                    <td>{{ zoneLabel(row.key) }}</td>
                    <td>{{ pace(row.fastSecPerKm) }} – {{ pace(row.slowSecPerKm) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        }
      </section>
      <section class="card">
        <h2>Mes charges</h2>
        @if (strength(); as list) {
          @if (list.length === 0) {
            <p class="muted">Vos charges de travail apparaîtront après vos premières séances de renfo.</p>
          }
          @for (s of list; track s.exerciseId) {
            <div class="srow">
              <strong>{{ s.name }}</strong>
              <span class="muted">1RM estimé</span>
              <span class="val">{{ s.est1RmKg != null ? s.est1RmKg + ' kg' : '—' }}</span>
            </div>
          }
        }
      </section>
    </div>
    <section class="card">
      <h2>Dernières séances</h2>
      @if (overview(); as o) {
        @if (o.recentSessions.length === 0) {
          <p class="muted">Rien encore — vos activités apparaîtront ici.</p>
        }
        @for (s of o.recentSessions; track s.id) {
          <a class="recent" [routerLink]="['/moi/activites', s.id]">
            <span class="r-name">{{ s.name ?? (s.sport === 'strength' ? 'Renfo libre' : 'Sortie libre') }}</span>
            <span class="muted">{{ s.startedAt.slice(0, 10) }}</span>
            <span class="r-meta">
              {{ duration(s.durationSec) }}
              @if (s.distanceM) {
                · {{ (s.distanceM / 1000).toFixed(1) }} km
              }
              @if (s.avgPaceSecPerKm) {
                · {{ pace(s.avgPaceSecPerKm) }}
              }
            </span>
          </a>
        }
      }
    </section>
  `,
  styles: `
    section { margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
    .grid section { margin-bottom: 0; }
    .grid + section { margin-top: 16px; }
    .bars { display: flex; align-items: flex-end; gap: 8px; height: 120px; padding-top: 8px; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 4px; height: 100%; }
    .bar { width: 100%; max-width: 40px; background: var(--accent-soft); border-radius: 4px 4px 0 0; min-height: 2px; }
    .bar-value { font-size: 11px; font-variant-numeric: tabular-nums; color: var(--accent-ink); }
    .bar-label { font-size: 10px; }
    .foot { margin: 10px 0 0; font-size: 12px; }
    .srow { display: flex; align-items: baseline; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 13px; }
    .srow:last-of-type { border-bottom: none; }
    .srow strong { flex: 1; }
    .val { font-weight: 600; font-variant-numeric: tabular-nums; }
    .recent { display: flex; align-items: baseline; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 13px; color: var(--ink); }
    a.recent:hover .r-name { color: var(--accent-ink); }
    .recent:last-child { border-bottom: none; }
    .r-name { font-weight: 600; flex: 1; }
    .r-meta { font-variant-numeric: tabular-nums; color: var(--ink2); }
    .table tbody tr { cursor: default; }
    .table tbody tr:hover { background: transparent; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export class MeProgressionPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly overview = signal<AthleteOverview | null>(null);
  readonly paces = signal<PaceTable | null>(null);
  readonly strength = signal<ExerciseStats[] | null>(null);
  readonly maxLoad = computed(() =>
    Math.max(1, ...(this.overview()?.loadByWeek.map((w) => w.loadUa) ?? [1])),
  );

  async ngOnInit(): Promise<void> {
    const [overview, paces, strength] = await Promise.all([
      this.api.get<AthleteOverview>('/me/overview'),
      this.api.get<PaceTable>('/me/paces'),
      this.api.get<ExerciseStats[]>('/me/strength-stats'),
    ]);
    this.overview.set(overview);
    this.paces.set(paces);
    this.strength.set(strength);
  }

  barHeight(loadUa: number): number {
    return Math.round((loadUa / this.maxLoad()) * 80);
  }

  pace(secPerKm: number): string {
    return formatPace(secPerKm);
  }

  duration(sec: number): string {
    return formatDuration(sec);
  }

  zoneLabel(key: string): string {
    return ZONE_LABELS[key] ?? key;
  }
}
