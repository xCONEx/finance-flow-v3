
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
      if (monthlyCosts.length === 0) {
        toast({
          title: "Erro",
          description: "Não há despesas para gerar o relatório.",
          variant: "destructive"
        });
        return;
      }

      await generateExpensesPDF(monthlyCosts, { name: profile?.name, email: user?.email });
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

  const totalMonthlyCosts = monthlyCosts.reduce((sum, cost) => sum + cost.value, 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthCosts = monthlyCosts
    .filter(cost => cost.month === currentMonth)
    .reduce((sum, cost) => sum + cost.value, 0);

  // Custos com vencimento próximo (próximos 7 dias)
  const upcomingCosts = monthlyCosts.filter(cost => {
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
  <div className="space-y-6">
    {/* Header */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="text-purple-600" />
          Custos Mensais
        </h2>
        <p className="text-gray-600">
          Gerencie suas despesas e custos fixos mensais
          {monthlyCosts.length > 0 && (
            <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {monthlyCosts.length} {monthlyCosts.length === 1 ? 'despesa importada' : 'despesas importadas'}
            </span>
          )}
        </p>
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        {monthlyCosts.length > 0 && (
          <>
            <Button onClick={handleGeneratePDF} variant="outline" className="hidden sm:flex">
              <FileText className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
            <Button onClick={handleGeneratePDF} variant="outline" className="sm:hidden" size="sm">
              <FileText className="h-4 w-4" />
            </Button>
          </>
        )}

        <Button onClick={() => setShowExpenseModal(true)} disabled={submitting} className="hidden sm:flex">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Custo
        </Button>
        <Button onClick={() => setShowExpenseModal(true)} disabled={submitting} className="sm:hidden flex-1" size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>

    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="text-center">
            <h3 className="text-sm sm:text-lg font-semibold text-red-800">Total Mensal</h3>
            <div className="text-xl sm:text-3xl font-bold text-red-600">
              R$ {totalMonthlyCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="text-center">
            <h3 className="text-sm sm:text-lg font-semibold text-orange-800">Mês Atual</h3>
            <div className="text-xl sm:text-3xl font-bold text-orange-600">
              R$ {currentMonthCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="text-center">
            <h3 className="text-sm sm:text-lg font-semibold text-blue-800">Vencimentos</h3>
            <div className="text-xl sm:text-3xl font-bold text-blue-600">{upcomingCosts}</div>
            <p className="text-xs text-blue-600">próximos 7 dias</p>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Costs List */}
    <div className="grid gap-4  pb-20 md:pb-0">
      {monthlyCosts.length > 0 ? (
        monthlyCosts.map((cost) => (
          <Card key={cost.id} className="transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold truncate">{cost.description}</h3>
                    <div className="flex gap-1">
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
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Vence em: {formatDueDate(cost.dueDate)}</span>
                      {getDueDateBadge(cost.dueDate)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="text-right flex-1 sm:flex-none">
                    <div className="text-lg font-bold text-red-600">
                      R$ {cost.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
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
