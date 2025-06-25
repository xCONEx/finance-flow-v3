
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import AddIncomeModal from './AddIncomeModal';
import AddExpenseModal from './AddExpenseModal';
import EditTransactionModal from './EditTransactionModal';

const FinancialOverview: React.FC = () => {
  const { monthlyCosts } = useApp();
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filter financial transactions only
  const financialTransactions = monthlyCosts.filter(cost => 
    cost.description?.includes('FINANCIAL_INCOME:') || 
    cost.description?.includes('FINANCIAL_EXPENSE:')
  );

  const incomes = financialTransactions.filter(t => t.description?.includes('FINANCIAL_INCOME:'));
  const expenses = financialTransactions.filter(t => t.description?.includes('FINANCIAL_EXPENSE:'));

  const totalIncome = incomes.reduce((sum, income) => sum + Math.abs(income.value), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + Math.abs(expense.value), 0);
  const balance = totalIncome - totalExpenses;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTransactionTitle = (description: string) => {
    if (description?.includes('FINANCIAL_INCOME:')) {
      return description.replace('FINANCIAL_INCOME:', '').trim();
    }
    if (description?.includes('FINANCIAL_EXPENSE:')) {
      return description.replace('FINANCIAL_EXPENSE:', '').trim();
    }
    return description;
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-green-800 truncate">Receitas</p>
                <p className="text-xl font-bold text-green-600 truncate">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-red-800 truncate">Despesas</p>
                <p className="text-xl font-bold text-red-600 truncate">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-r ${balance >= 0 ? 'from-blue-50 to-indigo-50 border-blue-200' : 'from-orange-50 to-red-50 border-orange-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>Saldo</p>
                <p className={`text-xl font-bold truncate ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
              <Wallet className={`h-8 w-8 flex-shrink-0 ml-2 ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-purple-800 truncate">Transações</p>
                <p className="text-xl font-bold text-purple-600">
                  {financialTransactions.length}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons - Stack on mobile */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => setShowIncomeModal(true)}
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Receita
        </Button>
        <Button 
          onClick={() => setShowExpenseModal(true)}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Despesa
        </Button>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {financialTransactions.length > 0 ? (
          financialTransactions.map((transaction) => (
            <Card key={transaction.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleEditTransaction(transaction)}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">
                      {getTransactionTitle(transaction.description)}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {transaction.category} • {new Date(transaction.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-lg font-bold ${transaction.description?.includes('FINANCIAL_INCOME:') ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.description?.includes('FINANCIAL_INCOME:') ? '+' : '-'}{formatCurrency(Math.abs(transaction.value))}
                    </span>
                    <div className={`w-3 h-3 rounded-full ${transaction.description?.includes('FINANCIAL_INCOME:') ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <DollarSign className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhuma transação registrada</p>
              <p className="text-sm text-gray-400 mt-1">Comece adicionando uma receita ou despesa</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <AddIncomeModal 
        isOpen={showIncomeModal} 
        onClose={() => setShowIncomeModal(false)}
        onSuccess={() => window.location.reload()}
      />
      <AddExpenseModal 
        isOpen={showExpenseModal} 
        onClose={() => setShowExpenseModal(false)}
        onSuccess={() => window.location.reload()}
      />
      <EditTransactionModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal} 
        transaction={editingTransaction}
      />
    </div>
  );
};

export default FinancialOverview;
