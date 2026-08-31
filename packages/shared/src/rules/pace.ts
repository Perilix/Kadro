/** VMA → allures. La VMA est en km/h, les allures en secondes par km. */

/** Allure (s/km) à un pourcentage de VMA. Ex. VMA 16,5 à 100 % → 218 s/km (3:38). */
export function paceSecPerKm(vmaKmh: number, pctVma: number): number {
  if (vmaKmh <= 0) throw new RangeError('vmaKmh doit être > 0');
  if (pctVma <= 0) throw new RangeError('pctVma doit être > 0');
  return 3600 / (vmaKmh * (pctVma / 100));
}

export interface PaceRange {
  /** Borne rapide (pct max) — la plus petite valeur en s/km. */
  fastSecPerKm: number;
  /** Borne lente (pct min). */
  slowSecPerKm: number;
}

/** Fourchette d'allure pour une cible « 85 – 88 % VMA ». */
export function paceRange(vmaKmh: number, minPct: number, maxPct: number): PaceRange {
  if (minPct > maxPct) throw new RangeError('minPct > maxPct');
  return {
    fastSecPerKm: paceSecPerKm(vmaKmh, maxPct),
    slowSecPerKm: paceSecPerKm(vmaKmh, minPct),
  };
}

/** Temps cible (s) pour une distance donnée à un % de VMA. Ex. 400 m à 100 % de 16,5 → 87 s. */
export function targetTimeSec(vmaKmh: number, distanceM: number, pctVma: number): number {
  if (distanceM <= 0) throw new RangeError('distanceM doit être > 0');
  return paceSecPerKm(vmaKmh, pctVma) * (distanceM / 1000);
}

/** Formate des secondes en « m:ss » (218 → « 3:38 ») ou « h:mm:ss » au-delà de l'heure. */
export function formatDuration(totalSec: number): string {
  const s = Math.round(totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** Formate une allure en « m:ss /km ». */
export function formatPace(secPerKm: number): string {
  return `${formatDuration(secPerKm)} /km`;
}

export interface HrZone {
  zone: 1 | 2 | 3 | 4 | 5;
  minBpm: number;
  maxBpm: number;
}

/** Bornes de zones FC en % de FC max : Z1 55–70, Z2 70–80, Z3 80–86, Z4 86–93, Z5 93–100. */
const HR_BOUNDS: readonly [number, number][] = [
  [0.55, 0.7],
  [0.7, 0.8],
  [0.8, 0.86],
  [0.86, 0.93],
  [0.93, 1],
];

export function hrZonesFromMax(hrMaxBpm: number): HrZone[] {
  if (hrMaxBpm <= 0) throw new RangeError('hrMaxBpm doit être > 0');
  return HR_BOUNDS.map(([lo, hi], i) => ({
    zone: (i + 1) as HrZone['zone'],
    minBpm: Math.round(hrMaxBpm * lo),
    maxBpm: Math.round(hrMaxBpm * hi),
  }));
}
