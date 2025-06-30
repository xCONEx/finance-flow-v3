import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, BellOff, Smartphone, Volume2, VolumeX, Settings } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { NotificationSettings as NotificationSettingsType } from '../types/notification';

const NotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const currentSettings = notificationService.getSettings();
    setSettings(currentSettings);
    setLoading(false);
  };

  const updateSetting = (key: keyof NotificationSettingsType, value: any) => {
    if (!settings) return;

    const newSettings = { ...settings };
    
    if (typeof value === 'object' && value !== null) {
      newSettings[key] = { ...(newSettings[key] as any), ...value };
    } else {
      newSettings[key] = value;
    }

    setSettings(newSettings);
    notificationService.updateSettings(newSettings);
  };

  const updateCategory = (category: string, enabled: boolean) => {
    if (!settings) return;
    
    updateSetting('categories', {
      ...settings.categories,
      [category]: enabled
    });
  };

  const updateTiming = (timing: string, enabled: boolean) => {
    if (!settings) return;
    
    updateSetting('reminderTiming', {
      ...settings.reminderTiming,
      [timing]: enabled
    });
  };

  const testNotification = async () => {
    try {
      await notificationService.scheduleLocalNotification({
        title: 'FinanceFlow - Teste',
        body: 'Esta é uma notificação de teste! 💰',
        data: {
          type: 'test',
          timestamp: Date.now()
        }
      });
      
      toast({
        title: "🔔 Notificação de Teste Enviada",
        description: "Verifique se a notificação apareceu no seu dispositivo.",
      });
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de teste:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a notificação de teste.",
        variant: "destructive"
      });
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationService.cancelAllNotifications();
      toast({
        title: "🗑️ Notificações Limpas",
        description: "Todas as notificações agendadas foram canceladas.",
      });
    } catch (error) {
      console.error('❌ Erro ao limpar notificações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível limpar as notificações.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 animate-spin" />
            Carregando configurações...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Erro ao carregar configurações</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {Capacitor.isNativePlatform() ? <Smartphone className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            Configurações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-enabled">Notificações Ativadas</Label>
              <p className="text-sm text-muted-foreground">
                Ativar ou desativar todas as notificações
              </p>
            </div>
            <Switch
              id="notifications-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSetting('enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-enabled">Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações mesmo com o app fechado
              </p>
            </div>
            <Switch
              id="push-enabled"
              checked={settings.pushEnabled}
              onCheckedChange={(checked) => updateSetting('pushEnabled', checked)}
              disabled={!settings.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="inapp-enabled">Notificações In-App</Label>
              <p className="text-sm text-muted-foreground">
                Mostrar notificações dentro do aplicativo
              </p>
            </div>
            <Switch
              id="inapp-enabled"
              checked={settings.inAppEnabled}
              onCheckedChange={(checked) => updateSetting('inAppEnabled', checked)}
              disabled={!settings.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Som e Vibração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {settings.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            Som e Vibração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-enabled">Som</Label>
              <p className="text-sm text-muted-foreground">
                Tocar som ao receber notificações
              </p>
            </div>
            <Switch
              id="sound-enabled"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
              disabled={!settings.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="vibration-enabled">Vibração</Label>
              <p className="text-sm text-muted-foreground">
                Vibrar ao receber notificações (apenas mobile)
              </p>
            </div>
            <Switch
              id="vibration-enabled"
              checked={settings.vibrationEnabled}
              onCheckedChange={(checked) => updateSetting('vibrationEnabled', checked)}
              disabled={!settings.enabled || !Capacitor.isNativePlatform()}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categorias de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Notificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="expense-reminder">💰 Lembretes de Despesa</Label>
                <p className="text-xs text-muted-foreground">3 dias antes do vencimento</p>
              </div>
              <Switch
                id="expense-reminder"
                checked={settings.categories.expense_reminder}
                onCheckedChange={(checked) => updateCategory('expense_reminder', checked)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="expense-due">🚨 Despesas Vencendo</Label>
                <p className="text-xs text-muted-foreground">No dia do vencimento</p>
              </div>
              <Switch
                id="expense-due"
                checked={settings.categories.expense_due}
                onCheckedChange={(checked) => updateCategory('expense_due', checked)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="income-received">✅ Receitas Recebidas</Label>
                <p className="text-xs text-muted-foreground">Confirmação de pagamentos</p>
              </div>
              <Switch
                id="income-received"
                checked={settings.categories.income_received}
                onCheckedChange={(checked) => updateCategory('income_received', checked)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reserve-goal">🎯 Metas de Reserva</Label>
                <p className="text-xs text-muted-foreground">Atualizações de reservas</p>
              </div>
              <Switch
                id="reserve-goal"
                checked={settings.categories.reserve_goal}
                onCheckedChange={(checked) => updateCategory('reserve_goal', checked)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="system-alert">⚠️ Alertas do Sistema</Label>
                <p className="text-xs text-muted-foreground">Notificações importantes</p>
              </div>
              <Switch
                id="system-alert"
                checked={settings.categories.system_alert}
                onCheckedChange={(checked) => updateCategory('system_alert', checked)}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="general">🔔 Notificações Gerais</Label>
                <p className="text-xs text-muted-foreground">Outras notificações</p>
              </div>
              <Switch
                id="general"
                checked={settings.categories.general}
                onCheckedChange={(checked) => updateCategory('general', checked)}
                disabled={!settings.enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timing dos Lembretes */}
      <Card>
        <CardHeader>
          <CardTitle>Timing dos Lembretes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="three-days">3 dias antes</Label>
              <p className="text-sm text-muted-foreground">
                Lembrete antecipado para despesas
              </p>
            </div>
            <Switch
              id="three-days"
              checked={settings.reminderTiming.threeDays}
              onCheckedChange={(checked) => updateTiming('threeDays', checked)}
              disabled={!settings.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="one-day">1 dia antes</Label>
              <p className="text-sm text-muted-foreground">
                Lembrete no dia anterior
              </p>
            </div>
            <Switch
              id="one-day"
              checked={settings.reminderTiming.oneDay}
              onCheckedChange={(checked) => updateTiming('oneDay', checked)}
              disabled={!settings.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="same-day">No dia do vencimento</Label>
              <p className="text-sm text-muted-foreground">
                Alerta no dia do vencimento
              </p>
            </div>
            <Switch
              id="same-day"
              checked={settings.reminderTiming.sameDay}
              onCheckedChange={(checked) => updateTiming('sameDay', checked)}
              disabled={!settings.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={testNotification}
              className="flex-1"
              disabled={!settings.enabled}
            >
              <Bell className="h-4 w-4 mr-2" />
              Testar Notificação
            </Button>
            
            <Button 
              onClick={clearAllNotifications}
              className="flex-1"
            >
              <BellOff className="h-4 w-4 mr-2" />
              Limpar Todas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
