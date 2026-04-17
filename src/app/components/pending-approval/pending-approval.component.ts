import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-pending-approval',
  imports: [CommonModule],
  template: `
    <section class="wrap">
      <article class="card">
        <h1>Oczekiwanie na zatwierdzenie konta</h1>
        <p>
          Twoje konto zostalo utworzone i oczekuje na przydzielenie roli przez administratora. Do
          tego czasu masz dostep tylko do tego widoku.
        </p>

        <p class="mail">Zalogowany: {{ userService.currentUser()?.email }}</p>

        <button (click)="logout()">Wyloguj</button>
      </article>
    </section>
  `,
  styles: [
    `
      .wrap {
        min-height: calc(100vh - 70px);
        display: grid;
        place-items: center;
        padding: 1rem;
      }

      .card {
        max-width: 640px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 0.9rem;
        padding: 1.2rem;
      }

      h1 {
        margin-top: 0;
      }

      p {
        color: #475569;
      }

      .mail {
        font-weight: 600;
      }

      button {
        border: 0;
        border-radius: 0.5rem;
        padding: 0.55rem 0.85rem;
        background: #2563eb;
        color: #fff;
        cursor: pointer;
      }

      :host-context(html.dark) .card {
        background: #1e293b;
        border-color: #334155;
      }

      :host-context(html.dark) p {
        color: #cbd5e1;
      }
    `,
  ],
})
export class PendingApprovalComponent {
  userService = inject(UserService);
  private router = inject(Router);

  logout(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
  }
}
