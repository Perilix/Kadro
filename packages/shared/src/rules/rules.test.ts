import { describe, expect, it } from 'vitest';
import {
  formatPace,
  formatDuration,
  hrZonesFromMax,
  paceRange,
  paceSecPerKm,
  paceTable,
  PACE_ZONES,
  targetTimeSec,
} from './pace';
import { epley1Rm, loadFromPctRm, tonnageKg } from './strength';
import { acuteChronicRatio, sessionLoadUa } from './load';
import { checkinLevel } from './checkin';

describe('VMA → allures (les chiffres de la maquette)', () => {
  it('Léa, VMA 16,5 à 100 % → 3:38 /km', () => {
    expect(formatPace(paceSecPerKm(16.5, 100))).toBe('3:38 /km');
  });
  it('Léa, 400 m à 100 % VMA → 1:27', () => {
    expect(formatDuration(targetTimeSec(16.5, 400, 100))).toBe('1:27');
  });
  it('Yanis, VMA 18 → 3:20 /km et 1:20 au 400 m', () => {
    expect(formatPace(paceSecPerKm(18, 100))).toBe('3:20 /km');
    expect(formatDuration(targetTimeSec(18, 400, 100))).toBe('1:20');
  });
  it('fourchette seuil 85–88 % : borne rapide < borne lente', () => {
    const r = paceRange(16.5, 85, 88);
    expect(r.fastSecPerKm).toBeLessThan(r.slowSecPerKm);
    expect(formatPace(r.fastSecPerKm)).toBe('4:08 /km');
    expect(formatPace(r.slowSecPerKm)).toBe('4:17 /km');
  });
  it('zones FC sur FC max 192 : Z5 démarre à 179', () => {
    const zones = hrZonesFromMax(192);
    expect(zones).toHaveLength(5);
    expect(zones[4]?.minBpm).toBe(179);
    expect(zones[4]?.maxBpm).toBe(192);
  });
  it('table d’allures de Léa (VMA 16,5) : une ligne par zone, du footing au VMA', () => {
    const rows = paceTable(16.5);
    expect(rows.map((r) => r.key)).toEqual(PACE_ZONES.map((z) => z.key));
    const threshold = rows.find((r) => r.key === 'threshold');
    expect(formatPace(threshold!.slowSecPerKm)).toBe('4:17 /km');
    expect(formatPace(threshold!.fastSecPerKm)).toBe('4:02 /km');
    for (const r of rows) expect(r.fastSecPerKm).toBeLessThan(r.slowSecPerKm);
  });
  it('rejette les entrées invalides', () => {
    expect(() => paceSecPerKm(0, 100)).toThrow(RangeError);
    expect(() => paceSecPerKm(16, -5)).toThrow(RangeError);
    expect(() => paceRange(16, 90, 80)).toThrow(RangeError);
  });
});

describe('1RM → charges (Epley)', () => {
  it('60 kg × 6 reps → 1RM estimé 72 kg', () => {
    expect(epley1Rm(60, 6)).toBeCloseTo(72);
  });
  it('à 1 rep, le 1RM est la charge elle-même', () => {
    expect(epley1Rm(85, 1)).toBe(85);
  });
  it('squat de Léa : 1RM 85 kg à 70 % → 60 kg (palier 2,5)', () => {
    expect(loadFromPctRm(85, 70)).toBe(60);
  });
  it('hip thrust : 1RM 90 kg à 65 % → 57,5 kg', () => {
    expect(loadFromPctRm(90, 65)).toBe(57.5);
  });
  it('tonnage : 4 × 6 × 60 kg → 1 440 kg', () => {
    const sets = Array.from({ length: 4 }, () => ({ reps: 6, kg: 60 }));
    expect(tonnageKg(sets)).toBe(1440);
  });
});

describe('charge & ratio aigu / chronique', () => {
  it('58 min à RPE 8 → 46 UA', () => {
    expect(sessionLoadUa(58, 8)).toBe(46);
  });
  it('ratio : 34 UA sur 7 j pour 224 UA sur 28 j → 0,61', () => {
    expect(acuteChronicRatio(34, 224)).toBeCloseTo(0.607, 2);
  });
  it('null sans historique', () => {
    expect(acuteChronicRatio(34, 0)).toBeNull();
  });
});

describe('check-in → niveau de forme', () => {
  it('1–2 bad, 3 warn, 4–5 good', () => {
    expect(checkinLevel(1)).toBe('bad');
    expect(checkinLevel(2)).toBe('bad');
    expect(checkinLevel(3)).toBe('warn');
    expect(checkinLevel(4)).toBe('good');
    expect(checkinLevel(5)).toBe('good');
  });
});
