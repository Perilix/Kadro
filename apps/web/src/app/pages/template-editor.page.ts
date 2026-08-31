import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type {
  AthleteListItem,
  Exercise,
  Page,
  ResolvedPreview,
  RunBlock,
  RunStep,
  SessionTemplateCreate,
  StrengthItem,
} from '@kadro/shared';
import { formatPace, zSessionTemplateCreate } from '@kadro/shared';
import { ApiClient } from '../core/api-client';

interface StepDraft {
  kind: 'warmup' | 'work' | 'recovery' | 'cooldown';
  mode: 'duration' | 'distance';
  durationMin: number;
  distanceM: number;
  targetType: 'vmaPct' | 'zone' | 'pace' | 'racePace' | 'free';
  minPct: number;
  maxPct: number;
  zone: number;
  minPace: string;
  maxPace: string;
  race: '10k' | 'half' | 'marathon';
  note: string;
}

interface BlockDraft {
  repeat: boolean;
  count: number;
  steps: StepDraft[];
}

interface ExerciseDraft {
  exerciseId: string;
  sets: number;
  mode: 'reps' | 'duration';
  reps: number;
  durationSec: number;
  loadType: 'pctRm' | 'absolute' | 'bodyweight';
  pct: number;
  kg: number;
  restSec: number;
}

const KIND_LABELS: [StepDraft['kind'], string][] = [
  ['warmup', 'Échauffement'],
  ['work', 'Travail'],
  ['recovery', 'Récupération'],
  ['cooldown', 'Retour au calme'],
];

