
import React, { useState } from 'react';
import { Plus, Trash2, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '../contexts/AppContext';
import { toast } from '@/hooks/use-toast';

const WorkItems = () => {
  const { workItems, addWorkItem, deleteWorkItem } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    value: 0,
    depreciationYears: 5
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

    addWorkItem(formData);
    setFormData({
      description: '',
      category: '',
      value: 0,
      depreciationYears: 5
    });
    setShowForm(false);
    toast({
      title: "Item Adicionado",
      description: "O item de trabalho foi cadastrado com sucesso.",
    });
  };

  const handleDelete = (id: string) => {
    deleteWorkItem(id);
    toast({
      title: "Item Removido",
      description: "O item foi excluído com sucesso.",
    });
  };

  const totalValue = workItems.reduce((sum, item) => sum + item.value, 0);
  const equipmentValue = workItems
    .filter(item => item.category.toLowerCase().includes('equipamento'))
    .reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="text-purple-600" />
            Itens de Trabalho
          </h2>
          <p className="text-gray-600">Gerencie equipamentos, softwares e outros itens</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-800">Total de Itens</h3>
              <div className="text-3xl font-bold text-blue-600">
                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-800">Valor Equipamentos</h3>
              <div className="text-3xl font-bold text-green-600">
                R$ {equipmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Item de Trabalho</CardTitle>
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
                    placeholder="Ex: Câmera Sony A7 III"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="Ex: Equipamento"
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
                    placeholder="15000.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depreciationYears">Anos de Depreciação</Label>
                  <Input
                    id="depreciationYears"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.depreciationYears}
                    onChange={(e) => setFormData({...formData, depreciationYears: Number(e.target.value)})}
                    placeholder="5"
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

      {/* Items List */}
      <div className="grid gap-4">
        {workItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{item.description}</h3>
                  <p className="text-sm text-gray-600">Categoria: {item.category}</p>
                  <p className="text-xs text-gray-500">Depreciação: {item.depreciationYears} anos</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {workItems.length === 0 && !showForm && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Briefcase className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhum item cadastrado ainda</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowForm(true)}>
                Adicionar Primeiro Item
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WorkItems;
