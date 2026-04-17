export type UserRole = 'admin' | 'devops' | 'developer' | 'guest';

export interface User {
  id: string;
  email: string;
  imie: string;
  nazwisko: string;
  rola: UserRole;
  isBlocked: boolean;
  createdAt: string;
}
