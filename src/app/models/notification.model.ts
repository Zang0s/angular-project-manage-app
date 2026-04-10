export type ISOString = string;
export type UserID = string;
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: ISOString;
  priority: NotificationPriority;
  isRead: boolean;
  recipientId: UserID;
}

export type NotificationInput = {
  title: string;
  message: string;
  priority: NotificationPriority;
  recipientId: UserID;
};
