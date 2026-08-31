import type { UserRole } from '@kadro/shared';

export interface JwtPayload {
  /** userId. */
  sub: string;
  role: UserRole;
  /** Coach : son équipe. Athlète : l'équipe rejointe. */
  teamId?: string;
  /** Athlète : son dossier `athletes`. */
  athleteId?: string;
  type: 'access' | 'refresh';
}
