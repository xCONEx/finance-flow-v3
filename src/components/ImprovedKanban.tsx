
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Filter, Search, Calendar, User, Clock, AlertCircle, Badge as BadgeIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useKanbanContext } from '@/hooks/useKanbanContext';
import { toast } from '@/hooks/use-toast';

interface KanbanCard {
  id: string;
  title: string;
  client: string;
  due_date?: string;
  priority: 'alta' | 'media' | 'baixa';
  status: 'filmado' | 'edicao' | 'revisao' | 'entregue';
  description: string;
  links: { name: string; url: string }[];
  created_at: string;
  updated_at: string;
  user_id: string;
  agency_id?: string;
}

interface Column {
  id: string;
  title: string;
  status: string;
  cards: KanbanCard[];
}

const COLUMNS: Omit<Column, 'cards'>[] = [
  { id: 'filmado', title: 'Filmado', status: 'filmado' },
  { id: 'edicao', title: 'Em Edição', status: 'edicao' },
  { id: 'revisao', title: 'Em Revisão', status: 'revisao' },
  { id: 'entregue', title: 'Entregue', status: 'entregue' },
];

const PRIORITY_COLORS = {
  alta: 'bg-red-100 text-red-800 border-red-200',
  media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  baixa: 'bg-green-100 text-green-800 border-green-200',
};

const PRIORITY_LABELS = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

