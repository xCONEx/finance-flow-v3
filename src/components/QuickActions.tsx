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

interface QuickActionsProps {
  onNavigate?: (tab: string) => void;
}

const QuickActions = ({ onNavigate }: QuickActionsProps) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showManualJobModal, setShowManualJobModal] = useState(false); // ✅ novo estado

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
              variant="outline"
              className={`h-20 flex flex-col gap-1 ${action.color} text-white border-none transition-all duration-300 hover:scale-105`}
              onClick={action.action}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.title}</span>
            </Button>
          ))}
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
