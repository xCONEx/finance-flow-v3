export interface NotificationData {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  timestamp: number;
  isRead: boolean;
  type: NotificationType;
  priority: NotificationPriority;
  category?: string;
  userId: string;
  createdAt: string;
  expiresAt?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  category?: string;
  dueDate?: string;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  userId: string;
  data?: Record<string, any>;
}

export type NotificationType = 
  | 'expense_reminder'
  | 'expense_due'
  | 'income_received'
  | 'reserve_goal'
  | 'system_alert'
  | 'task_reminder'
  | 'job_update'
  | 'general';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationSettings {
  enabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  categories: {
    expense_reminder: boolean;
    expense_due: boolean;
    income_received: boolean;
    reserve_goal: boolean;
    system_alert: boolean;
    task_reminder: boolean;
    job_update: boolean;
    general: boolean;
  };
  reminderTiming: {
    threeDays: boolean;
    oneDay: boolean;
    sameDay: boolean;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  type: NotificationType;
  variables: string[];
  isDefault: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
} 