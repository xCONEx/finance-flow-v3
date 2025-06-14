
import React, { useState, useEffect } from 'react';
import { DollarSign, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useAppContext } from '../contexts/AppContext';
import { toast } from '@/hooks/use-toast';

const EXPENSE_CATEGORIES = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Lazer',
  'Outros'
];

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCost?: any | null;
}

const ExpenseModal = ({ open, onOpenChange, editingCost }: ExpenseModalProps) => {
  const { addMonthlyCost, updateMonthlyCost } = useAppContext();
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    value: 0,
    month: new Date().toISOString().slice(0, 7)
  });

  // Resetar e popular formulário quando abrir modal
  useEffect(() => {
    if (open) {
      if (editingCost) {
        setFormData({
          description: editingCost.description || '',
          category: editingCost.category || '',
          value: editingCost.value || 0,
          month: editingCost.month || new Date().toISOString().slice(0, 7)
        });
      } else {
        setFormData({
          description: '',
          category: '',
          value: 0,
          month: new Date().toISOString().slice(0, 7)
        });
      }
    }
  }, [open, editingCost]);

  const handleSave = async () => {
    if (!formData.description || !formData.category || formData.value <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingCost) {
        await updateMonthlyCost(editingCost.id, formData);
        toast({
          title: "Despesa Atualizada",
          description: "A despesa foi atualizada com sucesso.",
        });
      } else {
        await addMonthlyCost(formData);
        toast({
          title: "Despesa Adicionada",
          description: "A despesa foi adicionada com sucesso.",
        });
      }

      setFormData({
        description: '',
        category: '',
        value: 0,
        month: new Date().toISOString().slice(0, 7)
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: editingCost ? "Erro ao atualizar despesa." : "Erro ao adicionar despesa.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {editingCost ? 'Editar Despesa' : 'Nova Despesa'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-description">Descrição *</Label>
            <Input
              id="expense-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Ex: Energia elétrica"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expense-category">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({...formData, category: value})}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense-value">Valor (R$) *</Label>
              <CurrencyInput
                id="expense-value"
                value={formData.value}
                onChange={(value) => setFormData({...formData, value})}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-month">Mês *</Label>
              <Input
                id="expense-month"
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({...formData, month: e.target.value})}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1 order-1">
              <Save className="h-4 w-4 mr-2" />
              {editingCost ? 'Atualizar' : 'Salvar'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="order-2 md:order-2">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseModal;
