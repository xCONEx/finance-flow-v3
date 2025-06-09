
import React from 'react';
import { CheckCircle, Circle, Calendar, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppContext } from '../contexts/AppContext';
import { toast } from '@/hooks/use-toast';

interface TasksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TasksModal = ({ open, onOpenChange }: TasksModalProps) => {
  const { tasks, updateTask } = useAppContext();

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
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

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Todas as Tarefas ({tasks.length})</DialogTitle>
          <DialogDescription>
            Gerencie todas as suas tarefas em um só lugar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tarefas Pendentes */}
          {pendingTasks.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Pendentes ({pendingTasks.length})
              </h3>
              <div className="space-y-2">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <button
                      onClick={() => toggleTask(task.id, true)}
                      className="text-purple-600 hover:text-purple-700 transition-colors"
                    >
                      <Circle className="h-5 w-5" />
                    </button>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                      )}
                      {task.dueDate && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      task.priority === 'alta' ? 'bg-red-500' :
                      task.priority === 'média' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tarefas Concluídas */}
          {completedTasks.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Concluídas ({completedTasks.length})
              </h3>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                    <button
                      onClick={() => toggleTask(task.id, false)}
                      className="text-green-600 hover:text-green-700 transition-colors"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <div className="flex-1">
                      <p className="text-sm font-medium line-through text-gray-500">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-gray-400 mt-1 line-through">{task.description}</p>
                      )}
                      {task.dueDate && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <div className={`w-3 h-3 rounded-full opacity-50 ${
                      task.priority === 'alta' ? 'bg-red-500' :
                      task.priority === 'média' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma tarefa cadastrada ainda.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TasksModal;
