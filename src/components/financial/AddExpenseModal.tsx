
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const expenseCategories = [
  'Pró-labore',
  'Aluguel de Estúdio/Espaço',
  'Energia Elétrica',
  'Água',
  'Internet/Telefone',
  'Equipamentos (Câmera, Lentes, Iluminação)',
  'Manutenção de Equipamentos',
  'Software/Assinaturas (Adobe, CRM, etc)',
  'Marketing/Publicidade',
  'Transporte/Combustível',
  'Alimentação (Trabalho Externo)',
  'Figurino/Acessórios para Ensaios',
  'Impressão de Material',
  'Contabilidade/Taxas',
  'Impostos',
  'Cursos/Treinamentos',
  'Assistente/Freelancer',
  'Despesas Bancárias',
  'Material de Escritório',
  'Seguro',
  'Gasolina',
  'Pedágio',
  'Outras Despesas'
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

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    category: '',
    payment_method: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    is_paid: true
  });
  const [loading, setLoading] = useState(false);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const handleAmountChange = (value: number) => {
    setFormData({ ...formData, amount: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.amount <= 0) {
      toast({
        title: "Erro",
        description: "O valor deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      console.log('💳 Adicionando saída:', { 
        amount: formData.amount, 
        finalValue: formData.amount,
        description: formData.description 
      });

      const { error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          description: `FINANCIAL_EXPENSE: ${formData.description} | Payment: ${formData.payment_method} | Supplier: ${formData.supplier || 'N/A'} | Date: ${formData.date} | Paid: ${formData.is_paid}`,
          value: formData.amount, // Positive for expense
          category: formData.category,
          month: currentMonth
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Saída adicionada com sucesso!",
      });

      onSuccess();
      onClose();
      setFormData({
        description: '',
        amount: 0,
        category: '',
        payment_method: '',
        supplier: '',
        date: new Date().toISOString().split('T')[0],
        is_paid: true
      });
    } catch (error) {
      console.error('❌ Erro ao adicionar saída:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar saída. Tente novamente.",
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
          <DialogTitle className="text-red-600">Adicionar Saída</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              placeholder="Descrição da saída"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor Total (R$) *</Label>
            <CurrencyInput
              id="amount"
              value={formData.amount}
              onChange={handleAmountChange}
              placeholder="R$ 0,00"
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
                {expenseCategories.map((category) => (
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
            <Label htmlFor="supplier">Fornecedor/Empresa (Opcional)</Label>
            <Input
              id="supplier"
              placeholder="Nome do fornecedor ou empresa"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            />
          </div>

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
              variant="destructive"
              className="flex-1"
              disabled={loading || formData.amount <= 0}
            >
              {loading ? 'Adicionando...' : 'Adicionar Saída'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseModal;
