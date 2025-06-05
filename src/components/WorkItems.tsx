
import React, { useState } from 'react';
import { Plus, Trash2, Briefcase, Edit, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { generateWorkItemsPDF } from '../utils/pdfGenerator';

const EQUIPMENT_CATEGORIES = [
  'Câmera',
  'Lente', 
  'Hardware',
  'Software',
  'Iluminação',
  'Audio',
  'Acessórios',
  'Outros'
];

const WorkItems = () => {
  const { workItems, addWorkItem, updateWorkItem, deleteWorkItem, loading } = useAppContext();
  const { userData } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    value: 0,
    depreciationYears: 5
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
      if (editingItem) {
        await updateWorkItem(editingItem, formData);
        toast({
          title: "Item Atualizado",
          description: "O item foi atualizado com sucesso.",
        });
        setEditingItem(null);
      } else {
        await addWorkItem(formData);
        toast({
          title: "Item Adicionado",
          description: "O item de trabalho foi cadastrado com sucesso.",
        });
      }
      
      setFormData({
        description: '',
        category: '',
        value: 0,
        depreciationYears: 5
      });
      setShowForm(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: editingItem ? "Erro ao atualizar item." : "Erro ao adicionar item de trabalho.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    setFormData({
      description: item.description,
      category: item.category,
      value: item.value,
      depreciationYears: item.depreciationYears || 5
    });
    setEditingItem(item.id);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setShowForm(false);
    setFormData({
      description: '',
      category: '',
      value: 0,
      depreciationYears: 5
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkItem(id);
      toast({
        title: "Item Removido",
        description: "O item foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover item.",
        variant: "destructive"
      });
    }
  };

  const handleGeneratePDF = async () => {
    try {
      if (workItems.length === 0) {
        toast({
          title: "Erro",
          description: "Não há itens para gerar o relatório.",
          variant: "destructive"
        });
        return;
      }

      await generateWorkItemsPDF(workItems, userData);
      toast({
        title: "PDF Gerado",
        description: "O relatório de itens de trabalho foi gerado com sucesso.",
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

  const totalValue = workItems.reduce((sum, item) => sum + item.value, 0);
  const equipmentValue = workItems
    .filter(item => item.category.toLowerCase().includes('equipamento') || 
                   item.category.toLowerCase().includes('câmera') ||
                   item.category.toLowerCase().includes('lente') ||
                   item.category.toLowerCase().includes('hardware'))
    .reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando itens de trabalho...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="text-purple-600" />
            Itens de Trabalho
          </h2>
          <p className="text-gray-600">
            Gerencie equipamentos, softwares e outros itens
            {workItems.length > 0 && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {workItems.length} {workItems.length === 1 ? 'item importado' : 'itens importados'}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {workItems.length > 0 && (
            <Button onClick={handleGeneratePDF} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
          )}
          <Button onClick={() => setShowForm(true)} disabled={submitting}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-800">Total de Itens</h3>
              <div className="text-3xl font-bold text-blue-600">
                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
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

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingItem ? 'Editar Item de Trabalho' : 'Novo Item de Trabalho'}</CardTitle>
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
                      {EQUIPMENT_CATEGORIES.map((category) => (
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
                    placeholder="15.000,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depreciationYears">Anos de Depreciação</Label>
                  <Input
                    id="depreciationYears"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="20"
                    value={formData.depreciationYears}
                    onChange={(e) => setFormData({...formData, depreciationYears: Number(e.target.value)})}
                    placeholder="5"
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (editingItem ? 'Atualizando...' : 'Adicionando...') : (editingItem ? 'Atualizar' : 'Adicionar')}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={submitting}>
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
          <Card key={item.id} className="transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{item.description}</h3>
                  <p className="text-sm text-gray-600">Categoria: {item.category}</p>
                  <p className="text-xs text-gray-500">Depreciação: {item.depreciationYears || 5} anos</p>
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
                    onClick={() => handleEdit(item)}
                    className="transition-all duration-300 hover:scale-105"
                    disabled={submitting}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(item.id)}
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
