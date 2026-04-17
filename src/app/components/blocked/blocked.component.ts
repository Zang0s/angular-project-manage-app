import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-blocked',
  imports: [CommonModule],
  template: `
    <section class="wrap">
      <article class="card">
        <h1>Konto zablokowane</h1>
        <p>Administrator zablokowal dostep do aplikacji dla tego konta.</p>
        <p class="mail">{{ userService.currentUser()?.email }}</p>

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
        max-width: 560px;
        background: #fff;
        border: 1px solid #fecaca;
        border-radius: 0.9rem;
        padding: 1.2rem;
      }

      h1 {
        margin-top: 0;
        color: #b91c1c;
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
        background: #1f2937;
        color: #fff;
        cursor: pointer;
      }

      :host-context(html.dark) .card {
        background: #1e293b;
        border-color: #7f1d1d;
      }

      :host-context(html.dark) p {
        color: #cbd5e1;
      }

      :host-context(html.dark) h1 {
        color: #fca5a5;
      }
    `,
  ],
})
export class BlockedComponent {
  userService = inject(UserService);
  private router = inject(Router);

  logout(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
  }
}
