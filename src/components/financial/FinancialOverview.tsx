
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, CreditCard, ArrowDown, ArrowUp, PlusCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/utils/formatters';
import { useTheme } from '../../contexts/ThemeContext';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EditTransactionModal } from './EditTransactionModal';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  created_at: string;
}

const FinancialOverview = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentTheme } = useTheme();
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: 0,
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Mock data since transactions table doesn't exist
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          description: 'Pagamento de cliente',
          amount: 2500,
          type: 'income',
          category: 'Serviços',
          date: '2024-01-15',
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          description: 'Equipamento de câmera',
          amount: 800,
          type: 'expense',
          category: 'Equipamentos',
          date: '2024-01-10',
          created_at: '2024-01-10T14:30:00Z'
        }
      ];

      setTransactions(mockTransactions);
      calculateTotals(mockTransactions);
    } catch (error: any) {
      console.error('Erro ao carregar transações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar transações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (transactions: Transaction[]) => {
    let income = 0;
    let expenses = 0;

    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        income += transaction.amount;
      } else {
        expenses += transaction.amount;
      }
    });

    setTotalIncome(income);
    setTotalExpenses(expenses);
    setBalance(income - expenses);
  };

  const handleAddTransaction = async () => {
    if (!user?.id) return;

    try {
      // Mock implementation - in real app this would save to database
      const newTrans: Transaction = {
        id: Date.now().toString(),
        description: newTransaction.description,
        amount: newTransaction.amount,
        type: newTransaction.type as 'income' | 'expense',
        category: newTransaction.category,
        date: newTransaction.date,
        created_at: new Date().toISOString()
      };

      setTransactions(prevTransactions => [newTrans, ...prevTransactions]);
      calculateTotals([...transactions, newTrans]);
      setNewTransaction({
        description: '',
        amount: 0,
        type: 'expense',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddModal(false);

      toast({
        title: "Sucesso",
        description: "Transação adicionada com sucesso!",
      });
    } catch (error: any) {
      console.error('Erro ao adicionar transação:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar transação. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!user?.id) return;

    try {
      // Mock implementation - in real app this would delete from database
      const updatedTransactions = transactions.filter(transaction => transaction.id !== transactionId);
      setTransactions(updatedTransactions);
      calculateTotals(updatedTransactions);

      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso!",
      });
    } catch (error: any) {
      console.error('Erro ao excluir transação:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir transação. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Visão Geral Financeira</h2>
        <p className="text-gray-600 dark:text-gray-400">Acompanhe suas finanças de perto</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-700">
          <CardHeader>
            <CardTitle>Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total de receitas</div>
          </CardContent>
        </Card>

        <Card className="bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-700">
          <CardHeader>
            <CardTitle>Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total de despesas</div>
          </CardContent>
        </Card>

        <Card className="bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-700">
          <CardHeader>
            <CardTitle>Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Saldo atual</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Transações Recentes</h3>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="h-4 w-4 mr-2" /> Adicionar Transação</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Transação</DialogTitle>
              <DialogDescription>
                Adicione uma nova receita ou despesa à sua lista.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descrição
                </Label>
                <Input
                  type="text"
                  id="description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Valor
                </Label>
                <Input
                  type="number"
                  id="amount"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Tipo
                </Label>
                <select
                  id="type"
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as 'income' | 'expense' })}
                  className="col-span-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  <option value="income">Receita</option>
                  <option value="expense">Despesa</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Data
                </Label>
                <Input
                  type="date"
                  id="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <Button onClick={handleAddTransaction}>Adicionar Transação</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <div className="overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Data
              </th>
              <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id}>
                <td className="px-5 py-5 border-b text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{transaction.description}</p>
                </td>
                <td className="px-5 py-5 border-b text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{formatCurrency(transaction.amount)}</p>
                </td>
                <td className="px-5 py-5 border-b text-sm">
                  {transaction.type === 'income' ? (
                    <Badge variant="outline" className="text-green-500 bg-green-50 border-green-500">
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Receita
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-500 bg-red-50 border-red-500">
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Despesa
                    </Badge>
                  )}
                </td>
                <td className="px-5 py-5 border-b text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-5 py-5 border-b text-sm">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setShowEditModal(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="ml-2"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Edit Transaction Modal */}
        <EditTransactionModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          transaction={selectedTransaction}
          onSave={(updatedTransaction) => {
            // Handle the updated transaction
            console.log('Transaction updated:', updatedTransaction);
            setSelectedTransaction(null);
          }}
        />
      </div>
    </div>
  );
};

export default FinancialOverview;
