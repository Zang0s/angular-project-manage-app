import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { AppNotification } from '../../models/notification.model';

@Component({
  selector: 'app-notification-details',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="wrapper">
      @if (!notification()) {
        <div class="not-found">
          <h2>Powiadomienie nie istnieje</h2>
          <a routerLink="/notifications" class="back">Powrot do listy</a>
        </div>
      } @else {
        <article class="card">
          <header class="head">
            <h1>{{ notification()!.title }}</h1>
            <span class="badge" [class]="'badge-' + notification()!.priority">{{
              notification()!.priority
            }}</span>
          </header>

          <p class="message">{{ notification()!.message }}</p>

          <dl class="meta">
            <div>
              <dt>Data</dt>
              <dd>{{ notification()!.date | date: 'dd.MM.yyyy HH:mm' }}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{{ notification()!.isRead ? 'Przeczytane' : 'Nieprzeczytane' }}</dd>
            </div>
          </dl>

          <div class="actions">
            @if (!notification()!.isRead) {
              <button (click)="markAsRead()">Oznacz jako przeczytane</button>
            }
            <a routerLink="/notifications" class="back">Wroc do listy</a>
          </div>
        </article>
      }
    </section>
  `,
  styles: [
    `
      .wrapper {
        max-width: 840px;
        margin: 0 auto;
        padding: 2rem;
      }

      .not-found,
      .card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1.25rem;
      }

      .head {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
      }

      h1,
      h2 {
        margin: 0;
      }

      .message {
        margin: 1rem 0;
        color: #374151;
      }

      .meta {
        display: grid;
        grid-template-columns: repeat(2, minmax(140px, 1fr));
        gap: 0.75rem;
        margin: 1rem 0;
      }

      dt {
        color: #6b7280;
        font-size: 0.85rem;
      }

      dd {
        margin: 0.25rem 0 0;
      }

      .actions {
        display: flex;
        gap: 0.5rem;
      }

      button,
      .back {
        border: 0;
        border-radius: 0.5rem;
        padding: 0.5rem 0.8rem;
        text-decoration: none;
        cursor: pointer;
      }

      button {
        background: #22c55e;
        color: #fff;
      }

      .back {
        background: #475569;
        color: #fff;
      }

      .badge {
        border-radius: 999px;
        padding: 0.2rem 0.55rem;
        height: fit-content;
        font-size: 0.75rem;
        text-transform: uppercase;
      }

      .badge-low {
        background: #e5e7eb;
      }
      .badge-medium {
        background: #fef3c7;
      }
      .badge-high {
        background: #fee2e2;
      }

      :host-context(html.dark) .not-found,
      :host-context(html.dark) .card {
        background: #1e293b;
        border-color: #334155;
      }

      :host-context(html.dark) .message {
        color: #e2e8f0;
      }

      :host-context(html.dark) dt {
        color: #94a3b8;
      }
    `,
  ],
})
export class NotificationDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);

  notification = signal<AppNotification | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const notification = this.notificationService.getByIdForCurrentUser(id);
    if (!notification) return;

    this.notification.set(notification);
    this.notificationService.markAsRead(id);

    const updated = this.notificationService.getByIdForCurrentUser(id);
    if (updated) {
      this.notification.set(updated);
    }
  }

  markAsRead(): void {
    const current = this.notification();
    if (!current) return;

    this.notificationService.markAsRead(current.id);
    const updated = this.notificationService.getByIdForCurrentUser(current.id);
    if (updated) {
      this.notification.set(updated);
    }
  }
}
