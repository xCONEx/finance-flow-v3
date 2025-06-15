
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useApp } from '../contexts/AppContext';

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCost?: any;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  open,
  onOpenChange,
  editingCost,
}) => {
  const { user } = useSupabaseAuth();
  const { addMonthlyCost, updateMonthlyCost } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    value: 0,
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
  });

  const categories = [
    'Aluguel',
    'Energia',
    'Internet',
    'Telefone',
    'Equipamentos',
    'Software',
    'Marketing',
    'Transporte',
    'Alimentação',
    'Outros'
  ];

  // Preencher formulário quando estiver editando
  useEffect(() => {
    if (editingCost) {
      setFormData({
        description: editingCost.description || '',
        category: editingCost.category || '',
        value: editingCost.value || 0,
        month: editingCost.month || new Date().toISOString().slice(0, 7),
      });
    } else {
      setFormData({
        description: '',
        category: '',
        value: 0,
        month: new Date().toISOString().slice(0, 7),
      });
    }
  }, [editingCost, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (editingCost) {
        await updateMonthlyCost(editingCost.id, formData);
        toast({
          title: "Custo Atualizado",
          description: "O custo mensal foi atualizado com sucesso.",
        });
      } else {
        await addMonthlyCost(formData);
        toast({
          title: "Custo Adicionado",
          description: "O custo mensal foi registrado com sucesso.",
        });
      }

      // Reset form
      setFormData({
        description: '',
        category: '',
        value: 0,
        month: new Date().toISOString().slice(0, 7),
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar custo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar custo mensal.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingCost ? 'Editar Custo Mensal' : 'Adicionar Custo Mensal'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ex: Aluguel do escritório"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
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

          <div>
            <Label htmlFor="value">Valor (R$)</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <Label htmlFor="month">Mês de Referência</Label>
            <Input
              id="month"
              type="month"
              value={formData.month}
              onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (editingCost ? 'Atualizando...' : 'Adicionando...') : (editingCost ? 'Atualizar' : 'Adicionar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseModal;
