
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
import { useApp } from '../contexts/AppContext';
import { toast } from '@/hooks/use-toast';

interface JobEditorProps {
  jobId?: string;
  onClose: () => void;
  onSaved?: () => void;
}

const JobEditor = ({ jobId, onClose, onSaved }: JobEditorProps) => {
  const { jobs, addJob, updateJob } = useApp();
  const [formData, setFormData] = useState({
    description: '',
    client: '',
    eventDate: '',
    estimatedHours: 0,
    difficultyLevel: 'médio' as 'fácil' | 'médio' | 'complicado' | 'difícil',
    logistics: 0,
    equipment: 0,
    assistance: 0,
    status: 'pendente' as 'pendente' | 'aprovado',
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
          profitMargin: 30
        });
      }
    }
  }, [jobId, jobs]);

  const handleSave = async () => {
    if (!formData.description || !formData.client) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      const jobData = {
        ...formData,
        eventDate: new Date(formData.eventDate + 'T00:00:00').toISOString(),
      };

      if (jobId) {
        await updateJob(jobId, jobData);
        toast({
          title: "Job Atualizado",
          description: "O job foi atualizado com sucesso.",
        });
      } else {
        await addJob(jobData);
        toast({
          title: "Job Criado",
          description: "O job foi criado com sucesso.",
        });
      }

      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar job:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar job.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{jobId ? 'Editar Job' : 'Novo Job'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição do Job *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva o projeto..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => setFormData({...formData, client: e.target.value})}
                placeholder="Nome do cliente"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="estimatedHours">Horas Estimadas</Label>
              <Input
                id="estimatedHours"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({...formData, estimatedHours: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficultyLevel">Nível de Dificuldade</Label>
              <Select value={formData.difficultyLevel} onValueChange={(value) => setFormData({...formData, difficultyLevel: value as 'fácil' | 'médio' | 'complicado' | 'difícil'})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fácil">Fácil</SelectItem>
                  <SelectItem value="médio">Médio</SelectItem>
                  <SelectItem value="complicado">Complicado</SelectItem>
                  <SelectItem value="difícil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as 'pendente' | 'aprovado'})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Ex: Casamento, Corporativo..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="discountValue">Desconto (R$)</Label>
              <CurrencyInput
                id="discountValue"
                value={formData.discountValue}
                onChange={(value) => setFormData({...formData, discountValue: value})}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {jobId ? 'Atualizar' : 'Salvar'} Job
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobEditor;
