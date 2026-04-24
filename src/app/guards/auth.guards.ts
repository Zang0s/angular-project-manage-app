import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';

export const loginPageGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const userService = inject(UserService);
  await userService.ensureInitialized();

  const user = userService.currentUser();
  if (!user) return true;
  if (user.isBlocked) return router.createUrlTree(['/blocked']);
  if (user.rola === 'guest') return router.createUrlTree(['/pending-approval']);

  return router.createUrlTree(['/']);
};

export const authGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);
  const userService = inject(UserService);
  await userService.ensureInitialized();

  const user = userService.currentUser();
  if (user) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

export const approvedGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const userService = inject(UserService);
  await userService.ensureInitialized();

  const user = userService.currentUser();
  if (!user) return router.createUrlTree(['/login']);
  if (user.isBlocked) return router.createUrlTree(['/blocked']);
  if (user.rola === 'guest') return router.createUrlTree(['/pending-approval']);

  return true;
};

export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const userService = inject(UserService);
  await userService.ensureInitialized();

  const user = userService.currentUser();
  if (!user) return router.createUrlTree(['/login']);
  if (user.isBlocked) return router.createUrlTree(['/blocked']);
  if (user.rola !== 'admin') return router.createUrlTree(['/']);

  return true;
};

export const pendingViewGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const userService = inject(UserService);
  await userService.ensureInitialized();

  const user = userService.currentUser();
  if (!user) return router.createUrlTree(['/login']);
  if (user.isBlocked) return router.createUrlTree(['/blocked']);
  if (user.rola !== 'guest') return router.createUrlTree(['/']);

  return true;
};

export const blockedViewGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const userService = inject(UserService);
  await userService.ensureInitialized();

  const user = userService.currentUser();
  if (!user) return router.createUrlTree(['/login']);
  if (!user.isBlocked) {
    if (user.rola === 'guest') return router.createUrlTree(['/pending-approval']);
    return router.createUrlTree(['/']);
  }

  return true;
};
