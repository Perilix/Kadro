import { Component, computed, input } from '@angular/core';

export const FORM_LEVELS: Record<string, { label: string; color: string; soft: string }> = {
  good: { label: 'Bonne forme', color: 'var(--good)', soft: 'var(--good-soft)' },
  warn: { label: 'À surveiller', color: 'var(--warn)', soft: 'var(--warn-soft)' },
  bad: { label: 'Fatigue', color: 'var(--bad)', soft: 'var(--bad-soft)' },
  none: { label: 'Pas de check-in', color: 'var(--ink3)', soft: 'var(--neutral-soft)' },
};

@Component({
  selector: 'ui-status-pill',
  template: `
    <span
      class="pill"
      [style.background]="def().soft"
      [style.color]="level() === 'none' ? 'var(--ink2)' : def().color"
    >
      <span class="dot" [style.background]="def().color"></span>{{ label() || def().label }}
    </span>
  `,
})
export class StatusPillComponent {
  readonly level = input.required<string>();
  readonly label = input('');
  readonly def = computed(() => FORM_LEVELS[this.level()] ?? FORM_LEVELS['none']);
}
