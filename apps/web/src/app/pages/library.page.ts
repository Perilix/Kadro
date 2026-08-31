import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { Athlete, AthleteListItem, Page, RunBlock, SessionTemplate } from '@kadro/shared';
import { formatDuration, formatPace, paceRange, targetTimeSec } from '@kadro/shared';
import { ApiClient } from '../core/api-client';
import { AvatarComponent } from '../ui/avatar.component';
import { IconComponent } from '../ui/icon.component';

export const CATEGORY_LABELS: Record<string, string> = {
  endurance: 'Endurance',
  vma: 'VMA',
  threshold: 'Seuil',
  race_pace: 'Allure course',
  hills: 'Côtes',
  strength: 'Renforcement',
  other: 'Autre',
};

const CATEGORY_ORDER = ['endurance', 'vma', 'threshold', 'race_pace', 'hills', 'strength', 'other'];

interface BlockView {
  title: string;
  detail: string;
  color: string;
  repeat: string;
}

interface PaceRowView {
  name: string;
  vma: number;
  target: string;
  pace: string;
}

@Component({
  selector: 'app-library-page',
  imports: [FormsModule, RouterLink, AvatarComponent, IconComponent],
  template: `
    <header class="row head">
      <div class="head-txt">
        <h1>Bibliothèque de séances</h1>
        <div class="muted sub">{{ templates().length }} modèle{{ templates().length > 1 ? 's' : '' }} · réutilisables pour tous vos athlètes</div>
      </div>
      <div class="input search">
        <ui-icon name="search" [size]="18" />
        <input [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Rechercher un modèle" />
      </div>
      <a class="btn primary" routerLink="/bibliotheque/nouvelle"><ui-icon name="plus" [size]="18" [sw]="2" />Nouveau modèle</a>
    </header>
    <div class="row cols">
      <section class="card list">
        @for (group of grouped(); track group.category) {
          <div class="label g-label">{{ categoryLabel(group.category) }}</div>
          @for (t of group.items; track t.id) {
            <button class="row tpl" type="button" [class.on]="selectedId() === t.id" (click)="select(t)">
              <span class="t-ic"><ui-icon [name]="t.type === 'strength' ? 'dumbbell' : 'run'" [size]="16" /></span>
              <div class="t-txt">
                <div class="ellip t-name">{{ t.name }}</div>
                <div class="faint ellip t-meta">{{ tplMeta(t) }}</div>
              </div>
            </button>
          }
        }
        @if (templates().length === 0) {
          <p class="muted empty">Créez votre première séance : elle sera réutilisable pour tous vos athlètes.</p>
        }
      </section>
      @if (selected(); as t) {
        <section class="card detail">
          <div class="row d-head">
            <div class="d-title">
              <div class="row d-pills">
                <span class="pill accent"><ui-icon [name]="t.type === 'strength' ? 'dumbbell' : 'run'" [size]="13" />{{ categoryLabel(t.category) }}</span>
                <span class="pill soft">Difficulté attendue {{ t.expectedDifficulty }} / 10</span>
                <span class="faint tiny">Utilisé {{ t.usageCount }} fois</span>
              </div>
              <h2 class="d-name">{{ t.name }}</h2>
              <div class="muted d-meta">{{ tplMeta(t) }}</div>
            </div>
            <button class="btn" type="button" (click)="duplicate(t)"><ui-icon name="copy" [size]="18" />Dupliquer</button>
            <button class="btn" type="button" (click)="archive(t)">Archiver</button>
            <a class="btn primary" routerLink="/planning"><ui-icon name="users" [size]="18" [sw]="2" />Assigner à…</a>
          </div>
          <div class="row d-cols">
            <div class="d-main">
              <div class="label sec-label">Structure</div>
              @if (t.type === 'run') {
                @for (b of blockViews(); track $index) {
                  <div class="row block">
                    <span class="bar" [style.background]="b.color"></span>
                    <div class="b-txt">
                      <div class="b-name">{{ b.title }}</div>
                      <div class="muted b-detail">{{ b.detail }}</div>
                    </div>
                    @if (b.repeat) {
                      <span class="pill accent"><ui-icon name="repeat" [size]="13" />{{ b.repeat }}</span>
                    }
                  </div>
                }
              } @else {
                @for (e of t.exercises ?? []; track $index) {
                  <div class="row block">
                    <span class="bar" style="background: var(--accent)"></span>
                    <div class="b-txt">
                      <div class="b-name">{{ e.sets }} × {{ e.reps ?? e.durationSec + '″' }}{{ loadLabel(e.load) }}</div>
                      <div class="muted b-detail">Repos {{ e.restSec }}″{{ e.perSide ? ' · par côté' : '' }}</div>
                    </div>
                  </div>
                }
              }
              @if (t.instructions) {
                <div class="label sec-label spaced">Consigne affichée à l'athlète</div>
                <div class="consigne">{{ t.instructions }}</div>
              }
            </div>
            @if (t.type === 'run' && paceRows().length > 0) {
              <div class="d-side">
                <div class="label sec-label">Allures individualisées <span class="faint normal">· calculées depuis la VMA</span></div>
                <div class="p-head">
                  <span>Athlète</span><span>VMA</span><span>Cible</span><span>Allure</span>
                </div>
                @for (row of paceRows(); track row.name) {
                  <div class="p-row">
                    <span class="row p-name"><ui-avatar [name]="row.name" [size]="26" /><span class="ellip">{{ row.name }}</span></span>
                    <span class="num muted">{{ row.vma }}</span>
                    <span class="num p-target">{{ row.target }}</span>
                    <span class="num muted">{{ row.pace }}</span>
                  </div>
                }
                <p class="faint p-note">Chaque athlète voit sa propre allure cible sur sa montre et dans l'app.</p>
              </div>
            }
          </div>
        </section>
      } @else {
        <section class="card detail center-empty">
          <p class="muted">Sélectionnez un modèle pour voir sa structure et les allures de vos athlètes.</p>
        </section>
      }
    </div>
  `,
  styles: `
    .head { gap: 16px; }
    .head-txt { flex: 1 1 auto; }
    .sub { margin-top: 4px; }
    .search { width: 260px; }
    .search input { border: none; outline: none; background: transparent; color: var(--ink); font-family: inherit; font-size: 14px; flex: 1 1 auto; min-width: 0; }
    .cols { gap: 20px; align-items: stretch; }
    .list { width: 320px; flex: 0 0 auto; padding: 8px; overflow: auto; max-height: calc(100dvh - 180px); }
    .g-label { padding: 12px 12px 4px; }
    .tpl { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px; border-radius: 10px; background: transparent; border: none; font-family: inherit; cursor: pointer; text-align: left; color: var(--ink); }
    .tpl.on, .tpl:hover { background: var(--nav-active); }
    .t-ic { width: 32px; height: 32px; border-radius: 8px; background: var(--neutral-soft); display: inline-flex; align-items: center; justify-content: center; color: var(--ink2); flex: 0 0 auto; }
    .t-txt { flex: 1 1 auto; min-width: 0; line-height: 1.3; }
    .t-name { font-weight: 500; font-size: 13.5px; }
    .t-meta { font-size: 12px; }
    .detail { flex: 1 1 auto; min-width: 0; padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
    .center-empty { align-items: center; justify-content: center; min-height: 300px; }
    .d-head { gap: 12px; align-items: flex-start; }
    .d-title { flex: 1 1 auto; min-width: 0; }
    .d-pills { gap: 8px; flex-wrap: wrap; }
    .tiny { font-size: 12.5px; }
    .d-name { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; margin: 8px 0 0; }
    .d-meta { font-size: 13.5px; margin-top: 2px; }
    .d-cols { gap: 24px; align-items: flex-start; }
    .d-main { flex: 1 1 0; min-width: 0; }
    .d-side { width: 380px; flex: 0 0 auto; }
    .sec-label { margin-bottom: 4px; }
    .sec-label.spaced { margin-top: 18px; }
    .normal { font-weight: 400; }
    .block { gap: 12px; padding: 11px 0; border-top: 1px solid var(--line); }
    .bar { width: 6px; height: 36px; border-radius: 99px; flex: 0 0 auto; }
    .b-txt { flex: 1 1 auto; line-height: 1.3; min-width: 0; }
    .b-name { font-weight: 500; }
    .b-detail { font-size: 12.5px; }
    .consigne { padding: 12px 14px; border-radius: 10px; background: var(--surface2); font-size: 13.5px; line-height: 1.45; }
    .p-head { display: grid; grid-template-columns: 1.4fr 0.6fr 0.9fr 1fr; gap: 12px; padding: 6px 0; font-size: 11.5px; color: var(--ink3); }
    .p-row { display: grid; grid-template-columns: 1.4fr 0.6fr 0.9fr 1fr; gap: 12px; align-items: center; padding: 8px 0; border-top: 1px solid var(--line); font-size: 13px; }
    .p-name { gap: 8px; font-weight: 500; min-width: 0; }
    .p-target { font-weight: 600; }
    .p-note { font-size: 12px; margin: 12px 0 0; line-height: 1.4; }
    .empty { padding: 12px; margin: 0; font-size: 13px; }
  `,
})
export class LibraryPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly templates = signal<SessionTemplate[]>([]);
  readonly roster = signal<{ name: string; vma: number }[]>([]);
  readonly query = signal('');
  readonly selectedId = signal<string | null>(null);

  readonly selected = computed(() => this.templates().find((t) => t.id === this.selectedId()) ?? null);

  readonly grouped = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.templates().filter((t) => !q || t.name.toLowerCase().includes(q));
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: list.filter((t) => t.category === category),
    })).filter((g) => g.items.length > 0);
  });

  readonly blockViews = computed<BlockView[]>(() => {
    const t = this.selected();
    if (!t?.blocks) return [];
    return t.blocks.map((b) => this.blockView(b));
  });

  readonly paceRows = computed<PaceRowView[]>(() => {
    const t = this.selected();
    const work = this.firstVmaWork();
    if (!t || !work) return [];
    return this.roster()
      .slice(0, 6)
      .map((a) => {
        const range = paceRange(a.vma, work.minPct, work.maxPct);
        const target = work.distanceM
          ? formatDuration(targetTimeSec(a.vma, work.distanceM, (work.minPct + work.maxPct) / 2))
          : '—';
        return {
          name: a.name,
          vma: a.vma,
          target,
          pace: `${formatPace(range.fastSecPerKm).replace(' /km', '')}–${formatPace(range.slowSecPerKm)}`,
        };
      });
  });

  async ngOnInit(): Promise<void> {
    const [templates, roster] = await Promise.all([
      this.api.get<SessionTemplate[]>('/templates'),
      this.api.get<Page<AthleteListItem>>('/athletes?limit=100'),
    ]);
    this.templates.set(templates);
    this.selectedId.set(templates[0]?.id ?? null);
    const withVma: { name: string; vma: number }[] = [];
    for (const a of roster.items.slice(0, 8)) {
      const detail = await this.api.get<Athlete>(`/athletes/${a.id}`).catch(() => null);
      if (detail?.profile.vmaKmh != null) {
        withVma.push({ name: `${a.firstName} ${a.lastName}`, vma: detail.profile.vmaKmh });
      }
    }
    this.roster.set(withVma);
  }

  select(t: SessionTemplate): void {
    this.selectedId.set(t.id);
  }

  categoryLabel(category: string): string {
    return CATEGORY_LABELS[category] ?? category;
  }

  tplMeta(t: SessionTemplate): string {
    const parts: string[] = [];
    if (t.estDurationMin) parts.push(`≈ ${t.estDurationMin} min`);
    if (t.estDistanceKm) parts.push(`${t.estDistanceKm} km`);
    if (t.type === 'strength' && t.exercises) parts.push(`${t.exercises.length} exercice${t.exercises.length > 1 ? 's' : ''}`);
    if (parts.length === 0) parts.push(t.type === 'run' ? 'Course' : 'Renforcement');
    return parts.join(' · ');
  }

  loadLabel(load: { type: string; pct?: number; kg?: number }): string {
    if (load.type === 'pctRm') return ` à ${load.pct} % 1RM`;
    if (load.type === 'absolute') return ` à ${load.kg} kg`;
    return ' au poids du corps';
  }

  async duplicate(t: SessionTemplate): Promise<void> {
    await this.api.post(`/templates/${t.id}/duplicate`);
    this.templates.set(await this.api.get<SessionTemplate[]>('/templates'));
  }

  async archive(t: SessionTemplate): Promise<void> {
    await this.api.patch(`/templates/${t.id}`, { archived: true });
    this.templates.update((list) => list.filter((x) => x.id !== t.id));
    if (this.selectedId() === t.id) this.selectedId.set(this.templates()[0]?.id ?? null);
  }

  private firstVmaWork(): { minPct: number; maxPct: number; distanceM: number | null } | null {
    for (const block of this.selected()?.blocks ?? []) {
      const steps = block.kind === 'repeat' ? block.children : [block];
      for (const step of steps) {
        if (step.target.type === 'vmaPct') {
          return { minPct: step.target.minPct, maxPct: step.target.maxPct, distanceM: step.distanceM };
        }
      }
    }
    return null;
  }

  private blockView(block: RunBlock): BlockView {
    if (block.kind === 'repeat') {
      const child = block.children[0];
      const view = child ? this.stepView(child) : { title: '', detail: '' };
      const recovery = block.children[1];
      return {
        title: view.title,
        detail: recovery ? `Récupération ${this.stepDuration(recovery)}` : view.detail,
        color: 'var(--accent)',
        repeat: `× ${block.count}`,
      };
    }
    const view = this.stepView(block);
    return { ...view, color: 'var(--line-strong)', repeat: '' };
  }

  private stepView(step: Extract<RunBlock, { kind: 'warmup' | 'work' | 'recovery' | 'cooldown' }>): {
    title: string;
    detail: string;
  } {
    const kindLabel = { warmup: 'Échauffement', work: '', recovery: 'Récupération', cooldown: 'Retour au calme' }[step.kind];
    const amount = step.distanceM ? `${step.distanceM} m` : this.stepDuration(step);
    const target = this.targetLabel(step.target);
    const title = step.kind === 'work' ? `${amount}${target ? ` ${target}` : ''}` : `${kindLabel} · ${amount}`;
    return { title, detail: step.note ?? (step.kind === 'work' ? '' : target) };
  }

  private stepDuration(step: { durationSec: number | null }): string {
    return step.durationSec ? `${Math.round(step.durationSec / 60)}′` : '';
  }

  private targetLabel(target: RunBlock extends infer _ ? { type: string; minPct?: number; maxPct?: number; zone?: number; minSecPerKm?: number; maxSecPerKm?: number; race?: string } : never): string {
    switch (target.type) {
      case 'vmaPct':
        return target.minPct === target.maxPct ? `à ${target.minPct} % VMA` : `à ${target.minPct} – ${target.maxPct} % VMA`;
      case 'zone':
        return `Z${target.zone}`;
      case 'pace':
        return `${formatPace(target.minSecPerKm!)}`;
      case 'racePace':
        return target.race === '10k' ? 'allure 10 km' : target.race === 'half' ? 'allure semi' : 'allure marathon';
      default:
        return 'allure libre';
    }
  }
}
