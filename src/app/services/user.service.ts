import { Injectable, signal, computed } from '@angular/core';
import { User, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private usersSignal = signal<User[]>([
    { id: 'user-1', imie: 'Jan', nazwisko: 'Kowalski', rola: 'admin' },
    { id: 'user-2', imie: 'Anna', nazwisko: 'Nowak', rola: 'developer' },
    { id: 'user-3', imie: 'Piotr', nazwisko: 'Wiśniewski', rola: 'devops' },
  ]);

  readonly users = this.usersSignal.asReadonly();
  readonly currentUser = computed(() => this.usersSignal()[0]);

  getAll(): User[] {
    return this.usersSignal();
  }

  getById(id: string): User | undefined {
    return this.usersSignal().find((u) => u.id === id);
  }

  getDevelopersAndDevops(): User[] {
    return this.usersSignal().filter((u) => u.rola === 'developer' || u.rola === 'devops');
  }

  getByRole(rola: UserRole): User[] {
    return this.usersSignal().filter((u) => u.rola === rola);
  }
}
