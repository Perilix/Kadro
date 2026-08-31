/** 1RM → charges. Formule d'Epley, arrondi au palier de disques. */

/** 1RM estimé (Epley) depuis une série : 60 kg × 6 reps → 72 kg. À 1 rep, la charge elle-même. */
export function epley1Rm(kg: number, reps: number): number {
  if (kg <= 0) throw new RangeError('kg doit être > 0');
  if (!Number.isInteger(reps) || reps < 1) throw new RangeError('reps doit être un entier ≥ 1');
  return reps === 1 ? kg : kg * (1 + reps / 30);
}

/** Charge de travail pour « x % du 1RM », arrondie au palier (2,5 kg par défaut). 85 × 70 % → 60. */
export function loadFromPctRm(oneRmKg: number, pct: number, stepKg = 2.5): number {
  if (oneRmKg <= 0) throw new RangeError('oneRmKg doit être > 0');
  if (pct <= 0 || pct > 120) throw new RangeError('pct hors bornes');
  if (stepKg <= 0) throw new RangeError('stepKg doit être > 0');
  return Math.round((oneRmKg * pct) / 100 / stepKg) * stepKg;
}

/** Tonnage d'une liste de séries réalisées (reps × kg), en kg. */
export function tonnageKg(sets: ReadonlyArray<{ reps: number | null; kg: number | null }>): number {
  return sets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.kg ?? 0), 0);
}
