
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
    month: new Date().toISOString().slice(0, 7),
    dueDate: undefined as Date | undefined,
    isRecurring: false,
    installments: 1,
    notificationEnabled: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingCost) {
      setFormData({
        description: editingCost.description || '',
        category: editingCost.category || '',
        value: editingCost.value || 0,
        month: editingCost.month || new Date().toISOString().slice(0, 7),
        dueDate: editingCost.dueDate ? new Date(editingCost.dueDate) : undefined,
        isRecurring: editingCost.isRecurring || false,
        installments: editingCost.installments || 1,
        notificationEnabled: editingCost.notificationEnabled !== false
      });
    } else {
      setFormData({
        description: '',
        category: '',
        value: 0,
        month: new Date().toISOString().slice(0, 7),
        dueDate: undefined,
        isRecurring: false,
        installments: 1,
        notificationEnabled: true
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
      const costData = {
        description: formData.description,
        category: formData.category,
        value: formData.value,
        month: formData.month,
        dueDate: formData.dueDate?.toISOString().split('T')[0],
        isRecurring: formData.isRecurring,
        installments: formData.installments > 1 ? formData.installments : undefined,
        notificationEnabled: formData.notificationEnabled,
        currentInstallment: formData.installments > 1 ? 1 : undefined,
        parentId: undefined
      };

      if (editingCost) {
        await updateMonthlyCost(editingCost.id, costData);
        toast({
          title: "Custo Atualizado",
          description: "O custo foi atualizado com sucesso.",
        });
      } else {
        await addMonthlyCost(costData);
        
        let successMessage = "O custo foi adicionado com sucesso.";
        if (formData.isRecurring) {
          successMessage += " Será repetido mensalmente.";
        }
        if (formData.installments > 1) {
          successMessage += ` Parcelado em ${formData.installments}x.`;
        }
        
        toast({
          title: "Custo Adicionado",
          description: successMessage,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCost ? 'Editar Custo' : 'Adicionar Custo Mensal'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
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

            <div>
              <Label htmlFor="dueDate">Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, "dd/MM/yyyy") : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => setFormData({...formData, dueDate: date})}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="recurring">Repetir todo mês automaticamente</Label>
                <p className="text-sm text-muted-foreground">
                  O custo será criado automaticamente todos os meses
                </p>
              </div>
              <Switch
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData({...formData, isRecurring: checked})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="installments">Número de Parcelas</Label>
                <Select
                  value={formData.installments.toString()}
                  onValueChange={(value) => setFormData({...formData, installments: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">À vista</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="3">3x</SelectItem>
                    <SelectItem value="4">4x</SelectItem>
                    <SelectItem value="5">5x</SelectItem>
                    <SelectItem value="6">6x</SelectItem>
                    <SelectItem value="12">12x</SelectItem>
                    <SelectItem value="24">24x</SelectItem>
                  </SelectContent>
                </Select>
                {formData.installments > 1 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Valor por parcela: R$ {(formData.value / formData.installments).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Ativar Notificações</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber lembretes de vencimento
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={formData.notificationEnabled}
                  onCheckedChange={(checked) => setFormData({...formData, notificationEnabled: checked})}
                />
              </div>
            </div>
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
