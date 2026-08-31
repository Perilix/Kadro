import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth-store';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  if (await auth.ensureLoaded()) return true;
  return router.createUrlTree(['/connexion']);
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  if (await auth.ensureLoaded()) return router.createUrlTree(['/apercu']);
  return true;
};
