
export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  private isInitialized = false;
  private isSupported = false;

  constructor() {
    this.checkSupport();
  }

  private checkSupport() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
  }

  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.isInitialized = permission === 'granted';
      return this.isInitialized;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  async showNotification(data: NotificationData): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Notifications not initialized');
      return;
    }

    try {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: data.badge,
        tag: data.tag,
        data: data.data,
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  async scheduleNotification(data: NotificationData, delay: number): Promise<void> {
    setTimeout(() => {
      this.showNotification(data);
    }, delay);
  }

  // Mock function for creating notifications in database
  async createNotification(userId: string, title: string, message: string, type: string = 'info'): Promise<void> {
    // Since notifications table doesn't exist, we'll just log it
    console.log('Creating notification:', { userId, title, message, type });
    
    // Show browser notification instead
    if (this.isInitialized) {
      await this.showNotification({
        title,
        body: message,
        data: { type, userId }
      });
    }
  }

  // Mock function for marking notifications as read
  async markAsRead(notificationId: string): Promise<void> {
    console.log('Marking notification as read:', notificationId);
  }

  // Mock function for getting user notifications
  async getUserNotifications(userId: string): Promise<any[]> {
    console.log('Getting notifications for user:', userId);
    return [];
  }

  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
