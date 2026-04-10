import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-dialog',
  imports: [CommonModule],
  template: `
    @if (notification(); as item) {
      <aside class="dialog" [class]="'dialog-' + item.priority" role="dialog" aria-live="polite">
        <header class="head">
          <strong>{{ item.title }}</strong>
          <button class="close" (click)="close()" aria-label="Zamknij">x</button>
        </header>

        <p>{{ item.message }}</p>

        <div class="actions">
          <button class="details" (click)="openDetails(item.id)">Szczegoly</button>
          <button class="read" (click)="markAsReadAndClose()">Oznacz jako przeczytane</button>
        </div>
      </aside>
    }
  `,
  styles: [
    `
      .dialog {
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        width: min(380px, calc(100vw - 2rem));
        border-radius: 0.75rem;
        background: #fff;
        border: 1px solid #e5e7eb;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18);
        padding: 0.9rem;
        z-index: 1000;
      }

      .dialog-low {
        border-left: 4px solid #64748b;
      }

      .dialog-medium {
        border-left: 4px solid #f59e0b;
      }

      .dialog-high {
        border-left: 4px solid #ef4444;
      }

      .head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
      }

      .close {
        border: 0;
        border-radius: 0.375rem;
        width: 1.75rem;
        height: 1.75rem;
        background: #f3f4f6;
        cursor: pointer;
      }

      p {
        margin: 0.7rem 0;
        color: #374151;
      }

      .actions {
        display: flex;
        gap: 0.5rem;
      }

      .actions button {
        border: 0;
        border-radius: 0.5rem;
        padding: 0.45rem 0.75rem;
        color: #fff;
        cursor: pointer;
      }

      .details {
        background: #0ea5e9;
      }

      .read {
        background: #22c55e;
      }

      :host-context(html.dark) .dialog {
        background: #1e293b;
        border-color: #334155;
      }

      :host-context(html.dark) p {
        color: #e2e8f0;
      }

      :host-context(html.dark) .close {
        background: #334155;
        color: #e2e8f0;
      }
    `,
  ],
})
export class NotificationDialogComponent {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  notification = computed(() => this.notificationService.activeDialog());

  close(): void {
    this.notificationService.closeDialog();
  }

  markAsReadAndClose(): void {
    this.notificationService.markDialogAsReadAndClose();
  }

  openDetails(notificationId: string): void {
    this.router.navigate(['/notifications', notificationId]);
    this.notificationService.markDialogAsReadAndClose();
  }
}
