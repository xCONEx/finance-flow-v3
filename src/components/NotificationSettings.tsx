import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Smartphone } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

const NotificationSettings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar estado atual das notificações
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Verificar permissões no mobile
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const permissions = await LocalNotifications.checkPermissions();
        setNotificationsEnabled(permissions.display === 'granted');
      } else {
        // Verificar permissões no web
        setNotificationsEnabled(Notification.permission === 'granted');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status das notificações:', error);
    }
  };

  const toggleNotifications = async () => {
    try {
      if (!notificationsEnabled) {
        await notificationService.initialize();
        await checkNotificationStatus();
        
        if (notificationsEnabled) {
          toast({
            title: "✅ Notificações Ativadas",
            description: "Você receberá lembretes sobre vencimentos de custos.",
          });
        }
      } else {
        await notificationService.cancelAllNotifications();
        setNotificationsEnabled(false);
        
        toast({
          title: "❌ Notificações Desativadas",
          description: "Você não receberá mais lembretes automáticos.",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao alterar configuração de notificações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar as configurações de notificação.",
        variant: "destructive"
      });
    }
  };

  const testNotification = async () => {
    try {
      await notificationService.scheduleLocalNotification({
        title: 'Finance Flow - Teste',
        body: 'Esta é uma notificação de teste! 💰',
        data: {
          costId: 'test-cost',
          amount: 100,
          dueDate: new Date().toISOString(),
          category: 'teste'
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Capacitor.isNativePlatform() ? <Smartphone className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          Configurações de Notificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications">Lembretes de Vencimento</Label>
            <p className="text-sm text-muted-foreground">
              Receba notificações sobre custos próximos do vencimento
            </p>
          </div>
          <Switch
            id="notifications"
            checked={notificationsEnabled}
            onCheckedChange={toggleNotifications}
          />
        </div>

        {Capacitor.isNativePlatform() && (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Notificações push no dispositivo móvel
              </p>
            </div>
            <Switch
              id="push"
              checked={pushEnabled}
              onCheckedChange={setPushEnabled}
            />
          </div>
        )}

        <div className="pt-4 border-t">
          <Button 
            onClick={testNotification}
            variant="outline"
            className="w-full"
            disabled={!notificationsEnabled}
          >
            <Bell className="h-4 w-4 mr-2" />
            Testar Notificação
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 <strong>Dica:</strong> As notificações são enviadas:</p>
          <p>• 3 dias antes do vencimento</p>
          <p>• No dia do vencimento</p>
          <p>• Apenas para custos com notificações ativadas</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
