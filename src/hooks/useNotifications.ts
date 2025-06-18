
import { useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useApp } from '../contexts/AppContext';

export const useNotifications = () => {
  const { monthlyCosts } = useApp();

  useEffect(() => {
    // Inicializar o serviço de notificações
    notificationService.initialize();
  }, []);

  useEffect(() => {
    // Agendar notificações para todos os custos com vencimento
    if (monthlyCosts.length > 0) {
      monthlyCosts.forEach(cost => {
        if (cost.dueDate && cost.notificationEnabled) {
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

  return {
    scheduleNotification,
    sendImmediateNotification,
    notificationService
  };
};
