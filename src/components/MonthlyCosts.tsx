
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trash2, Plus, DollarSign, Loader2, FileText, PieChart } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { toast } from '@/hooks/use-toast';
import ExpenseModal from './ExpenseModal';
import CostDistributionChart from './CostDistributionChart';
import { generateExpensesPDF } from '../utils/pdfGenerator';
import { safeFormatCurrency, safeFormatNumber } from '../utils/formatters';

const MonthlyCosts = () => {
  const { monthlyCosts, addMonthlyCost, deleteMonthlyCost, loading } = useApp();
  const { user, profile } = useSupabaseAuth();
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [fixedCosts, setFixedCosts] = useState(0);
  const [variableCosts, setVariableCosts] = useState(0);
  const [filteredCosts, setFilteredCosts] = useState([]);

  const calculateTotals = (costs: any[]) => {
    let total = 0;
    let fixed = 0;
    let variable = 0;

    costs.forEach(cost => {
      // Usar verificação segura para amount/value
      const amount = cost.amount || cost.value || 0;
      const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
      
      total += safeAmount;
      if (cost.type === 'fixed') {
        fixed += safeAmount;
      } else {
        variable += safeAmount;
      }
    });

    setMonthlyTotal(total);
    setFixedCosts(fixed);
    setVariableCosts(variable);
  };

  const handleDelete = async (id: string) => {
    try {
      setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      if (filteredCosts.length === 0) {
        toast({
          title: "Erro",
          description: "Não há custos para gerar o relatório.",
          variant: "destructive"
        });
        return;
      }

      await generateExpensesPDF(filteredCosts, { name: profile?.name, email: user?.email });
      toast({
        title: "PDF Gerado",
        description: "O relatório de custos mensais foi gerado com sucesso.",
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

  useEffect(() => {
    const selectedYear = selectedMonth.split('-')[0];
    const selectedMonthNumber = selectedMonth.split('-')[1];

    const filtered = monthlyCosts.filter(cost => {
      if (!cost.dueDate) return false;
      
      const costYear = new Date(cost.dueDate).getFullYear().toString();
      const costMonth = (new Date(cost.dueDate).getMonth() + 1).toString().padStart(2, '0');
      return costYear === selectedYear && costMonth === selectedMonthNumber;
    });

    setFilteredCosts(filtered);
    calculateTotals(filtered);
  }, [monthlyCosts, selectedMonth]);

  if (loading) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando custos mensais...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="text-green-600" />
            Custos Mensais
          </h2>
          <p className="text-gray-600">
            Gerencie seus custos e despesas mensais
            {filteredCosts.length > 0 && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {filteredCosts.length} {filteredCosts.length === 1 ? 'custo cadastrado' : 'custos cadastrados'}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex gap-2">
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full sm:w-auto"
            />
            {filteredCosts.length > 0 && (
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
          </div>
          <Button onClick={() => setShowExpenseModal(true)} disabled={submitting} className="hidden sm:flex">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Custo
          </Button>
          <Button onClick={() => setShowExpenseModal(true)} disabled={submitting} className="sm:hidden" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <h3 className="text-sm sm:text-lg font-semibold text-red-800">Total do Mês</h3>
              <div className="text-xl sm:text-3xl font-bold text-red-600">
                {safeFormatCurrency(monthlyTotal)}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <h3 className="text-sm sm:text-lg font-semibold text-blue-800">Custos Fixos</h3>
              <div className="text-xl sm:text-3xl font-bold text-blue-600">
                {safeFormatCurrency(fixedCosts)}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <h3 className="text-sm sm:text-lg font-semibold text-yellow-800">Custos Variáveis</h3>
              <div className="text-xl sm:text-3xl font-bold text-yellow-600">
                {safeFormatCurrency(variableCosts)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {filteredCosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição de Custos - {new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CostDistributionChart />
          </CardContent>
        </Card>
      )}

      {/* Costs List */}
      <div className="grid gap-4">
        {filteredCosts.map((cost) => {
          // Usar verificação segura para todos os valores
          const amount = cost.amount || cost.value || 0;
          const description = cost.description || 'Sem descrição';
          const category = cost.category || 'Sem categoria';
          const dueDate = cost.dueDate || new Date().toISOString();
          
          return (
            <Card key={cost.id} className="transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="font-semibold truncate">{description}</h3>
                      <div className="flex gap-2">
                        <Badge variant={cost.type === 'fixed' ? 'default' : 'secondary'} className="text-xs">
                          {cost.type === 'fixed' ? 'Fixo' : 'Variável'}
                        </Badge>
                        {cost.is_recurring && (
                          <Badge variant="outline" className="text-xs">
                            Recorrente
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Categoria: {category}</p>
                    <p className="text-xs text-gray-500">
                      Vencimento: {new Date(dueDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="text-right flex-1 sm:flex-none">
                      <div className="text-lg font-bold text-green-600">
                        {safeFormatCurrency(amount)}
                      </div>
                    </div>
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
          );
        })}
        
        {filteredCosts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <DollarSign className="mx-auto h-12 w-12 mb-4" />
              <p>
                {monthlyCosts.length === 0 
                  ? 'Nenhum custo cadastrado ainda'
                  : `Nenhum custo encontrado para ${new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
                }
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setShowExpenseModal(true)}>
                Adicionar Primeiro Custo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <ExpenseModal 
        open={showExpenseModal} 
        onOpenChange={setShowExpenseModal}
      />
    </div>
  );
};

export default MonthlyCosts;
