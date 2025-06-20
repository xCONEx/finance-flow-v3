import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Plus, ArrowUpDown, Edit, FileText, Filter, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePrivacy } from '@/contexts/PrivacyContext';
import AddIncomeModal from './AddIncomeModal';
import AddExpenseModal from './AddExpenseModal';
import EditTransactionModal from './EditTransactionModal';

interface FinancialTransaction {
  id: string;
  user_id: string;
  description: string;
  value: number;
  category: string;
  month: string;
  created_at: string;
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
  const [filteredTransactions, setFilteredTransactions] = useState<FinancialTransaction[]>([]);
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);
  
  // Filtros
  const [filterType, setFilterType] = useState('all'); // all, income, expense
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterPaid, setFilterPaid] = useState('all'); // all, paid, pending

  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { valuesHidden, toggleValuesVisibility, formatValue } = usePrivacy();

  const loadTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .or('description.ilike.FINANCIAL_INCOME:%,description.ilike.FINANCIAL_EXPENSE:%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transactionData = data || [];
      setTransactions(transactionData);
      applyFilters(transactionData);

      // Calculate summary from financial transactions
      const incomeTransactions = transactionData.filter((t: FinancialTransaction) => 
        t.description.includes('FINANCIAL_INCOME:') && t.value < 0
      );
      const expenseTransactions = transactionData.filter((t: FinancialTransaction) => 
        t.description.includes('FINANCIAL_EXPENSE:') && t.value > 0
      );

      const totalIncome = Math.abs(incomeTransactions.reduce((sum, t) => sum + t.value, 0));
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.value, 0);

      // Calculate pending amounts
      const pendingIncomeTransactions = incomeTransactions.filter(t => 
        !t.description.includes('Paid: true')
      );
      const pendingExpenseTransactions = expenseTransactions.filter(t => 
        !t.description.includes('Paid: true')
      );

      const pendingIncome = Math.abs(pendingIncomeTransactions.reduce((sum, t) => sum + t.value, 0));
      const pendingExpenses = pendingExpenseTransactions.reduce((sum, t) => sum + t.value, 0);

      setSummary({
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        pendingIncome,
        pendingExpenses
      });
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (transactionData: FinancialTransaction[] = transactions) => {
    let filtered = [...transactionData];

    // Filter by type (income/expense)
    if (filterType === 'income') {
      filtered = filtered.filter(t => t.description.includes('FINANCIAL_INCOME:'));
    } else if (filterType === 'expense') {
      filtered = filtered.filter(t => t.description.includes('FINANCIAL_EXPENSE:'));
    }

    // Filter by category
    if (filterCategory) {
      filtered = filtered.filter(t => t.category.toLowerCase().includes(filterCategory.toLowerCase()));
    }

    // Filter by date range
    if (filterDateFrom) {
      filtered = filtered.filter(t => {
        const transactionData = parseTransactionData(t.description);
        const transactionDate = transactionData.date || t.created_at.split('T')[0];
        return transactionDate >= filterDateFrom;
      });
    }

    if (filterDateTo) {
      filtered = filtered.filter(t => {
        const transactionData = parseTransactionData(t.description);
        const transactionDate = transactionData.date || t.created_at.split('T')[0];
        return transactionDate <= filterDateTo;
      });
    }

    // Filter by payment status
    if (filterPaid !== 'all') {
      filtered = filtered.filter(t => {
        const transactionData = parseTransactionData(t.description);
        const isPaid = transactionData.isPaid;
        return filterPaid === 'paid' ? isPaid : !isPaid;
      });
    }

    setFilteredTransactions(filtered);
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [filterType, filterCategory, filterDateFrom, filterDateTo, filterPaid, transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const parseTransactionData = (description: string) => {
    const isIncome = description.includes('FINANCIAL_INCOME:');
    const parts = description.split(' | ');
    const mainDesc = parts[0].replace('FINANCIAL_INCOME: ', '').replace('FINANCIAL_EXPENSE: ', '');
    const payment = parts.find(p => p.startsWith('Payment:'))?.replace('Payment: ', '') || '';
    const clientOrSupplier = parts.find(p => p.startsWith('Client:') || p.startsWith('Supplier:'))?.split(': ')[1] || '';
    const date = parts.find(p => p.startsWith('Date:'))?.replace('Date: ', '') || '';
    const isPaid = parts.find(p => p.startsWith('Paid:'))?.replace('Paid: ', '') === 'true';

    return {
      isIncome,
      description: mainDesc,
      paymentMethod: payment,
      clientOrSupplier,
      date,
      isPaid
    };
  };

  const handleEditTransaction = (transaction: FinancialTransaction) => {
    setSelectedTransaction(transaction);
    setShowEditModal(true);
  };

  const exportToPDF = () => {
    // Create PDF content
    const content = filteredTransactions.map(transaction => {
      const transactionData = parseTransactionData(transaction.description);
      return {
        date: transactionData.date || formatDate(transaction.created_at),
        type: transactionData.isIncome ? 'Entrada' : 'Saída',
        description: transactionData.description,
        category: transaction.category,
        amount: formatValue(Math.abs(transaction.value)),
        paymentMethod: transactionData.paymentMethod,
        clientSupplier: transactionData.clientOrSupplier,
        status: transactionData.isPaid ? 'Pago' : 'Pendente'
      };
    });

    // Simple implementation - in a real app, you'd use a PDF library like jsPDF
    const dataStr = JSON.stringify(content, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `transacoes_financeiras_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Exportação",
      description: "Dados exportados com sucesso! (Em formato JSON para demonstração)",
    });
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterCategory('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterPaid('all');
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
      {/* Privacy Toggle */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleValuesVisibility}
          className="flex items-center gap-2"
        >
          {valuesHidden ? (
            <>
              <EyeOff className="h-4 w-4" />
              Mostrar Valores
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Ocultar Valores
            </>
          )}
        </Button>
      </div>

      {/* Header com Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entradas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatValue(summary.totalIncome)}
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
                  {formatValue(summary.totalExpenses)}
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
                  {formatValue(summary.balance)}
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
                  {formatValue(summary.pendingIncome)}
                </p>
              </div>
              <ArrowUpDown className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Entradas</SelectItem>
                  <SelectItem value="expense">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Categoria</label>
              <Input
                placeholder="Filtrar por categoria"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={filterPaid} onValueChange={setFilterPaid}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
        <Button onClick={exportToPDF} variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Lista de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>
            Transações Recentes ({filteredTransactions.length} de {transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma transação encontrada com os filtros aplicados.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => {
                const transactionData = parseTransactionData(transaction.description);
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{transactionData.description}</h4>
                        <Badge variant={transactionData.isIncome ? 'default' : 'destructive'}>
                          {transactionData.isIncome ? 'Entrada' : 'Saída'}
                        </Badge>
                        {!transactionData.isPaid && (
                          <Badge variant="outline">Pendente</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {transaction.category} • {formatDate(transactionData.date || transaction.created_at)}
                      </p>
                      {transactionData.clientOrSupplier && (
                        <p className="text-sm text-muted-foreground">
                          {transactionData.isIncome ? 'Cliente' : 'Fornecedor'}: {transactionData.clientOrSupplier}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className={`font-bold ${transactionData.isIncome ? 'text-green-600' : 'text-red-600'}`}>
                          {transactionData.isIncome ? '+' : '-'}{formatValue(Math.abs(transaction.value))}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {transactionData.paymentMethod}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTransaction(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
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
      <EditTransactionModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadTransactions}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default FinancialOverview;
