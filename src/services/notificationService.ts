
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
  private scheduledNotifications = new Set<string>(); // Prevenir duplicatas
  private notificationQueue = new Map<string, NodeJS.Timeout>(); // Controlar timers

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
      console.log('🔔 Notification service initialized:', this.isInitialized);
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

    // Usar tag para prevenir duplicatas
    const notificationTag = data.tag || `notification-${Date.now()}`;
    
    if (this.scheduledNotifications.has(notificationTag)) {
      console.log('🔔 Notification already scheduled:', notificationTag);
      return;
    }

    try {
      this.scheduledNotifications.add(notificationTag);
      
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: data.badge,
        tag: notificationTag,
        data: data.data,
      });

      // Auto close after 5 seconds e limpar da lista
      setTimeout(() => {
        notification.close();
        this.scheduledNotifications.delete(notificationTag);
      }, 5000);

      // Limpar da lista quando clicada
      notification.onclick = () => {
        this.scheduledNotifications.delete(notificationTag);
        notification.close();
      };

    } catch (error) {
      console.error('Error showing notification:', error);
      this.scheduledNotifications.delete(notificationTag);
    }
  }

  async scheduleNotification(data: NotificationData, delay: number): Promise<void> {
    const notificationTag = data.tag || `scheduled-${Date.now()}`;
    
    // Cancelar notificação anterior se existir
    if (this.notificationQueue.has(notificationTag)) {
      clearTimeout(this.notificationQueue.get(notificationTag)!);
    }

    const timer = setTimeout(() => {
      this.showNotification({ ...data, tag: notificationTag });
      this.notificationQueue.delete(notificationTag);
    }, delay);

    this.notificationQueue.set(notificationTag, timer);
  }

  async scheduleExpenseReminder(expense: any): Promise<void> {
    if (!expense.dueDate || !expense.notificationEnabled) {
      return;
    }

    const dueDate = new Date(expense.dueDate);
    const now = new Date();
    const expenseTag = `expense-${expense.id || expense.description}`;

    // Cancelar notificações anteriores desta despesa
    this.cancelExpenseNotifications(expenseTag);

    // Notificação 3 dias antes
    const threeDaysBefore = new Date(dueDate.getTime() - (3 * 24 * 60 * 60 * 1000));
    if (threeDaysBefore > now) {
      const delay3Days = threeDaysBefore.getTime() - now.getTime();
      await this.scheduleNotification({
        title: 'Despesa vence em 3 dias',
        body: `${expense.description} - R$ ${expense.amount}`,
        tag: `${expenseTag}-3days`,
        data: { type: 'expense_reminder', expenseId: expense.id, dueDate: expense.dueDate }
      }, delay3Days);
    }

    // Notificação no dia do vencimento
    if (dueDate > now) {
      const delayDueDate = dueDate.getTime() - now.getTime();
      await this.scheduleNotification({
        title: 'Despesa vence hoje!',
        body: `${expense.description} - R$ ${expense.amount}`,
        tag: `${expenseTag}-today`,
        data: { type: 'expense_due', expenseId: expense.id, dueDate: expense.dueDate }
      }, delayDueDate);
    }

    console.log(`📅 Scheduled notifications for expense: ${expense.description}`);
  }

  async cancelExpenseNotifications(expenseId: string): Promise<void> {
    // Cancelar timers agendados
    const keysToRemove: string[] = [];
    
    this.notificationQueue.forEach((timer, key) => {
      if (key.includes(expenseId)) {
        clearTimeout(timer);
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => {
      this.notificationQueue.delete(key);
    });

    // Remover das notificações agendadas
    this.scheduledNotifications.forEach(tag => {
      if (tag.includes(expenseId)) {
        this.scheduledNotifications.delete(tag);
      }
    });

    console.log(`🗑️ Cancelled notifications for expense: ${expenseId}`);
  }

  async cancelAllNotifications(): Promise<void> {
    // Cancelar todos os timers
    this.notificationQueue.forEach(timer => clearTimeout(timer));
    this.notificationQueue.clear();
    
    // Limpar lista de notificações agendadas
    this.scheduledNotifications.clear();
    
    console.log('🗑️ All notifications cancelled');
  }

  async scheduleLocalNotification(payload: PushNotificationPayload): Promise<void> {
    const { Capacitor } = await import('@capacitor/core');
    
    if (Capacitor.isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        
        await LocalNotifications.schedule({
          notifications: [{
            title: payload.title,
            body: payload.body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) }, // 1 segundo de delay
            extra: payload.data
          }]
        });
      } catch (error) {
        console.error('❌ Error scheduling local notification:', error);
        // Fallback para web notification
        await this.showNotification({
          title: payload.title,
          body: payload.body,
          data: payload.data
        });
      }
    } else {
      // Web notification
      await this.showNotification({
        title: payload.title,
        body: payload.body,
        data: payload.data
      });
    }
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
        tag: `db-notification-${userId}-${Date.now()}`,
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
