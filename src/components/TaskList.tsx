
import React, { useState } from 'react';
import { CheckCircle, Circle, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '../contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import TasksModal from './TasksModal';
import AddTaskModal from './AddTaskModal';

const TaskList = () => {
  const { tasks, updateTask } = useAppContext();
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  
  const recentTasks = tasks.slice(0, 3);

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      // Corrigido: usar apenas campos válidos
      await updateTask(taskId, { completed });
      toast({
        title: completed ? "Tarefa Concluída" : "Tarefa Reaberta",
        description: completed ? "A tarefa foi marcada como concluída." : "A tarefa foi reaberta.",
      });
    } catch (error) {
      console.error('Erro ao atualizar task:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa.",
        variant: "destructive"
      });
    }
  };

  if (recentTasks.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p className="text-sm">Nenhuma tarefa cadastrada</p>
        <Button 
          size="sm" 
          variant="ghost" 
          className="mt-2"
          onClick={() => setShowAddTask(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar primeira tarefa
        </Button>
        <AddTaskModal open={showAddTask} onOpenChange={setShowAddTask} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentTasks.map((task) => (
        <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
          <button
            onClick={() => toggleTask(task.id, !task.completed)}
            className="text-purple-600 hover:text-purple-700 transition-colors"
          >
            {task.completed ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>
          <div className="flex-1">
            <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-gray-400 mt-1">
                {task.description}
              </p>
            )}
            {task.dueDate && (
              <p className="text-xs text-gray-500">
                Vence em: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          <div className={`w-2 h-2 rounded-full ${
            task.priority === 'alta' ? 'bg-red-500' :
            task.priority === 'média' ? 'bg-yellow-500' :
            'bg-green-500'
          }`} />
        </div>
      ))}
      
      <div className="flex justify-between pt-2 border-t">
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => setShowAllTasks(true)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver Todas ({tasks.length})
        </Button>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => setShowAddTask(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      <TasksModal open={showAllTasks} onOpenChange={setShowAllTasks} />
      <AddTaskModal open={showAddTask} onOpenChange={setShowAddTask} />
    </div>
  );
};

export default TaskList;
