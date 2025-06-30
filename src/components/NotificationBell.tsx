import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCheck, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { notificationService } from '../services/notificationService';
import { InAppNotification, NotificationType } from '../types/notification';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '@/lib/utils';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const { isDark } = useTheme();

  useEffect(() => {
    // Carregar notificações iniciais
    loadNotifications();
    
    // Atualizar notificações periodicamente
    const interval = setInterval(loadNotifications, 30000); // 30 segundos
    
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    const inAppNotifications = notificationService.getInAppNotifications();
    setNotifications(inAppNotifications);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markInAppNotificationAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllInAppNotificationsAsRead();
    loadNotifications();
  };

  const handleDeleteNotification = async (id: string) => {
    await notificationService.deleteInAppNotification(id);
    loadNotifications();
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'hoje';
    if (diffDays === 1) return 'amanhã';
    if (diffDays > 0) return `em ${diffDays} dias`;
    return `há ${Math.abs(diffDays)} dias`;
  };

  const formatTimeAgo = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return created.toLocaleDateString('pt-BR');
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'expense_reminder':
        return '💰';
      case 'expense_due':
        return '🚨';
      case 'income_received':
        return '✅';
      case 'reserve_goal':
        return '🎯';
      case 'system_alert':
        return '⚠️';
      case 'task_reminder':
        return '📋';
      case 'job_update':
        return '💼';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: NotificationType, priority: string) => {
    if (priority === 'urgent') return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
    if (priority === 'high') return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950';
    
    switch (type) {
      case 'expense_due':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'expense_reminder':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'income_received':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'reserve_goal':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificações
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={handleMarkAllAsRead}
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Marcar todas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => window.location.href = '/?view=notification-settings'}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação no momento</p>
                <p className="text-xs mt-1">Você receberá notificações sobre vencimentos e atualizações importantes</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className={cn(
                        "p-4 border-l-4 transition-colors hover:bg-muted/50",
                        getNotificationColor(notification.type, notification.priority),
                        !notification.isRead && "bg-muted/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="text-lg mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatTimeAgo(notification.createdAt)}</span>
                              {notification.dueDate && (
                                <>
                                  <span>•</span>
                                  <span>Vence {formatDueDate(notification.dueDate)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <CheckCheck className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteNotification(notification.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
