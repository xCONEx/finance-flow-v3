import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export interface CentralNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: any;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export function useRealtimeNotifications() {
  const { user } = useSupabaseAuth();
  const [notifications, setNotifications] = useState<CentralNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar notificações do Supabase
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) setNotifications(data);
    setLoading(false);
  }, [user?.id]);

  // Marcar notificação como lida
  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    if (!user?.id) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications((prev) => prev.map(n => ({ ...n, is_read: true })));
  };

  // Excluir notificação
  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter(n => n.id !== id));
  };

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => [payload.new as CentralNotification, ...prev].slice(0, 50));
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) => prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new } : n));
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    unreadCount: notifications.filter(n => !n.is_read).length,
  };
} 