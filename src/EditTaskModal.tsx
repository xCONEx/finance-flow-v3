import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { toast } from '@/hooks/use-toast';

interface EditTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
}

const taskStatuses = [
  { value: 'todo' as const, label: 'A fazer', color: 'bg-gray-500' },
  { value: 'editing' as const, label: 'Em edição', color: 'bg-blue-500' },
  { value: 'urgent' as const, label: 'Urgente', color: 'bg-red-500' },
  { value: 'delivered' as const, label: 'Entregue', color: 'bg-green-500' },
  { value: 'revision' as const, label: 'Alteração', color: 'bg-yellow-500' }
];

const EditTaskModal: React.FC<EditTaskModalProps> = ({ open, onOpenChange, taskId }) => {
  const { tasks, updateTask, deleteTask } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as 'todo' | 'editing' | 'urgent' | 'delivered' | 'revision',
    priority: 'média' as 'baixa' | 'média' | 'alta',
    dueDate: ''
  });

  const task = tasks.find(t => t.id === taskId);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'média',
        dueDate: task.dueDate || ''
      });
    } else {
      // Reset form when no task is selected
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'média',
        dueDate: ''
      });
    }
  }, [task, taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskId || !formData.title.trim()) {
      toast({
        title: "Erro",
        description: "Título da tarefa é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Criar objeto de updates, removendo campos undefined
      const updates: any = {
        title: formData.title,
        status: formData.status,
        priority: formData.priority,
        completed: formData.status === 'delivered'
      };

      // Só adicionar description se não for vazia
      if (formData.description) {
        updates.description = formData.description;
      }

      // Só adicionar dueDate se não for vazia
      if (formData.dueDate) {
        updates.dueDate = formData.dueDate;
      }

      await updateTask(taskId, updates);

      toast({
        title: "Tarefa Atualizada",
        description: "A tarefa foi atualizada com sucesso.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!taskId) return;

    try {
      await deleteTask(taskId);
      toast({
        title: "Tarefa Removida",
        description: "A tarefa foi removida com sucesso.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao remover tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover tarefa.",
        variant: "destructive"
      });
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
          <DialogDescription>
            Edite os detalhes da sua tarefa e atualize o status
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Título da tarefa"
              className="text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Detalhes da tarefa..."
              className="min-h-[60px] text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Status da Tarefa</Label>
            <div className="flex flex-wrap gap-2">
              {taskStatuses.map((status) => (
                <Badge
                  key={status.value}
                  variant={formData.status === status.value ? "default" : "outline"}
                  className={`cursor-pointer text-xs ${formData.status === status.value ? status.color : ''}`}
                  onClick={() => setFormData({...formData, status: status.value})}
                >
                  {status.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as 'baixa' | 'média' | 'alta'})}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="baixa">Baixa</option>
                <option value="média">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de Vencimento</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2 pt-4 border-t">
            <Button type="submit" className="flex-1 order-1">Salvar</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="order-2">
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              size="icon"
              onClick={handleDelete}
              className="order-3 md:order-3"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskModal;
