import { 
  NotificationData, 
  PushNotificationPayload, 
  InAppNotification, 
  NotificationType, 
  NotificationPriority,
  NotificationSettings,
  NotificationTemplate
} from '../types/notification';

class NotificationService {
  private isInitialized = false;
  private isSupported = false;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private scheduledNotifications = new Set<string>();
  private notificationQueue = new Map<string, NodeJS.Timeout>();
  private inAppNotifications: InAppNotification[] = [];
  private settings: NotificationSettings;
  private isDarkMode = false;

  constructor() {
    this.checkSupport();
    this.loadSettings();
    this.checkThemeMode();
  }

  private checkSupport() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
  }

  private loadSettings() {
    const savedSettings = localStorage.getItem('financeflow_notification_settings');
    this.settings = savedSettings ? JSON.parse(savedSettings) : this.getDefaultSettings();
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      categories: {
        expense_reminder: true,
        expense_due: true,
        income_received: true,
        reserve_goal: true,
        system_alert: true,
        task_reminder: true,
        job_update: true,
        general: true
      },
      reminderTiming: {
        threeDays: true,
        oneDay: true,
        sameDay: true
      }
    };
  }

  private checkThemeMode() {
    this.isDarkMode = document.documentElement.classList.contains('dark');
    // Observar mudanças no tema
    const observer = new MutationObserver(() => {
      this.isDarkMode = document.documentElement.classList.contains('dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('🔔 Notificações não suportadas neste navegador');
      return false;
    }

    try {
      // Registrar service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('🔔 Service Worker registrado:', this.swRegistration);

      // Solicitar permissão
      const permission = await Notification.requestPermission();
      this.isInitialized = permission === 'granted';
      
      if (this.isInitialized) {
        // Carregar notificações in-app
        this.loadInAppNotifications();
        // Configurar listeners
        this.setupNotificationListeners();
      }

      console.log('🔔 Serviço de notificações inicializado:', this.isInitialized);
      return this.isInitialized;
    } catch (error) {
      console.error('❌ Erro ao inicializar notificações:', error);
      return false;
    }
  }

  private setupNotificationListeners() {
    // Listener para notificações push
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
        this.handleNotificationClick(event.data);
      }
    });
  }

  private handleNotificationClick(data: any) {
    // Implementar lógica de navegação baseada no tipo de notificação
    switch (data.notificationType) {
      case 'expense_reminder':
      case 'expense_due':
        window.location.href = '/?view=monthly-costs';
        break;
      case 'income_received':
        window.location.href = '/?view=financial';
        break;
      default:
        window.focus();
    }
  }

  async showNotification(data: NotificationData): Promise<void> {
    if (!this.isInitialized) {
      console.warn('🔔 Notificações não inicializadas');
      return;
    }

    const notificationTag = data.tag || `notification-${Date.now()}`;
    
    if (this.scheduledNotifications.has(notificationTag)) {
      console.log('🔔 Notificação já agendada:', notificationTag);
      return;
    }

    try {
      this.scheduledNotifications.add(notificationTag);
      
      // Verificar se deve mostrar baseado nas configurações
      if (!this.shouldShowNotification(data.type)) {
        return;
      }

      // Criar notificação com tema apropriado
      const notificationOptions = this.createNotificationOptions(data);
      
      const notification = new Notification(data.title, notificationOptions);

      // Auto close após 5 segundos
      setTimeout(() => {
        notification.close();
        this.scheduledNotifications.delete(notificationTag);
      }, 5000);

      // Listener para clique
      notification.onclick = () => {
        this.scheduledNotifications.delete(notificationTag);
        notification.close();
        this.handleNotificationClick(data);
      };

      // Adicionar à lista de notificações in-app se habilitado
      if (this.settings.inAppEnabled) {
        this.addInAppNotification(data);
      }

    } catch (error) {
      console.error('❌ Erro ao mostrar notificação:', error);
      this.scheduledNotifications.delete(notificationTag);
    }
  }

  private createNotificationOptions(data: NotificationData): NotificationOptions {
    const isDark = this.isDarkMode;
    
    return {
      body: data.body,
      icon: data.icon || (isDark ? '/icons/web-app-manifest-512x512.png' : '/icons/web-app-manifest-192x192.png'),
      badge: data.badge || '/icons/favicon-96x96.png',
      tag: data.tag,
      data: data.data,
      requireInteraction: data.priority === 'urgent',
      silent: !this.settings.soundEnabled
    };
  }

  private shouldShowNotification(type: NotificationType): boolean {
    return this.settings.categories[type] || false;
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

    const formatExpenseNotification = (expense: any) => {
      let description = expense.description || 'Despesa';
      let amount = expense.value ? `R$ ${expense.value.toFixed(2)}` : '';
      let client = expense.client || '';
      
      let message = description;
      if (amount) {
        message += `, ${amount}`;
      }
      if (client) {
        message += `, Cliente: ${client}`;
      }
      
      return message;
    };

    // Notificação 3 dias antes
    if (this.settings.reminderTiming.threeDays) {
      const threeDaysBefore = new Date(dueDate.getTime() - (3 * 24 * 60 * 60 * 1000));
      if (threeDaysBefore > now) {
        const delay3Days = threeDaysBefore.getTime() - now.getTime();
        await this.scheduleNotification({
          id: `${expenseTag}-3days`,
          title: '💰 Despesa vence em 3 dias',
          body: formatExpenseNotification(expense),
          tag: `${expenseTag}-3days`,
          type: 'expense_reminder',
          priority: 'medium',
          timestamp: Date.now(),
          isRead: false,
          userId: expense.userId || 'system',
          createdAt: new Date().toISOString(),
          data: { 
            type: 'expense_reminder', 
            expenseId: expense.id, 
            dueDate: expense.dueDate,
            amount: expense.value
          }
        }, delay3Days);
      }
    }

    // Notificação 1 dia antes
    if (this.settings.reminderTiming.oneDay) {
      const oneDayBefore = new Date(dueDate.getTime() - (24 * 60 * 60 * 1000));
      if (oneDayBefore > now) {
        const delay1Day = oneDayBefore.getTime() - now.getTime();
        await this.scheduleNotification({
          id: `${expenseTag}-1day`,
          title: '⚠️ Despesa vence amanhã!',
          body: formatExpenseNotification(expense),
          tag: `${expenseTag}-1day`,
          type: 'expense_reminder',
          priority: 'high',
          timestamp: Date.now(),
          isRead: false,
          userId: expense.userId || 'system',
          createdAt: new Date().toISOString(),
          data: { 
            type: 'expense_reminder', 
            expenseId: expense.id, 
            dueDate: expense.dueDate,
            amount: expense.value
          }
        }, delay1Day);
      }
    }

    // Notificação no dia do vencimento
    if (this.settings.reminderTiming.sameDay && dueDate > now) {
      const delayDueDate = dueDate.getTime() - now.getTime();
      await this.scheduleNotification({
        id: `${expenseTag}-today`,
        title: '🚨 Despesa vence hoje!',
        body: formatExpenseNotification(expense),
        tag: `${expenseTag}-today`,
        type: 'expense_due',
        priority: 'urgent',
        timestamp: Date.now(),
        isRead: false,
        userId: expense.userId || 'system',
        createdAt: new Date().toISOString(),
        data: { 
          type: 'expense_due', 
          expenseId: expense.id, 
          dueDate: expense.dueDate,
          amount: expense.value
        }
      }, delayDueDate);
    }

    console.log(`📅 Notificações agendadas para despesa: ${expense.description}`);
  }

  private cancelExpenseNotifications(expenseTag: string): void {
    const tagsToCancel = [
      `${expenseTag}-3days`,
      `${expenseTag}-1day`,
      `${expenseTag}-today`
    ];

    tagsToCancel.forEach(tag => {
      if (this.notificationQueue.has(tag)) {
        clearTimeout(this.notificationQueue.get(tag)!);
        this.notificationQueue.delete(tag);
      }
      this.scheduledNotifications.delete(tag);
    });
  }

  async cancelAllNotifications(): Promise<void> {
    // Cancelar todos os timers
    this.notificationQueue.forEach(timer => clearTimeout(timer));
    this.notificationQueue.clear();
    
    // Limpar lista de notificações agendadas
    this.scheduledNotifications.clear();
    
    console.log('🗑️ Todas as notificações canceladas');
  }

  async scheduleLocalNotification(payload: PushNotificationPayload): Promise<void> {
    try {
      const { Capacitor } = await import('@capacitor/core');
      
      if (Capacitor.isNativePlatform()) {
        try {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          
          await LocalNotifications.schedule({
            notifications: [{
              title: payload.title,
              body: payload.body,
              id: Date.now(),
              schedule: { at: new Date(Date.now() + 1000) },
              extra: payload.data
            }]
          });
        } catch (error) {
          console.error('❌ Erro ao agendar notificação local:', error);
          // Fallback para notificação web
          await this.showNotification({
            id: `local-${Date.now()}`,
            title: payload.title,
            body: payload.body,
            type: 'general',
            priority: 'medium',
            timestamp: Date.now(),
            isRead: false,
            userId: 'system',
            createdAt: new Date().toISOString(),
            data: payload.data
          });
        }
      } else {
        // Notificação web
        await this.showNotification({
          id: `web-${Date.now()}`,
          title: payload.title,
          body: payload.body,
          type: 'general',
          priority: 'medium',
          timestamp: Date.now(),
          isRead: false,
          userId: 'system',
          createdAt: new Date().toISOString(),
          data: payload.data
        });
      }
    } catch (error) {
      console.error('❌ Erro ao importar Capacitor:', error);
      // Fallback para notificação web
      await this.showNotification({
        id: `web-${Date.now()}`,
        title: payload.title,
        body: payload.body,
        type: 'general',
        priority: 'medium',
        timestamp: Date.now(),
        isRead: false,
        userId: 'system',
        createdAt: new Date().toISOString(),
        data: payload.data
      });
    }
  }

  // Métodos para notificações in-app
  private loadInAppNotifications() {
    const saved = localStorage.getItem('financeflow_inapp_notifications');
    this.inAppNotifications = saved ? JSON.parse(saved) : [];
  }

  private saveInAppNotifications() {
    localStorage.setItem('financeflow_inapp_notifications', JSON.stringify(this.inAppNotifications));
  }

  private addInAppNotification(data: NotificationData) {
    const inAppNotification: InAppNotification = {
      id: data.id,
      title: data.title,
      message: data.body,
      type: data.type,
      priority: data.priority,
      category: data.category,
      dueDate: data.data?.dueDate,
      isRead: false,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      userId: data.userId,
      data: data.data
    };

    this.inAppNotifications.unshift(inAppNotification);
    
    // Manter apenas as últimas 50 notificações
    if (this.inAppNotifications.length > 50) {
      this.inAppNotifications = this.inAppNotifications.slice(0, 50);
    }

    this.saveInAppNotifications();
  }

  getInAppNotifications(): InAppNotification[] {
    return this.inAppNotifications;
  }

  async markInAppNotificationAsRead(id: string): Promise<void> {
    const notification = this.inAppNotifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      this.saveInAppNotifications();
    }
  }

  async markAllInAppNotificationsAsRead(): Promise<void> {
    this.inAppNotifications.forEach(n => n.isRead = true);
    this.saveInAppNotifications();
  }

  async deleteInAppNotification(id: string): Promise<void> {
    this.inAppNotifications = this.inAppNotifications.filter(n => n.id !== id);
    this.saveInAppNotifications();
  }

  // Métodos para configurações
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('financeflow_notification_settings', JSON.stringify(this.settings));
  }

  getSettings(): NotificationSettings {
    return this.settings;
  }

  // Métodos utilitários
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  getUnreadCount(): number {
    return this.inAppNotifications.filter(n => !n.isRead).length;
  }

  // Métodos para templates de notificação
  getNotificationTemplates(): NotificationTemplate[] {
    return [
      {
        id: 'expense-reminder-3days',
        name: 'Lembrete de Despesa (3 dias)',
        title: '💰 Despesa vence em 3 dias',
        body: '{description}, {amount}, Cliente: {client}',
        type: 'expense_reminder',
        variables: ['description', 'amount', 'client'],
        isDefault: true
      },
      {
        id: 'expense-due-today',
        name: 'Despesa Vence Hoje',
        title: '🚨 Despesa vence hoje!',
        body: '{description}, {amount}, Cliente: {client}',
        type: 'expense_due',
        variables: ['description', 'amount', 'client'],
        isDefault: true
      },
      {
        id: 'income-received',
        name: 'Receita Recebida',
        title: '✅ Receita recebida',
        body: '{description}, {amount}, Cliente: {client}',
        type: 'income_received',
        variables: ['description', 'amount', 'client'],
        isDefault: true
      }
    ];
  }
}

export const notificationService = new NotificationService();
export default notificationService;

