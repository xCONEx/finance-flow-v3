
import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { toast } from '@/hooks/use-toast';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestore';

interface ManualValueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManualValueModal = ({ open, onOpenChange }: ManualValueModalProps) => {
  const { addJob } = useAppContext();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    description: '',
    client: '',
    eventDate: '',
    category: '',
    totalValue: 0
  });

  const jobCategories = [
    "Filmagem de Casamento",
    "Vídeo Institucional", 
    "Clipe Musical",
    "Reels/TikTok",
    "VSL (Video Sales Letter)",
    "Edição Simples",
    "Edição Complexa",
    "Motion Graphics",
    "Outros"
  ];

  const handleSave = async () => {
    if (!formData.description || !formData.client || formData.totalValue <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado.",
        variant: "destructive"
      });
      return;
    }

    const newJob = {
      description: formData.description,
      client: formData.client,
      eventDate: formData.eventDate || new Date().toISOString(),
      estimatedHours: 0,
      difficultyLevel: 'médio' as const,
      logistics: 0,
      equipment: 0,
      assistance: 0,
      status: 'aprovado' as const,
      category: formData.category,
      discountValue: 0,
      totalCosts: formData.totalValue,
      serviceValue: formData.totalValue,
      valueWithDiscount: formData.totalValue,
      profitMargin: 0,
      id: `manual_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user.id,
      isManual: true // Identificador para jobs manuais
    };

    try {
      // Adicionar ao estado local
      addJob(newJob);

      // Salvar no Firebase
      const currentData = await firestoreService.getUserData(user.id);
      const existingJobs = (currentData && 'jobs' in currentData && currentData.jobs) ? currentData.jobs : [];
      const updatedJobs = [...existingJobs, newJob];
      
      await firestoreService.updateField('usuarios', user.id, 'jobs', updatedJobs);

      toast({
        title: "Job Manual Salvo!",
        description: `Orçamento de ${formData.description} foi adicionado com sucesso.`,
      });

      // Reset form
      setFormData({
        description: '',
        client: '',
        eventDate: '',
        category: '',
        totalValue: 0
      });
      onOpenChange(false);

    } catch (error) {
      console.error('❌ Erro ao salvar job manual:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar job manual.",
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
            Adicionar Valor Manual
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição do Job *</Label>
            <Textarea
              id="description"
              placeholder="Descreva o projeto..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Cliente *</Label>
            <Input
              id="client"
              placeholder="Nome do cliente"
              value={formData.client}
              onChange={(e) => setFormData({...formData, client: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventDate">Data do Evento</Label>
            <Input
              id="eventDate"
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {jobCategories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalValue">Valor Total (R$) *</Label>
            <CurrencyInput
              id="totalValue"
              value={formData.totalValue}
              onChange={(value) => setFormData({...formData, totalValue: value})}
              placeholder="0,00"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Salvar Job
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualValueModal;
