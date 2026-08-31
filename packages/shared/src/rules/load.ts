/** Charge d'entraînement. Un seul modèle, lisible (décision : « à la Nolio mais moins »). */

/**
 * Charge d'une séance en UA — session-RPE de Foster ramené à une échelle lisible :
 * durée (min) × RPE ÷ 10. Ex. 58 min à RPE 8 → 46 UA.
 */
export function sessionLoadUa(durationMin: number, rpe: number): number {
  if (durationMin <= 0) throw new RangeError('durationMin doit être > 0');
  if (rpe < 1 || rpe > 10) throw new RangeError('rpe doit être entre 1 et 10');
  return Math.round((durationMin * rpe) / 10);
}

/**
 * Ratio aigu / chronique : charge des 7 derniers jours ÷ moyenne hebdomadaire des 28 derniers.
 * `null` tant qu'il n'y a pas d'historique. Seuil d'alerte par défaut : > 1,3.
 */
export function acuteChronicRatio(load7dUa: number, load28dUa: number): number | null {
  if (load28dUa <= 0) return null;
  return load7dUa / (load28dUa / 4);
}
