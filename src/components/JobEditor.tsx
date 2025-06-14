import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PercentageInput } from '@/components/ui/percentage-input';
import { useAppContext } from '../contexts/AppContext';
import { Job } from '../types';
import { toast } from '@/hooks/use-toast';

interface JobEditorProps {
  jobId?: string;
  onClose: () => void;
  onSaved?: () => void; // NOVO: Callback quando salvar
}

const JobEditor = ({ jobId, onClose, onSaved }: JobEditorProps) => {
  const { jobs, addJob, updateJob } = useAppContext();
  const [formData, setFormData] = useState({
    description: '',
    client: '',
    eventDate: '',
    estimatedHours: 0,
    difficultyLevel: 'médio' as Job['difficultyLevel'],
    logistics: 0,
    equipment: 0,
    assistance: 0,
    status: 'pendente' as Job['status'],
    category: '',
    discountValue: 0,
    totalCosts: 0,
    serviceValue: 0,
    valueWithDiscount: 0,
    profitMargin: 30
  });

  useEffect(() => {
    if (jobId) {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        setFormData({
          description: job.description,
          client: job.client,
          eventDate: job.eventDate.split('T')[0],
          estimatedHours: job.estimatedHours,
          difficultyLevel: job.difficultyLevel,
          logistics: job.logistics || 0,
          equipment: job.equipment || 0,
          assistance: job.assistance || 0,
          status: job.status,
          category: job.category,
          discountValue: job.discountValue,
          totalCosts: job.totalCosts,
          serviceValue: job.serviceValue,
          valueWithDiscount: job.valueWithDiscount,
          profitMargin: job.profitMargin
        });
      }
    }
  }, [jobId, jobs]);

  // Função para salvar status imediatamente no Firebase
  const handleStatusChange = async (newStatus: Job['status']) => {
    setFormData(prev => ({ ...prev, status: newStatus }));
    
    if (jobId) {
      try {
        console.log('🔄 Atualizando status do job:', jobId, 'para:', newStatus);
        await updateJob(jobId, { status: newStatus });
        toast({
          title: "Status Atualizado",
          description: `Job marcado como ${newStatus}.`,
        });
      } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar status.",
          variant: "destructive"
        });
      }
    }
  };

  // Calcular valores automaticamente
  useEffect(() => {
    const costs = formData.logistics + formData.equipment + formData.assistance;
    const discountAmount = (formData.serviceValue * formData.discountValue) / 100;
    const valueWithDiscount = formData.serviceValue - discountAmount;
    
    setFormData(prev => ({
      ...prev,
      totalCosts: costs,
      valueWithDiscount: valueWithDiscount
    }));
  }, [formData.logistics, formData.equipment, formData.assistance, formData.serviceValue, formData.discountValue]);

  const handleSave = async () => {
    if (!formData.description || !formData.client) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const jobData = {
      ...formData,
      eventDate: new Date(formData.eventDate).toISOString(),
    };

    try {
      console.log('💾 Salvando job:', jobData);
      if (jobId) {
        await updateJob(jobId, jobData);
        toast({
          title: "Job Atualizado",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        await addJob(jobData);
        toast({
          title: "Job Criado",
          description: "O novo job foi criado com sucesso.",
        });
      }
      
      // NOVO: Chamar callback se disponível
      if (onSaved) {
        onSaved();
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Erro ao salvar job:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar job.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <Card className="w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">{jobId ? 'Editar Job' : 'Novo Job'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6">
          {/* MELHORADO: Grid responsivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Ex: Filmagem de casamento"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => setFormData({...formData, client: e.target.value})}
                placeholder="Nome do cliente"
                className="text-sm"
              />
            </div>
          </div>

          {/* MELHORADO: Grid mais compacto no mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Data do Evento</Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Horas Estimadas</Label>
              <Input
                id="estimatedHours"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({...formData, estimatedHours: Number(e.target.value)})}
                placeholder="8"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Ex: Casamento"
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficultyLevel">Nível de Dificuldade</Label>
              <Select value={formData.difficultyLevel} onValueChange={(value: Job['difficultyLevel']) => setFormData({...formData, difficultyLevel: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fácil">Fácil</SelectItem>
                  <SelectItem value="médio">Médio</SelectItem>
                  <SelectItem value="difícil">Difícil</SelectItem>
                  <SelectItem value="muito difícil">Muito Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logistics">Logística (R$)</Label>
              <CurrencyInput
                id="logistics"
                value={formData.logistics}
                onChange={(value) => setFormData({...formData, logistics: value})}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipamentos (R$)</Label>
              <CurrencyInput
                id="equipment"
                value={formData.equipment}
                onChange={(value) => setFormData({...formData, equipment: value})}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assistance">Assistência (R$)</Label>
              <CurrencyInput
                id="assistance"
                value={formData.assistance}
                onChange={(value) => setFormData({...formData, assistance: value})}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceValue">Valor do Serviço (R$)</Label>
              <CurrencyInput
                id="serviceValue"
                value={formData.serviceValue}
                onChange={(value) => setFormData({...formData, serviceValue: value})}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountValue">Desconto (%)</Label>
              <PercentageInput
                id="discountValue"
                value={formData.discountValue}
                onChange={(value) => setFormData({...formData, discountValue: value})}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor com Desconto</Label>
              <div className="p-2 bg-gray-50 rounded border">
                R$ {formData.valueWithDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Total de Custos</Label>
            <div className="p-2 bg-gray-50 rounded border">
              R$ {formData.totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="order-2 md:order-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="order-1 md:order-2">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobEditor;
