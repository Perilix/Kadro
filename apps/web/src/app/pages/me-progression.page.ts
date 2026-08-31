import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Athlete, AthleteOverview, ExerciseStats, PaceTable } from '@kadro/shared';
import { formatDuration, formatPace } from '@kadro/shared';
import { ApiClient } from '../core/api-client';
import { BarChartComponent } from '../ui/bar-chart.component';
import { IconComponent } from '../ui/icon.component';

@Component({
  selector: 'app-me-progression-page',
  imports: [BarChartComponent, IconComponent],
  template: `
    <header class="row head">
      <h1 class="grow">Progression</h1>
      <span class="pill soft">12 semaines</span>
    </header>
    <div class="row cols">
      <div class="col main">
        <section class="card pad">
          <div class="row card-head"><h2>Volume hebdo</h2><span class="faint tiny">km</span></div>
          @if (overview(); as o) {
            <div class="row metrics">
              <div class="metric col"><span class="faint tiny">Cette semaine</span><span class="num m-val">{{ currentVolume(o) }}</span></div>
              <div class="metric col"><span class="faint tiny">Moy. 4 sem.</span><span class="num m-val">{{ avgVolume(o) }}</span></div>
              <div class="metric col"><span class="faint tiny">Charge 7 j</span><span class="num m-val">{{ currentLoad(o) }} UA</span></div>
            </div>
            <ui-bar-chart [values]="volumes(o)" [labels]="labels(o)" [w]="620" [h]="140" />
          }
        </section>
        <section class="card pad">
          <div class="row card-head"><h2>Mes charges</h2><span class="faint tiny">1RM estimés · 16 semaines</span></div>
          @for (s of strength(); track s.exerciseId) {
            <div class="row str-row">
              <span class="s-ic"><ui-icon name="dumbbell" [size]="18" /></span>
              <div class="grow s-txt">
                <div class="s-name">{{ s.name }}</div>
                <div class="muted tiny">Dernière charge {{ s.lastWorkingKg != null ? s.lastWorkingKg + ' kg' : '—' }}</div>
              </div>
              <div class="col rm">
                <span class="faint tiny">1RM estimé</span>
                <span class="num m-val">{{ s.est1RmKg != null ? s.est1RmKg + ' kg' : '—' }}</span>
              </div>
            </div>
          }
          @if (strength().length === 0) {
            <p class="muted empty">Tes charges apparaîtront après tes premières séances de renfo.</p>
          }
        </section>
        <section class="card pad">
          <div class="row card-head"><h2>Dernières séances</h2></div>
          @for (s of overview()?.recentSessions ?? []; track s.id) {
            <a class="row act" (click)="openActivity(s.id)">
              <span class="s-ic"><ui-icon [name]="s.sport === 'strength' ? 'dumbbell' : 'run'" [size]="18" /></span>
              <div class="grow s-txt">
                <div class="s-name">{{ s.name ?? (s.sport === 'strength' ? 'Renfo libre' : 'Sortie libre') }}</div>
                <div class="muted tiny">{{ meta(s) }}</div>
              </div>
              <span class="faint num tiny">{{ s.startedAt.slice(8, 10) }}/{{ s.startedAt.slice(5, 7) }}</span>
            </a>
          }
          @if ((overview()?.recentSessions ?? []).length === 0) {
            <p class="muted empty">Tes activités apparaîtront ici.</p>
          }
        </section>
      </div>
      <aside class="col side">
        <section class="card pad">
          <div class="row card-head"><h2>Mes allures</h2><span class="faint tiny">VMA {{ vma() }}</span></div>
          @for (z of paceZones(); track z.tag) {
            <div class="zone">
              <span class="pill num ztag" [style.background]="z.color">{{ z.tag }}</span>
              <span class="muted">{{ z.label }}</span>
              <span class="num strong">{{ z.value }}</span>
            </div>
          }
          @if (paceZones().length === 0) {
            <p class="muted empty-pad">Renseigne ta VMA (ou fais un test avec ton coach) pour voir tes allures.</p>
          }
        </section>
        @if (records().length > 0) {
          <section class="card pad">
            <div class="row card-head"><h2>Mes records</h2></div>
            <div class="row recs">
              @for (r of records(); track r.distance) {
                <div class="rec col">
                  <span class="faint tiny">{{ r.distance }}</span>
                  <span class="num rec-t">{{ r.time }}</span>
                  <span class="faint rec-w">{{ r.when }}</span>
                </div>
              }
            </div>
          </section>
        }
      </aside>
    </div>
  `,
  styles: `
    .grow { flex: 1 1 auto; min-width: 0; }
    .cols { gap: 20px; align-items: flex-start; }
    .main { flex: 1 1 0; min-width: 0; gap: 16px; }
    .side { width: 340px; flex: 0 0 auto; gap: 16px; }
    .pad { padding: 16px 18px; }
    .card-head { gap: 10px; margin-bottom: 10px; }
    .card-head h2 { flex: 1 1 auto; }
    .tiny { font-size: 12.5px; }
    .metrics { gap: 24px; margin-bottom: 8px; }
    .metric { gap: 3px; flex: 1 1 0; }
    .m-val { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
    .str-row, .act { gap: 14px; padding: 10px 0; border-top: 1px solid var(--line); color: var(--ink); }
    a.act { cursor: pointer; }
    a.act:hover .s-name { color: var(--accent-ink); }
    .s-ic { width: 36px; height: 36px; border-radius: 10px; background: var(--neutral-soft); display: inline-flex; align-items: center; justify-content: center; color: var(--ink2); flex: 0 0 auto; }
    .s-txt { line-height: 1.3; min-width: 0; }
    .s-name { font-weight: 500; }
    .rm { gap: 2px; align-items: flex-end; }
    .zone { display: grid; grid-template-columns: 44px 1fr auto; gap: 10px; align-items: center; padding: 7px 0; border-top: 1px solid var(--line); font-size: 13px; }
    .ztag { height: 22px; padding: 0 7px; color: #fff; font-size: 11px; justify-content: center; }
    .strong { font-weight: 600; }
    .recs { gap: 8px; }
    .rec { flex: 1 1 0; padding: 10px 12px; border-radius: 10px; background: var(--surface2); gap: 1px; }
    .rec-t { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
    .rec-w { font-size: 11px; }
    .empty { padding: 8px 0; margin: 0; font-size: 13px; }
    .empty-pad { margin: 0; font-size: 13px; }
  `,
})
export class MeProgressionPage implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);
  readonly overview = signal<AthleteOverview | null>(null);
  readonly paces = signal<PaceTable | null>(null);
  readonly strength = signal<ExerciseStats[]>([]);
  readonly me = signal<Athlete | null>(null);

  readonly records = computed(() => this.me()?.personalRecords ?? []);

  readonly paceZones = computed(() => {
    const rows = this.paces()?.rows ?? [];
    const easy = rows.find((r) => r.key === 'easy');
    const marathon = rows.find((r) => r.key === 'marathon');
    const threshold = rows.find((r) => r.key === 'threshold');
    const vmaRow = rows.find((r) => r.key === 'vma');
    const zones: { tag: string; label: string; value: string; color: string }[] = [];
    if (easy) zones.push({ tag: 'Z2', label: 'Endurance', value: this.range(easy), color: 'var(--ink3)' });
    if (marathon) zones.push({ tag: 'Mar.', label: 'Allure marathon', value: this.range(marathon), color: 'var(--ink2)' });
    if (threshold) zones.push({ tag: 'Seuil', label: 'Allure seuil', value: this.range(threshold), color: 'var(--ink2)' });
    if (vmaRow) zones.push({ tag: 'VMA', label: 'Intervalles', value: this.range(vmaRow), color: 'var(--accent)' });
    return zones;
  });

  async ngOnInit(): Promise<void> {
    const [overview, paces, strength, me] = await Promise.all([
      this.api.get<AthleteOverview>('/me/overview?weeks=12'),
      this.api.get<PaceTable>('/me/paces'),
      this.api.get<ExerciseStats[]>('/me/strength-stats'),
      this.api.get<Athlete>('/me/profile').catch(() => null),
    ]);
    this.overview.set(overview);
    this.paces.set(paces);
    this.strength.set(strength);
    this.me.set(me);
  }

  volumes(o: AthleteOverview): number[] {
    return o.loadByWeek.map((w) => w.volumeKm);
  }

  labels(o: AthleteOverview): string[] {
    return o.loadByWeek.map((w) => w.week.slice(5));
  }

  currentVolume(o: AthleteOverview): string {
    return String(o.loadByWeek[o.loadByWeek.length - 1]?.volumeKm ?? 0).replace('.', ',');
  }

  avgVolume(o: AthleteOverview): string {
    const list = o.loadByWeek.slice(-5, -1);
    if (list.length === 0) return '—';
    return String(Math.round((list.reduce((s, w) => s + w.volumeKm, 0) / list.length) * 10) / 10).replace('.', ',');
  }

  currentLoad(o: AthleteOverview): number {
    return o.loadByWeek[o.loadByWeek.length - 1]?.loadUa ?? 0;
  }

  vma(): string {
    const v = this.paces()?.vmaKmh;
    return v != null ? String(v).replace('.', ',') : '—';
  }

  meta(s: { durationSec: number; distanceM: number | null; avgPaceSecPerKm: number | null }): string {
    const parts = [formatDuration(s.durationSec)];
    if (s.distanceM) parts.push(`${(s.distanceM / 1000).toFixed(1)} km`);
    if (s.avgPaceSecPerKm) parts.push(formatPace(s.avgPaceSecPerKm));
    return parts.join(' · ');
  }

  async openActivity(id: string): Promise<void> {
    await this.router.navigate(['/moi/activites', id]);
  }

  private range(row: { fastSecPerKm: number; slowSecPerKm: number }): string {
    return `${formatPace(row.fastSecPerKm).replace(' /km', '')} – ${formatPace(row.slowSecPerKm)}`;
  }
}
