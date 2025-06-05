
import React, { useState } from 'react';
import { Plus, Calculator, Calendar, FileText, Briefcase, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import AddTaskModal from './AddTaskModal';
import { useAppContext } from '../contexts/AppContext';
import { toast } from '@/hooks/use-toast';

interface QuickActionsProps {
  onNavigate: (tab: string) => void;
}

const QuickActions = ({ onNavigate }: QuickActionsProps) => {
  const { addMonthlyCost, addWorkItem } = useAppContext();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  // Estados para o modal de despesa
  const [expenseData, setExpenseData] = useState({
    description: '',
    category: '',
    value: 0
  });

  // Estados para o modal de item
  const [itemData, setItemData] = useState({
    description: '',
    category: '',
    value: 0
  });

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

  const handleSaveExpense = async () => {
    if (!expenseData.description || !expenseData.category || expenseData.value <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      await addMonthlyCost({
        description: expenseData.description,
        category: expenseData.category,
        value: expenseData.value,
        month: new Date().toISOString().slice(0, 7)
      });

      toast({
        title: "Despesa Adicionada",
        description: "A despesa foi adicionada com sucesso.",
      });

      setExpenseData({ description: '', category: '', value: 0 });
      setShowExpenseModal(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar despesa.",
        variant: "destructive"
      });
    }
  };

  const handleSaveItem = async () => {
    if (!itemData.description || !itemData.category || itemData.value <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      await addWorkItem({
        description: itemData.description,
        category: itemData.category,
        value: itemData.value,
        depreciationYears: 5
      });

      toast({
        title: "Item Adicionado",
        description: "O item de trabalho foi adicionado com sucesso.",
      });

      setItemData({ description: '', category: '', value: 0 });
      setShowItemModal(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar item.",
        variant: "destructive"
      });
    }
  };

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

      {/* Modal de Task */}
      <AddTaskModal open={showTaskModal} onOpenChange={setShowTaskModal} />
      
      {/* Modal de Despesa */}
      <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nova Despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-description">Descrição *</Label>
              <Input
                id="expense-description"
                value={expenseData.description}
                onChange={(e) => setExpenseData({...expenseData, description: e.target.value})}
                placeholder="Ex: Energia elétrica"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expense-category">Categoria *</Label>
              <Input
                id="expense-category"
                value={expenseData.category}
                onChange={(e) => setExpenseData({...expenseData, category: e.target.value})}
                placeholder="Ex: Utilidades"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-value">Valor (R$) *</Label>
              <CurrencyInput
                id="expense-value"
                value={expenseData.value}
                onChange={(value) => setExpenseData({...expenseData, value})}
                placeholder="0,00"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveExpense} className="flex-1">Salvar</Button>
              <Button variant="outline" onClick={() => setShowExpenseModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Item */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Novo Item de Trabalho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-description">Descrição *</Label>
              <Input
                id="item-description"
                value={itemData.description}
                onChange={(e) => setItemData({...itemData, description: e.target.value})}
                placeholder="Ex: Câmera DSLR"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="item-category">Categoria *</Label>
              <Input
                id="item-category"
                value={itemData.category}
                onChange={(e) => setItemData({...itemData, category: e.target.value})}
                placeholder="Ex: Equipamento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-value">Valor (R$) *</Label>
              <CurrencyInput
                id="item-value"
                value={itemData.value}
                onChange={(value) => setItemData({...itemData, value})}
                placeholder="0,00"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveItem} className="flex-1">Salvar</Button>
              <Button variant="outline" onClick={() => setShowItemModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default QuickActions;
