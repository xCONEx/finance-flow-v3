
import React, { useState } from 'react';
import { Plus, Trash2, DollarSign, Edit, FileText, Loader2, Calendar, Bell, Repeat, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '../contexts/AppContext';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { toast } from '@/hooks/use-toast';
import ExpenseModal from './ExpenseModal';
import { generateExpensesPDF } from '../utils/pdfGenerator';

const MonthlyCosts = () => {
  const { monthlyCosts, updateMonthlyCost, deleteMonthlyCost, loading } = useApp();
  const { user, profile } = useSupabaseAuth();
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingCost, setEditingCost] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter out financial transactions and reserve items - only show regular expenses
  const regularExpenses = monthlyCosts.filter(cost => 
    !cost.description?.includes('FINANCIAL_INCOME:') && 
    !cost.description?.includes('FINANCIAL_EXPENSE:') &&
    !cost.description?.includes('RESERVE_') &&
    !cost.description?.includes('Reserva:') &&
    !cost.description?.includes('SMART_RESERVE') &&
    cost.category !== 'Reserva' &&
    cost.category !== 'Smart Reserve' &&
    cost.category !== 'Reserve'
  );

  const handleEdit = (cost: any) => {
    setEditingCost(cost);
    setShowExpenseModal(true);
  };

  const handleCloseModal = () => {
    setEditingCost(null);
    setShowExpenseModal(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMonthlyCost(id);
      toast({
        title: "Custo Removido",
        description: "O custo foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover custo.",
        variant: "destructive"
      });
    }
  };

  const handleGeneratePDF = async () => {
    try {
      if (regularExpenses.length === 0) {
        toast({
          title: "Erro",
          description: "Não há despesas para gerar o relatório.",
          variant: "destructive"
        });
        return;
      }

      await generateExpensesPDF(regularExpenses, { name: profile?.name, email: user?.email });
      toast({
        title: "PDF Gerado",
        description: "O relatório de despesas foi gerado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório PDF.",
        variant: "destructive"
      });
    }
  };

  const formatDueDate = (dueDate: string) => {
    return new Date(dueDate).toLocaleDateString('pt-BR');
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateBadge = (dueDate: string) => {
    const days = getDaysUntilDue(dueDate);
    
    if (days < 0) {
      return <Badge variant="destructive">Vencido</Badge>;
    } else if (days === 0) {
      return <Badge variant="destructive">Vence hoje</Badge>;
    } else if (days <= 3) {
      return <Badge className="bg-orange-500">Vence em {days}d</Badge>;
    } else if (days <= 7) {
      return <Badge className="bg-yellow-500">Vence em {days}d</Badge>;
    } else {
      return <Badge variant="outline">Vence em {days}d</Badge>;
    }
  };

  const totalMonthlyCosts = regularExpenses.reduce((sum, cost) => sum + cost.value, 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthCosts = regularExpenses
    .filter(cost => cost.month === currentMonth)
    .reduce((sum, cost) => sum + cost.value, 0);

  // Custos com vencimento próximo (próximos 7 dias)
  const upcomingCosts = regularExpenses.filter(cost => {
    if (!cost.dueDate) return false;
    const days = getDaysUntilDue(cost.dueDate);
    return days >= 0 && days <= 7;
  }).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando custos mensais...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <DollarSign className="text-purple-600" />
            Custos Mensais
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Gerencie suas despesas e custos fixos mensais
            {regularExpenses.length > 0 && (
              <span className="ml-2 text-xs sm:text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {regularExpenses.length} {regularExpenses.length === 1 ? 'despesa cadastrada' : 'despesas cadastradas'}
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {regularExpenses.length > 0 && (
            <Button onClick={handleGeneratePDF} variant="outline" className="flex-1 sm:flex-none">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Gerar PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          )}

          <Button onClick={() => setShowExpenseModal(true)} disabled={submitting} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Adicionar Custo</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <h3 className="text-sm sm:text-lg font-semibold text-red-800">Total Mensal</h3>
              <div className="text-lg sm:text-3xl font-bold text-red-600 break-words">
                R$ {totalMonthlyCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <h3 className="text-sm sm:text-lg font-semibold text-orange-800">Mês Atual</h3>
              <div className="text-lg sm:text-3xl font-bold text-orange-600 break-words">
                R$ {currentMonthCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <h3 className="text-sm sm:text-lg font-semibold text-blue-800">Vencimentos</h3>
              <div className="text-lg sm:text-3xl font-bold text-blue-600">{upcomingCosts}</div>
              <p className="text-xs text-blue-600">próximos 7 dias</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Costs List */}
      <div className="grid gap-4">
        {regularExpenses.length > 0 ? (
          regularExpenses.map((cost) => (
            <Card key={cost.id} className="transition-all duration-300 hover:shadow-lg overflow-hidden">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col space-y-3">
                  {/* Mobile Layout - Stacked */}
                  <div className="flex flex-col sm:hidden space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-sm truncate flex-1 pr-2">{cost.description}</h3>
                      <div className="text-lg font-bold text-red-600 whitespace-nowrap">
                        R$ {cost.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {cost.isRecurring && (
                        <Badge variant="outline" className="text-xs">
                          <Repeat className="h-3 w-3 mr-1" />
                          Rec.
                        </Badge>
                      )}
                      {cost.installments && cost.installments > 1 && (
                        <Badge variant="outline" className="text-xs">
                          <CreditCard className="h-3 w-3 mr-1" />
                          {cost.currentInstallment || 1}/{cost.installments}
                        </Badge>
                      )}
                      {cost.notificationEnabled && (
                        <Badge variant="outline" className="text-xs">
                          <Bell className="h-3 w-3 mr-1" />
                          🔔
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-gray-600">Categoria: {cost.category}</p>
                    <p className="text-xs text-gray-500">
                      Mês: {new Date(cost.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>

                    {cost.dueDate && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-600">Vence: {formatDueDate(cost.dueDate)}</span>
                        {getDueDateBadge(cost.dueDate)}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(cost)}
                        className="flex-1 transition-all duration-300 hover:scale-105"
                        disabled={submitting}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(cost.id)}
                        className="flex-1 transition-all duration-300 hover:scale-105"
                        disabled={submitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout - Side by side */}
                  <div className="hidden sm:flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold truncate text-base">{cost.description}</h3>
                        <div className="flex gap-1 flex-wrap">
                          {cost.isRecurring && (
                            <Badge variant="outline" className="text-xs">
                              <Repeat className="h-3 w-3 mr-1" />
                              Recorrente
                            </Badge>
                          )}
                          {cost.installments && cost.installments > 1 && (
                            <Badge variant="outline" className="text-xs">
                              <CreditCard className="h-3 w-3 mr-1" />
                              {cost.currentInstallment || 1}/{cost.installments}
                            </Badge>
                          )}
                          {cost.notificationEnabled && (
                            <Badge variant="outline" className="text-xs">
                              <Bell className="h-3 w-3 mr-1" />
                              Notif.
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600">Categoria: {cost.category}</p>
                      <p className="text-xs text-gray-500">
                        Mês: {new Date(cost.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </p>

                      {cost.dueDate && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Vence em: {formatDueDate(cost.dueDate)}</span>
                          {getDueDateBadge(cost.dueDate)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">
                          R$ {cost.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(cost)}
                          className="transition-all duration-300 hover:scale-105"
                          disabled={submitting}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(cost.id)}
                          className="transition-all duration-300 hover:scale-105"
                          disabled={submitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <DollarSign className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhum custo cadastrado ainda</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowExpenseModal(true)}>
                Adicionar Primeiro Custo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <ExpenseModal open={showExpenseModal} onOpenChange={handleCloseModal} editingCost={editingCost} />
    </div>
  );
};

export default MonthlyCosts;
