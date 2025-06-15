
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '../contexts/AppContext';
import { toast } from '@/hooks/use-toast';

interface WorkItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: any | null;
}

const WorkItemModal = ({ open, onOpenChange, editingItem }: WorkItemModalProps) => {
  const { addWorkItem, updateWorkItem } = useApp();
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    value: 0,
    depreciationYears: 5
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
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
  }, [editingItem, open]);

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
          description: "O item foi adicionado com sucesso.",
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar item.",
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
            {editingItem ? 'Editar Item' : 'Adicionar Item'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Ex: Câmera Canon EOS R5"
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
                <SelectItem value="Câmeras">Câmeras</SelectItem>
                <SelectItem value="Lentes">Lentes</SelectItem>
                <SelectItem value="Áudio">Áudio</SelectItem>
                <SelectItem value="Iluminação">Iluminação</SelectItem>
                <SelectItem value="Tripés e Suportes">Tripés e Suportes</SelectItem>
                <SelectItem value="Acessórios">Acessórios</SelectItem>
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="Hardware">Hardware</SelectItem>
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
            <Label htmlFor="depreciationYears">Anos de Depreciação</Label>
            <Select
              value={formData.depreciationYears.toString()}
              onValueChange={(value) => setFormData({...formData, depreciationYears: parseInt(value)})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 ano</SelectItem>
                <SelectItem value="2">2 anos</SelectItem>
                <SelectItem value="3">3 anos</SelectItem>
                <SelectItem value="5">5 anos</SelectItem>
                <SelectItem value="10">10 anos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Salvando...' : editingItem ? 'Atualizar' : 'Adicionar'}
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

export default WorkItemModal;
