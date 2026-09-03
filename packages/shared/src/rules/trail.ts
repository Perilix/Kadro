export function gradeCostFactor(gradePct: number): number {
  const g = Math.max(-30, Math.min(30, gradePct));
  return 1 + 0.03 * g + 0.0018 * g * g;
}

export function gapPaceSecPerKm(paceSecPerKm: number, gradePct: number): number {
  if (paceSecPerKm <= 0) throw new RangeError('paceSecPerKm doit être > 0');
  return paceSecPerKm / gradeCostFactor(gradePct);
}

export function ascentSpeedMPerH(elevGainM: number, durationSec: number): number {
  if (elevGainM < 0) throw new RangeError('elevGainM doit être ≥ 0');
  if (durationSec <= 0) throw new RangeError('durationSec doit être > 0');
  return Math.round((elevGainM / durationSec) * 3600);
}

export type HrZonesSec = [number, number, number, number, number];

export function hrTimeInZonesSec(
  tSec: number[],
  hrBpm: (number | null)[],
  hrMaxBpm: number,
): HrZonesSec {
  if (hrMaxBpm <= 0) throw new RangeError('hrMaxBpm doit être > 0');
  const thresholds = [0.7, 0.8, 0.86, 0.93].map((f) => hrMaxBpm * f);
  const zones: HrZonesSec = [0, 0, 0, 0, 0];
  for (let i = 0; i < tSec.length; i += 1) {
    const hr = hrBpm[i];
    if (hr == null) continue;
    const dt =
      i + 1 < tSec.length
        ? tSec[i + 1]! - tSec[i]!
        : i > 0
          ? tSec[i]! - tSec[i - 1]!
          : 0;
    if (dt <= 0) continue;
    const zone = thresholds.filter((th) => hr >= th).length;
    zones[zone as 0 | 1 | 2 | 3 | 4] += dt;
  }
  return zones.map((v) => Math.round(v)) as HrZonesSec;
}
