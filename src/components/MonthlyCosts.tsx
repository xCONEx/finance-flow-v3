
import React, { useState } from 'react';
import { Plus, Trash2, DollarSign, Edit, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { generateExpensesPDF } from '../utils/pdfGenerator';

const EXPENSE_CATEGORIES = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Lazer',
  'Outros'
];

const MonthlyCosts = () => {
  const { monthlyCosts, addMonthlyCost, updateMonthlyCost, deleteMonthlyCost, loading } = useAppContext();
  const { userData } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingCost, setEditingCost] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    value: 0,
    month: new Date().toISOString().slice(0, 7)
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.category || formData.value <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos corretamente.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingCost) {
        await updateMonthlyCost(editingCost, formData);
        toast({
          title: "Custo Atualizado",
          description: "O custo foi atualizado com sucesso.",
        });
        setEditingCost(null);
      } else {
        await addMonthlyCost(formData);
        toast({
          title: "Custo Adicionado",
          description: "O custo mensal foi cadastrado com sucesso.",
        });
      }
      
      setFormData({
        description: '',
        category: '',
        value: 0,
        month: new Date().toISOString().slice(0, 7)
      });
      setShowForm(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: editingCost ? "Erro ao atualizar custo." : "Erro ao adicionar custo mensal.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cost: any) => {
    setFormData({
      description: cost.description,
      category: cost.category,
      value: cost.value,
      month: cost.month
    });
    setEditingCost(cost.id);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingCost(null);
    setShowForm(false);
    setFormData({
      description: '',
      category: '',
      value: 0,
      month: new Date().toISOString().slice(0, 7)
    });
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

      await generateExpensesPDF(monthlyCosts, userData);
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

  const totalMonthlyCosts = monthlyCosts.reduce((sum, cost) => sum + cost.value, 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthCosts = monthlyCosts
    .filter(cost => cost.month === currentMonth)
    .reduce((sum, cost) => sum + cost.value, 0);

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
      <div className="flex justify-between items-center">
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
        <div className="flex gap-2">
          {monthlyCosts.length > 0 && (
            <Button onClick={handleGeneratePDF} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
          )}
          <Button onClick={() => setShowForm(true)} disabled={submitting}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Custo
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-800">Total Mensal</h3>
              <div className="text-3xl font-bold text-red-600">
                R$ {totalMonthlyCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-orange-800">Mês Atual</h3>
              <div className="text-3xl font-bold text-orange-600">
                R$ {currentMonthCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCost ? 'Editar Custo Mensal' : 'Novo Custo Mensal'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Ex: Aluguel do escritório"
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({...formData, category: value})}
                    disabled={submitting}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg z-50">
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Valor (R$)</Label>
                  <CurrencyInput
                    id="value"
                    value={formData.value}
                    onChange={(value) => setFormData({...formData, value})}
                    placeholder="1.500,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month">Mês</Label>
                  <Input
                    id="month"
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (editingCost ? 'Atualizando...' : 'Adicionando...') : (editingCost ? 'Atualizar' : 'Adicionar')}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={submitting}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Costs List */}
      <div className="grid gap-4">
        {monthlyCosts.map((cost) => (
          <Card key={cost.id} className="transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{cost.description}</h3>
                  <p className="text-sm text-gray-600">Categoria: {cost.category}</p>
                  <p className="text-xs text-gray-500">
                    Mês: {new Date(cost.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
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
        ))}
        
        {monthlyCosts.length === 0 && !showForm && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <DollarSign className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhum custo cadastrado ainda</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowForm(true)}>
                Adicionar Primeiro Custo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MonthlyCosts;
