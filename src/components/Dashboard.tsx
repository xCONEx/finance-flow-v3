import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, CheckCircle2, Clock, ListChecks, User2 } from 'lucide-react';
import { format } from 'date-fns';
import TaskList from './TaskList';
import QuickActions from './QuickActions';
import AddTaskModal from './AddTaskModal';

const Dashboard = () => {
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  const handleAddTask = async (task: any) => {
    console.log('Tarefa adicionada:', task);
    setIsAddTaskModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white dark:bg-gray-800 shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Tarefas Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-2" />
                5 Tarefas
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Reuniões de Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <CalendarIcon className="h-4 w-4 mr-2" />
                2 Reuniões
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Contratos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <ListChecks className="h-4 w-4 mr-2" />
                10 Contratos
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <TaskList />
          </div>
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
        </div>
      </div>
      
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onAdd={handleAddTask}
      />
      
    </div>
  );
};

export default Dashboard;