const ImprovedKanban: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  const { user } = useSupabaseAuth();
  const { isAgencyMode, currentAgencyId, currentUserId, contextLabel } = useKanbanContext();

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    due_date: '',
    priority: 'media' as 'alta' | 'media' | 'baixa',
    status: 'filmado' as 'filmado' | 'edicao' | 'revisao' | 'entregue',
    description: '',
    links: [{ name: '', url: '' }]
  });

  useEffect(() => {
    if (user) {
      console.log('🔄 ImprovedKanban - Carregando dados...', {
        isAgencyMode,
        currentAgencyId,
        currentUserId,
        contextLabel
      });
      loadKanbanData();
    }
  }, [user, isAgencyMode, currentAgencyId, currentUserId]);

  const loadKanbanData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase.from('kanban_boards').select('*');
      
      if (isAgencyMode && currentAgencyId) {
        // Modo agência: buscar projetos da agência
        query = query.eq('agency_id', currentAgencyId);
        console.log('🏢 Carregando Kanban da agência:', currentAgencyId);
      } else {
        // Modo individual: buscar projetos do usuário (sem agency_id ou null)
        query = query.eq('user_id', user.id).is('agency_id', null);
        console.log('👤 Carregando Kanban individual do usuário:', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar Kanban:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar projetos do Kanban",
          variant: "destructive"
        });
        return;
      }

      const rawCards = data || [];
      console.log(`📋 ${rawCards.length} projetos carregados (${contextLabel}):`, rawCards);

      // Transformar dados do Supabase para o formato esperado
      const cards: KanbanCard[] = rawCards.map(item => {
        const boardData = item.board_data as any;
        return {
          id: item.id,
          title: boardData?.title || 'Projeto sem título',
          client: boardData?.client || 'Cliente não informado',
          due_date: boardData?.due_date,
          priority: boardData?.priority || 'media',
          status: boardData?.status || 'filmado',
          description: boardData?.description || '',
          links: boardData?.links || [],
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
          user_id: item.user_id || user.id,
          agency_id: item.agency_id
        };
      });

      // Organizar cards por coluna
      const newColumns = COLUMNS.map(col => ({
        ...col,
        cards: cards.filter(card => card.status === col.status)
      }));

      setColumns(newColumns);
      console.log('✅ Colunas organizadas:', newColumns);
    } catch (error) {
      console.error('❌ Erro geral ao carregar Kanban:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar projetos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const boardData = {
        title: formData.title,
        client: formData.client,
        due_date: formData.due_date || null,
        priority: formData.priority,
        status: formData.status,
        description: formData.description,
        links: formData.links.filter(link => link.name && link.url)
      };

      const cardData = {
        user_id: user.id,
        agency_id: isAgencyMode ? currentAgencyId : null,
        board_data: boardData
      };

      console.log('💾 Salvando projeto:', { cardData, isAgencyMode, currentAgencyId });

      if (editingCard) {
        // Atualizar card existente
        const { error } = await supabase
          .from('kanban_boards')
          .update({
            board_data: boardData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCard.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Projeto atualizado com sucesso"
        });
      } else {
        // Criar novo card
        const { error } = await supabase
          .from('kanban_boards')
          .insert([cardData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Novo projeto criado com sucesso"
        });
      }

      // Recarregar dados
      await loadKanbanData();
      
      // Fechar modal e limpar form
      setIsAddDialogOpen(false);
      setEditingCard(null);
      setFormData({
        title: '',
        client: '',
        due_date: '',
        priority: 'media',
        status: 'filmado',
        description: '',
        links: [{ name: '', url: '' }]
      });

    } catch (error) {
      console.error('❌ Erro ao salvar projeto:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar projeto",
        variant: "destructive"
      });
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !user) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    try {
      // Encontrar o card que está sendo movido
      const sourceColumn = columns.find(col => col.id === source.droppableId);
      const card = sourceColumn?.cards.find(c => c.id === draggableId);
      
      if (!card) return;

      // Atualizar status no banco
      const newStatus = destination.droppableId as 'filmado' | 'edicao' | 'revisao' | 'entregue';
      
      const updatedBoardData = {
        ...card,
        status: newStatus
      };

      const { error } = await supabase
        .from('kanban_boards')
        .update({ 
          board_data: updatedBoardData,
          updated_at: new Date().toISOString()
        })
        .eq('id', draggableId);

      if (error) throw error;

      // Atualizar estado local
      setColumns(prevColumns => {
        const newColumns = [...prevColumns];
        const sourceCol = newColumns.find(col => col.id === source.droppableId);
        const destCol = newColumns.find(col => col.id === destination.droppableId);
        
        if (sourceCol && destCol) {
          const cardToMove = sourceCol.cards.find(c => c.id === draggableId);
          if (cardToMove) {
            sourceCol.cards = sourceCol.cards.filter(c => c.id !== draggableId);
            cardToMove.status = newStatus;
            destCol.cards.push(cardToMove);
          }
        }
        
        return newColumns;
      });

      toast({
        title: "Sucesso",
        description: "Status do projeto atualizado"
      });

    } catch (error) {
      console.error('❌ Erro ao mover projeto:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do projeto",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!user || !window.confirm('Tem certeza que deseja excluir este projeto?')) return;

    try {
      const { error } = await supabase
        .from('kanban_boards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      await loadKanbanData();
      
      toast({
        title: "Sucesso",
        description: "Projeto excluído com sucesso"
      });
    } catch (error) {
      console.error('❌ Erro ao excluir projeto:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir projeto",
        variant: "destructive"
      });
    }
  };

  const filteredColumns = columns.map(col => ({
    ...col,
    cards: col.cards.filter(card => {
      const matchesSearch = card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          card.client.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || card.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    })
  }));

  const openEditDialog = (card: KanbanCard) => {
    setEditingCard(card);
    setFormData({
      title: card.title,
      client: card.client,
      due_date: card.due_date || '',
      priority: card.priority,
      status: card.status,
      description: card.description,
      links: card.links.length > 0 ? card.links : [{ name: '', url: '' }]
    });
    setIsAddDialogOpen(true);
  };

  const addLinkField = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, { name: '', url: '' }]
    }));
  };

  const removeLinkField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header com indicador de contexto */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kanban - Projetos</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="flex items-center gap-1">
                {isAgencyMode ? '🏢' : '👤'}
                {contextLabel}
              </Badge>
              <span className="text-sm text-gray-600">
                {filteredColumns.reduce((acc, col) => acc + col.cards.length, 0)} projetos
              </span>
            </div>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Projeto
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as prioridades</SelectItem>
              <SelectItem value="alta">Alta prioridade</SelectItem>
              <SelectItem value="media">Média prioridade</SelectItem>
              <SelectItem value="baixa">Baixa prioridade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredColumns.map((column) => (
            <div key={column.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <Badge variant="secondary">{column.cards.length}</Badge>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      {column.cards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white border rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow group ${
                                snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                              }`}
                              onClick={() => openEditDialog(card)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                                  {card.title}
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(card.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-2 mb-2">
                                <User className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-600 truncate">{card.client}</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${PRIORITY_COLORS[card.priority]}`}
                                >
                                  <BadgeIcon className="h-3 w-3 mr-1" />
                                  {PRIORITY_LABELS[card.priority]}
                                </Badge>
                                
                                {card.due_date && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(card.due_date).toLocaleDateString('pt-BR')}
                                  </div>
                                )}
                              </div>

                              {card.description && (
                                <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                  {card.description}
                                </p>
                              )}

                              {card.links && card.links.length > 0 && (
                                <div className="mt-2 text-xs text-blue-600">
                                  {card.links.length} link{card.links.length > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCard ? 'Editar Projeto' : 'Novo Projeto'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título do Projeto</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="client">Cliente</Label>
                <Input
                  id="client"
                  value={formData.client}
                  onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="due_date">Data de Entrega</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filmado">Filmado</SelectItem>
                    <SelectItem value="edicao">Em Edição</SelectItem>
                    <SelectItem value="revisao">Em Revisão</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label>Links</Label>
              {formData.links.map((link, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    placeholder="Nome do link"
                    value={link.name}
                    onChange={(e) => {
                      const newLinks = [...formData.links];
                      newLinks[index].name = e.target.value;
                      setFormData(prev => ({ ...prev, links: newLinks }));
                    }}
                  />
                  <Input
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...formData.links];
                      newLinks[index].url = e.target.value;
                      setFormData(prev => ({ ...prev, links: newLinks }));
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeLinkField(index)}
                    disabled={formData.links.length === 1}
                  >
                    Remover
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addLinkField}>
                Adicionar Link
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCard ? 'Atualizar' : 'Criar'} Projeto
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImprovedKanban;
