
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const incomeCategories = [
  'Ensaio Fotográfico',
  'Casamento',
  'Aniversário/Festa',
  'Corporativo/Empresarial',
  'Book Pessoal',
  'Evento Social',
  'Produto/Comercial',
  'Arquitetônico',
  'Newborn/Gestante',
  'Edição de Vídeo',
  'Design Gráfico',
  'Consultoria',
  'Curso/Workshop',
  'Aluguel de Equipamento',
  'Outros Serviços'
];

const paymentMethods = [
  'Pix',
  'Pix Parcelado',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Transferência (TED/DOC)',
  'Boleto',
  'Dinheiro',
  'Outros'
];

const AddIncomeModal: React.FC<AddIncomeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    payment_method: '',
    client: '',
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    is_paid: false,
    notification_enabled: true
  });
  const [loading, setLoading] = useState(false);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { scheduleNotification } = useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const expenseData = {
        user_id: user.id,
        description: `FINANCIAL_INCOME: ${formData.description} | Payment: ${formData.payment_method} | Client: ${formData.client || 'N/A'} | Date: ${formData.date} | Paid: ${formData.is_paid}`,
        value: -(parseFloat(formData.amount) || 0), // Negative for income
        category: formData.category,
        month: currentMonth,
        due_date: formData.due_date || null,
        notification_enabled: formData.notification_enabled
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single();

      if (error) throw error;

      // Schedule notifications if enabled and has due date
      if (formData.notification_enabled && formData.due_date && !formData.is_paid) {
        await scheduleNotification({
          ...data,
          description: formData.description,
          value: parseFloat(formData.amount) || 0,
          due_date: formData.due_date
        });
      }

      toast({
        title: "Sucesso",
        description: "Entrada adicionada com sucesso!",
      });

      onSuccess();
      onClose();
      setFormData({
        description: '',
        amount: '',
        category: '',
        payment_method: '',
        client: '',
        date: new Date().toISOString().split('T')[0],
        due_date: '',
        is_paid: false,
        notification_enabled: true
      });
    } catch (error) {
      console.error('Erro ao adicionar entrada:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar entrada. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-green-600">Adicionar Entrada</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              placeholder="Descrição da entrada"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor Total (R$) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {incomeCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Forma de Pagamento *</Label>
            <Select 
              value={formData.payment_method} 
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Cliente *</Label>
            <Input
              id="client"
              placeholder="Nome do cliente"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data do Serviço *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Data de Vencimento (Opcional)</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
            <p className="text-xs text-gray-500">
              Se preenchido, você receberá notificações 1 dia antes e no dia do vencimento
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_paid"
              checked={formData.is_paid}
              onCheckedChange={(checked) => setFormData({ ...formData, is_paid: !!checked })}
            />
            <Label htmlFor="is_paid">Marcar como recebido</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notification_enabled"
              checked={formData.notification_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, notification_enabled: !!checked })}
            />
            <Label htmlFor="notification_enabled">Ativar notificações de cobrança</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 flex-1"
              disabled={loading}
            >
              {loading ? 'Adicionando...' : 'Adicionar Entrada'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddIncomeModal;
