
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, Edit, Trash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Job } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import AddTaskModal from './AddTaskModal';

const TaskList = () => {
  const [tasks, setTasks] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar tarefas:', error);
        return;
      }

      setTasks(data || []);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (newTask: Job) => {
    try {
      const taskData = {
        ...newTask,
        user_id: user?.id
      };

      const { data, error } = await supabase
        .from('jobs')
        .insert([taskData])
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao adicionar tarefa:', error);
        toast({
          title: "Erro",
          description: "Erro ao adicionar tarefa. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setTasks(prevTasks => [data, ...prevTasks]);
      toast({
        title: "Sucesso",
        description: "Tarefa adicionada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar tarefa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <p>Carregando tarefas...</p>
      ) : tasks.length === 0 ? (
        <p>Nenhuma tarefa encontrada.</p>
      ) : (
        tasks.map((task) => (
          <Card key={task.id} className="w-full">
            <CardHeader>
              <CardTitle>{task.title || task.description}</CardTitle>
              <CardDescription>
                Cliente: {task.client}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center space-x-4">
                <Checkbox id={`task-${task.id}`} />
                <label
                  htmlFor={`task-${task.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Marcar como concluída
                </label>
              </div>
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Trash className="mr-2 h-4 w-4" />
                      <span>Excluir</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onAdd={handleAddTask}
      />
    </div>
  );
};

export default TaskList;
