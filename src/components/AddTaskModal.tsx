import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TaskStatus } from '@/types';
import { useToast } from "@/hooks/use-toast"
import { Job } from '@/types/project';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { useSubscriptionPermissions } from '@/hooks/useSubscriptionPermissions';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: Job) => Promise<void>;
  status?: TaskStatus;
  context?: 'project' | 'client';
  clientId?: string;
}

const AddTaskModal = ({ isOpen, onClose, onAdd, status, context, clientId }: AddTaskModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: undefined,
    priority: 'baixa',
    status: status || 'pendente',
    context: context || 'project',
    clientId: clientId || '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast()
  
  const { incrementJobUsage } = useUsageTracking();
  const { canCreateJob, refreshUsage } = useSubscriptionPermissions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar limite antes de criar
    if (!canCreateJob) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de jobs do seu plano. Faça upgrade para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório.",
        variant: "destructive",
      })
      return;
    }

    setLoading(true);

    try {
      const newTask: Job = {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate ? formData.dueDate.toISOString() : new Date().toISOString(),
        priority: formData.priority,
        status: formData.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        companyId: 'fakeCompanyId', // TODO: pegar do contexto
        links: [],
        client: formData.clientId,
      };

      await onAdd(newTask);
      
      // Incrementar contador de uso apenas se o job foi aprovado
      if (formData.status === 'aprovado') {
        await incrementJobUsage();
        await refreshUsage(); // Atualizar dados na UI
      }

      toast({
        title: "Sucesso",
        description: "Tarefa adicionada com sucesso!",
      })
      onClose();
      setFormData({
        title: '',
        description: '',
        dueDate: undefined,
        priority: 'baixa',
        status: status || 'pendente',
        context: context || 'project',
        clientId: clientId || '',
      });
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar tarefa. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Nome da tarefa"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Detalhes da tarefa"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Data de Entrega</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={
                    "w-[240px] justify-start text-left font-normal" +
                    (formData.dueDate ? "" : " text-muted-foreground")
                  }
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate ? (
                    format(formData.dueDate, "PPP")
                  ) : (
                    <span>Escolha uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center" side="bottom">
                <Calendar
                  mode="single"
                  selected={formData.dueDate}
                  onSelect={(date) => setFormData({ ...formData, dueDate: date })}
                  disabled={(date) =>
                    date < new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as "baixa" | "media" | "alta" })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em andamento">Em Andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="revisao">Revisão</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskModal;
