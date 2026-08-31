import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Athlete, AthleteOverview, Monitoring, Note, PaceTable } from '@kadro/shared';
import { formatDuration, formatPace } from '@kadro/shared';
import { ApiClient } from '../core/api-client';
import { ALERT_LABELS, alertDetail } from './dashboard.page';

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
  imports: [RouterLink, FormsModule],
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
      @if (overview()?.currentAlert; as alert) {
        <div class="banner">
          <span class="status status-{{ alert.severity === 'critical' ? 'bad' : 'warn' }}">
            {{ alertLabel(alert.kind) }}
          </span>
          <span class="muted">{{ detail(alert) }}</span>
        </div>
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
      <div class="grid">
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
            <p class="muted foot">UA par semaine · ratio A:C {{ o.acuteChronicRatio ?? '—' }}</p>
          }
        </section>
        <section class="card">
          <h2>Dernières séances</h2>
          @if (overview(); as o) {
            @if (o.recentSessions.length === 0) {
              <p class="muted">Rien encore.</p>
            }
            @for (s of o.recentSessions; track s.id) {
              <a class="recent" [routerLink]="['/activites', s.id]">
                <span class="r-name">{{ s.name ?? (s.sport === 'strength' ? 'Renfo libre' : 'Sortie libre') }}</span>
                <span class="muted">{{ s.startedAt.slice(0, 10) }}</span>
                <span class="r-meta">
                  {{ duration(s.durationSec) }}
                  @if (s.distanceM) {
                    · {{ (s.distanceM / 1000).toFixed(1) }} km
                  }
                  @if (s.loadUa) {
                    · {{ s.loadUa }} UA
                  }
                  @if (s.feedbackRpe != null) {
                    · RPE {{ s.feedbackRpe }}
                  }
                </span>
              </a>
            }
          }
        </section>
      </div>
      <section class="card mono">
        <h2>Notes privées</h2>
        <form class="note-form" (ngSubmit)="addNote()">
          <input class="input" name="noteDraft" [(ngModel)]="noteDraft" placeholder="Une note que l'athlète ne verra jamais…" />
          <button class="btn" type="submit" [disabled]="!noteDraft.trim()">Ajouter</button>
        </form>
        @for (note of notes(); track note.id) {
          <div class="note">
            <span class="muted n-date">{{ note.date }}</span>
            <span class="n-text">{{ note.text }}</span>
            <button class="link-del" type="button" (click)="deleteNote(note)">×</button>
          </div>
        }
      </section>
      @if (monitoring(); as m) {
        <section class="card mono">
          <h2>Monitoring — 7 jours</h2>
          <div class="mono-grid">
            <div><span class="muted">Sommeil moyen</span><strong>{{ m.summary7d.sleepAvgMin != null ? sleep(m.summary7d.sleepAvgMin) : '—' }}</strong></div>
            <div><span class="muted">FC repos</span><strong>{{ m.summary7d.restingHrAvgBpm != null ? m.summary7d.restingHrAvgBpm + ' bpm' : '—' }}</strong></div>
            <div><span class="muted">VFC</span><strong>{{ m.summary7d.hrvAvgMs != null ? m.summary7d.hrvAvgMs + ' ms' : '—' }}</strong></div>
            <div><span class="muted">Poids</span><strong>{{ m.summary7d.weightKg != null ? m.summary7d.weightKg + ' kg' : '—' }}</strong></div>
          </div>
          <p class="muted foot">Alimenté par la montre de l'athlète dès la connexion des intégrations.</p>
        </section>
      }
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
    .banner { display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--line); border-left: 3px solid var(--warn); border-radius: var(--radius-card); padding: 12px 16px; margin-top: 16px; }
    .bars { display: flex; align-items: flex-end; gap: 8px; height: 120px; padding-top: 8px; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 4px; height: 100%; }
    .bar { width: 100%; max-width: 34px; background: var(--accent-soft); border-radius: 4px 4px 0 0; min-height: 2px; }
    .bar-value { font-size: 11px; font-variant-numeric: tabular-nums; color: var(--accent-ink); }
    .bar-label { font-size: 10px; }
    .foot { margin: 10px 0 0; font-size: 12px; }
    .recent { display: flex; align-items: baseline; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 13px; color: var(--ink); }
    a.recent:hover .r-name { color: var(--accent-ink); }
    .note-form { display: flex; gap: 8px; margin-bottom: 12px; }
    .note { display: flex; align-items: baseline; gap: 12px; padding: 7px 0; border-bottom: 1px solid var(--line); font-size: 13px; }
    .note:last-child { border-bottom: none; }
    .n-date { font-variant-numeric: tabular-nums; }
    .n-text { flex: 1; }
    .link-del { background: none; border: none; color: var(--ink3); cursor: pointer; font-size: 14px; padding: 0 4px; }
    .link-del:hover { color: var(--bad); }
    .recent:last-child { border-bottom: none; }
    .r-name { font-weight: 600; flex: 1; }
    .r-meta { font-variant-numeric: tabular-nums; color: var(--ink2); }
    .mono { margin-top: 16px; }
    .mono-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .mono-grid div { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
    .mono-grid strong { font-size: 17px; font-variant-numeric: tabular-nums; }
  `,
})
export class AthleteDetailPage implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly route = inject(ActivatedRoute);

  readonly athlete = signal<Athlete | null>(null);
  readonly paces = signal<PaceTable | null>(null);
  readonly overview = signal<AthleteOverview | null>(null);
  readonly monitoring = signal<Monitoring | null>(null);
  readonly notes = signal<Note[]>([]);
  noteDraft = '';
  private athleteId = '';
  readonly maxLoad = computed(() =>
    Math.max(1, ...(this.overview()?.loadByWeek.map((w) => w.loadUa) ?? [1])),
  );

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.athleteId = id;
    const [athlete, paces, overview, monitoring, notes] = await Promise.all([
      this.api.get<Athlete>(`/athletes/${id}`),
      this.api.get<PaceTable>(`/athletes/${id}/paces`),
      this.api.get<AthleteOverview>(`/athletes/${id}/overview`),
      this.api.get<Monitoring>(`/athletes/${id}/monitoring`),
      this.api.get<Note[]>(`/athletes/${id}/notes`),
    ]);
    this.athlete.set(athlete);
    this.paces.set(paces);
    this.overview.set(overview);
    this.monitoring.set(monitoring);
    this.notes.set(notes);
  }

  async addNote(): Promise<void> {
    const text = this.noteDraft.trim();
    if (!text) return;
    const note = await this.api.post<Note>(`/athletes/${this.athleteId}/notes`, { text });
    this.notes.update((list) => [note, ...list]);
    this.noteDraft = '';
  }

  async deleteNote(note: Note): Promise<void> {
    await this.api.delete(`/athletes/${this.athleteId}/notes/${note.id}`);
    this.notes.update((list) => list.filter((n) => n.id !== note.id));
  }

  pace(secPerKm: number): string {
    return formatPace(secPerKm);
  }

  duration(sec: number): string {
    return formatDuration(sec);
  }

  sleep(minutes: number): string {
    return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
  }

  barHeight(loadUa: number): number {
    return Math.round((loadUa / this.maxLoad()) * 80);
  }

  alertLabel(kind: string): string {
    return ALERT_LABELS[kind] ?? kind;
  }

  detail(alert: NonNullable<AthleteOverview['currentAlert']>): string {
    return alertDetail(alert);
  }

  zoneLabel(key: string): string {
    return ZONE_LABELS[key] ?? key;
  }

  formLabel(status: string): string {
    return FORM_LABELS[status] ?? '—';
  }
}
