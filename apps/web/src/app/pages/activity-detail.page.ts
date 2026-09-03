import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import type { ActivityDetail, HrZonesSec, Streams } from '@kadro/shared';
import {
  ascentSpeedMPerH,
  formatDuration,
  formatPace,
  gapPaceSecPerKm,
  gradeCostFactor,
  hrTimeInZonesSec,
  hrZonesFromMax,
} from '@kadro/shared';
import { ApiClient } from '../core/api-client';
import { LineChartComponent, type ChartBand, type ChartTick, type ChartYBand } from '../ui/line-chart.component';

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

const LAP_LABELS: Record<string, string> = {
  warmup: 'Échauffement',
  work: 'Effort',
  recovery: 'Récup',
  cooldown: 'Retour au calme',
  lap: 'Tour',
};

interface ChartData {
  xs: number[];
  ys: (number | null)[];
  ticks: ChartTick[];
  bands: ChartBand[];
}

interface LapRow {
  idx: number;
  label: string;
  work: boolean;
  duration: string;
  distance: string;
  pace: string;
  hr: string;
  delta: string | null;
  deltaStatus: 'good' | 'warn' | null;
}

interface SplitRow {
  km: number;
  pace: string;
  gap: string | null;
  elev: string | null;
  hr: string;
}

interface ZoneBar {
  zone: number;
  sec: number;
  label: string;
  pct: number;
  opacity: number;
}

