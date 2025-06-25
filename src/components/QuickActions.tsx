import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, Briefcase } from "lucide-react"
import AddTaskModal from './AddTaskModal';

const QuickActions = () => {
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  const handleAddTask = async () => {
    setIsAddTaskModalOpen(false);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Ações rápidas</CardTitle>
        <CardDescription>Comece a gerenciar seus projetos rapidamente.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Button onClick={() => setIsAddTaskModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar tarefa
        </Button>
        <Button variant="secondary">
          <Users className="mr-2 h-4 w-4" />
          Gerenciar membros
        </Button>
        <Button variant="secondary">
          <Briefcase className="mr-2 h-4 w-4" />
          Criar projeto
        </Button>
      </CardContent>
      
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onAdd={handleAddTask}
      />
      
    </Card>
  );
};

export default QuickActions;
