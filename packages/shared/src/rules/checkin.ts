import type { FormStatus } from '../dto/common';

export type CheckinLevel = Exclude<FormStatus, 'none'>;

/**
 * Niveau de forme dérivé du ressenti du matin (1 = épuisé·e … 5 = au top).
 * 1–2 → bad (rouge) · 3 → warn (ambre) · 4–5 → good (vert).
 * Jamais la couleur seule côté UI : toujours un point/icône + un mot.
 */
export function checkinLevel(feeling: 1 | 2 | 3 | 4 | 5): CheckinLevel {
  if (feeling <= 2) return 'bad';
  if (feeling === 3) return 'warn';
  return 'good';
}