@Component({
  selector: 'app-activity-detail-page',
  imports: [LineChartComponent],
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
      <p class="muted sub">{{ dateLabel(a.startedAt) }} · {{ sportLabel(a.sport) }}</p>

      <div class="kpis">
        <div class="kpi"><div class="value">{{ duration(a.durationSec) }}</div><div class="caption">Durée</div></div>
        @if (a.distanceM) {
          <div class="kpi"><div class="value">{{ (a.distanceM / 1000).toFixed(2) }} km</div><div class="caption">Distance</div></div>
        }
        @if (a.avgPaceSecPerKm) {
          <div class="kpi"><div class="value">{{ pace(a.avgPaceSecPerKm) }}</div><div class="caption">Allure moyenne</div></div>
        }
        @if (gapAvg(); as gap) {
          <div class="kpi"><div class="value">{{ pace(gap) }}</div><div class="caption">Allure ajustée pente</div></div>
        }
        @if (a.avgHrBpm) {
          <div class="kpi"><div class="value">{{ a.avgHrBpm }}<span class="unit"> bpm</span></div><div class="caption">FC moyenne{{ a.maxHrBpm ? ' · max ' + a.maxHrBpm : '' }}</div></div>
        }
        @if (a.avgCadenceSpm) {
          <div class="kpi"><div class="value">{{ a.avgCadenceSpm }}<span class="unit"> ppm</span></div><div class="caption">Cadence</div></div>
        }
        @if (a.elevGainM) {
          <div class="kpi"><div class="value">{{ a.elevGainM }} m</div><div class="caption">Dénivelé +{{ a.elevLossM ? ' · −' + a.elevLossM + ' m' : '' }}</div></div>
        }
        @if (ascentSpeed(); as vam) {
          <div class="kpi"><div class="value">{{ vam }}<span class="unit"> m/h</span></div><div class="caption">Vitesse ascensionnelle</div></div>
        }
        @if (a.loadUa != null) {
          <div class="kpi"><div class="value">{{ a.loadUa }} UA</div><div class="caption">Charge</div></div>
        }
      </div>

      @if (paceChart(); as chart) {
        <section class="card">
          <div class="card-head">
            <h2>Allure</h2>
            @if (chart.bands.length) {
              <span class="muted legend"><span class="swatch"></span>répétitions</span>
            }
          </div>
          <ui-line-chart [xs]="chart.xs" [ys]="chart.ys" [ticks]="chart.ticks" [bands]="chart.bands" [yFmt]="paceFmt" [invertY]="true" [h]="180" />
        </section>
      }

      @if (hrChart(); as chart) {
        <section class="card">
          <div class="card-head">
            <h2>Fréquence cardiaque</h2>
            @if (!hrZoneBands().length) {
              <span class="muted legend">zones indisponibles — FC max de l'athlète non renseignée</span>
            }
          </div>
          <ui-line-chart [xs]="chart.xs" [ys]="chart.ys" [ticks]="chart.ticks" [bands]="chart.bands" [yBands]="hrZoneBands()" [h]="190" />
          @if (zoneBars(); as bars) {
            <div class="zones">
              @for (z of bars; track z.zone) {
                <div class="zone">
                  <span class="zone-name">Z{{ z.zone }}</span>
                  <div class="zone-track"><div class="zone-fill" [style.width.%]="z.pct" [style.opacity]="z.opacity"></div></div>
                  <span class="zone-time muted">{{ z.label }}</span>
                </div>
              }
            </div>
          }
        </section>
      }

      @if (isTrail() && altChart(); as chart) {
        <section class="card">
          <h2>Profil altimétrique</h2>
          <ui-line-chart [xs]="chart.xs" [ys]="chart.ys" [ticks]="chart.ticks" [bands]="[]" [yFmt]="altFmt" [area]="true" [h]="150" />
        </section>
      }

      @if (lapRows(); as rows) {
        <section class="card">
          <h2>Prévu vs réalisé — rep par rep</h2>
          <table class="table">
            <thead><tr><th>#</th><th>Segment</th><th>Durée</th><th>Distance</th><th>Allure</th><th>FC</th><th>Écart cible</th></tr></thead>
            <tbody>
              @for (row of rows; track row.idx) {
                <tr [class.work]="row.work">
                  <td class="muted">{{ row.idx }}</td>
                  <td>{{ row.label }}</td>
                  <td>{{ row.duration }}</td>
                  <td>{{ row.distance }}</td>
                  <td>{{ row.pace }}</td>
                  <td>{{ row.hr }}</td>
                  <td>
                    @if (row.delta != null) {
                      <span [class]="row.deltaStatus ? 'status status-' + row.deltaStatus : ''">{{ row.delta }}</span>
                    } @else {
                      <span class="muted">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }

      @if (splitRows(); as rows) {
        <section class="card">
          <h2>Splits</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Km</th><th>Allure</th>
                @if (showGapColumn()) {
                  <th>Ajustée pente</th><th>Dénivelé</th>
                }
                <th>FC</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows; track row.km) {
                <tr>
                  <td>{{ row.km }}</td>
                  <td>{{ row.pace }}</td>
                  @if (showGapColumn()) {
                    <td>{{ row.gap ?? '—' }}</td>
                    <td>{{ row.elev ?? '—' }}</td>
                  }
                  <td>{{ row.hr }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }

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
        @if (a.bestEfforts.length) {
          <section class="card">
            <h2>Meilleurs efforts</h2>
            <div class="rows">
              @for (effort of a.bestEfforts; track effort.label) {
                <div class="row">
                  <span class="muted">{{ effort.label }}</span>
                  <strong>
                    {{ duration(effort.valueSec) }}
                    @if (effort.isRecord) {
                      <span class="badge record">record</span>
                    }
                    @if (effort.note) {
                      <span class="muted vs">{{ effort.note }}</span>
                    }
                  </strong>
                </div>
              }
            </div>
          </section>
        }
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
    } @else {
      <p class="muted">Chargement…</p>
    }
  `,
  styles: `
    .back { background: none; border: none; font-family: inherit; font-size: 13px; cursor: pointer; padding: 0; align-self: flex-start; color: var(--ink2); }
    .head { display: flex; align-items: center; gap: 12px; }
    .head h1 { margin: 0; }
    .sub { margin: 6px 0 0; text-transform: capitalize; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
    .grid section { margin: 0; }
    .rows { display: grid; gap: 10px; }
    .row { display: flex; justify-content: space-between; align-items: baseline; font-variant-numeric: tabular-nums; }
    .vs { font-weight: 400; font-size: 12px; }
    .row .status { margin-left: 8px; font-size: 12px; }
    .comment { margin: 10px 0 0; font-size: 13px; line-height: 1.5; }
    .card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
    .legend { font-size: 12px; display: inline-flex; align-items: center; gap: 6px; }
    .swatch { width: 10px; height: 10px; border-radius: 3px; background: var(--accent-soft); display: inline-block; }
    .zones { display: grid; gap: 6px; margin-top: 14px; }
    .zone { display: grid; grid-template-columns: 28px 1fr 64px; align-items: center; gap: 10px; }
    .zone-name { font-size: 12px; font-weight: 600; color: var(--ink2); }
    .zone-track { height: 10px; border-radius: 5px; background: var(--surface2); overflow: hidden; }
    .zone-fill { height: 100%; border-radius: 5px; background: var(--accent); }
    .zone-time { font-size: 12px; text-align: right; font-variant-numeric: tabular-nums; }
    tr.work td { background: var(--accent-soft); }
    tr.work td:first-child { border-radius: 6px 0 0 6px; }
    tr.work td:last-child { border-radius: 0 6px 6px 0; }
    .badge.record { background: var(--accent-soft); color: var(--accent-ink); margin-left: 8px; }
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
    .table td { font-variant-numeric: tabular-nums; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export class ActivityDetailPage implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  readonly activity = signal<ActivityDetail | null>(null);
  readonly streams = signal<Streams | null>(null);

  readonly paceFmt = (v: number): string => formatDuration(v);
  readonly altFmt = (v: number): string => `${Math.round(v)} m`;

  readonly isTrail = computed(() => {
    const a = this.activity();
    if (!a) return false;
    return a.sport === 'trail' || (a.elevGainM ?? 0) >= 200;
  });

  private readonly workBands = computed<ChartBand[]>(() => {
    const laps = this.activity()?.laps;
    if (!laps?.length) return [];
    const bands: ChartBand[] = [];
    let t = 0;
    for (const lap of laps) {
      if (lap.kind === 'work') bands.push({ from: t, to: t + lap.durationSec });
      t += lap.durationSec;
    }
    return bands;
  });

  readonly paceChart = computed<ChartData | null>(() => {
    const a = this.activity();
    if (!a || a.sport === 'strength') return null;
    const s = this.streams();
    if (s?.speedMps?.length) {
      const raw = s.speedMps.map((v) => (v != null && v > 0.4 ? 1000 / v : null));
      const ys = smooth(raw, 9).map((v) => (v != null && v <= 900 ? v : null));
      return { xs: s.tSec, ys, ticks: timeTicks(s.tSec), bands: this.workBands() };
    }
    if (a.laps?.length && a.laps.some((l) => l.avgPaceSecPerKm != null)) {
      const { xs, ys } = stepSeries(a.laps.map((l) => ({ span: l.durationSec, value: l.avgPaceSecPerKm })));
      return { xs, ys, ticks: timeTicks(xs), bands: this.workBands() };
    }
    if (a.kmSplits?.length) {
      const { xs, ys } = stepSeries(a.kmSplits.map((split) => ({ span: 1, value: split.paceSecPerKm })));
      return { xs, ys, ticks: kmTicks(xs), bands: [] };
    }
    return null;
  });

  readonly hrChart = computed<ChartData | null>(() => {
    const a = this.activity();
    if (!a) return null;
    const s = this.streams();
    if (s?.hrBpm?.length && s.hrBpm.some((v) => v != null)) {
      return { xs: s.tSec, ys: smooth(s.hrBpm, 5), ticks: timeTicks(s.tSec), bands: this.workBands() };
    }
    if (a.laps?.length && a.laps.some((l) => l.avgHrBpm != null)) {
      const { xs, ys } = stepSeries(a.laps.map((l) => ({ span: l.durationSec, value: l.avgHrBpm })));
      return { xs, ys, ticks: timeTicks(xs), bands: this.workBands() };
    }
    if (a.kmSplits?.length && a.kmSplits.some((split) => split.avgHrBpm != null)) {
      const { xs, ys } = stepSeries(a.kmSplits.map((split) => ({ span: 1, value: split.avgHrBpm })));
      return { xs, ys, ticks: kmTicks(xs), bands: [] };
    }
    return null;
  });

  readonly hrZoneBands = computed<ChartYBand[]>(() => {
    const hrMax = this.activity()?.athleteHrMaxBpm;
    if (!hrMax) return [];
    return hrZonesFromMax(hrMax).map((z) => ({ from: z.minBpm, to: z.maxBpm, label: `Z${z.zone}` }));
  });

  readonly zoneBars = computed<ZoneBar[] | null>(() => {
    const a = this.activity();
    if (!a) return null;
    let zones: HrZonesSec | null = a.hrZonesSec;
    if (!zones) {
      const s = this.streams();
      if (s?.hrBpm?.length && a.athleteHrMaxBpm) {
        zones = hrTimeInZonesSec(s.tSec, s.hrBpm, a.athleteHrMaxBpm);
      }
    }
    if (!zones) return null;
    const total = zones.reduce((acc, v) => acc + v, 0);
    if (total <= 0) return null;
    return zones.map((sec, i) => ({
      zone: i + 1,
      sec,
      label: formatDuration(sec),
      pct: Math.round((sec / total) * 100),
      opacity: 0.35 + i * 0.1625,
    }));
  });

  readonly altChart = computed<ChartData | null>(() => {
    const a = this.activity();
    if (!a) return null;
    const s = this.streams();
    if (s?.altM?.length && s.altM.some((v) => v != null)) {
      return { xs: s.tSec, ys: smooth(s.altM, 5), ticks: timeTicks(s.tSec), bands: [] };
    }
    if (a.kmSplits?.length && a.kmSplits.some((split) => split.elevDeltaM != null)) {
      const xs: number[] = [0];
      const ys: (number | null)[] = [0];
      let alt = 0;
      for (const split of a.kmSplits) {
        alt += split.elevDeltaM ?? 0;
        xs.push(split.km);
        ys.push(alt);
      }
      return { xs, ys, ticks: kmTicks(xs), bands: [] };
    }
    return null;
  });

  readonly lapRows = computed<LapRow[] | null>(() => {
    const laps = this.activity()?.laps;
    if (!laps?.length) return null;
    let workCount = 0;
    let lapCount = 0;
    return laps.map((lap) => {
      if (lap.kind === 'work') workCount += 1;
      if (lap.kind === 'lap') lapCount += 1;
      const suffix = lap.kind === 'work' ? ` ${workCount}` : lap.kind === 'lap' ? ` ${lapCount}` : '';
      const delta = lap.targetDeltaSec;
      return {
        idx: lap.idx,
        label: `${LAP_LABELS[lap.kind] ?? lap.kind}${suffix}`,
        work: lap.kind === 'work',
        duration: formatDuration(lap.durationSec),
        distance:
          lap.distanceM == null
            ? '—'
            : lap.distanceM < 1000
              ? `${Math.round(lap.distanceM)} m`
              : `${(lap.distanceM / 1000).toFixed(2)} km`,
        pace: lap.avgPaceSecPerKm != null ? formatPace(lap.avgPaceSecPerKm) : '—',
        hr: lap.avgHrBpm != null ? `${lap.avgHrBpm}${lap.endHrBpm != null ? ' → ' + lap.endHrBpm : ''}` : '—',
        delta: delta != null ? `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${Math.abs(Math.round(delta))} s` : null,
        deltaStatus: delta == null ? null : delta <= 2 ? 'good' : delta > 5 ? 'warn' : null,
      };
    });
  });

  readonly splitRows = computed<SplitRow[] | null>(() => {
    const splits = this.activity()?.kmSplits;
    if (!splits?.length) return null;
    const trail = this.isTrail();
    return splits.map((split) => {
      const gap =
        split.gapPaceSecPerKm ??
        (trail && split.elevDeltaM != null
          ? gapPaceSecPerKm(split.paceSecPerKm, split.elevDeltaM / 10)
          : null);
      return {
        km: split.km,
        pace: formatPace(split.paceSecPerKm),
        gap: gap != null ? formatPace(gap) : null,
        elev:
          split.elevDeltaM != null
            ? `${split.elevDeltaM > 0 ? '+' : ''}${Math.round(split.elevDeltaM)} m`
            : null,
        hr: split.avgHrBpm != null ? String(split.avgHrBpm) : '—',
      };
    });
  });

  readonly showGapColumn = computed(
    () => this.isTrail() && (this.splitRows()?.some((row) => row.gap != null || row.elev != null) ?? false),
  );

  readonly gapAvg = computed<number | null>(() => {
    const a = this.activity();
    if (!a) return null;
    if (a.gapAvgPaceSecPerKm != null) return a.gapAvgPaceSecPerKm;
    if (!this.isTrail() || !a.kmSplits?.length) return null;
    let timeSec = 0;
    let equivKm = 0;
    for (const split of a.kmSplits) {
      if (split.elevDeltaM == null) return null;
      timeSec += split.paceSecPerKm;
      equivKm += gradeCostFactor(split.elevDeltaM / 10);
    }
    return equivKm > 0 ? timeSec / equivKm : null;
  });

  readonly ascentSpeed = computed<number | null>(() => {
    const a = this.activity();
    if (!a) return null;
    if (a.ascentSpeedMPerH != null) return a.ascentSpeedMPerH;
    if (!this.isTrail() || !a.elevGainM || !a.durationSec) return null;
    return ascentSpeedMPerH(a.elevGainM, a.durationSec);
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    const detail = await this.api.get<ActivityDetail>(`/activities/${id}`);
    this.activity.set(detail);
    if (detail.hasStreams) {
      try {
        this.streams.set(await this.api.get<Streams>(`/activities/${id}/streams?points=600`));
      } catch {
        this.streams.set(null);
      }
    }
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

function smooth(values: (number | null)[], window: number): (number | null)[] {
  const half = Math.floor(window / 2);
  return values.map((value, i) => {
    if (value == null) return null;
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(values.length - 1, i + half); j += 1) {
      const v = values[j];
      if (v == null) continue;
      sum += v;
      count += 1;
    }
    return count > 0 ? sum / count : null;
  });
}

function stepSeries(items: { span: number; value: number | null }[]): {
  xs: number[];
  ys: (number | null)[];
} {
  const xs: number[] = [];
  const ys: (number | null)[] = [];
  let x = 0;
  for (const item of items) {
    xs.push(x, x + item.span);
    ys.push(item.value, item.value);
    x += item.span;
  }
  return { xs, ys };
}

function timeTicks(xs: number[]): ChartTick[] {
  if (!xs.length) return [];
  const max = xs[xs.length - 1]!;
  const steps = [300, 600, 900, 1800, 3600, 7200];
  const step = steps.find((s) => max / s <= 7) ?? 7200;
  const ticks: ChartTick[] = [];
  for (let t = step; t < max; t += step) {
    ticks.push({ x: t, label: `${Math.round(t / 60)}′` });
  }
  return ticks;
}

function kmTicks(xs: number[]): ChartTick[] {
  if (!xs.length) return [];
  const max = Math.max(...xs);
  const step = max <= 8 ? 1 : max <= 16 ? 2 : 5;
  const ticks: ChartTick[] = [];
  for (let k = step; k <= max; k += step) {
    ticks.push({ x: k, label: `${k}` });
  }
  return ticks;
}
