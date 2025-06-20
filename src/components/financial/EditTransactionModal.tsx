
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: any;
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

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ isOpen, onClose, onSuccess, transaction }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    payment_method: '',
    client_supplier: '',
    date: '',
    is_paid: true
  });
  const [loading, setLoading] = useState(false);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const parseTransactionData = (description: string) => {
    const isIncome = description.includes('FINANCIAL_INCOME:');
    const parts = description.split(' | ');
    const mainDesc = parts[0].replace('FINANCIAL_INCOME: ', '').replace('FINANCIAL_EXPENSE: ', '');
    const payment = parts.find(p => p.startsWith('Payment:'))?.replace('Payment: ', '') || '';
    const clientOrSupplier = parts.find(p => p.startsWith('Client:') || p.startsWith('Supplier:'))?.split(': ')[1] || '';
    const date = parts.find(p => p.startsWith('Date:'))?.replace('Date: ', '') || '';
    const isPaid = parts.find(p => p.startsWith('Paid:'))?.replace('Paid: ', '') === 'true';

    return {
      isIncome,
      description: mainDesc,
      paymentMethod: payment,
      clientOrSupplier,
      date,
      isPaid
    };
  };

  useEffect(() => {
    if (transaction) {
      const transactionData = parseTransactionData(transaction.description);
      setFormData({
        description: transactionData.description,
        amount: Math.abs(transaction.value).toString(),
        category: transaction.category,
        payment_method: transactionData.paymentMethod,
        client_supplier: transactionData.clientOrSupplier,
        date: transactionData.date,
        is_paid: transactionData.isPaid
      });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !transaction) return;

    setLoading(true);
    try {
      const isIncome = transaction.value < 0;
      const prefix = isIncome ? 'FINANCIAL_INCOME:' : 'FINANCIAL_EXPENSE:';
      const clientSupplierLabel = isIncome ? 'Client:' : 'Supplier:';
      
      const updatedDescription = `${prefix} ${formData.description} | Payment: ${formData.payment_method} | ${clientSupplierLabel} ${formData.client_supplier || 'N/A'} | Date: ${formData.date} | Paid: ${formData.is_paid}`;
      const updatedValue = isIncome ? -(parseFloat(formData.amount) || 0) : (parseFloat(formData.amount) || 0);

      const { error } = await supabase
        .from('expenses')
        .update({
          description: updatedDescription,
          value: updatedValue,
          category: formData.category
        })
        .eq('id', transaction.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso!",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar transação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!transaction) return null;

  const isIncome = transaction.value < 0;
  const categories = isIncome ? incomeCategories : expenseCategories;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={isIncome ? "text-green-600" : "text-red-600"}>
            Editar {isIncome ? 'Entrada' : 'Saída'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              placeholder="Descrição da transação"
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
                {categories.map((category) => (
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
            <Label htmlFor="client_supplier">{isIncome ? 'Cliente' : 'Fornecedor'} (Opcional)</Label>
            <Input
              id="client_supplier"
              placeholder={isIncome ? "Nome do cliente" : "Nome do fornecedor ou empresa"}
              value={formData.client_supplier}
              onChange={(e) => setFormData({ ...formData, client_supplier: e.target.value })}
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
              className={`flex-1 ${isIncome ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionModal;
