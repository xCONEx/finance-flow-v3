import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { InAppNotification, NotificationType } from '../types/notification';

const NotificationStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    byType: {} as Record<NotificationType, number>,
    byPriority: {} as Record<string, number>
  });

  useEffect(() => {
    calculateStats();
    const interval = setInterval(calculateStats, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, []);

  const calculateStats = () => {
    const notifications = notificationService.getInAppNotifications();
    const unread = notifications.filter(n => !n.isRead).length;
    
    const byType: Record<NotificationType, number> = {
      expense_reminder: 0,
      expense_due: 0,
      income_received: 0,
      reserve_goal: 0,
      system_alert: 0,
      task_reminder: 0,
      job_update: 0,
      general: 0
    };

    const byPriority: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };

    notifications.forEach(notification => {
      byType[notification.type]++;
      byPriority[notification.priority]++;
    });

    setStats({
      total: notifications.length,
      unread,
      byType,
      byPriority
    });
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'expense_reminder': return '💰';
      case 'expense_due': return '🚨';
      case 'income_received': return '✅';
      case 'reserve_goal': return '🎯';
      case 'system_alert': return '⚠️';
      case 'task_reminder': return '📋';
      case 'job_update': return '💼';
      default: return '🔔';
    }
  };

  const getTypeLabel = (type: NotificationType) => {
    switch (type) {
      case 'expense_reminder': return 'Lembretes';
      case 'expense_due': return 'Vencendo';
      case 'income_received': return 'Receitas';
      case 'reserve_goal': return 'Reservas';
      case 'system_alert': return 'Alertas';
      case 'task_reminder': return 'Tarefas';
      case 'job_update': return 'Trabalhos';
      default: return 'Geral';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Não Lidas</p>
                <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lidas</p>
                <p className="text-2xl font-bold text-green-600">{stats.total - stats.unread}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Leitura</p>
                <p className="text-2xl font-bold">
                  {stats.total > 0 ? Math.round(((stats.total - stats.unread) / stats.total) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Por Tipo de Notificação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(type as NotificationType)}</span>
                  <span className="text-sm font-medium">{getTypeLabel(type as NotificationType)}</span>
                </div>
                <Badge>{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Por Prioridade */}
      <Card>
        <CardHeader>
          <CardTitle>Por Prioridade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(stats.byPriority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize">{priority}</span>
                </div>
                <Badge className={getPriorityColor(priority)}>{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Dicas sobre Notificações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• <strong>Lembretes de Despesa:</strong> Recebidos 3 dias antes do vencimento</p>
            <p>• <strong>Despesas Vencendo:</strong> Alertas no dia do vencimento</p>
            <p>• <strong>Receitas Recebidas:</strong> Confirmação de pagamentos</p>
            <p>• <strong>Metas de Reserva:</strong> Atualizações sobre suas reservas</p>
            <p>• <strong>Alertas do Sistema:</strong> Notificações importantes do sistema</p>
            <p>• Configure as notificações em Configurações → Notificações</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationStats; 