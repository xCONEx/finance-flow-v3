
import React, { useState } from 'react';
import { CheckCircle, Circle, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '../contexts/AppContext';
import TasksModal from './TasksModal';
import AddTaskModal from './AddTaskModal';
import EditTaskModal from './EditTaskModal';

const TaskList = () => {
  const { tasks } = useAppContext();
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  const recentTasks = tasks.slice(0, 3);

  const getStatusInfo = (status: string) => {
    const statusMap: any = {
      todo: { label: 'A fazer', color: 'bg-gray-500' },
      editing: { label: 'Em edição', color: 'bg-blue-500' },
      urgent: { label: 'Urgente', color: 'bg-red-500' },
      delivered: { label: 'Entregue', color: 'bg-green-500' },
      revision: { label: 'Alteração', color: 'bg-yellow-500' }
    };
    return statusMap[status] || { label: 'A fazer', color: 'bg-gray-500' };
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
      {recentTasks.map((task) => {
        const statusInfo = getStatusInfo((task as any).status);
        return (
          <div 
            key={task.id} 
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
            onClick={() => setEditingTaskId(task.id)}
          >
            <div className="text-purple-600">
              {task.completed ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {task.title}
                </p>
                <Badge variant="outline" className={`text-xs text-white ${statusInfo.color}`}>
                  {statusInfo.label}
                </Badge>
              </div>
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
        );
      })}
      
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
      <EditTaskModal 
        open={editingTaskId !== null} 
        onOpenChange={(open) => !open && setEditingTaskId(null)}
        taskId={editingTaskId}
      />
    </div>
  );
};

export default TaskList;
