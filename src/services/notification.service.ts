import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  notifications = signal<Notification[]>([]);
  private nextId = 0;

  show(message: string, type: 'success' | 'error' = 'success') {
    const notification = { id: this.nextId++, message, type };
    this.notifications.update(current => [...current, notification]);
    
    setTimeout(() => {
      this.dismiss(notification.id);
    }, 5000);
  }

  dismiss(id: number) {
    this.notifications.update(current => current.filter(n => n.id !== id));
  }
}
