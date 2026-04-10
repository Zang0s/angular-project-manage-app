import { Inject, Injectable, PLATFORM_ID, computed, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserService } from './user.service';
import { AppNotification, NotificationInput } from '../models/notification.model';

const STORAGE_KEY = 'manageme_notifications';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly isBrowser: boolean;
  private notificationsSignal = signal<AppNotification[]>([]);
  private activeDialogSignal = signal<AppNotification | null>(null);
  private dialogQueueSignal = signal<AppNotification[]>([]);

  readonly notifications = this.notificationsSignal.asReadonly();
  readonly activeDialog = this.activeDialogSignal.asReadonly();

  readonly currentUserNotifications = computed(() => {
    const currentUserId = this.userService.currentUser().id;
    return this.notificationsSignal()
      .filter((n) => n.recipientId === currentUserId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  readonly unreadCount = computed(
    () => this.currentUserNotifications().filter((n) => !n.isRead).length,
  );

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private userService: UserService,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.notificationsSignal.set(this.loadFromStorage());
    }
  }

  send(input: NotificationInput): AppNotification {
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      title: input.title,
      message: input.message,
      priority: input.priority,
      recipientId: input.recipientId,
      date: new Date().toISOString(),
      isRead: false,
    };

    const updated = [notification, ...this.notificationsSignal()];
    this.saveToStorage(updated);
    this.tryOpenDialog(notification);

    return notification;
  }

  sendMany(inputs: NotificationInput[]): AppNotification[] {
    if (inputs.length === 0) return [];

    const created = inputs.map(
      (input) =>
        ({
          id: crypto.randomUUID(),
          title: input.title,
          message: input.message,
          priority: input.priority,
          recipientId: input.recipientId,
          date: new Date().toISOString(),
          isRead: false,
        }) satisfies AppNotification,
    );

    this.saveToStorage([...created, ...this.notificationsSignal()]);
    created.forEach((notification) => this.tryOpenDialog(notification));

    return created;
  }

  getByIdForCurrentUser(id: string): AppNotification | undefined {
    const currentUserId = this.userService.currentUser().id;
    return this.notificationsSignal().find((n) => n.id === id && n.recipientId === currentUserId);
  }

  markAsRead(id: string): void {
    const notifications = this.notificationsSignal();
    const index = notifications.findIndex((n) => n.id === id);
    if (index === -1 || notifications[index].isRead) return;

    const updated = [...notifications];
    updated[index] = { ...updated[index], isRead: true };
    this.saveToStorage(updated);

    const active = this.activeDialogSignal();
    if (active && active.id === id) {
      this.activeDialogSignal.set({ ...active, isRead: true });
    }
  }

  markAllAsReadForCurrentUser(): void {
    const currentUserId = this.userService.currentUser().id;
    const updated = this.notificationsSignal().map((n) =>
      n.recipientId === currentUserId ? { ...n, isRead: true } : n,
    );
    this.saveToStorage(updated);
  }

  closeDialog(): void {
    const queue = this.dialogQueueSignal();
    if (queue.length === 0) {
      this.activeDialogSignal.set(null);
      return;
    }

    const [next, ...rest] = queue;
    this.dialogQueueSignal.set(rest);
    this.activeDialogSignal.set(next);
  }

  markDialogAsReadAndClose(): void {
    const active = this.activeDialogSignal();
    if (active) {
      this.markAsRead(active.id);
    }
    this.closeDialog();
  }

  private tryOpenDialog(notification: AppNotification): void {
    if (notification.priority === 'low') return;

    const currentUserId = this.userService.currentUser().id;
    if (notification.recipientId !== currentUserId) return;

    if (!this.activeDialogSignal()) {
      this.activeDialogSignal.set(notification);
      return;
    }

    this.dialogQueueSignal.set([...this.dialogQueueSignal(), notification]);
  }

  private loadFromStorage(): AppNotification[] {
    if (!this.isBrowser) return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(notifications: AppNotification[]): void {
    if (!this.isBrowser) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    this.notificationsSignal.set(notifications);
  }
}
