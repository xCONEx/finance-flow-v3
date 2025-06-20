
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Plus, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import AddIncomeModal from './AddIncomeModal';
import AddExpenseModal from './AddExpenseModal';

interface FinancialTransaction {
  id: string;
  description: string;
  value: number;
  category: string;
  month: string;
  created_at: string;
  user_id: string;
}

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  pendingIncome: number;
  pendingExpenses: number;
}

const FinancialOverview: React.FC = () => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    pendingIncome: 0,
    pendingExpenses: 0
  });
  const [loading, setLoading] = useState(true);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const loadTransactions = async () => {
    if (!user) return;

    try {
      // Load transactions from expenses table
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const transactionData = data || [];
      setTransactions(transactionData);

      // Calculate summary based on description prefixes
      const income = transactionData.filter((t) => t.description.startsWith('[ENTRADA]'));
      const expenses = transactionData.filter((t) => t.description.startsWith('[SAÍDA]'));

      const totalIncome = income.reduce((sum, t) => sum + Number(t.value || 0), 0);
      const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.value || 0), 0);

      setSummary({
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        pendingIncome: 0, // We'll implement this later
        pendingExpenses: 0 // We'll implement this later
      });
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getTransactionType = (description: string) => {
    if (description.startsWith('[ENTRADA]')) return 'income';
    if (description.startsWith('[SAÍDA]')) return 'expense';
    if (description.startsWith('[META]')) return 'goal';
    return 'other';
  };

  const cleanDescription = (description: string) => {
    return description.replace(/^\[(ENTRADA|SAÍDA|META)\]\s*/, '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entradas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalIncome)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saídas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalExpenses)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo</p>
                <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.balance)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">A Receber</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(summary.pendingIncome)}
                </p>
              </div>
              <ArrowUpDown className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-4">
        <Button onClick={() => setShowIncomeModal(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Entrada
        </Button>
        <Button onClick={() => setShowExpenseModal(true)} variant="destructive">
          <Plus className="h-4 w-4 mr-2" />
          Nova Saída
        </Button>
      </div>

      {/* Lista de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma transação encontrada.</p>
              <p className="text-sm text-muted-foreground mt-2">Adicione sua primeira entrada ou saída!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const type = getTransactionType(transaction.description);
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{cleanDescription(transaction.description)}</h4>
                        <Badge variant={type === 'income' ? 'default' : type === 'expense' ? 'destructive' : 'secondary'}>
                          {type === 'income' ? 'Entrada' : type === 'expense' ? 'Saída' : 'Meta'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {transaction.category} • {formatDate(transaction.created_at)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Mês: {transaction.month}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${type === 'income' ? 'text-green-600' : type === 'expense' ? 'text-red-600' : 'text-purple-600'}`}>
                        {type === 'income' ? '+' : type === 'expense' ? '-' : ''}{formatCurrency(transaction.value || 0)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <AddIncomeModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        onSuccess={loadTransactions}
      />
      <AddExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={loadTransactions}
      />
    </div>
  );
};

export default FinancialOverview;
