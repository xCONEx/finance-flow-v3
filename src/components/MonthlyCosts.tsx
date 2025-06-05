
import React, { useState } from 'react';
import { Plus, Trash2, DollarSign, Edit, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '../contexts/AppContext';
import { toast } from '@/hooks/use-toast';

const MonthlyCosts = () => {
  const { monthlyCosts, addMonthlyCost, updateMonthlyCost, deleteMonthlyCost, loading } = useAppContext();
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
      month: cost.month || new Date().toISOString().slice(0, 7)
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

  const totalCosts = monthlyCosts.reduce((sum, cost) => sum + cost.value, 0);

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
            Gerencie seus custos fixos e variáveis 
            {monthlyCosts.length > 0 && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {monthlyCosts.length} {monthlyCosts.length === 1 ? 'custo importado' : 'custos importados'}
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={submitting}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Custo
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-800">Total de Custos Mensais</h3>
            <div className="text-3xl font-bold text-red-600">
              R$ {totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="Ex: Infraestrutura"
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Valor (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                    placeholder="1500.00"
                    disabled={submitting}
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
          <Card key={cost.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{cost.description}</h3>
                  <p className="text-sm text-gray-600">Categoria: {cost.category}</p>
                  <p className="text-sm text-gray-500">
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
                    disabled={submitting}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(cost.id)}
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
