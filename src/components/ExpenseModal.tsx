
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '../contexts/AppContext';
import { toast } from '@/hooks/use-toast';

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCost?: any | null;
}

const ExpenseModal = ({ open, onOpenChange, editingCost }: ExpenseModalProps) => {
  const { addMonthlyCost, updateMonthlyCost } = useApp();
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    value: 0,
    month: new Date().toISOString().slice(0, 7) // YYYY-MM
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
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
  }, [editingCost, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.category) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingCost) {
        await updateMonthlyCost(editingCost.id, formData);
        toast({
          title: "Custo Atualizado",
          description: "O custo foi atualizado com sucesso.",
        });
      } else {
        await addMonthlyCost(formData);
        toast({
          title: "Custo Adicionado",
          description: "O custo foi adicionado com sucesso.",
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar custo.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingCost ? 'Editar Custo' : 'Adicionar Custo Mensal'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Ex: Aluguel do estúdio"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({...formData, category: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aluguel">Aluguel</SelectItem>
                <SelectItem value="Energia">Energia</SelectItem>
                <SelectItem value="Internet">Internet</SelectItem>
                <SelectItem value="Telefone">Telefone</SelectItem>
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Transporte">Transporte</SelectItem>
                <SelectItem value="Alimentação">Alimentação</SelectItem>
                <SelectItem value="Materiais">Materiais</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="value">Valor (R$) *</Label>
            <Input
              id="value"
              type="number"
              min="0"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value) || 0})}
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <Label htmlFor="month">Mês/Ano *</Label>
            <Input
              id="month"
              type="month"
              value={formData.month}
              onChange={(e) => setFormData({...formData, month: e.target.value})}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Salvando...' : editingCost ? 'Atualizar' : 'Adicionar'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseModal;
