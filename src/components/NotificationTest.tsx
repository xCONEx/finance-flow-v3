import React from 'react';
import { Button } from '@/components/ui/button';
import { testNotificationInsertion } from '@/services/notificationService';

const NotificationTest: React.FC = () => {
  const handleTest = async () => {
    console.log('🧪 Iniciando teste de notificação...');
    await testNotificationInsertion();
  };

  return (
    <div className="p-4 border rounded-lg bg-yellow-50">
      <h3 className="text-lg font-semibold mb-2">Teste de Notificações</h3>
      <p className="text-sm text-gray-600 mb-4">
        Clique no botão para testar a inserção de notificações no Supabase.
      </p>
      <Button onClick={handleTest} className="bg-blue-600 hover:bg-blue-700">
        Testar Inserção
      </Button>
    </div>
  );
};

export default NotificationTest; 