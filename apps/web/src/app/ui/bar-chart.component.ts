import { Component, computed, input } from '@angular/core';

interface Bar {
  x: number;
  width: number;
  top: number;
  bottom: number;
  radius: number;
  value: number;
  label: string;
  current: boolean;
  labelX: number;
}

@Component({
  selector: 'ui-bar-chart',
  template: `
    <svg width="100%" [attr.viewBox]="'0 0 ' + w() + ' ' + h()" style="display: block; font-family: inherit">
      @for (g of gridLines(); track g.value) {
        <line [attr.x1]="padL" [attr.x2]="w() - 8" [attr.y1]="g.y" [attr.y2]="g.y" stroke="var(--line)" stroke-width="1" />
        <text [attr.x]="padL - 8" [attr.y]="g.y + 4" text-anchor="end" font-size="11" fill="var(--ink3)">{{ g.value }}</text>
      }
      @for (b of bars(); track b.x) {
        <path
          [attr.d]="barPath(b)"
          [attr.fill]="b.current ? 'var(--accent-soft)' : 'var(--accent)'"
          [attr.stroke]="b.current ? 'var(--accent)' : null"
          [attr.stroke-dasharray]="b.current ? '3 3' : null"
          [attr.stroke-width]="b.current ? 1.25 : null"
        />
        @if (b.current || b.value === maxValue()) {
          <text [attr.x]="b.labelX" [attr.y]="b.top - 6" text-anchor="middle" font-size="11" font-weight="500" fill="var(--ink2)">{{ b.value }}</text>
        }
        <text
          [attr.x]="b.labelX"
          [attr.y]="h() - 8"
          text-anchor="middle"
          font-size="11"
          [attr.fill]="b.current ? 'var(--ink)' : 'var(--ink3)'"
          [attr.font-weight]="b.current ? 600 : 400"
        >{{ b.label }}</text>
      }
    </svg>
  `,
})
export class BarChartComponent {
  readonly values = input.required<number[]>();
  readonly labels = input.required<string[]>();
  readonly w = input(700);
  readonly h = input(124);

  readonly padL = 34;
  private readonly padB = 26;
  private readonly padT = 14;

  readonly maxValue = computed(() => Math.max(1, ...this.values()));
  private readonly scaleMax = computed(() => {
    const raw = this.maxValue();
    const step = raw <= 20 ? 10 : raw <= 50 ? 25 : raw <= 100 ? 50 : raw <= 500 ? 100 : 200;
    return Math.ceil(raw / step) * step;
  });

  readonly gridLines = computed(() => {
    const max = this.scaleMax();
    return [0, max / 2, max].map((value) => ({ value: Math.round(value), y: this.y(value) }));
  });

  readonly bars = computed<Bar[]>(() => {
    const values = this.values();
    const gap = Math.max(6, Math.round((this.w() / Math.max(1, values.length)) * 0.28));
    const iw = this.w() - this.padL - 8;
    const bw = (iw - gap * (values.length - 1)) / Math.max(1, values.length);
    return values.map((value, i) => {
      const x = this.padL + i * (bw + gap);
      return {
        x,
        width: bw,
        top: this.y(value),
        bottom: this.padT + this.ih(),
        radius: Math.min(4, bw / 2),
        value,
        label: this.labels()[i] ?? '',
        current: i === values.length - 1,
        labelX: x + bw / 2,
      };
    });
  });

  barPath(b: Bar): string {
    const top = Math.min(b.top, b.bottom - 1);
    return `M${b.x} ${b.bottom} V${top + b.radius} a${b.radius} ${b.radius} 0 0 1 ${b.radius} -${b.radius} h${b.width - 2 * b.radius} a${b.radius} ${b.radius} 0 0 1 ${b.radius} ${b.radius} V${b.bottom} z`;
  }

  private ih(): number {
    return this.h() - this.padT - this.padB;
  }

  private y(value: number): number {
    return this.padT + this.ih() - (value / this.scaleMax()) * this.ih();
  }
}
