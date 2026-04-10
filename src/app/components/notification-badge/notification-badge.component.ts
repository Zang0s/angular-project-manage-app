import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-badge',
  imports: [CommonModule, RouterLink],
  template: `
    <a routerLink="/notifications" class="badge-button" aria-label="Powiadomienia">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 20 20" fill="currentColor">
        <path
          fill-rule="evenodd"
          d="M10 2a6 6 0 00-6 6v3.586L2.293 13.293A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm-2 14a2 2 0 104 0H8z"
          clip-rule="evenodd"
        />
      </svg>

      @if (notificationService.unreadCount() > 0) {
        <span class="count">{{ formatCount(notificationService.unreadCount()) }}</span>
      }
    </a>
  `,
  styles: [
    `
      .badge-button {
        position: relative;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 0.5rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        color: #6b7280;
        background: transparent;
      }

      .badge-button:hover {
        background: #f3f4f6;
      }

      :host-context(html.dark) .badge-button {
        color: #d1d5db;
      }

      :host-context(html.dark) .badge-button:hover {
        background: #374151;
      }

      .icon {
        width: 1.25rem;
        height: 1.25rem;
      }

      .count {
        position: absolute;
        top: -0.2rem;
        right: -0.2rem;
        min-width: 1.15rem;
        height: 1.15rem;
        border-radius: 9999px;
        background: #ef4444;
        color: #fff;
        font-size: 0.65rem;
        line-height: 1.15rem;
        text-align: center;
        padding: 0 0.2rem;
        font-weight: 700;
      }
    `,
  ],
})
export class NotificationBadgeComponent {
  notificationService = inject(NotificationService);

  formatCount(value: number): string {
    return value > 99 ? '99+' : String(value);
  }
}
