import { z } from 'zod';

/** ObjectId MongoDB sérialisé. */
export const zObjectId = z.string().regex(/^[0-9a-f]{24}$/, 'ObjectId invalide');
export type ObjectIdString = z.infer<typeof zObjectId>;

export const zLocale = z.enum(['fr', 'de', 'en']);
export type Locale = z.infer<typeof zLocale>;

/** Jour calendaire dans le fuseau de l'athlète (jamais un instant UTC). */
export const zDateYmd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'attendu : YYYY-MM-DD');

export const zTimezone = z.string().min(1).max(64);

/** Code d'équipe — préfixe KDR, alphabet sans lettres/chiffres ambigus (pas de O/0/I/1). */
export const zInviteCode = z.string().regex(/^KDR-[A-HJ-NP-Z2-9]{4}$/, 'code invalide');
export const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const zSport = z.enum(['run', 'trail', 'strength']);
export type Sport = z.infer<typeof zSport>;

export const zFormStatus = z.enum(['good', 'warn', 'bad', 'none']);
export type FormStatus = z.infer<typeof zFormStatus>;

export const zIsoInstant = z.string().datetime();

export function zPage<S extends z.ZodTypeAny>(item: S) {
  return z.object({ items: z.array(item), nextCursor: z.string().nullable() });
}
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
