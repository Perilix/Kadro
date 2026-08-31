import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import type { ActivityDetail } from '@kadro/shared';
import { formatDuration, formatPace } from '@kadro/shared';
import { ApiClient } from '../core/api-client';

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Saisie manuelle',
  strava: 'Strava',
  polar: 'Polar',
  garmin: 'Garmin',
  coros: 'COROS',
  suunto: 'Suunto',
  apple: 'Apple Santé',
  wahoo: 'Wahoo',
  zwift: 'Zwift',
};

const SPORT_LABELS: Record<string, string> = {
  run: 'Course',
  trail: 'Trail',
  strength: 'Renfo',
  bike: 'Vélo',
  other: 'Autre',
};

@Component({
  selector: 'app-activity-detail-page',
  template: `
    @if (activity(); as a) {
      <button class="back muted" type="button" (click)="goBack()">← Retour</button>
      <div class="head">
        <h1>{{ a.name ?? (a.sport === 'strength' ? 'Renfo libre' : 'Sortie libre') }}</h1>
        <span class="badge">{{ sourceLabel(a.source) }}</span>
        @if (a.deviceName) {
          <span class="muted">{{ a.deviceName }}</span>
        }
      </div>
      <p class="muted sub">
        {{ dateLabel(a.startedAt) }} · {{ sportLabel(a.sport) }}
      </p>

      <div class="kpis">
        <div class="kpi"><div class="value">{{ duration(a.durationSec) }}</div><div class="caption">Durée</div></div>
        @if (a.distanceM) {
          <div class="kpi"><div class="value">{{ (a.distanceM / 1000).toFixed(2) }} km</div><div class="caption">Distance</div></div>
        }
        @if (a.avgPaceSecPerKm) {
          <div class="kpi"><div class="value">{{ pace(a.avgPaceSecPerKm) }}</div><div class="caption">Allure moyenne</div></div>
        }
        @if (a.avgHrBpm) {
          <div class="kpi"><div class="value">{{ a.avgHrBpm }}<span class="unit"> bpm</span></div><div class="caption">FC moyenne{{ a.maxHrBpm ? ' · max ' + a.maxHrBpm : '' }}</div></div>
        }
        @if (a.elevGainM) {
          <div class="kpi"><div class="value">{{ a.elevGainM }} m</div><div class="caption">Dénivelé +</div></div>
        }
        @if (a.loadUa != null) {
          <div class="kpi"><div class="value">{{ a.loadUa }} UA</div><div class="caption">Charge</div></div>
        }
      </div>

      <div class="grid">
        <section class="card">
          <h2>Ressenti de l'athlète</h2>
          @if (a.feedback; as f) {
            <div class="rows">
              @if (f.rpe != null) {
                <div class="row">
                  <span class="muted">Difficulté ressentie</span>
                  <strong>
                    {{ f.rpe }}/10
                    @if (a.expectedDifficulty != null) {
                      <span class="muted vs">attendue {{ a.expectedDifficulty }}/10</span>
                      @if (f.rpe - a.expectedDifficulty >= 2) {
                        <span class="status status-warn">plus dur que prévu</span>
                      }
                    }
                  </strong>
                </div>
              }
              @if (f.feeling != null) {
                <div class="row"><span class="muted">Sensation</span><strong>{{ f.feeling }}/5</strong></div>
              }
              @if (f.comment) {
                <p class="comment">« {{ f.comment }} »</p>
              }
            </div>
          } @else {
            <p class="muted">Pas encore de compte-rendu.</p>
          }
        </section>
        <section class="card">
          <h2>Comparaison — même séance précédente</h2>
          @if (a.comparison; as c) {
            <div class="rows">
              <div class="row"><span class="muted">Date</span><strong>{{ c.startedAt.slice(0, 10) }}</strong></div>
              <div class="row"><span class="muted">Durée</span><strong>{{ duration(c.durationSec) }} <span class="muted vs">vs {{ duration(a.durationSec) }}</span></strong></div>
              @if (c.avgPaceSecPerKm && a.avgPaceSecPerKm) {
                <div class="row">
                  <span class="muted">Allure</span>
                  <strong>
                    {{ pace(c.avgPaceSecPerKm) }} <span class="muted vs">vs {{ pace(a.avgPaceSecPerKm) }}</span>
                    @if (a.avgPaceSecPerKm < c.avgPaceSecPerKm) {
                      <span class="status status-good">plus rapide</span>
                    }
                  </strong>
                </div>
              }
              @if (c.avgHrBpm && a.avgHrBpm) {
                <div class="row"><span class="muted">FC moyenne</span><strong>{{ c.avgHrBpm }} <span class="muted vs">vs {{ a.avgHrBpm }} bpm</span></strong></div>
              }
            </div>
          } @else {
            <p class="muted">Première séance de ce type — la comparaison viendra avec la suivante.</p>
          }
        </section>
      </div>

      @if (a.strength; as s) {
        <section class="card">
          <h2>Renforcement — série par série</h2>
          @for (e of s.exercises; track e.exerciseId) {
            <div class="exo">
              <div class="exo-head">
                <strong>{{ e.name }}</strong>
                @if (e.prescribed) {
                  <span class="muted">prescrit {{ e.prescribed.sets }} × {{ e.prescribed.reps ?? '—' }}{{ e.prescribed.kg != null ? ' à ' + e.prescribed.kg + ' kg' : '' }}</span>
                }
              </div>
              <div class="sets">
                @for (set of e.sets; track $index) {
                  <span class="set" [class.skip]="!set.done">
                    {{ set.reps != null ? set.reps + ' reps' : set.durationSec + ' s' }}{{ set.kg != null ? ' · ' + set.kg + ' kg' : '' }}{{ set.rpe != null ? ' · RPE ' + set.rpe : '' }}
                  </span>
                }
              </div>
              @if (e.note) {
                <p class="muted comment">⚑ {{ e.note }}</p>
              }
            </div>
          }
          <p class="muted foot">Tonnage total : <strong>{{ s.tonnageKg }} kg</strong></p>
        </section>
      }

      @if (a.kmSplits?.length) {
        <section class="card">
          <h2>Splits</h2>
          <table class="table">
            <thead><tr><th>Km</th><th>Allure</th><th>FC</th></tr></thead>
            <tbody>
              @for (split of a.kmSplits; track split.km) {
                <tr>
                  <td>{{ split.km }}</td>
                  <td>{{ pace(split.paceSecPerKm) }}</td>
                  <td>{{ split.avgHrBpm ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }
    } @else {
      <p class="muted">Chargement…</p>
    }
  `,
  styles: `
    .back { background: none; border: none; font-family: inherit; font-size: 13px; cursor: pointer; margin-bottom: 12px; padding: 0; }
    .head { display: flex; align-items: center; gap: 12px; }
    .head h1 { margin: 0; }
    .sub { margin: 6px 0 20px; text-transform: capitalize; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; margin-top: 4px; }
    .grid section { margin: 0; }
    .rows { display: grid; gap: 10px; }
    .row { display: flex; justify-content: space-between; align-items: baseline; font-variant-numeric: tabular-nums; }
    .vs { font-weight: 400; font-size: 12px; }
    .row .status { margin-left: 8px; font-size: 12px; }
    .comment { margin: 10px 0 0; font-size: 13px; line-height: 1.5; }
    section.card { margin-top: 16px; }
    .exo { padding: 10px 0; border-bottom: 1px solid var(--line); }
    .exo:last-of-type { border-bottom: none; }
    .exo-head { display: flex; gap: 12px; align-items: baseline; margin-bottom: 6px; }
    .sets { display: flex; flex-wrap: wrap; gap: 6px; }
    .set { background: var(--surface2); border: 1px solid var(--line); border-radius: 999px; padding: 3px 10px; font-size: 12px; font-variant-numeric: tabular-nums; }
    .set.skip { opacity: 0.5; text-decoration: line-through; }
    .foot { margin: 12px 0 0; font-size: 13px; }
    .unit { font-size: 14px; font-weight: 400; }
    .table tbody tr { cursor: default; }
    .table tbody tr:hover { background: transparent; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export class ActivityDetailPage implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  readonly activity = signal<ActivityDetail | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.activity.set(await this.api.get<ActivityDetail>(`/activities/${id}`));
  }

  goBack(): void {
    this.location.back();
  }

  duration(sec: number): string {
    return formatDuration(sec);
  }

  pace(secPerKm: number): string {
    return formatPace(secPerKm);
  }

  sourceLabel(source: string): string {
    return SOURCE_LABELS[source] ?? source;
  }

  sportLabel(sport: string): string {
    return SPORT_LABELS[sport] ?? sport;
  }

  dateLabel(iso: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }
}
