
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useApp } from '../contexts/AppContext';

interface ManualValueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManualValueModal: React.FC<ManualValueModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useSupabaseAuth();
  const { addJob } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    client: '',
    eventDate: '',
    serviceValue: 0,
    status: 'pendente' as 'pendente' | 'aprovado',
    category: 'Manual',
  });

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
      const jobData = {
        ...formData,
        eventDate: formData.eventDate || new Date().toISOString(),
        estimatedHours: 0,
        difficultyLevel: 'médio' as const,
        logistics: 0,
        equipment: 0,
        assistance: 0,
        discountValue: 0,
        totalCosts: 0,
        valueWithDiscount: formData.serviceValue,
        profitMargin: 0,
      };

      await addJob(jobData);

      toast({
        title: "Valor Manual Adicionado",
        description: "O valor foi registrado com sucesso.",
      });

      // Reset form
      setFormData({
        description: '',
        client: '',
        eventDate: '',
        serviceValue: 0,
        status: 'pendente',
        category: 'Manual',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao adicionar valor manual:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar valor manual.",
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
          <DialogTitle>Adicionar Valor Manual</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ex: Projeto especial"
              required
            />
          </div>

          <div>
            <Label htmlFor="client">Cliente</Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
              placeholder="Nome do cliente"
              required
            />
          </div>

          <div>
            <Label htmlFor="eventDate">Data do Evento</Label>
            <Input
              id="eventDate"
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="serviceValue">Valor do Serviço (R$)</Label>
            <Input
              id="serviceValue"
              type="number"
              step="0.01"
              min="0"
              value={formData.serviceValue}
              onChange={(e) => setFormData(prev => ({ ...prev, serviceValue: parseFloat(e.target.value) || 0 }))}
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'pendente' | 'aprovado') => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
              </SelectContent>
            </Select>
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
              {loading ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualValueModal;
