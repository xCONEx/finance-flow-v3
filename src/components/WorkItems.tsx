import React, { useState } from 'react';
import { Plus, Trash2, Briefcase, Edit, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { generateWorkItemsPDF } from '../utils/pdfGenerator';

const ITEM_CATEGORIES = [
  'Câmera',
  'Lente',
  'Iluminação',
  'Áudio',
  'Acessórios',
  'Computador',
  'Software',
  'Outros'
];

const WorkItems = () => {
  const { workItems, addWorkItem, updateWorkItem, deleteWorkItem, loading } = useAppContext();
  const { userData, user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    value: 0,
    depreciationYears: 5
  });

  const handleSubmit = async () => {
    if (!formData.description || !formData.category || formData.value <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await updateWorkItem(editingItem, {
          description: formData.description,
          category: formData.category,
          value: formData.value,
          depreciationYears: formData.depreciationYears
        });
        setEditingItem(null);
      } else {
        await addWorkItem({
          ...formData,
          createdAt: new Date().toISOString(),
          userId: user?.id || ''
        });
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
      console.error('Erro ao salvar item:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar item de trabalho.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      description: item.description,
      category: item.category,
      value: item.value,
      depreciationYears: item.depreciationYears
    });
    setEditingItem(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteWorkItem(id);
      toast({
        title: "Item Deletado",
        description: "O item de trabalho foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar item de trabalho.",
        variant: "destructive"
      });
    }
  };

  const generatePDF = async () => {
    if (userData) {
      await generateWorkItemsPDF(workItems, userData);
    }
  };

  const totalValue = workItems.reduce((sum, item) => sum + item.value, 0);
  const monthlyDepreciation = workItems.reduce((sum, item) => 
    sum + (item.value / (item.depreciationYears * 12)), 0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Itens de Trabalho</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie seus equipamentos e ferramentas de trabalho
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => generateWorkItemsPDF(workItems, userData)} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workItems.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Depreciação Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {monthlyDepreciation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Seus Itens de Trabalho
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workItems.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum item cadastrado ainda.</p>
              <Button onClick={() => setShowForm(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Item
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {workItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.description}</h3>
                    <p className="text-sm text-gray-600">
                      {item.category} • Depreciação: {item.depreciationYears} anos
                    </p>
                    <p className="text-sm font-medium">
                      R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          description: item.description,
                          category: item.category,
                          value: item.value,
                          depreciationYears: item.depreciationYears
                        });
                        setEditingItem(item.id);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteWorkItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Item' : 'Adicionar Item de Trabalho'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Ex: Câmera DSLR Canon"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$) *</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="depreciationYears">Anos de Depreciação *</Label>
              <Input
                id="depreciationYears"
                type="number"
                value={formData.depreciationYears}
                onChange={(e) => setFormData({...formData, depreciationYears: parseInt(e.target.value) || 5})}
                placeholder="5"
                min="1"
                max="20"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingItem ? 'Atualizar' : 'Adicionar'
                )}
              </Button>
              <Button variant="outline" onClick={() => {
                setShowForm(false);
                setEditingItem(null);
                setFormData({
                  description: '',
                  category: '',
                  value: 0,
                  depreciationYears: 5
                });
              }}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkItems;
