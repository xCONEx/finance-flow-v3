
import React, { useState } from 'react';
import { Plus, Calculator, Calendar, FileText, Briefcase, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface QuickActionsProps {
  onNavigate: (tab: string) => void;
}

const QuickActions = ({ onNavigate }: QuickActionsProps) => {
  const { addTask, addMonthlyCost, addWorkItem } = useAppContext();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleQuickTask = async () => {
    if (!user) return;
    
    setLoading('task');
    try {
      await addTask({
        title: 'Nova tarefa',
        description: 'Clique para editar esta tarefa',
        completed: false,
        priority: 'média'
      });
      
      toast({
        title: "Tarefa Criada",
        description: "Uma nova tarefa foi adicionada à sua lista.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleQuickExpense = async () => {
    if (!user) return;
    
    setLoading('expense');
    try {
      await addMonthlyCost({
        description: 'Nova despesa',
        category: 'Outros',
        value: 0,
        month: new Date().toISOString().slice(0, 7)
      });
      
      toast({
        title: "Despesa Criada",
        description: "Uma nova despesa foi adicionada. Clique em 'Custos' para editá-la.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar despesa.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleQuickItem = async () => {
    if (!user) return;
    
    setLoading('item');
    try {
      await addWorkItem({
        description: 'Novo item',
        category: 'Outros',
        value: 0,
        depreciationYears: 5
      });
      
      toast({
        title: "Item Criado",
        description: "Um novo item foi adicionado. Clique em 'Itens' para editá-lo.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar item.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const quickActions = [
    {
      title: 'Nova Tarefa',
      description: 'Adicionar tarefa rápida',
      icon: Plus,
      action: handleQuickTask,
      loading: loading === 'task',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Calculadora',
      description: 'Abrir calculadora de preços',
      icon: Calculator,
      action: () => onNavigate('calculator'),
      loading: false,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Nova Despesa',
      description: 'Adicionar despesa rápida',
      icon: DollarSign,
      action: handleQuickExpense,
      loading: loading === 'expense',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'Novo Item',
      description: 'Adicionar item de trabalho',
      icon: Briefcase,
      action: handleQuickItem,
      loading: loading === 'item',
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
              disabled={action.loading}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.title}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