@Component({
  selector: 'app-template-editor-page',
  imports: [FormsModule, RouterLink],
  template: `
    <a routerLink="/bibliotheque" class="back muted">← Bibliothèque</a>
    <h1>Nouvelle séance</h1>
    <div class="grid">
      <div class="main">
        <section class="card">
          <div class="row">
            <div>
              <label class="label">Type</label>
              <select class="input" [(ngModel)]="type" (ngModelChange)="previewResult.set(null)">
                <option value="run">Course</option>
                <option value="strength">Renfo</option>
              </select>
            </div>
            <div>
              <label class="label">Catégorie</label>
              <select class="input" [(ngModel)]="category">
                <option value="endurance">Endurance</option>
                <option value="vma">VMA</option>
                <option value="threshold">Seuil</option>
                <option value="race_pace">Allure course</option>
                <option value="hills">Côtes</option>
                <option value="strength">Renfo</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label class="label">Difficulté attendue</label>
              <select class="input" [(ngModel)]="expectedDifficulty">
                @for (n of scale10; track n) {
                  <option [ngValue]="n">{{ n }}/10</option>
                }
              </select>
            </div>
          </div>
          <label class="label">Nom</label>
          <input class="input" [(ngModel)]="name" placeholder="VMA 10 × 400" />
          <label class="label">Consigne pour l'athlète <span class="muted">(optionnel)</span></label>
          <input class="input" [(ngModel)]="instructions" placeholder="Récup trottinée, on ne force pas sur les 2 premières" />
        </section>

        @if (type === 'run') {
          <section class="card">
            <h2>Blocs</h2>
            @for (block of blocks; track $index; let bi = $index) {
              <div class="block" [class.repeat]="block.repeat">
                @if (block.repeat) {
                  <div class="repeat-head">
                    <span class="badge">Répéter</span>
                    <input class="input tiny" type="number" min="2" max="50" [(ngModel)]="block.count" />
                    <span class="muted">fois</span>
                    <button class="link-btn" type="button" (click)="addStep(block)">+ sous-bloc</button>
                    <button class="link-btn danger" type="button" (click)="removeBlock(bi)">retirer</button>
                  </div>
                }
                @for (step of block.steps; track $index; let si = $index) {
                  <div class="step">
                    <select class="input" [(ngModel)]="step.kind">
                      @for (k of kinds; track k[0]) {
                        <option [value]="k[0]">{{ k[1] }}</option>
                      }
                    </select>
                    <select class="input" [(ngModel)]="step.mode">
                      <option value="duration">Durée</option>
                      <option value="distance">Distance</option>
                    </select>
                    @if (step.mode === 'duration') {
                      <span class="unit"><input class="input tiny" type="number" min="1" [(ngModel)]="step.durationMin" /> min</span>
                    } @else {
                      <span class="unit"><input class="input tiny" type="number" min="50" step="50" [(ngModel)]="step.distanceM" /> m</span>
                    }
                    <select class="input" [(ngModel)]="step.targetType">
                      <option value="vmaPct">% VMA</option>
                      <option value="zone">Zone</option>
                      <option value="pace">Allure</option>
                      <option value="racePace">Allure course</option>
                      <option value="free">Libre</option>
                    </select>
                    @switch (step.targetType) {
                      @case ('vmaPct') {
                        <span class="unit">
                          <input class="input tiny" type="number" min="30" max="130" [(ngModel)]="step.minPct" />–<input class="input tiny" type="number" min="30" max="130" [(ngModel)]="step.maxPct" /> %
                        </span>
                      }
                      @case ('zone') {
                        <select class="input tiny" [(ngModel)]="step.zone">
                          @for (z of scale5; track z) {
                            <option [ngValue]="z">Z{{ z }}</option>
                          }
                        </select>
                      }
                      @case ('pace') {
                        <span class="unit">
                          <input class="input pace" [(ngModel)]="step.minPace" placeholder="4:10" />–<input class="input pace" [(ngModel)]="step.maxPace" placeholder="4:20" /> /km
                        </span>
                      }
                      @case ('racePace') {
                        <select class="input" [(ngModel)]="step.race">
                          <option value="10k">10 km</option>
                          <option value="half">Semi</option>
                          <option value="marathon">Marathon</option>
                        </select>
                      }
                    }
                    @if (!block.repeat) {
                      <button class="link-btn danger" type="button" (click)="removeBlock(bi)">retirer</button>
                    } @else if (block.steps.length > 1) {
                      <button class="link-btn danger" type="button" (click)="block.steps.splice(si, 1)">×</button>
                    }
                  </div>
                }
              </div>
            }
            <div class="add-row">
              <button class="btn btn-ghost" type="button" (click)="addBlock(false)">+ Bloc</button>
              <button class="btn btn-ghost" type="button" (click)="addBlock(true)">+ Bloc répété</button>
            </div>
          </section>
        } @else {
          <section class="card">
            <h2>Exercices</h2>
            @for (item of exercisesDraft; track $index; let ei = $index) {
              <div class="step">
                <select class="input wide" [(ngModel)]="item.exerciseId">
                  <option value="">Choisir un exercice…</option>
                  @for (e of catalog(); track e.id) {
                    <option [value]="e.id">{{ e.name }}</option>
                  }
                </select>
                <span class="unit"><input class="input tiny" type="number" min="1" max="20" [(ngModel)]="item.sets" /> ×</span>
                <select class="input" [(ngModel)]="item.mode">
                  <option value="reps">reps</option>
                  <option value="duration">secondes</option>
                </select>
                @if (item.mode === 'reps') {
                  <input class="input tiny" type="number" min="1" max="100" [(ngModel)]="item.reps" />
                } @else {
                  <input class="input tiny" type="number" min="5" max="600" [(ngModel)]="item.durationSec" />
                }
                <select class="input" [(ngModel)]="item.loadType">
                  <option value="pctRm">% 1RM</option>
                  <option value="absolute">kg</option>
                  <option value="bodyweight">Poids du corps</option>
                </select>
                @if (item.loadType === 'pctRm') {
                  <span class="unit"><input class="input tiny" type="number" min="10" max="120" [(ngModel)]="item.pct" /> %</span>
                } @else if (item.loadType === 'absolute') {
                  <span class="unit"><input class="input tiny" type="number" min="1" max="500" step="2.5" [(ngModel)]="item.kg" /> kg</span>
                }
                <span class="unit">repos <input class="input tiny" type="number" min="0" max="600" step="15" [(ngModel)]="item.restSec" /> s</span>
                <button class="link-btn danger" type="button" (click)="exercisesDraft.splice(ei, 1)">retirer</button>
              </div>
            }
            <div class="add-row">
              <button class="btn btn-ghost" type="button" (click)="addExercise()">+ Exercice</button>
            </div>
          </section>
        }

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        <div class="actions">
          <button class="btn" type="button" [disabled]="busy()" (click)="save()">Enregistrer le modèle</button>
        </div>
      </div>

      <aside class="card preview">
        <h2>Aperçu</h2>
        <select class="input" [ngModel]="previewAthleteId()" (ngModelChange)="setPreviewAthlete($event)">
          <option value="">Choisir un athlète…</option>
          @for (a of roster(); track a.id) {
            <option [value]="a.id">{{ a.firstName }} {{ a.lastName }}</option>
          }
        </select>
        @if (previewAthleteId()) {
          <button class="btn btn-ghost refresh" type="button" (click)="refreshPreview()">Recalculer</button>
        }
        @if (previewResult(); as p) {
          <dl>
            @if (p.vmaKmh != null) {
              <div><dt>VMA</dt><dd>{{ p.vmaKmh }} km/h</dd></div>
            }
            @if (p.estDurationMin != null) {
              <div><dt>Durée estimée</dt><dd>{{ p.estDurationMin }} min</dd></div>
            }
            @if (p.estLoadUa != null) {
              <div><dt>Charge estimée</dt><dd>{{ p.estLoadUa }} UA</dd></div>
            }
          </dl>
          @if (p.paces?.length) {
            <h3 class="muted">Allures résolues</h3>
            @for (pace of p.paces; track pace.blockPath) {
              <div class="pace-row">
                <span class="muted">bloc {{ pace.blockPath }}</span>
                <strong>{{ fmt(pace.minSecPerKm) }} – {{ fmt(pace.maxSecPerKm) }}</strong>
              </div>
            }
          }
          @if (p.loads?.length) {
            <h3 class="muted">Charges résolues</h3>
            @for (load of p.loads; track load.exerciseId) {
              <div class="pace-row">
                <span class="muted">{{ exerciseName(load.exerciseId) }}</span>
                <strong>{{ load.kg }} kg <span class="muted">(1RM {{ load.rmSourceKg }})</span></strong>
              </div>
            }
          }
        } @else if (previewAthleteId()) {
          <p class="muted">Complétez la séance pour voir les valeurs.</p>
        } @else {
          <p class="muted">L'aperçu convertit la séance dans les allures et charges de l'athlète choisi.</p>
        }
      </aside>
    </div>
  `,
  styles: `
    .back { display: inline-block; margin-bottom: 12px; font-size: 13px; }
    .grid { display: grid; grid-template-columns: 1fr 280px; gap: 16px; align-items: start; }
    .main { display: flex; flex-direction: column; gap: 16px; }
    .row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .block { border: 1px solid var(--line); border-radius: var(--radius-control); padding: 10px; margin-bottom: 10px; }
    .block.repeat { border-color: var(--accent); }
    .repeat-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .step { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 6px 0; }
    .step .input { width: auto; }
    .input.tiny { width: 64px; }
    .input.pace { width: 64px; }
    .input.wide { min-width: 180px; }
    .unit { display: inline-flex; align-items: center; gap: 4px; color: var(--ink2); font-size: 13px; }
    .link-btn { background: none; border: none; color: var(--accent-ink); font-family: inherit; font-size: 12px; cursor: pointer; padding: 2px 4px; }
    .link-btn.danger { color: var(--bad); }
    .add-row { display: flex; gap: 8px; margin-top: 6px; }
    .actions { display: flex; justify-content: flex-end; }
    .preview dl { margin: 12px 0; display: grid; gap: 6px; }
    .preview dl div { display: flex; justify-content: space-between; }
    .preview dt { color: var(--ink2); font-size: 13px; }
    .preview dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; }
    .preview h3 { font-size: 12px; margin: 14px 0 6px; text-transform: uppercase; letter-spacing: 0.04em; }
    .pace-row { display: flex; justify-content: space-between; padding: 4px 0; font-variant-numeric: tabular-nums; }
    .refresh { width: 100%; justify-content: center; margin-top: 10px; font-size: 13px; padding: 7px 12px; }
  `,
})
export class TemplateEditorPage implements OnInit {
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);

  readonly kinds = KIND_LABELS;
  readonly scale10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  readonly scale5 = [1, 2, 3, 4, 5];

  type: 'run' | 'strength' = 'run';
  category: SessionTemplateCreate['category'] = 'endurance';
  expectedDifficulty = 5;
  name = '';
  instructions = '';
  blocks: BlockDraft[] = [this.newBlock(false)];
  exercisesDraft: ExerciseDraft[] = [];

  readonly catalog = signal<Exercise[]>([]);
  readonly roster = signal<AthleteListItem[]>([]);
  readonly previewAthleteId = signal('');
  readonly previewResult = signal<ResolvedPreview | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const [catalog, roster] = await Promise.all([
      this.api.get<Exercise[]>('/exercises'),
      this.api.get<Page<AthleteListItem>>('/athletes'),
    ]);
    this.catalog.set(catalog);
    this.roster.set(roster.items);
  }

  addBlock(repeat: boolean): void {
    this.blocks.push(this.newBlock(repeat));
  }

  removeBlock(index: number): void {
    this.blocks.splice(index, 1);
  }

  addStep(block: BlockDraft): void {
    block.steps.push(this.newStep('recovery'));
  }

  addExercise(): void {
    this.exercisesDraft.push({
      exerciseId: '',
      sets: 3,
      mode: 'reps',
      reps: 10,
      durationSec: 45,
      loadType: 'pctRm',
      pct: 70,
      kg: 40,
      restSec: 90,
    });
  }

  fmt(secPerKm: number): string {
    return formatPace(secPerKm);
  }

  exerciseName(id: string): string {
    return this.catalog().find((e) => e.id === id)?.name ?? '';
  }

  async setPreviewAthlete(id: string): Promise<void> {
    this.previewAthleteId.set(id);
    await this.refreshPreview();
  }

  async refreshPreview(): Promise<void> {
    const athleteId = this.previewAthleteId();
    if (!athleteId) return;
    const content = this.buildContent();
    if (!content) {
      this.previewResult.set(null);
      return;
    }
    try {
      this.previewResult.set(
        await this.api.post<ResolvedPreview>('/sessions/preview', {
          athleteId,
          expectedDifficulty: this.expectedDifficulty,
          blocks: this.type === 'run' ? content.blocks : null,
          exercises: this.type === 'strength' ? content.exercises : null,
        }),
      );
    } catch {
      this.previewResult.set(null);
    }
  }

  async save(): Promise<void> {
    this.error.set(null);
    const content = this.buildContent();
    if (!content) {
      this.error.set('Complétez la séance : chaque bloc a besoin d’une durée ou d’une distance, chaque exercice d’un choix.');
      return;
    }
    const dto = {
      type: this.type,
      name: this.name.trim(),
      category: this.category,
      expectedDifficulty: this.expectedDifficulty,
      instructions: this.instructions.trim() || null,
      estDurationMin: null,
      estDistanceKm: null,
      blocks: this.type === 'run' ? content.blocks : null,
      exercises: this.type === 'strength' ? content.exercises : null,
    };
    const parsed = zSessionTemplateCreate.safeParse(dto);
    if (!parsed.success) {
      this.error.set(this.name.trim() ? 'Séance incomplète — vérifiez les blocs et cibles.' : 'Donnez un nom à la séance.');
      return;
    }
    this.busy.set(true);
    try {
      await this.api.post('/templates', parsed.data);
      await this.router.navigate(['/bibliotheque']);
    } catch {
      this.error.set('Enregistrement impossible. Réessayez.');
    } finally {
      this.busy.set(false);
    }
  }

  private buildContent(): { blocks: RunBlock[]; exercises: StrengthItem[] } | null {
    if (this.type === 'run') {
      if (this.blocks.length === 0) return null;
      const blocks: RunBlock[] = [];
      for (const draft of this.blocks) {
        const steps = draft.steps.map((s) => this.toStep(s));
        if (steps.some((s) => s == null)) return null;
        if (draft.repeat) {
          blocks.push({ kind: 'repeat', count: draft.count, children: steps as RunStep[] });
        } else {
          blocks.push((steps as RunStep[])[0]);
        }
      }
      return { blocks, exercises: [] };
    }
    if (this.exercisesDraft.length === 0 || this.exercisesDraft.some((e) => !e.exerciseId)) return null;
    const exercises: StrengthItem[] = this.exercisesDraft.map((e, i) => ({
      exerciseId: e.exerciseId,
      order: i,
      sets: e.sets,
      reps: e.mode === 'reps' ? e.reps : null,
      durationSec: e.mode === 'duration' ? e.durationSec : null,
      perSide: false,
      load:
        e.loadType === 'pctRm'
          ? { type: 'pctRm', pct: e.pct }
          : e.loadType === 'absolute'
            ? { type: 'absolute', kg: e.kg }
            : { type: 'bodyweight' },
      restSec: e.restSec,
      supersetGroup: null,
      note: null,
    }));
    return { blocks: [], exercises };
  }

  private toStep(draft: StepDraft): RunStep | null {
    const durationSec = draft.mode === 'duration' ? Math.round(draft.durationMin * 60) : null;
    const distanceM = draft.mode === 'distance' ? draft.distanceM : null;
    if (!durationSec && !distanceM) return null;
    let target: RunStep['target'];
    switch (draft.targetType) {
      case 'vmaPct':
        target = { type: 'vmaPct', minPct: draft.minPct, maxPct: draft.maxPct };
        break;
      case 'zone':
        target = { type: 'zone', zone: draft.zone };
        break;
      case 'pace': {
        const min = parsePace(draft.minPace);
        const max = parsePace(draft.maxPace);
        if (min == null || max == null) return null;
        target = { type: 'pace', minSecPerKm: min, maxSecPerKm: max };
        break;
      }
      case 'racePace':
        target = { type: 'racePace', race: draft.race };
        break;
      default:
        target = { type: 'free' };
    }
    return { kind: draft.kind, durationSec, distanceM, target, note: draft.note.trim() || null };
  }

  private newBlock(repeat: boolean): BlockDraft {
    return {
      repeat,
      count: 10,
      steps: repeat
        ? [this.newStep('work'), this.newStep('recovery')]
        : [this.newStep('work')],
    };
  }

  private newStep(kind: StepDraft['kind']): StepDraft {
    return {
      kind,
      mode: 'duration',
      durationMin: kind === 'warmup' ? 20 : kind === 'cooldown' ? 10 : 10,
      distanceM: 400,
      targetType: kind === 'work' ? 'vmaPct' : kind === 'recovery' ? 'free' : 'zone',
      minPct: 95,
      maxPct: 100,
      zone: 2,
      minPace: '',
      maxPace: '',
      race: '10k',
      note: '',
    };
  }
}

function parsePace(value: string): number | null {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}
