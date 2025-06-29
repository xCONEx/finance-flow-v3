import React, { useState } from 'react';
import {
  Plus,
  Calculator,
  Calendar,
  FileText,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AddTaskModal from './AddTaskModal';
import ExpenseModal from './ExpenseModal';
import WorkItemModal from './WorkItemModal';
import ManualValueModal from './ManualValueModal'; // ✅ importado
import { useApp } from '../contexts/AppContext';
import { usePrivacy } from '../contexts/PrivacyContext';

interface QuickActionsProps {
  onNavigate?: (tab: string) => void;
}

const QuickActions = ({ onNavigate }: QuickActionsProps) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showManualJobModal, setShowManualJobModal] = useState(false); // ✅ novo estado
  
  const { jobs, workRoutine } = useApp();
  const { formatValue } = usePrivacy();
  
  // Calcular valores para exibir
  const filteredJobs = jobs.filter(job => !job.companyId); // Apenas jobs pessoais
  const approvedJobs = filteredJobs.filter(job => job.status === 'aprovado');
  const totalRevenue = approvedJobs.reduce((sum, job) => {
    const jobValue = job.valueWithDiscount || job.serviceValue || 0;
    return sum + jobValue;
  }, 0);
  const pendingJobs = filteredJobs.filter(job => job.status === 'pendente').length;
  const monthlyGoal = (workRoutine?.valuePerHour || 0) * (workRoutine?.workHoursPerDay || 8) * (workRoutine?.workDaysPerMonth || 22);

  const quickActions = [
    {
      title: 'Nova Tarefa',
      description: 'Adicionar tarefa rápida',
      icon: Plus,
      action: () => setShowTaskModal(true),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Calculadora',
      description: 'Abrir calculadora manual',
      icon: Calculator,
      action: () => setShowManualJobModal(true), // ✅ novo modal
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Nova Despesa',
      description: 'Adicionar despesa rápida',
      icon: DollarSign,
      action: () => setShowExpenseModal(true),
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'Novo Item',
      description: 'Adicionar item de trabalho',
      icon: Briefcase,
      action: () => setShowItemModal(true),
      color: 'bg-green-500 hover:bg-green-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              className={`h-20 flex flex-col gap-1 ${action.color} text-white border-none transition-all duration-300 hover:scale-105`}
              onClick={action.action}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.title}</span>
            </Button>
          ))}
        </div>
        
        {/* Summary Stats */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Faturamento Total:</span>
              <span className="font-semibold">{formatValue(totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Jobs Pendentes:</span>
              <span className="font-semibold">{pendingJobs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Meta Mensal:</span>
              <span className="font-semibold">{formatValue(monthlyGoal)}</span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Modais */}
      <AddTaskModal open={showTaskModal} onOpenChange={setShowTaskModal} />
      <ExpenseModal open={showExpenseModal} onOpenChange={setShowExpenseModal} />
      <WorkItemModal open={showItemModal} onOpenChange={setShowItemModal} />
      <ManualValueModal open={showManualJobModal} onOpenChange={setShowManualJobModal} /> {/* ✅ novo modal */}
    </Card>
  );
};

export default QuickActions;
