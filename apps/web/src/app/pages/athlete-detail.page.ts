import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Athlete, PaceTable } from '@kadro/shared';
import { formatPace } from '@kadro/shared';
import { ApiClient } from '../core/api-client';

const ZONE_LABELS: Record<string, string> = {
  recovery: 'Récupération',
  easy: 'Endurance fondamentale',
  marathon: 'Allure marathon',
  threshold: 'Seuil',
  vma: 'VMA',
};

const FORM_LABELS: Record<string, string> = {
  good: 'En forme',
  warn: 'À surveiller',
  bad: 'Signal rouge',
  none: '—',
};

@Component({
  selector: 'app-athlete-detail-page',
  imports: [RouterLink],
  template: `
    @if (athlete(); as a) {
      <a routerLink="/athletes" class="back muted">← Athlètes</a>
      <div class="head">
        <h1>{{ a.firstName }} {{ a.lastName }}</h1>
        <span class="status status-{{ a.snapshot.formStatus }}">{{ formLabel(a.snapshot.formStatus) }}</span>
      </div>
      @if (a.goal) {
        <p class="muted goal">
          Objectif : <strong>{{ a.goal.label }}</strong>
          @if (a.goal.date) {
            · {{ a.goal.date }}
          }
          @if (a.goal.targetTime) {
            · visé {{ a.goal.targetTime }}
          }
        </p>
      }
      <div class="grid">
        <section class="card">
          <h2>Profil</h2>
          <dl>
            <div><dt>VMA</dt><dd>{{ a.profile.vmaKmh != null ? a.profile.vmaKmh + ' km/h' : '—' }}
              @if (a.profile.vmaSource) {
                <span class="badge">{{ a.profile.vmaSource === 'test' ? 'test' : 'déclarée' }}</span>
              }
            </dd></div>
            <div><dt>FC max</dt><dd>{{ a.profile.hrMaxBpm != null ? a.profile.hrMaxBpm + ' bpm' : '—' }}</dd></div>
            <div><dt>FC repos</dt><dd>{{ a.profile.hrRestBpm != null ? a.profile.hrRestBpm + ' bpm' : '—' }}</dd></div>
            <div><dt>Poids</dt><dd>{{ a.profile.weightKg != null ? a.profile.weightKg + ' kg' : '—' }}</dd></div>
            <div><dt>Adhérence 7 j</dt><dd>{{ a.snapshot.adherence7d != null ? a.snapshot.adherence7d + ' %' : '—' }}</dd></div>
            <div><dt>Ratio A:C</dt><dd>{{ a.snapshot.acuteChronicRatio ?? '—' }}</dd></div>
            <div><dt>Charge 7 j</dt><dd>{{ a.snapshot.load7dUa != null ? a.snapshot.load7dUa + ' UA' : '—' }}</dd></div>
            <div><dt>Volume 7 j</dt><dd>{{ a.snapshot.volume7dKm != null ? a.snapshot.volume7dKm + ' km' : '—' }}</dd></div>
          </dl>
          @if (a.profile.injuriesNote) {
            <p class="muted note">⚑ {{ a.profile.injuriesNote }}</p>
          }
        </section>
        <section class="card">
          <h2>Allures</h2>
          @if (paces(); as p) {
            @if (p.rows.length === 0) {
              <p class="muted">Pas de VMA renseignée — les cibles s'affichent en zones de ressenti.</p>
            } @else {
              <table class="table">
                <thead>
                  <tr><th>Zone</th><th>% VMA</th><th>Allure</th></tr>
                </thead>
                <tbody>
                  @for (row of p.rows; track row.key) {
                    <tr>
                      <td>{{ zoneLabel(row.key) }}</td>
                      <td>{{ row.minPct }}–{{ row.maxPct }} %</td>
                      <td>{{ pace(row.fastSecPerKm) }} – {{ pace(row.slowSecPerKm) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          }
        </section>
      </div>
    } @else {
      <p class="muted">Chargement…</p>
    }
  `,
  styles: `
    .back { display: inline-block; margin-bottom: 12px; font-size: 13px; color: var(--ink2); }
    .head { display: flex; align-items: center; gap: 14px; }
    .head h1 { margin: 0; }
    .goal { margin: 6px 0 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; align-items: start; }
    dl { margin: 0; display: grid; gap: 8px; }
    dl div { display: flex; justify-content: space-between; border-bottom: 1px solid var(--line); padding-bottom: 8px; }
    dl div:last-child { border-bottom: none; padding-bottom: 0; }
    dt { color: var(--ink2); font-size: 13px; }
    dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; }
    .note { margin: 12px 0 0; font-size: 13px; }
    .table tbody tr { cursor: default; }
    .table tbody tr:hover { background: transparent; }
  `,
})
export class AthleteDetailPage implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly route = inject(ActivatedRoute);

  readonly athlete = signal<Athlete | null>(null);
  readonly paces = signal<PaceTable | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    const [athlete, paces] = await Promise.all([
      this.api.get<Athlete>(`/athletes/${id}`),
      this.api.get<PaceTable>(`/athletes/${id}/paces`),
    ]);
    this.athlete.set(athlete);
    this.paces.set(paces);
  }

  pace(secPerKm: number): string {
    return formatPace(secPerKm);
  }

  zoneLabel(key: string): string {
    return ZONE_LABELS[key] ?? key;
  }

  formLabel(status: string): string {
    return FORM_LABELS[status] ?? '—';
  }
}
