import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth-store';

export const coachGuard: CanActivateFn = async () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  if (!(await auth.ensureLoaded())) return router.createUrlTree(['/connexion']);
  if (auth.user()?.role !== 'coach') return router.createUrlTree(['/moi']);
  return true;
};

export const athleteGuard: CanActivateFn = async () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  if (!(await auth.ensureLoaded())) return router.createUrlTree(['/connexion']);
  if (auth.user()?.role !== 'athlete') return router.createUrlTree(['/apercu']);
  return true;
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  if (await auth.ensureLoaded()) {
    return router.createUrlTree([auth.user()?.role === 'athlete' ? '/moi' : '/apercu']);
  }
  return true;
};
