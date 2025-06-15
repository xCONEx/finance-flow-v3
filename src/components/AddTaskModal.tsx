import React, { useState } from 'react';
import { Plus, Save } from 'lucide-react';
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
import { useApp } from '../contexts/AppContext';
import { toast } from '@/hooks/use-toast';

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddTaskModal = ({ open, onOpenChange }: AddTaskModalProps) => {
  const { addTask } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'média' as 'baixa' | 'média' | 'alta',
    dueDate: '',
    status: 'todo' as 'todo' | 'editing' | 'urgent' | 'delivered' | 'revision'
  });

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título da tarefa é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Criar objeto da task, removendo campos undefined/vazios
      const taskData: any = {
        title: formData.title,
        description: formData.description || '',
        priority: formData.priority,
        completed: false,
        status: formData.status
      };

      // Só adicionar dueDate se não for vazio
      if (formData.dueDate && formData.dueDate.trim()) {
        taskData.dueDate = formData.dueDate;
      }

      await addTask(taskData);

      toast({
        title: "Tarefa Adicionada",
        description: "A tarefa foi criada com sucesso.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'média',
        dueDate: '',
        status: 'todo'
      });
      onOpenChange(false);
    } catch (error) {
      console.error('❌ Erro ao adicionar task:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5" />
            Nova Tarefa
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Título *</Label>
            <Input
              id="task-title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Ex: Finalizar edição do vídeo"
              className="text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="task-description">Descrição</Label>
            <Textarea
              id="task-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Detalhes da tarefa..."
              className="min-h-[60px] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-priority">Prioridade</Label>
              <Select value={formData.priority} onValueChange={(value: 'baixa' | 'média' | 'alta') => setFormData({...formData, priority: value})}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="média">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-dueDate">Data de Vencimento</Label>
              <Input
                id="task-dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'todo' | 'editing' | 'urgent' | 'delivered' | 'revision') => setFormData({...formData, status: value})}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">A fazer</SelectItem>
                <SelectItem value="editing">Em edição</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="revision">Alteração</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col md:flex-row gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1 order-1">
              <Save className="h-4 w-4 mr-2" />
              Salvar Tarefa
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

export default AddTaskModal;
