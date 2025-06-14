
import React, { useState, useEffect } from 'react';
import { Briefcase, Save } from 'lucide-react';
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

const EQUIPMENT_CATEGORIES = [
  'Câmera',
  'Lente', 
  'Hardware',
  'Software',
  'Iluminação',
  'Audio',
  'Acessórios',
  'Outros'
];

interface WorkItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: any | null;
}

const WorkItemModal = ({ open, onOpenChange, editingItem }: WorkItemModalProps) => {
  const { addWorkItem, updateWorkItem } = useAppContext();
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    value: 0,
    depreciationYears: 5
  });

  // Resetar e popular formulário quando abrir modal
  useEffect(() => {
    if (open) {
      if (editingItem) {
        setFormData({
          description: editingItem.description || '',
          category: editingItem.category || '',
          value: editingItem.value || 0,
          depreciationYears: editingItem.depreciationYears || 5
        });
      } else {
        setFormData({
          description: '',
          category: '',
          value: 0,
          depreciationYears: 5
        });
      }
    }
  }, [open, editingItem]);

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
      if (editingItem) {
        await updateWorkItem(editingItem.id, formData);
        toast({
          title: "Item Atualizado",
          description: "O item foi atualizado com sucesso.",
        });
      } else {
        await addWorkItem(formData);
        toast({
          title: "Item Adicionado",
          description: "O item de trabalho foi adicionado com sucesso.",
        });
      }

      setFormData({
        description: '',
        category: '',
        value: 0,
        depreciationYears: 5
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: editingItem ? "Erro ao atualizar item." : "Erro ao adicionar item.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            {editingItem ? 'Editar Item' : 'Novo Item de Trabalho'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-description">Descrição *</Label>
            <Input
              id="item-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Ex: Câmera DSLR"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="item-category">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({...formData, category: value})}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {EQUIPMENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-value">Valor (R$) *</Label>
              <CurrencyInput
                id="item-value"
                value={formData.value}
                onChange={(value) => setFormData({...formData, value})}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-depreciation">Anos de Depreciação</Label>
              <Input
                id="item-depreciation"
                type="number"
                inputMode="numeric"
                min="1"
                max="20"
                value={formData.depreciationYears || ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  const clean = raw.replace(/^0+/, "");
                  setFormData({ ...formData, depreciationYears: Number(clean) });
                }}
                placeholder="5"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1 order-1">
              <Save className="h-4 w-4 mr-2" />
              {editingItem ? 'Atualizar' : 'Salvar'}
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

export default WorkItemModal;
