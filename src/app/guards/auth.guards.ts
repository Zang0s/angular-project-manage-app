import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';

export const loginPageGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = inject(UserService).currentUser();

  if (!user) return true;
  if (user.isBlocked) return router.createUrlTree(['/blocked']);
  if (user.rola === 'guest') return router.createUrlTree(['/pending-approval']);

  return router.createUrlTree(['/']);
};

export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const user = inject(UserService).currentUser();
  if (user) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

export const approvedGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = inject(UserService).currentUser();

  if (!user) return router.createUrlTree(['/login']);
  if (user.isBlocked) return router.createUrlTree(['/blocked']);
  if (user.rola === 'guest') return router.createUrlTree(['/pending-approval']);

  return true;
};

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = inject(UserService).currentUser();

  if (!user) return router.createUrlTree(['/login']);
  if (user.isBlocked) return router.createUrlTree(['/blocked']);
  if (user.rola !== 'admin') return router.createUrlTree(['/']);

  return true;
};

export const pendingViewGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = inject(UserService).currentUser();

  if (!user) return router.createUrlTree(['/login']);
  if (user.isBlocked) return router.createUrlTree(['/blocked']);
  if (user.rola !== 'guest') return router.createUrlTree(['/']);

  return true;
};

export const blockedViewGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = inject(UserService).currentUser();

  if (!user) return router.createUrlTree(['/login']);
  if (!user.isBlocked) {
    if (user.rola === 'guest') return router.createUrlTree(['/pending-approval']);
    return router.createUrlTree(['/']);
  }

  return true;
};
