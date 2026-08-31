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
import { AvatarComponent } from '../ui/avatar.component';
import { IconComponent } from '../ui/icon.component';

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
  imports: [FormsModule, RouterLink, AvatarComponent, IconComponent],
  template: `
    <div class="row crumb faint">
      <a routerLink="/bibliotheque" class="crumb-link">Bibliothèque</a>
      <ui-icon name="chevron" [size]="14" />
      <span class="crumb-here">Nouvelle séance</span>
    </div>
    <header class="row head">
      <h1 class="grow">Nouvelle séance</h1>
      <a class="btn" routerLink="/bibliotheque">Annuler</a>
      <button class="btn" type="button" [disabled]="busy()" (click)="saveTemplate()"><ui-icon name="library" [size]="18" />Enregistrer comme modèle</button>
      <button class="btn primary" type="button" [disabled]="busy() || !canAssign()" (click)="assign()"><ui-icon name="check" [size]="18" [sw]="2" />Assigner</button>
    </header>
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    @if (success()) {
      <p class="row ok"><ui-icon name="check" [size]="16" [sw]="2.25" />{{ success() }}</p>
    }
    <div class="row cols">
      <section class="card main col">
        <div class="row fields">
          <div class="col field grow"><span class="label">Nom de la séance</span>
            <input class="input" [(ngModel)]="name" placeholder="Seuil 3 × 8′" />
          </div>
          <div class="col field w-180"><span class="label">Type</span>
            <select class="input" [(ngModel)]="type" (ngModelChange)="previewResult.set(null)">
              <option value="run">Course à pied</option>
              <option value="strength">Renforcement</option>
            </select>
          </div>
          <div class="col field w-200"><span class="label">Catégorie</span>
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
        </div>
        <div class="col field">
          <span class="label">Difficulté attendue <span class="faint normal">· ce que l'athlète doit ressentir, comparé à son RPE après la séance</span></span>
          <div class="row chips">
            @for (n of scale10; track n) {
              <button class="chip num" type="button" [class.on]="expectedDifficulty === n" (click)="expectedDifficulty = n">{{ n }}</button>
            }
          </div>
        </div>

        @if (type === 'run') {
          <div class="col blocks">
            <div class="row"><span class="label grow">Blocs</span></div>
            @for (block of blocks; track $index; let bi = $index) {
              <div class="block col" [class.rep]="block.repeat">
                @if (block.repeat) {
                  <div class="row rep-head">
                    <span class="pill accent"><ui-icon name="repeat" [size]="13" />Répéter</span>
                    <input class="input tiny" type="number" min="2" max="50" [(ngModel)]="block.count" />
                    <span class="muted">fois</span>
                    <span class="grow"></span>
                    <button class="link-btn" type="button" (click)="addStep(block)">+ sous-bloc</button>
                    <button class="link-btn danger" type="button" (click)="removeBlock(bi)">retirer</button>
                  </div>
                }
                @for (step of block.steps; track $index; let si = $index) {
                  <div class="row step">
                    <span class="bar" [style.background]="step.kind === 'work' ? 'var(--accent)' : 'var(--line-strong)'"></span>
                    <select class="input auto" [(ngModel)]="step.kind">
                      @for (k of kinds; track k[0]) {
                        <option [value]="k[0]">{{ k[1] }}</option>
                      }
                    </select>
                    <select class="input auto" [(ngModel)]="step.mode">
                      <option value="duration">Durée</option>
                      <option value="distance">Distance</option>
                    </select>
                    @if (step.mode === 'duration') {
                      <span class="row unit"><input class="input tiny" type="number" min="1" [(ngModel)]="step.durationMin" />min</span>
                    } @else {
                      <span class="row unit"><input class="input tiny" type="number" min="50" step="50" [(ngModel)]="step.distanceM" />m</span>
                    }
                    <select class="input auto" [(ngModel)]="step.targetType">
                      <option value="vmaPct">% VMA</option>
                      <option value="zone">Zone</option>
                      <option value="pace">Allure</option>
                      <option value="racePace">Allure course</option>
                      <option value="free">Libre</option>
                    </select>
                    @switch (step.targetType) {
                      @case ('vmaPct') {
                        <span class="row unit"><input class="input tiny" type="number" min="30" max="130" [(ngModel)]="step.minPct" />–<input class="input tiny" type="number" min="30" max="130" [(ngModel)]="step.maxPct" />%</span>
                      }
                      @case ('zone') {
                        <select class="input tiny" [(ngModel)]="step.zone">
                          @for (z of scale5; track z) {
                            <option [ngValue]="z">Z{{ z }}</option>
                          }
                        </select>
                      }
                      @case ('pace') {
                        <span class="row unit"><input class="input pace" [(ngModel)]="step.minPace" placeholder="4:10" />–<input class="input pace" [(ngModel)]="step.maxPace" placeholder="4:20" />/km</span>
                      }
                      @case ('racePace') {
                        <select class="input auto" [(ngModel)]="step.race">
                          <option value="10k">10 km</option>
                          <option value="half">Semi</option>
                          <option value="marathon">Marathon</option>
                        </select>
                      }
                    }
                    <span class="grow"></span>
                    @if (!block.repeat) {
                      <button class="link-btn danger" type="button" (click)="removeBlock(bi)">retirer</button>
                    } @else if (block.steps.length > 1) {
                      <button class="link-btn danger" type="button" (click)="block.steps.splice(si, 1)">×</button>
                    }
                  </div>
                }
              </div>
            }
            <div class="row add-row">
              <button class="btn small" type="button" (click)="addBlock(false)"><ui-icon name="plus" [size]="16" />Bloc</button>
              <button class="btn small" type="button" (click)="addBlock(true)"><ui-icon name="repeat" [size]="16" />Répétition</button>
            </div>
          </div>
        } @else {
          <div class="col blocks">
            <div class="row"><span class="label grow">Exercices</span></div>
            @for (item of exercisesDraft; track $index; let ei = $index) {
              <div class="row step wrap">
                <span class="bar" style="background: var(--accent)"></span>
                <select class="input wide" [(ngModel)]="item.exerciseId">
                  <option value="">Choisir un exercice…</option>
                  @for (e of catalog(); track e.id) {
                    <option [value]="e.id">{{ e.name }}</option>
                  }
                </select>
                <span class="row unit"><input class="input tiny" type="number" min="1" max="20" [(ngModel)]="item.sets" />×</span>
                <select class="input auto" [(ngModel)]="item.mode">
                  <option value="reps">reps</option>
                  <option value="duration">secondes</option>
                </select>
                @if (item.mode === 'reps') {
                  <input class="input tiny" type="number" min="1" max="100" [(ngModel)]="item.reps" />
                } @else {
                  <input class="input tiny" type="number" min="5" max="600" [(ngModel)]="item.durationSec" />
                }
                <select class="input auto" [(ngModel)]="item.loadType">
                  <option value="pctRm">% 1RM</option>
                  <option value="absolute">kg</option>
                  <option value="bodyweight">Poids du corps</option>
                </select>
                @if (item.loadType === 'pctRm') {
                  <span class="row unit"><input class="input tiny" type="number" min="10" max="120" [(ngModel)]="item.pct" />%</span>
                } @else if (item.loadType === 'absolute') {
                  <span class="row unit"><input class="input tiny" type="number" min="1" max="500" step="2.5" [(ngModel)]="item.kg" />kg</span>
                }
                <span class="row unit muted">repos<input class="input tiny" type="number" min="0" max="600" step="15" [(ngModel)]="item.restSec" />s</span>
                <button class="link-btn danger" type="button" (click)="exercisesDraft.splice(ei, 1)">retirer</button>
              </div>
            }
            <div class="row add-row">
              <button class="btn small" type="button" (click)="addExercise()"><ui-icon name="plus" [size]="16" />Exercice</button>
            </div>
          </div>
        }

        <div class="row watch-note">
          <ui-icon name="clock" [size]="16" />
          <span class="grow">Envoyée sur la montre de chaque athlète la veille à 20 h, avec ses allures</span>
        </div>
        <div class="col field">
          <span class="label">Consigne pour l'athlète</span>
          <textarea class="input area" [(ngModel)]="instructions" placeholder="Tenir une allure régulière sur les trois blocs : le dernier doit être le plus facile mentalement, pas le plus rapide."></textarea>
        </div>
      </section>

      <aside class="side col">
        <section class="card pad">
          <div class="row card-head"><h2>Assigner à</h2><span class="faint tiny">{{ selectedAthletes().size }} sélectionné{{ selectedAthletes().size > 1 ? 's' : '' }}</span></div>
          @for (a of roster(); track a.id) {
            <label class="row a-row">
              <input type="checkbox" [checked]="selectedAthletes().has(a.id)" (change)="toggleAthlete(a.id)" />
              <ui-avatar [name]="a.firstName + ' ' + a.lastName" [size]="26" />
              <span class="grow strong">{{ a.firstName }} {{ a.lastName }}</span>
            </label>
          }
          <div class="col field top"><span class="label">Date</span>
            <input class="input" type="date" [(ngModel)]="assignDate" />
          </div>
          <label class="row keep">
            <input type="checkbox" [(ngModel)]="alsoSaveTemplate" />
            Enregistrer aussi comme modèle
          </label>
        </section>
        <section class="card pad">
          <div class="row card-head">
            <h2>Aperçu{{ previewName() ? ' · ' + previewName() : '' }}</h2>
            <select class="input mini" [ngModel]="previewAthleteId()" (ngModelChange)="setPreviewAthlete($event)">
              <option value="">Athlète…</option>
              @for (a of roster(); track a.id) {
                <option [value]="a.id">{{ a.firstName }}</option>
              }
            </select>
          </div>
          @if (previewResult(); as p) {
            <div class="col preview-rows">
              @if (p.vmaKmh != null) {
                <div class="row p-row"><span class="muted">VMA</span><span class="num strong">{{ p.vmaKmh }} km/h</span></div>
              }
              @for (pace of p.paces ?? []; track pace.blockPath) {
                <div class="row p-row"><span class="muted">Bloc {{ pace.blockPath }}</span><span class="num strong">{{ fmt(pace.minSecPerKm) }} – {{ fmt(pace.maxSecPerKm) }}</span></div>
              }
              @for (load of p.loads ?? []; track load.exerciseId) {
                <div class="row p-row"><span class="muted">{{ exerciseName(load.exerciseId) }}</span><span class="num strong">{{ load.kg }} kg <span class="faint normal">(1RM {{ load.rmSourceKg }})</span></span></div>
              }
              @if (p.estDurationMin != null) {
                <div class="row p-row"><span class="muted">Durée estimée</span><span class="num strong">≈ {{ p.estDurationMin }} min</span></div>
              }
              @if (p.estLoadUa != null) {
                <div class="row p-row"><span class="muted">Charge estimée</span><span class="num strong">{{ p.estLoadUa }} UA</span></div>
              }
            </div>
            <button class="btn small top" type="button" (click)="refreshPreview()">Recalculer</button>
          } @else if (previewAthleteId()) {
            <p class="muted tiny">Complétez la séance puis <button class="link-btn" type="button" (click)="refreshPreview()">recalculez</button>.</p>
          } @else {
            <p class="muted tiny">L'aperçu convertit la séance dans les allures et charges de l'athlète choisi.</p>
          }
        </section>
      </aside>
    </div>
  `,
  styles: `
    .crumb { gap: 6px; font-size: 13px; }
    .crumb-link { color: var(--ink2); }
    .crumb-here { color: var(--ink); }
    .head { gap: 10px; }
    .grow { flex: 1 1 auto; min-width: 0; }
    .ok { gap: 8px; margin: 0; color: var(--good); font-weight: 500; font-size: 13.5px; }
    .cols { gap: 20px; align-items: flex-start; }
    .main { flex: 1 1 auto; min-width: 0; padding: 20px 24px; gap: 18px; }
    .side { width: 380px; flex: 0 0 auto; gap: 16px; }
    .pad { padding: 16px 18px; }
    .card-head { gap: 10px; margin-bottom: 10px; }
    .card-head h2 { flex: 1 1 auto; }
    .tiny { font-size: 12.5px; }
    .normal { font-weight: 400; }
    .fields { gap: 14px; align-items: flex-end; }
    .field { gap: 6px; }
    .field.top { margin-top: 10px; }
    .w-180 { width: 180px; }
    .w-200 { width: 200px; }
    .chips { gap: 6px; flex-wrap: wrap; }
    .chip { width: 40px; height: 36px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; background: var(--surface); color: var(--ink2); border: 1px solid var(--line); font-family: inherit; cursor: pointer; }
    .chip.on { background: var(--btn-primary-bg); color: var(--btn-primary-ink); border-color: var(--btn-primary-bg); }
    .blocks { gap: 10px; }
    .block { gap: 6px; padding: 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--surface); }
    .block.rep { border-color: var(--accent); }
    .rep-head { gap: 8px; }
    .step { gap: 8px; flex-wrap: wrap; }
    .step .bar { width: 6px; height: 36px; border-radius: 99px; flex: 0 0 auto; }
    .input.auto { width: auto; }
    .input.tiny { width: 64px; }
    .input.pace { width: 68px; }
    .input.wide { width: 200px; }
    .input.mini { width: 110px; height: 32px; font-size: 13px; }
    .unit { gap: 4px; color: var(--ink2); font-size: 13px; }
    .link-btn { background: none; border: none; color: var(--accent-ink); font-family: inherit; font-size: 12px; cursor: pointer; padding: 2px 4px; }
    .link-btn.danger { color: var(--bad); }
    .add-row { gap: 8px; margin-top: 4px; }
    .watch-note { gap: 10px; padding: 10px 12px; border-radius: 10px; background: var(--surface2); font-size: 13px; color: var(--ink2); }
    .area { height: 64px; align-items: flex-start; padding: 10px 12px; resize: vertical; font-family: inherit; }
    .a-row { gap: 10px; padding: 8px 0; font-size: 13.5px; cursor: pointer; }
    .strong { font-weight: 500; }
    .keep { gap: 8px; font-size: 13px; margin-top: 10px; cursor: pointer; }
    .preview-rows { font-size: 13px; }
    .p-row { justify-content: space-between; padding: 8px 0; border-top: 1px solid var(--line); }
    .top { margin-top: 10px; }
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
  assignDate = new Date().toISOString().slice(0, 10);
  alsoSaveTemplate = false;
  blocks: BlockDraft[] = [this.newBlock(false)];
  exercisesDraft: ExerciseDraft[] = [];

  readonly catalog = signal<Exercise[]>([]);
  readonly roster = signal<AthleteListItem[]>([]);
  readonly selectedAthletes = signal(new Set<string>());
  readonly previewAthleteId = signal('');
  readonly previewResult = signal<ResolvedPreview | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const [catalog, roster] = await Promise.all([
      this.api.get<Exercise[]>('/exercises'),
      this.api.get<Page<AthleteListItem>>('/athletes?limit=100'),
    ]);
    this.catalog.set(catalog);
    this.roster.set(roster.items);
  }

  canAssign(): boolean {
    return this.selectedAthletes().size > 0 && Boolean(this.assignDate);
  }

  previewName(): string {
    const a = this.roster().find((x) => x.id === this.previewAthleteId());
    return a ? `${a.firstName} ${a.lastName}` : '';
  }

  toggleAthlete(id: string): void {
    const next = new Set(this.selectedAthletes());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedAthletes.set(next);
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
    const dto = this.buildDto();
    if (!dto) {
      this.previewResult.set(null);
      return;
    }
    try {
      this.previewResult.set(
        await this.api.post<ResolvedPreview>('/sessions/preview', {
          athleteId,
          expectedDifficulty: this.expectedDifficulty,
          blocks: dto.blocks,
          exercises: dto.exercises,
        }),
      );
    } catch {
      this.previewResult.set(null);
    }
  }

  async saveTemplate(): Promise<void> {
    const dto = this.validated();
    if (!dto) return;
    this.busy.set(true);
    try {
      await this.api.post('/templates', dto);
      await this.router.navigate(['/bibliotheque']);
    } catch {
      this.error.set('Enregistrement impossible. Réessayez.');
    } finally {
      this.busy.set(false);
    }
  }

  async assign(): Promise<void> {
    const dto = this.validated();
    if (!dto || !this.canAssign()) return;
    this.busy.set(true);
    try {
      await this.api.post('/sessions/assign', {
        session: dto,
        athleteIds: [...this.selectedAthletes()],
        date: this.assignDate,
        saveAsTemplate: this.alsoSaveTemplate,
      });
      this.success.set(
        `Séance assignée à ${this.selectedAthletes().size} athlète${this.selectedAthletes().size > 1 ? 's' : ''} — chacun reçoit ses allures.`,
      );
      setTimeout(() => void this.router.navigate(['/planning']), 900);
    } catch {
      this.error.set('Assignation impossible. Réessayez.');
    } finally {
      this.busy.set(false);
    }
  }

  private validated(): SessionTemplateCreate | null {
    this.error.set(null);
    const dto = this.buildDto();
    if (!dto) {
      this.error.set('Complétez la séance : chaque bloc a besoin d’une durée ou d’une distance, chaque exercice d’un choix.');
      return null;
    }
    const parsed = zSessionTemplateCreate.safeParse(dto);
    if (!parsed.success) {
      this.error.set(this.name.trim() ? 'Séance incomplète — vérifiez les blocs et cibles.' : 'Donnez un nom à la séance.');
      return null;
    }
    return parsed.data;
  }

  private buildDto(): SessionTemplateCreate | null {
    const base = {
      type: this.type,
      name: this.name.trim(),
      category: this.category,
      expectedDifficulty: this.expectedDifficulty,
      instructions: this.instructions.trim() || null,
      estDurationMin: null,
      estDistanceKm: null,
    };
    if (this.type === 'run') {
      if (this.blocks.length === 0) return null;
      const blocks: RunBlock[] = [];
      for (const draft of this.blocks) {
        const steps = draft.steps.map((s) => this.toStep(s));
        if (steps.some((s) => s == null)) return null;
        if (draft.repeat) blocks.push({ kind: 'repeat', count: draft.count, children: steps as RunStep[] });
        else blocks.push((steps as RunStep[])[0]!);
      }
      return { ...base, blocks, exercises: null } as SessionTemplateCreate;
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
    return { ...base, blocks: null, exercises } as SessionTemplateCreate;
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
      steps: repeat ? [this.newStep('work'), this.newStep('recovery')] : [this.newStep('work')],
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
