
import React, { useState } from 'react';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '../contexts/AppContext';
import { toast } from '@/hooks/use-toast';

const MonthlyCosts = () => {
  const { monthlyCosts, addMonthlyCost, deleteMonthlyCost } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    value: 0,
    month: new Date().toISOString().slice(0, 7)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.category || formData.value <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos corretamente.",
        variant: "destructive"
      });
      return;
    }

    addMonthlyCost(formData);
    setFormData({
      description: '',
      category: '',
      value: 0,
      month: new Date().toISOString().slice(0, 7)
    });
    setShowForm(false);
    toast({
      title: "Custo Adicionado",
      description: "O custo mensal foi cadastrado com sucesso.",
    });
  };

  const handleDelete = (id: string) => {
    deleteMonthlyCost(id);
    toast({
      title: "Custo Removido",
      description: "O custo foi excluído com sucesso.",
    });
  };

  const totalCosts = monthlyCosts.reduce((sum, cost) => sum + cost.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="text-purple-600" />
            Custos Mensais
          </h2>
          <p className="text-gray-600">Gerencie seus custos fixos e variáveis</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
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

      {/* Add Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Custo Mensal</CardTitle>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="Ex: Infraestrutura"
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month">Mês</Label>
                  <Input
                    id="month"
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Adicionar</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
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
                    onClick={() => handleDelete(cost.id)}
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
