import type { RunBlock, RunStep, StrengthItem } from '../dto/session';
import { paceRange } from './pace';

export const ZONE_VMA_PCT: Record<number, [number, number]> = {
  1: [55, 65],
  2: [65, 75],
  3: [75, 85],
  4: [85, 95],
  5: [95, 105],
};

const FALLBACK_PACE_SEC_PER_KM = 360;

export interface ResolvedPace {
  blockPath: string;
  minSecPerKm: number;
  maxSecPerKm: number;
}

function stepPace(step: RunStep, vmaKmh: number | null): { min: number; max: number } | null {
  const t = step.target;
  if (t.type === 'pace') return { min: t.minSecPerKm, max: t.maxSecPerKm };
  if (vmaKmh == null) return null;
  if (t.type === 'vmaPct') {
    const r = paceRange(vmaKmh, t.minPct, t.maxPct);
    return { min: r.fastSecPerKm, max: r.slowSecPerKm };
  }
  if (t.type === 'zone') {
    const bounds = ZONE_VMA_PCT[t.zone];
    if (!bounds) return null;
    const r = paceRange(vmaKmh, bounds[0], bounds[1]);
    return { min: r.fastSecPerKm, max: r.slowSecPerKm };
  }
  return null;
}

export function resolveRunPaces(blocks: RunBlock[], vmaKmh: number | null): ResolvedPace[] {
  const paces: ResolvedPace[] = [];
  blocks.forEach((block, i) => {
    if (block.kind === 'repeat') {
      block.children.forEach((child, j) => {
        const p = stepPace(child, vmaKmh);
        if (p) paces.push({ blockPath: `${i}.${j}`, minSecPerKm: p.min, maxSecPerKm: p.max });
      });
    } else {
      const p = stepPace(block, vmaKmh);
      if (p) paces.push({ blockPath: `${i}`, minSecPerKm: p.min, maxSecPerKm: p.max });
    }
  });
  return paces;
}

function stepDurationSec(step: RunStep, vmaKmh: number | null): number {
  if (step.durationSec != null) return step.durationSec;
  const p = stepPace(step, vmaKmh);
  const secPerKm = p ? (p.min + p.max) / 2 : FALLBACK_PACE_SEC_PER_KM;
  return ((step.distanceM ?? 0) / 1000) * secPerKm;
}

export function estimateRunDurationSec(blocks: RunBlock[], vmaKmh: number | null): number {
  return Math.round(
    blocks.reduce((sum, block) => {
      if (block.kind === 'repeat') {
        return sum + block.count * block.children.reduce((s, c) => s + stepDurationSec(c, vmaKmh), 0);
      }
      return sum + stepDurationSec(block, vmaKmh);
    }, 0),
  );
}

const SEC_PER_REP = 3;

export function estimateStrengthDurationSec(items: StrengthItem[]): number {
  return Math.round(
    items.reduce((sum, item) => {
      const workSec = item.durationSec ?? (item.reps ?? 0) * SEC_PER_REP;
      const perSet = (item.perSide ? workSec * 2 : workSec) + item.restSec;
      return sum + item.sets * perSet;
    }, 0),
  );
}
