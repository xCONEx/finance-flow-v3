
import React, { useState } from 'react';
import { Plus, Trash2, Briefcase, Edit, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '../contexts/AppContext';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { toast } from '@/hooks/use-toast';
import WorkItemModal from './WorkItemModal';
import { generateWorkItemsPDF } from '../utils/pdfGenerator';

const WorkItems = () => {
  const { workItems, updateWorkItem, deleteWorkItem, loading } = useApp();
  const { user, profile } = useSupabaseAuth();
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowItemModal(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setShowItemModal(false);
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

      await generateWorkItemsPDF(workItems, { name: profile?.name, email: user?.email });
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
      <div className="space-y-6 pb-24 md:pb-6">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando itens de trabalho...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Briefcase className="text-purple-600" />
            Itens de Trabalho
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Gerencie equipamentos, softwares e outros itens
            {workItems.length > 0 && (
              <span className="ml-2 text-xs sm:text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {workItems.length} {workItems.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {workItems.length > 0 && (
            <Button onClick={handleGeneratePDF} variant="outline" className="flex-1 sm:flex-none">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Gerar PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          )}

          <Button onClick={() => setShowItemModal(true)} disabled={submitting} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Adicionar Item</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <h3 className="text-sm sm:text-lg font-semibold text-blue-800">Total de Itens</h3>
              <div className="text-lg sm:text-3xl font-bold text-blue-600 break-words">
                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <h3 className="text-sm sm:text-lg font-semibold text-green-800">Valor Equipamentos</h3>
              <div className="text-lg sm:text-3xl font-bold text-green-600 break-words">
                R$ {equipmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      <div className="grid gap-4">
        {workItems.length > 0 ? (
          workItems.map((item) => (
            <Card key={item.id} className="transition-all duration-300 hover:shadow-lg overflow-hidden">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col space-y-3">
                  {/* Mobile Layout - Stacked */}
                  <div className="flex flex-col sm:hidden space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-sm truncate flex-1 pr-2">{item.description}</h3>
                      <div className="text-lg font-bold text-blue-600 whitespace-nowrap">
                        R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600">Categoria: {item.category}</p>
                    <p className="text-xs text-gray-500">
                      Depreciação: {item.depreciationYears || 5} anos
                    </p>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                        className="flex-1 transition-all duration-300 hover:scale-105"
                        disabled={submitting}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item.id)}
                        className="flex-1 transition-all duration-300 hover:scale-105"
                        disabled={submitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout - Side by side */}
                  <div className="hidden sm:flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate text-base">{item.description}</h3>
                      <p className="text-sm text-gray-600">Categoria: {item.category}</p>
                      <p className="text-xs text-gray-500">Depreciação: {item.depreciationYears || 5} anos</p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="flex gap-2">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Briefcase className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhum item cadastrado ainda</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowItemModal(true)}>
                Adicionar Primeiro Item
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <WorkItemModal open={showItemModal} onOpenChange={handleCloseModal} editingItem={editingItem} />
    </div>
  );
};

export default WorkItems;
