import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { AthleteListItem, Group, InviteCodeInfo, Page } from '@kadro/shared';
import { ApiClient } from '../core/api-client';
import { AvatarComponent } from '../ui/avatar.component';
import { IconComponent } from '../ui/icon.component';
import { StatusPillComponent } from '../ui/status-pill.component';

const COLS = '1.5fr 1fr 0.8fr 0.9fr 0.95fr 1.3fr 1.1fr';

@Component({
  selector: 'app-athletes-page',
  imports: [FormsModule, RouterLink, AvatarComponent, IconComponent, StatusPillComponent],
  template: `
    <header class="row head">
      <div class="head-txt">
        <h1>Athlètes</h1>
        <div class="muted sub">{{ all().length }} athlète{{ all().length > 1 ? 's' : '' }} · {{ groups().length }} groupe{{ groups().length > 1 ? 's' : '' }}</div>
      </div>
      <div class="input search">
        <ui-icon name="search" [size]="18" />
        <input [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Rechercher un athlète" />
      </div>
      <a class="btn primary" routerLink="/equipe"><ui-icon name="link" [size]="18" [sw]="2" />Inviter un athlète</a>
    </header>
    <div class="row cols">
      <aside class="col facets">
        <div class="label pad">Groupes</div>
        <button class="facet row" type="button" [class.on]="groupFilter() === null" (click)="groupFilter.set(null)">
          <span>Tous</span><span class="faint num">{{ all().length }}</span>
        </button>
        @for (g of groups(); track g.id) {
          <button class="facet row" type="button" [class.on]="groupFilter() === g.id" (click)="groupFilter.set(g.id)">
            <span class="ellip">{{ g.name }}</span><span class="faint num">{{ countIn(g.id) }}</span>
          </button>
        }
        <div class="label pad top">Filtres rapides</div>
        <button class="facet row" type="button" [class.on]="quickFilter() === 'attention'" (click)="toggleQuick('attention')">
          <span>À traiter</span><span class="faint num">{{ attentionCount() }}</span>
        </button>
        <button class="facet row" type="button" [class.on]="quickFilter() === 'nocheckin'" (click)="toggleQuick('nocheckin')">
          <span>Sans check-in</span><span class="faint num">{{ noCheckinCount() }}</span>
        </button>
      </aside>
      <section class="card table-card">
        <div class="section-head"><h2>Tous les athlètes</h2>
          @if (invite(); as info) {
            <span class="faint small-txt">Code d'équipe : <span class="num strong-code">{{ info.code }}</span></span>
          }
        </div>
        <div class="table-head" [style.grid-template-columns]="cols">
          <div>Athlète</div><div>Forme</div><div>Sommeil 7 j</div><div>Charge 7 j</div><div>Adhérence</div><div>Objectif</div><div>Dernière activité</div>
        </div>
        @for (a of filtered(); track a.id) {
          <a class="table-row" [style.grid-template-columns]="cols" [routerLink]="['/athletes', a.id]">
            <div class="row name-cell"><ui-avatar [name]="a.firstName + ' ' + a.lastName" [size]="30" /><span class="ellip strong">{{ a.firstName }} {{ a.lastName }}</span></div>
            <div><ui-status-pill [level]="a.formStatus" /></div>
            <div class="num muted">{{ sleep(a) }}</div>
            <div class="row bar-cell">
              <span class="meter load"><span [style.width.%]="loadPct(a)" style="background: var(--accent)"></span></span>
              <span class="num muted">{{ a.acuteChronicRatio ?? '—' }}</span>
            </div>
            <div class="row bar-cell">
              <span class="meter"><span [style.width.%]="a.adherence7d ?? 0" [style.background]="(a.adherence7d ?? 100) < 75 ? 'var(--warn)' : 'var(--ink)'"></span></span>
              <span class="num muted">{{ a.adherence7d != null ? a.adherence7d + ' %' : '—' }}</span>
            </div>
            <div class="ellip">{{ a.goalLabel ?? '—' }}</div>
            <div class="muted ellip">{{ lastActivity(a) }}</div>
          </a>
        }
        @if (filtered().length === 0) {
          <p class="muted empty">Aucun athlète ne correspond. Partagez votre code d'équipe pour inviter.</p>
        }
      </section>
    </div>
  `,
  styles: `
    .head { gap: 16px; }
    .head-txt { flex: 1 1 auto; }
    .sub { margin-top: 4px; }
    .search { width: 260px; }
    .search input { border: none; outline: none; background: transparent; color: var(--ink); font-family: inherit; font-size: 14px; flex: 1 1 auto; min-width: 0; }
    .cols { gap: 20px; align-items: flex-start; }
    .facets { width: 200px; flex: 0 0 auto; gap: 4px; }
    .label.pad { padding: 4px 12px 6px; }
    .label.top { padding-top: 16px; }
    .facet { gap: 8px; height: 36px; padding: 0 12px; border-radius: 9px; font-size: 13.5px; font-weight: 500; color: var(--ink2); background: transparent; border: none; font-family: inherit; cursor: pointer; text-align: left; }
    .facet span:first-child { flex: 1 1 auto; }
    .facet.on { background: var(--nav-active); color: var(--ink); }
    .table-card { flex: 1 1 auto; min-width: 0; overflow: hidden; }
    .small-txt { font-size: 12.5px; }
    .strong-code { font-weight: 600; letter-spacing: 0.06em; color: var(--ink); }
    .name-cell { gap: 10px; min-width: 0; }
    .strong { font-weight: 500; }
    .bar-cell { gap: 8px; }
    .meter { display: block; width: 72px; }
    .meter.load { width: 56px; }
    .meter span { display: block; }
    .empty { padding: 14px 16px; margin: 0; font-size: 13px; }
  `,
})
export class AthletesPage implements OnInit {
  private readonly api = inject(ApiClient);
  readonly all = signal<AthleteListItem[]>([]);
  readonly groups = signal<Group[]>([]);
  readonly invite = signal<InviteCodeInfo | null>(null);
  readonly query = signal('');
  readonly groupFilter = signal<string | null>(null);
  readonly quickFilter = signal<'attention' | 'nocheckin' | null>(null);
  readonly cols = COLS;

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.all().filter((a) => {
      if (this.groupFilter() && !a.groupIds.includes(this.groupFilter()!)) return false;
      if (this.quickFilter() === 'attention' && a.formStatus !== 'warn' && a.formStatus !== 'bad') return false;
      if (this.quickFilter() === 'nocheckin' && a.formStatus !== 'none') return false;
      if (q && !`${a.firstName} ${a.lastName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  readonly attentionCount = computed(
    () => this.all().filter((a) => a.formStatus === 'warn' || a.formStatus === 'bad').length,
  );
  readonly noCheckinCount = computed(() => this.all().filter((a) => a.formStatus === 'none').length);

  async ngOnInit(): Promise<void> {
    const [roster, groups, invite] = await Promise.all([
      this.api.get<Page<AthleteListItem>>('/athletes?limit=100&sort=name'),
      this.api.get<Group[]>('/groups'),
      this.api.get<InviteCodeInfo>('/team/invite-code'),
    ]);
    this.all.set(roster.items);
    this.groups.set(groups);
    this.invite.set(invite);
  }

  toggleQuick(filter: 'attention' | 'nocheckin'): void {
    this.quickFilter.update((current) => (current === filter ? null : filter));
  }

  countIn(groupId: string): number {
    return this.all().filter((a) => a.groupIds.includes(groupId)).length;
  }

  loadPct(a: AthleteListItem): number {
    if (a.acuteChronicRatio == null) return 0;
    return Math.min(100, Math.round((a.acuteChronicRatio / 1.5) * 100));
  }

  sleep(a: AthleteListItem): string {
    if (a.sleepAvg7dMin == null) return '—';
    return `${Math.floor(a.sleepAvg7dMin / 60)} h ${String(a.sleepAvg7dMin % 60).padStart(2, '0')}`;
  }

  lastActivity(a: AthleteListItem): string {
    if (!a.lastActivityAt) return '—';
    const days = Math.floor((Date.now() - new Date(a.lastActivityAt).getTime()) / 86400000);
    return days === 0 ? "Aujourd'hui" : days === 1 ? 'Hier' : `Il y a ${days} j`;
  }
}
