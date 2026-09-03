import { Component, computed, input } from '@angular/core';

export interface ChartBand {
  from: number;
  to: number;
}

export interface ChartYBand {
  from: number;
  to: number;
  label: string;
}

export interface ChartTick {
  x: number;
  label: string;
}

@Component({
  selector: 'ui-line-chart',
  template: `
    <svg width="100%" [attr.viewBox]="'0 0 ' + w() + ' ' + h()" style="display: block; font-family: inherit">
      @for (b of yBandRects(); track b.label) {
        @if (b.shaded) {
          <rect [attr.x]="padL" [attr.y]="b.top" [attr.width]="iw()" [attr.height]="b.height" fill="var(--surface2)" opacity="0.55" />
        }
        <text [attr.x]="w() - 4" [attr.y]="b.top + 11" text-anchor="end" font-size="10" fill="var(--ink3)">{{ b.label }}</text>
      }
      @for (b of bandRects(); track b.left) {
        <rect [attr.x]="b.left" [attr.y]="padT" [attr.width]="b.width" [attr.height]="ih()" fill="var(--accent-soft)" opacity="0.7" />
      }
      @for (g of gridLines(); track g.y) {
        <line [attr.x1]="padL" [attr.x2]="padL + iw()" [attr.y1]="g.y" [attr.y2]="g.y" stroke="var(--line)" stroke-width="1" />
        <text [attr.x]="padL - 8" [attr.y]="g.y + 4" text-anchor="end" font-size="11" fill="var(--ink3)" style="font-variant-numeric: tabular-nums">{{ g.label }}</text>
      }
      @for (t of tickMarks(); track t.px) {
        <text [attr.x]="t.px" [attr.y]="h() - 6" text-anchor="middle" font-size="11" fill="var(--ink3)" style="font-variant-numeric: tabular-nums">{{ t.label }}</text>
      }
      @if (area()) {
        @for (p of areaPaths(); track p) {
          <path [attr.d]="p" fill="var(--accent-soft)" />
        }
      }
      @for (p of linePaths(); track p) {
        <path [attr.d]="p" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round" />
      }
    </svg>
  `,
})
export class LineChartComponent {
  readonly xs = input.required<number[]>();
  readonly ys = input.required<(number | null)[]>();
  readonly w = input(700);
  readonly h = input(170);
  readonly yFmt = input<(v: number) => string>((v) => String(Math.round(v)));
  readonly ticks = input<ChartTick[]>([]);
  readonly bands = input<ChartBand[]>([]);
  readonly yBands = input<ChartYBand[]>([]);
  readonly invertY = input(false);
  readonly area = input(false);

  readonly padL = 48;
  readonly padT = 10;
  private readonly padR = 8;
  private readonly padB = 22;

  readonly iw = computed(() => this.w() - this.padL - this.padR);
  readonly ih = computed(() => this.h() - this.padT - this.padB);

  private readonly xDomain = computed<[number, number]>(() => {
    const xs = this.xs();
    if (xs.length === 0) return [0, 1];
    const min = Math.min(...xs);
    const max = Math.max(...xs);
    return max > min ? [min, max] : [min, min + 1];
  });

  private readonly yDomain = computed<[number, number]>(() => {
    const values = this.ys().filter((v): v is number => v != null);
    if (values.length === 0) return [0, 1];
    let min = Math.min(...values);
    let max = Math.max(...values);
    for (const band of this.yBands()) {
      min = Math.min(min, band.from);
      max = Math.max(max, band.to);
    }
    if (max === min) max = min + 1;
    const pad = (max - min) * 0.06;
    return [min - pad, max + pad];
  });

  private px(x: number): number {
    const [min, max] = this.xDomain();
    return this.padL + ((x - min) / (max - min)) * this.iw();
  }

  private py(y: number): number {
    const [min, max] = this.yDomain();
    const ratio = (y - min) / (max - min);
    return this.invertY()
      ? this.padT + ratio * this.ih()
      : this.padT + this.ih() - ratio * this.ih();
  }

  readonly gridLines = computed(() => {
    const [min, max] = this.yDomain();
    const fmt = this.yFmt();
    return [min, (min + max) / 2, max].map((value) => ({
      y: Math.round(this.py(value)),
      label: fmt(value),
    }));
  });

  readonly tickMarks = computed(() =>
    this.ticks().map((t) => ({ px: this.px(t.x), label: t.label })),
  );

  readonly bandRects = computed(() => {
    const [min, max] = this.xDomain();
    return this.bands()
      .map((b) => ({ from: Math.max(min, b.from), to: Math.min(max, b.to) }))
      .filter((b) => b.to > b.from)
      .map((b) => ({ left: this.px(b.from), width: this.px(b.to) - this.px(b.from) }));
  });

  readonly yBandRects = computed(() => {
    const [min, max] = this.yDomain();
    return this.yBands()
      .map((b, i) => ({ ...b, shaded: i % 2 === 0, from: Math.max(min, b.from), to: Math.min(max, b.to) }))
      .filter((b) => b.to > b.from)
      .map((b) => {
        const y1 = this.py(b.from);
        const y2 = this.py(b.to);
        return { label: b.label, shaded: b.shaded, top: Math.min(y1, y2), height: Math.abs(y1 - y2) };
      });
  });

  private readonly segments = computed(() => {
    const xs = this.xs();
    const ys = this.ys();
    const out: { x: number; y: number }[][] = [];
    let current: { x: number; y: number }[] = [];
    for (let i = 0; i < xs.length; i += 1) {
      const y = ys[i];
      if (y == null) {
        if (current.length > 1) out.push(current);
        current = [];
        continue;
      }
      current.push({ x: this.px(xs[i]!), y: this.py(y) });
    }
    if (current.length > 1) out.push(current);
    return out;
  });

  readonly linePaths = computed(() =>
    this.segments().map(
      (seg) => 'M' + seg.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L'),
    ),
  );

  readonly areaPaths = computed(() => {
    const bottom = this.padT + this.ih();
    return this.segments().map((seg) => {
      const line = seg.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L');
      const first = seg[0]!;
      const last = seg[seg.length - 1]!;
      return `M${first.x.toFixed(1)} ${bottom} L${line} L${last.x.toFixed(1)} ${bottom} z`;
    });
  });
}
