
import { useEffect } from 'react';
import { notificationService } from '../services/notificationService';

export const useNotifications = (monthlyCosts?: any[]) => {
  useEffect(() => {
    // Inicializar o serviço de notificações
    notificationService.initialize();
  }, []);

  useEffect(() => {
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
        if (cost.dueDate && cost.notificationEnabled) {
          console.log('📅 Scheduling notification for:', cost.description, 'Due:', cost.dueDate);
          notificationService.scheduleExpenseReminder(cost);
        }
      });
    }
  }, [monthlyCosts]);

  const scheduleNotification = async (expense: any) => {
    await notificationService.scheduleExpenseReminder(expense);
  };

  const sendImmediateNotification = async (title: string, message: string, data?: any) => {
    await notificationService.scheduleLocalNotification({
      title,
      body: message,
      data
    });
  };

  const cancelExpenseNotifications = async (expenseId: string) => {
    await notificationService.cancelExpenseNotifications(expenseId);
  };

  return {
    scheduleNotification,
    sendImmediateNotification,
    cancelExpenseNotifications,
    notificationService
  };
};
