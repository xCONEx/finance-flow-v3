
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '../contexts/AppContext';
import { Job } from '../types';
import { toast } from '@/hooks/use-toast';

interface JobEditorProps {
  jobId?: string;
  onClose: () => void;
}

const JobEditor = ({ jobId, onClose }: JobEditorProps) => {
  const { jobs, addJob, updateJob } = useAppContext();
  const [formData, setFormData] = useState({
    description: '',
    client: '',
    eventDate: '',
    estimatedHours: 0,
    difficultyLevel: 'médio' as Job['difficultyLevel'],
    logistics: '',
    equipment: '',
    assistance: '',
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
          logistics: job.logistics,
          equipment: job.equipment,
          assistance: job.assistance,
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

  const handleSave = () => {
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

    if (jobId) {
      updateJob(jobId, jobData);
      toast({
        title: "Job Atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    } else {
      addJob(jobData);
      toast({
        title: "Job Criado",
        description: "O novo job foi criado com sucesso.",
      });
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{jobId ? 'Editar Job' : 'Novo Job'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Ex: Filmagem de casamento"
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

          <div className="grid grid-cols-2 gap-4">
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
                placeholder="8"
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
              <Select value={formData.status} onValueChange={(value: Job['status']) => setFormData({...formData, status: value})}>
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

          <div className="space-y-2">
            <Label htmlFor="logistics">Logística</Label>
            <Textarea
              id="logistics"
              value={formData.logistics}
              onChange={(e) => setFormData({...formData, logistics: e.target.value})}
              placeholder="Detalhes sobre localização, transporte, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment">Equipamentos</Label>
            <Textarea
              id="equipment"
              value={formData.equipment}
              onChange={(e) => setFormData({...formData, equipment: e.target.value})}
              placeholder="Lista de equipamentos necessários"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assistance">Assistência</Label>
            <Textarea
              id="assistance"
              value={formData.assistance}
              onChange={(e) => setFormData({...formData, assistance: e.target.value})}
              placeholder="Detalhes sobre equipe de apoio"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceValue">Valor do Serviço (R$)</Label>
              <Input
                id="serviceValue"
                type="number"
                step="0.01"
                value={formData.serviceValue}
                onChange={(e) => setFormData({...formData, serviceValue: Number(e.target.value)})}
                placeholder="2500.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountValue">Desconto (R$)</Label>
              <Input
                id="discountValue"
                type="number"
                step="0.01"
                value={formData.discountValue}
                onChange={(e) => setFormData({...formData, discountValue: Number(e.target.value)})}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
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
