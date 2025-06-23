
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CurrencyInput } from '@/components/ui/currency-input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  value: number;
  due_date: string;
  category: string;
  is_recurring: boolean;
  recurring_type?: string;
  status: string;
  notification_enabled: boolean;
}

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense: Expense | null;
}

const categories = [
  'Internet/Telefone',
  'Aluguel',
  'Energia Elétrica',
  'Transporte',
  'Alimentação',
  'Equipamentos',
  'Software/Licenças',
  'Marketing',
  'Impostos',
  'Outros'
];

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expense
}) => {
  const [formData, setFormData] = useState({
    description: '',
    value: 0,
    due_date: '',
    category: 'Outros',
    is_recurring: false,
    recurring_type: 'monthly',
    status: 'pendente',
    notification_enabled: true
  });
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || '',
        value: Math.abs(expense.value) || 0,
        due_date: expense.due_date || '',
        category: expense.category || 'Outros',
        is_recurring: expense.is_recurring || false,
        recurring_type: expense.recurring_type || 'monthly',
        status: expense.status || 'pendente',
        notification_enabled: expense.notification_enabled !== false
      });
    }
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      toast({
        title: "Erro",
        description: "Descrição é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    if (formData.value <= 0) {
      toast({
        title: "Erro", 
        description: "Valor deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.due_date) {
      toast({
        title: "Erro",
        description: "Data de vencimento é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const isIncome = formData.description.includes('FINANCIAL_INCOME:');
      const finalValue = isIncome ? -Math.abs(formData.value) : Math.abs(formData.value);

      const { error } = await supabase
        .from('expenses')
        .update({
          ...formData,
          value: finalValue
        })
        .eq('id', expense?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso!",
      });

      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar transação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!expense) return;

    if (!confirm('Tem certeza que deseja remover esta transação?')) return;

    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Transação removida com sucesso!",
      });

      onSuccess();
    } catch (error) {
      console.error('Erro ao remover transação:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover transação.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const isIncome = formData.description.includes('FINANCIAL_INCOME:');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-600">
            Editar {isIncome ? 'Entrada' : 'Saída'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              placeholder={isIncome ? "Descrição da entrada" : "Descrição da despesa"}
              value={isIncome ? formData.description.replace('FINANCIAL_INCOME: ', '') : formData.description}
              onChange={(e) => {
                const value = isIncome ? `FINANCIAL_INCOME: ${e.target.value}` : e.target.value;
                setFormData({ ...formData, description: value });
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor (R$) *</Label>
            <CurrencyInput
              id="value"
              placeholder="0,00"
              value={formData.value}
              onChange={(value) => setFormData({ ...formData, value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Data de Vencimento *</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_recurring"
              checked={formData.is_recurring}
              onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
            />
            <Label htmlFor="is_recurring">Recorrente</Label>
          </div>

          {formData.is_recurring && (
            <div className="space-y-2">
              <Label htmlFor="recurring_type">Tipo de Recorrência</Label>
              <Select
                value={formData.recurring_type}
                onValueChange={(value) => setFormData({ ...formData, recurring_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="notification_enabled"
              checked={formData.notification_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, notification_enabled: checked })}
            />
            <Label htmlFor="notification_enabled">Notificações</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading || deleteLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || deleteLoading}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleteLoading ? 'Removendo...' : 'Remover'}
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 flex-1"
              disabled={loading || deleteLoading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
