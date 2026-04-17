import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserRole } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { SUPER_ADMIN_EMAIL } from '../../app.settings';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="wrapper">
      <header>
        <h1>Uzytkownicy</h1>
        <p>Zarzadzanie rolami i blokadami kont.</p>
      </header>

      @if (users().length === 0) {
        <p class="empty">Brak uzytkownikow. Zaloguj sie przez Google, aby utworzyc konto.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Imie i nazwisko</th>
              <th>Rola</th>
              <th>Status</th>
              <th>Utworzone</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr>
                <td>
                  {{ user.email }}
                  @if (isSuperAdmin(user.email)) {
                    <span class="pill">super admin</span>
                  }
                </td>
                <td>{{ user.imie }} {{ user.nazwisko }}</td>
                <td>
                  <select
                    [ngModel]="user.rola"
                    (ngModelChange)="changeRole(user.id, $event)"
                    [disabled]="isSuperAdmin(user.email)"
                  >
                    <option value="guest">guest</option>
                    <option value="developer">developer</option>
                    <option value="devops">devops</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <span class="status" [class.blocked]="user.isBlocked">
                    {{ user.isBlocked ? 'zablokowany' : 'aktywny' }}
                  </span>
                </td>
                <td>{{ user.createdAt | date: 'dd.MM.yyyy HH:mm' }}</td>
                <td>
                  <button
                    (click)="toggleBlocked(user.id, user.isBlocked)"
                    [disabled]="isSuperAdmin(user.email)"
                  >
                    {{ user.isBlocked ? 'Odblokuj' : 'Zablokuj' }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: [
    `
      .wrapper {
        max-width: 1100px;
        margin: 0 auto;
        padding: 2rem;
      }

      h1 {
        margin: 0;
      }

      header p {
        margin-top: 0.35rem;
        color: #6b7280;
      }

      .empty {
        color: #6b7280;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        overflow: hidden;
      }

      th,
      td {
        text-align: left;
        padding: 0.75rem;
        border-bottom: 1px solid #e5e7eb;
      }

      th {
        background: #f8fafc;
        color: #334155;
        font-weight: 600;
      }

      .pill {
        margin-left: 0.35rem;
        border-radius: 999px;
        background: #dbeafe;
        color: #1e40af;
        font-size: 0.7rem;
        padding: 0.12rem 0.4rem;
      }

      select,
      button {
        border: 1px solid #cbd5e1;
        border-radius: 0.45rem;
        padding: 0.35rem 0.55rem;
        background: #fff;
      }

      button {
        cursor: pointer;
      }

      .status {
        border-radius: 999px;
        background: #dcfce7;
        color: #166534;
        font-size: 0.75rem;
        padding: 0.15rem 0.45rem;
      }

      .status.blocked {
        background: #fee2e2;
        color: #991b1b;
      }

      :host-context(html.dark) header p,
      :host-context(html.dark) .empty {
        color: #94a3b8;
      }

      :host-context(html.dark) table {
        background: #1e293b;
        border-color: #334155;
      }

      :host-context(html.dark) th,
      :host-context(html.dark) td {
        border-color: #334155;
      }

      :host-context(html.dark) th {
        background: #334155;
        color: #e2e8f0;
      }

      :host-context(html.dark) select,
      :host-context(html.dark) button {
        background: #334155;
        border-color: #475569;
        color: #e2e8f0;
      }
    `,
  ],
})
export class UsersComponent {
  private userService = inject(UserService);

  users = computed(() =>
    [...this.userService.getAll()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );

  changeRole(userId: string, role: UserRole): void {
    this.userService.updateRole(userId, role);
  }

  toggleBlocked(userId: string, isBlocked: boolean): void {
    this.userService.setBlocked(userId, !isBlocked);
  }

  isSuperAdmin(email: string): boolean {
    return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  }
}
