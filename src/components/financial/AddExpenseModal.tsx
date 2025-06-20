
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
    value: '',
    category: '',
    payment_method: '',
    supplier: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
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
      // Insert into expenses table with correct schema
      const { error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          description: `[SAÍDA] ${formData.description}${formData.supplier ? ` - ${formData.supplier}` : ''}`,
          value: parseFloat(formData.value) || 0,
          category: formData.category,
          month: formData.month
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
        value: '',
        category: '',
        payment_method: '',
        supplier: '',
        month: new Date().toISOString().slice(0, 7),
        is_paid: true
      });
    } catch (error) {
      console.error('Erro ao adicionar saída:', error);
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
            <Label htmlFor="value">Valor Total (R$) (Opcional)</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
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
            <Label htmlFor="month">Mês *</Label>
            <Input
              id="month"
              type="month"
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
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
              disabled={loading}
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
