import { useEffect, useRef } from 'react';
import { notificationService } from '../services/notificationService';

export const useNotifications = (monthlyCosts?: any[]) => {
  const processedCosts = useRef(new Set<string>());
  const lastProcessedTime = useRef<number>(0);

  useEffect(() => {
    // Inicializar o serviço de notificações apenas uma vez
    const initNotifications = async () => {
      await notificationService.initialize();
    };
    
    initNotifications();
  }, []);

  useEffect(() => {
    // Evitar processamento muito frequente (debounce de 5 segundos)
    const now = Date.now();
    if (now - lastProcessedTime.current < 5000) {
      return;
    }
    lastProcessedTime.current = now;

    // Schedule notifications only for regular monthly costs with due dates
    if (monthlyCosts && monthlyCosts.length > 0) {
      const regularCosts = monthlyCosts.filter(cost => 
        !cost.description?.includes('FINANCIAL_INCOME:') && 
        !cost.description?.includes('FINANCIAL_EXPENSE:') &&
        !cost.description?.includes('RESERVE_') &&
        !cost.description?.includes('Reserva:') &&
        !cost.description?.includes('SMART_RESERVE') &&
        cost.category !== 'Reserva' &&
        cost.category !== 'Smart Reserve' &&
        cost.category !== 'Reserve'
      );

      regularCosts.forEach(cost => {
        const costKey = `${cost.id || cost.description}-${cost.dueDate}`;
        
        // Verificar se já foi processado
        if (processedCosts.current.has(costKey)) {
          return;
        }

        if (cost.dueDate && cost.notificationEnabled) {
          console.log('📅 Agendando notificação para:', cost.description, 'Vence:', cost.dueDate);
          notificationService.scheduleExpenseReminder(cost);
          processedCosts.current.add(costKey);
        }
      });

      // Limpar custos antigos do cache (manter apenas últimos 100)
      if (processedCosts.current.size > 100) {
        const costKeys = Array.from(processedCosts.current);
        const keysToRemove = costKeys.slice(0, costKeys.length - 100);
        keysToRemove.forEach(key => processedCosts.current.delete(key));
      }
    }
  }, [monthlyCosts]);

  const scheduleNotification = async (expense: any) => {
    const costKey = `${expense.id || expense.description}-${expense.dueDate}`;
    
    if (!processedCosts.current.has(costKey)) {
      await notificationService.scheduleExpenseReminder(expense);
      processedCosts.current.add(costKey);
    }
  };

  const sendImmediateNotification = async (title: string, message: string, data?: any) => {
    await notificationService.scheduleLocalNotification({
      title,
      body: message,
      data
    });
  };

  const getUnreadCount = () => {
    return notificationService.getUnreadCount();
  };

  const getInAppNotifications = () => {
    return notificationService.getInAppNotifications();
  };

  const markAsRead = async (id: string) => {
    await notificationService.markInAppNotificationAsRead(id);
  };

  const markAllAsRead = async () => {
    await notificationService.markAllInAppNotificationsAsRead();
  };

  const deleteNotification = async (id: string) => {
    await notificationService.deleteInAppNotification(id);
  };

  return {
    scheduleNotification,
    sendImmediateNotification,
    getUnreadCount,
    getInAppNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};
