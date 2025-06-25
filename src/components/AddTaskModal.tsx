
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ClientSelector from './ClientSelector';
import AddClientModal from './clients/AddClientModal';
import { Job } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUsageTracking } from '@/hooks/useUsageTracking';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: Job) => Promise<void>;
}

const AddTaskModal = ({ isOpen, onClose, onAdd }: AddTaskModalProps) => {
  const [formData, setFormData] = useState<Job>({
    description: '',
    client: '',
    client_id: '',
    event_date: '',
    estimated_hours: 0,
    difficulty_level: 'médio',
    logistics: 0,
    equipment: 0,
    assistance: 0,
    status: 'pendente',
    category: '',
    discount_value: 0,
    total_costs: 0,
    service_value: 0,
    value_with_discount: 0,
    profit_margin: 30,
  });
  const [eventDate, setEventDate] = useState<Date>();
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const { checkUsageLimit, incrementUsage } = useUsageTracking();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    // Check usage limit before creating
    const canCreate = await checkUsageLimit('jobs');
    if (!canCreate) {
      return; // checkUsageLimit already shows the appropriate toast
    }

    if (!formData.description.trim() || !formData.client.trim()) {
      toast({
        title: "Erro",
        description: "Descrição e cliente são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const jobData: Job = {
      ...formData,
      user_id: user.id,
      event_date: eventDate ? eventDate.toISOString() : undefined,
    };

    try {
      await onAdd(jobData);
      // Increment usage after successful creation
      await incrementUsage('jobs');
      
      // Reset form
      setFormData({
        description: '',
        client: '',
        client_id: '',
        event_date: '',
        estimated_hours: 0,
        difficulty_level: 'médio',
        logistics: 0,
        equipment: 0,
        assistance: 0,
        status: 'pendente',
        category: '',
        discount_value: 0,
        total_costs: 0,
        service_value: 0,
        value_with_discount: 0,
        profit_margin: 30,
      });
      setEventDate(undefined);
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar tarefa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleClientChange = (clientId: string) => {
    setFormData({ ...formData, client_id: clientId });
  };

  const handleClientAdded = () => {
    // Refresh client list if needed
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                placeholder="Descrição da tarefa"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <ClientSelector
              value={formData.client_id}
              onValueChange={handleClientChange}
              onOpenAddModal={() => setIsAddClientModalOpen(true)}
            />

            <div className="grid gap-2">
              <Label>Data do Evento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !eventDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, "PPP") : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={setEventDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                placeholder="Categoria do trabalho"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="difficulty_level">Nível de Dificuldade</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value: 'fácil' | 'médio' | 'complicado' | 'difícil') => 
                  setFormData({ ...formData, difficulty_level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a dificuldade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fácil">Fácil</SelectItem>
                  <SelectItem value="médio">Médio</SelectItem>
                  <SelectItem value="complicado">Complicado</SelectItem>
                  <SelectItem value="difícil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="estimated_hours">Horas Estimadas</Label>
              <Input
                id="estimated_hours"
                type="number"
                placeholder="0"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: parseInt(e.target.value) || 0 })}
              />
            </div>
          </form>
          <DialogFooter>
            <Button type="submit" onClick={handleSubmit}>
              Adicionar Tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onClientAdded={handleClientAdded}
      />
    </>
  );
};

export default AddTaskModal;
