import { Component, computed, input } from '@angular/core';

const PALETTE: [string, string][] = [
  ['var(--accent-soft)', 'var(--accent-ink)'],
  ['#E3F1E6', '#1E7A46'],
  ['#FCE9D9', '#B8561E'],
  ['#EFE4FA', '#6B3FA0'],
  ['#FDF0C9', '#946B00'],
  ['#DDEFF5', '#1E6F86'],
  ['#F4E2E2', '#A8362E'],
  ['#E6E9EE', '#4A5560'],
];

export function initialsOf(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

@Component({
  selector: 'ui-avatar',
  template: `
    <span
      class="avatar"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.background]="colors()[0]"
      [style.color]="colors()[1]"
      [style.font-size.px]="fontSize()"
    >{{ initials() }}</span>
  `,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly size = input(36);
  readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/);
    return `${parts[0]?.charAt(0) ?? ''}${parts[1]?.charAt(0) ?? ''}`.toUpperCase();
  });
  readonly colors = computed(() => {
    const ini = this.initials();
    const hash = (ini.charCodeAt(0) * 31 + (ini.charCodeAt(1) || 0)) % PALETTE.length;
    return PALETTE[hash] ?? PALETTE[0];
  });
  readonly fontSize = computed(() => Math.round(this.size() * 0.36));
}
