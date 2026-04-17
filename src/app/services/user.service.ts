import { Inject, Injectable, PLATFORM_ID, computed, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SUPER_ADMIN_EMAIL } from '../app.settings';
import { User, UserRole } from '../models/user.model';

type GooglePayload = {
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
};

export type LoginResult = {
  user: User;
  isNewUser: boolean;
};

const USERS_STORAGE_KEY = 'manageme_users';
const SESSION_STORAGE_KEY = 'manageme_current_user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly isBrowser: boolean;
  private usersSignal = signal<User[]>([]);
  private currentUserIdSignal = signal<string | null>(null);

  readonly users = this.usersSignal.asReadonly();
  readonly currentUser = computed<User | null>(() => {
    const id = this.currentUserIdSignal();
    if (!id) return null;
    return this.usersSignal().find((u) => u.id === id) ?? null;
  });

  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.rola === 'admin');

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.usersSignal.set(this.loadUsers());
      const currentUserId = localStorage.getItem(SESSION_STORAGE_KEY);
      this.currentUserIdSignal.set(currentUserId);

      if (currentUserId && !this.usersSignal().some((u) => u.id === currentUserId)) {
        this.currentUserIdSignal.set(null);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }

  getAll(): User[] {
    return this.usersSignal();
  }

  getById(id: string): User | undefined {
    return this.usersSignal().find((u) => u.id === id);
  }

  getDevelopersAndDevops(): User[] {
    return this.usersSignal().filter(
      (u) => (u.rola === 'developer' || u.rola === 'devops') && !u.isBlocked,
    );
  }

  getByRole(rola: UserRole): User[] {
    return this.usersSignal().filter((u) => u.rola === rola);
  }

  updateRole(userId: string, role: UserRole): boolean {
    const users = this.usersSignal();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return false;

    if (users[index].email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      role = 'admin';
    }

    const updated = [...users];
    updated[index] = { ...updated[index], rola: role };
    this.saveUsers(updated);
    return true;
  }

  setBlocked(userId: string, isBlocked: boolean): boolean {
    const users = this.usersSignal();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return false;

    if (users[index].email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return false;
    }

    const updated = [...users];
    updated[index] = { ...updated[index], isBlocked };
    this.saveUsers(updated);
    return true;
  }

  logout(): void {
    this.currentUserIdSignal.set(null);
    if (this.isBrowser) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  loginWithGoogleCredential(credential: string): LoginResult {
    if (!this.isBrowser) {
      throw new Error('Logowanie OAuth jest dostepne tylko w przegladarce.');
    }

    const payload = this.decodeJwtPayload(credential);
    if (!payload || !payload.email) {
      throw new Error('Nie udalo sie odczytac danych konta Google.');
    }

    const email = payload.email.trim().toLowerCase();
    const { imie, nazwisko } = this.extractNames(payload);
    const users = this.usersSignal();
    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === email);

    if (existingIndex !== -1) {
      const existing = users[existingIndex];
      const nextRole: UserRole =
        email === SUPER_ADMIN_EMAIL.toLowerCase() ? 'admin' : existing.rola;

      const updatedUser: User = {
        ...existing,
        imie,
        nazwisko,
        rola: nextRole,
      };

      const updatedUsers = [...users];
      updatedUsers[existingIndex] = updatedUser;
      this.saveUsers(updatedUsers);
      this.setCurrentUserId(updatedUser.id);

      return { user: updatedUser, isNewUser: false };
    }

    const role: UserRole = email === SUPER_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'guest';
    const newUser: User = {
      id: payload.sub || crypto.randomUUID(),
      email,
      imie,
      nazwisko,
      rola: role,
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    this.saveUsers(updatedUsers);
    this.setCurrentUserId(newUser.id);

    return { user: newUser, isNewUser: true };
  }

  private setCurrentUserId(userId: string): void {
    this.currentUserIdSignal.set(userId);
    if (this.isBrowser) {
      localStorage.setItem(SESSION_STORAGE_KEY, userId);
    }
  }

  private loadUsers(): User[] {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (!data) return [];

    try {
      const parsed = JSON.parse(data) as unknown[];
      if (!Array.isArray(parsed)) return [];
      return parsed.map((raw) => this.normalizeUser(raw));
    } catch {
      return [];
    }
  }

  private saveUsers(users: User[]): void {
    this.usersSignal.set(users);
    if (this.isBrowser) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }

  private normalizeUser(raw: unknown): User {
    const input = (raw || {}) as Partial<User>;

    const email = (input.email || `${input.id || crypto.randomUUID()}@unknown.local`).toLowerCase();

    const role: UserRole =
      input.rola === 'admin' ||
      input.rola === 'developer' ||
      input.rola === 'devops' ||
      input.rola === 'guest'
        ? input.rola
        : 'guest';

    return {
      id: input.id || crypto.randomUUID(),
      email,
      imie: input.imie || 'Uzytkownik',
      nazwisko: input.nazwisko || '',
      rola: email === SUPER_ADMIN_EMAIL.toLowerCase() ? 'admin' : role,
      isBlocked: Boolean(input.isBlocked),
      createdAt: input.createdAt || new Date().toISOString(),
    };
  }

  private decodeJwtPayload(token: string): GooglePayload | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;

      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const json = atob(padded);

      return JSON.parse(json) as GooglePayload;
    } catch {
      return null;
    }
  }

  private extractNames(payload: GooglePayload): { imie: string; nazwisko: string } {
    const given = payload.given_name?.trim();
    const family = payload.family_name?.trim();

    if (given || family) {
      return {
        imie: given || 'Uzytkownik',
        nazwisko: family || '',
      };
    }

    const fullName = payload.name?.trim() || 'Uzytkownik';
    const [first, ...rest] = fullName.split(' ');

    return {
      imie: first || 'Uzytkownik',
      nazwisko: rest.join(' '),
    };
  }
}
