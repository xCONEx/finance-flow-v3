
import { Capacitor } from '@capacitor/core';

class NotificationService {
  private isInitialized = false;

  async initialize() {
    try {
      if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        
        // Request permissions
        const permissions = await LocalNotifications.requestPermissions();
        console.log('📱 Notification permissions:', permissions);
        
        if (permissions.display === 'granted') {
          this.isInitialized = true;
          console.log('✅ Mobile notifications initialized');
        } else {
          console.log('❌ Notification permissions denied');
        }
      } else {
        // Web notifications
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            this.isInitialized = true;
            console.log('✅ Web notifications initialized');
          } else {
            console.log('❌ Web notification permissions denied');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
    }
  }

  async scheduleExpenseReminder(expense: any) {
    if (!this.isInitialized || !expense.dueDate) return;

    try {
      const dueDate = new Date(expense.dueDate);
      const today = new Date();
      const oneDayBefore = new Date(dueDate);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);
      
      // Set notification time to 9 AM
      oneDayBefore.setHours(9, 0, 0, 0);
      dueDate.setHours(9, 0, 0, 0);

      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      };

      // Schedule notification for 1 day before due date
      if (oneDayBefore > today) {
        await this.scheduleLocalNotification({
          id: `expense-reminder-${expense.id}-1d`,
          title: `💰 Vencimento Amanhã`,
          body: `${expense.description} - ${formatCurrency(expense.value)} vence amanhã`,
          schedule: { at: oneDayBefore },
          data: {
            type: 'expense_reminder',
            expenseId: expense.id,
            daysUntilDue: 1
          }
        });
        console.log('📅 Scheduled 1-day reminder for:', expense.description);
      }

      // Schedule notification for due date
      if (dueDate > today) {
        await this.scheduleLocalNotification({
          id: `expense-reminder-${expense.id}-0d`,
          title: `🚨 Vence Hoje!`,
          body: `${expense.description} - ${formatCurrency(expense.value)} vence hoje`,
          schedule: { at: dueDate },
          data: {
            type: 'expense_due',
            expenseId: expense.id,
            daysUntilDue: 0
          }
        });
        console.log('📅 Scheduled due date reminder for:', expense.description);
      }
    } catch (error) {
      console.error('❌ Error scheduling expense reminder:', error);
    }
  }

  async scheduleLocalNotification(options: any) {
    try {
      if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        
        const notificationOptions = {
          notifications: [{
            id: options.id || Date.now(),
            title: options.title,
            body: options.body,
            schedule: options.schedule,
            extra: options.data || {},
            sound: 'default',
            smallIcon: 'ic_notification',
            iconColor: '#4F46E5'
          }]
        };

        await LocalNotifications.schedule(notificationOptions);
        console.log('📱 Mobile notification scheduled:', options.title);
      } else {
        // Web notification (immediate)
        if (this.isInitialized && 'Notification' in window) {
          new Notification(options.title, {
            body: options.body,
            icon: '/icons/icon-192.png',
            badge: '/icons/favicon-96x96.png',
            data: options.data || {}
          });
          console.log('🌐 Web notification sent:', options.title);
        }
      }
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
    }
  }

  async cancelExpenseNotifications(expenseId: string) {
    try {
      if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        
        // Cancel both 1-day and due date notifications
        await LocalNotifications.cancel({
          notifications: [
            { id: `expense-reminder-${expenseId}-1d` },
            { id: `expense-reminder-${expenseId}-0d` }
          ]
        });
        console.log('🗑️ Cancelled notifications for expense:', expenseId);
      }
    } catch (error) {
      console.error('❌ Error cancelling notifications:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({
            notifications: pending.notifications.map(n => ({ id: n.id }))
          });
          console.log('🗑️ Cancelled all notifications');
        }
      }
    } catch (error) {
      console.error('❌ Error cancelling all notifications:', error);
    }
  }

  async getPendingNotifications() {
    try {
      if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const pending = await LocalNotifications.getPending();
        console.log('📋 Pending notifications:', pending.notifications.length);
        return pending.notifications;
      }
      return [];
    } catch (error) {
      console.error('❌ Error getting pending notifications:', error);
      return [];
    }
  }
}

export const notificationService = new NotificationService();
