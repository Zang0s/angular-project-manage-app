import { Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private currentUserSignal = signal<User>({
    id: 'user-1',
    imie: 'Jan',
    nazwisko: 'Kowalski',
  });

  readonly currentUser = this.currentUserSignal.asReadonly();
}
