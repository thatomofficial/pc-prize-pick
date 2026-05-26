import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Allows the route only if the user is signed in. Otherwise redirects to
 * `/login` with the original URL preserved in `?returnUrl=` so the sign-in
 * screen can send the user back after a successful submit.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthed()) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/**
 * Allows the route only if the user is NOT signed in. Used to keep already-
 * authed users out of `/login`, `/register`, and `/forgot-password` — they
 * get bounced to their account dashboard instead.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthed()) return true;

  return router.createUrlTree(['/account']);
};