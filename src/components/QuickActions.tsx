import React, { useState } from 'react';
import { Plus, Calculator, Calendar, FileText, Briefcase, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AddTaskModal from './AddTaskModal';

interface QuickActionsProps {
  onNavigate: (tab: string) => void;
}

const QuickActions = ({ onNavigate }: QuickActionsProps) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

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
      description: 'Abrir calculadora de preços',
      icon: Calculator,
      action: () => onNavigate('calculator'),
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

      <AddTaskModal open={showTaskModal} onOpenChange={setShowTaskModal} />
      
      {/* Placeholder para modais de despesa e item - serão implementados depois */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Modal de Despesa</h3>
            <p className="mb-4">Modal para adicionar despesa será implementado</p>
            <Button onClick={() => setShowExpenseModal(false)}>Fechar</Button>
          </div>
        </div>
      )}
      
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Modal de Item</h3>
            <p className="mb-4">Modal para adicionar item será implementado</p>
            <Button onClick={() => setShowItemModal(false)}>Fechar</Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default QuickActions;
