import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { AppNotification, NotificationPriority } from '../../models/notification.model';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="wrapper">
      <header class="header">
        <div>
          <h1>Powiadomienia</h1>
          <p>Lista powiadomien dla zalogowanego uzytkownika.</p>
        </div>

        <button
          class="mark-all"
          (click)="markAllAsRead()"
          [disabled]="notificationService.unreadCount() === 0"
        >
          Oznacz wszystkie jako przeczytane
        </button>
      </header>

      <div class="filters">
        <button [class.active]="filter() === 'all'" (click)="filter.set('all')">Wszystkie</button>
        <button [class.active]="filter() === 'unread'" (click)="filter.set('unread')">
          Nieprzeczytane
        </button>
        <button [class.active]="filter() === 'read'" (click)="filter.set('read')">
          Przeczytane
        </button>
      </div>

      @if (filtered().length === 0) {
        <p class="empty">Brak powiadomien.</p>
      } @else {
        <ul class="list">
          @for (item of filtered(); track item.id) {
            <li class="item" [class.unread]="!item.isRead">
              <div class="item-main">
                <div class="top-row">
                  <h3>{{ item.title }}</h3>
                  <span class="priority" [class]="'priority-' + item.priority">
                    {{ priorityLabel(item.priority) }}
                  </span>
                </div>
                <p>{{ item.message }}</p>
                <small>{{ item.date | date: 'dd.MM.yyyy HH:mm' }}</small>
              </div>

              <div class="item-actions">
                <a [routerLink]="['/notifications', item.id]" class="btn-link">Szczegoly</a>
                @if (!item.isRead) {
                  <button class="btn-read" (click)="markAsRead(item.id)">
                    Oznacz jako przeczytane
                  </button>
                }
              </div>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [
    `
      .wrapper {
        max-width: 960px;
        margin: 0 auto;
        padding: 2rem;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      h1 {
        margin: 0;
      }

      .header p {
        margin: 0.4rem 0 0;
        color: #6b7280;
      }

      .mark-all {
        border: 0;
        border-radius: 0.5rem;
        padding: 0.6rem 0.9rem;
        background: #2563eb;
        color: #fff;
        cursor: pointer;
      }

      .mark-all:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .filters {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .filters button {
        border: 0;
        border-radius: 999px;
        padding: 0.45rem 0.8rem;
        background: #e5e7eb;
        cursor: pointer;
      }

      .filters button.active {
        background: #2563eb;
        color: #fff;
      }

      .empty {
        color: #6b7280;
      }

      .list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.75rem;
      }

      .item {
        border-radius: 0.75rem;
        background: #fff;
        border: 1px solid #e5e7eb;
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }

      .item.unread {
        border-color: #2563eb;
        box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.15);
      }

      .item-main {
        flex: 1;
      }

      .top-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }

      h3 {
        margin: 0;
      }

      .item-main p {
        margin: 0.4rem 0;
        color: #374151;
      }

      .item-main small {
        color: #6b7280;
      }

      .priority {
        display: inline-flex;
        align-items: center;
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .priority-low {
        background: #e5e7eb;
        color: #374151;
      }

      .priority-medium {
        background: #fef3c7;
        color: #92400e;
      }

      .priority-high {
        background: #fee2e2;
        color: #991b1b;
      }

      .item-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn-link,
      .btn-read {
        border: 0;
        border-radius: 0.5rem;
        padding: 0.45rem 0.75rem;
        cursor: pointer;
        font-size: 0.85rem;
        text-decoration: none;
      }

      .btn-link {
        background: #0ea5e9;
        color: #fff;
      }

      .btn-read {
        background: #22c55e;
        color: #fff;
      }

      :host-context(html.dark) .header p,
      :host-context(html.dark) .empty,
      :host-context(html.dark) .item-main small {
        color: #94a3b8;
      }

      :host-context(html.dark) .item {
        background: #1e293b;
        border-color: #334155;
      }

      :host-context(html.dark) .item-main p {
        color: #e2e8f0;
      }

      :host-context(html.dark) .filters button {
        background: #334155;
        color: #e2e8f0;
      }
    `,
  ],
})
export class NotificationsComponent {
  notificationService = inject(NotificationService);

  filter = signal<'all' | 'read' | 'unread'>('all');

  filtered = computed(() => {
    const items = this.notificationService.currentUserNotifications();
    const filter = this.filter();
    if (filter === 'read') return items.filter((n) => n.isRead);
    if (filter === 'unread') return items.filter((n) => !n.isRead);
    return items;
  });

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsReadForCurrentUser();
  }

  priorityLabel(priority: NotificationPriority): string {
    if (priority === 'high') return 'High';
    if (priority === 'medium') return 'Medium';
    return 'Low';
  }
}
