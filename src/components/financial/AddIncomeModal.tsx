
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

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const incomeCategories = [
  'Casamento',
  'Ensaio Casamento',
  'Ensaio Família',
  'Ensaio Individual',
  'Ensaio Gestante',
  'Ensaio Newborn',
  'Evento Social',
  'Evento Corporativo',
  'Fotografia de Produto',
  'Fotografia Publicitária',
  'Venda de Prints/Álbuns',
  'Consultoria/Workshop',
  'Sinal de Agendamento',
  'Pagamento Restante',
  'Outras Receitas'
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
    client_name: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    work_id: '',
    is_paid: true
  });
  const [loading, setLoading] = useState(false);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Usar SQL direto através de uma query personalizada
      const { error } = await supabase
        .rpc('exec_sql', {
          query: `
            INSERT INTO financial_transactions (
              user_id, type, description, amount, category, payment_method, 
              client_name, date, time, work_id, is_paid
            ) VALUES (
              $1, 'income', $2, $3, $4, $5, $6, $7, $8, $9, $10
            )
          `,
          params: [
            user.id,
            formData.description,
            parseFloat(formData.amount) || 0,
            formData.category,
            formData.payment_method,
            formData.client_name || null,
            formData.date,
            formData.time || null,
            formData.work_id || null,
            formData.is_paid
          ]
        });

      if (error) throw error;

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
        client_name: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].slice(0, 5),
        work_id: '',
        is_paid: true
      });
    } catch (error) {
      console.error('Erro ao adicionar entrada:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar entrada. Certifique-se de que executou o SQL das tabelas financeiras.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
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
            <Label htmlFor="amount">Valor Total (R$) (Opcional)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="work_id">Vincular Trabalho (Opcional)</Label>
            <Select value={formData.work_id} onValueChange={(value) => setFormData({ ...formData, work_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um trabalho..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum trabalho vinculado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="partial_payment"
              checked={false}
              disabled
            />
            <Label htmlFor="partial_payment">Pagamento Parcial / Agendar Restante</Label>
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
            <Label htmlFor="client_name">Cliente Vinculado (Opcional)</Label>
            <Input
              id="client_name"
              placeholder="Nome do cliente"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Horário (Opcional)</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_paid"
              checked={formData.is_paid}
              onCheckedChange={(checked) => setFormData({ ...formData, is_paid: !!checked })}
            />
            <Label htmlFor="is_paid">Marcar como pago</Label>
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
              className="flex-1 bg-green-600 hover:bg-green-700"
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
