export type NotificationType = 'info' | 'success' | 'error';

export interface AppNotification {
  message: string;
  type: NotificationType;
}

export function notifyApp(message: string, type: NotificationType = 'info'): void {
  window.dispatchEvent(
    new CustomEvent<AppNotification>('app:notification', {
      detail: { message, type },
    }),
  );
}
