
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import AddIncomeModal from './AddIncomeModal';
import AddExpenseModal from './AddExpenseModal';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  payment_method: string;
  supplier?: string;
  date: string;
  time?: string;
  is_paid: boolean;
  created_at: string;
}

const FinancialOverview: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  // Carregar transações
  const loadTransactions = async () => {
    if (!user) return;

    try {
      // Usar SQL direto para buscar as transações
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT * FROM financial_transactions 
          WHERE user_id = '${user.id}' 
          ORDER BY date DESC, created_at DESC
        `
      });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      // Não mostrar erro se as tabelas ainda não existem
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  // Calcular totais
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.is_paid)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && t.is_paid)
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpenses;

  // Filtrar transações
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'income') return matchesSearch && transaction.type === 'income';
    if (activeFilter === 'expense') return matchesSearch && transaction.type === 'expense';
    if (activeFilter === 'pending') return matchesSearch && !transaction.is_paid;
    if (activeFilter === 'paid') return matchesSearch && transaction.is_paid;
    
    return matchesSearch;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">(Pago)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">(Pagas)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <DollarSign className={`h-4 w-4 ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatCurrency(netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">(Pago)</p>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-4">
        <Button 
          onClick={() => setShowIncomeModal(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Entrada
        </Button>
        <Button 
          onClick={() => setShowExpenseModal(true)}
          variant="destructive"
        >
          <Minus className="h-4 w-4 mr-2" />
          Nova Saída
        </Button>
      </div>

      {/* Filtros e Pesquisa */}
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros */}
          <Tabs value={activeFilter} onValueChange={setActiveFilter}>
            <TabsList>
              <TabsTrigger value="all">Lançamentos Gerais</TabsTrigger>
              <TabsTrigger value="expense">Contas a Pagar</TabsTrigger>
              <TabsTrigger value="income">Contas a Receber</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Lista de Transações */}
          <div className="space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {transactions.length === 0 ? (
                  <div>
                    <p>Nenhuma transação encontrada.</p>
                    <p className="text-sm mt-2">Execute o SQL das tabelas financeiras primeiro!</p>
                  </div>
                ) : (
                  <p>Nenhuma transação corresponde aos filtros aplicados.</p>
                )}
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{transaction.description}</span>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                        {transaction.category}
                      </Badge>
                      {!transaction.is_paid && (
                        <Badge variant="outline">Pendente</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(transaction.date)} • {transaction.payment_method}
                      {transaction.supplier && ` • ${transaction.supplier}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.is_paid ? 'Pago' : 'Pendente'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
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
