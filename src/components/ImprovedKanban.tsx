
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Briefcase, 
  Clock, 
  DollarSign, 
  User, 
  Plus, 
  Edit, 
  Trash2,
  MessageCircle,
  Paperclip,
  Calendar,
  Save,
  X,
  Palette,
  Upload,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestore';

// Definições de tipos atualizadas
interface KanbanTag {
  id: string;
  name: string;
  color: string;
}

interface KanbanTask {
  id: string;
  title: string;
  description: string;
  value: string;
  deadline: string;
  responsible: string;
  type: string;
  comments: number;
  attachments: number;
  priority: 'alta' | 'média' | 'baixa';
  tags: string[];
  createdAt: string;
}

interface KanbanColumn {
  title: string;
  color: string;
  items: KanbanTask[];
}

interface KanbanBoard {
  [key: string]: KanbanColumn;
}

interface KanbanSettings {
  tags: KanbanTag[];
  customColumns: string[];
}

const ImprovedKanban = () => {
  const [boards, setBoards] = useState<{ [boardId: string]: KanbanBoard }>({});
  const [kanbanSettings, setKanbanSettings] = useState<KanbanSettings>({ tags: [], customColumns: [] });
  const [activeBoard, setActiveBoard] = useState('main');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskValue, setNewTaskValue] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskResponsible, setNewTaskResponsible] = useState('');
  const [newTaskType, setNewTaskType] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'alta' | 'média' | 'baixa'>('média');
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState('todo');
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  
  // Estados para tags
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  
  // Estados para colunas customizadas
  const [showCreateColumn, setShowCreateColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  
  // Estados para logo
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const { user, agencyData } = useAuth();
  const { toast } = useToast();

  // Cores predefinidas para prioridades
  const priorityColors = {
    'alta': '#EF4444',
    'média': '#F59E0B', 
    'baixa': '#10B981'
  };

  // Cores para tags
  const tagColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  useEffect(() => {
    loadKanbanData();
    loadTeamMembers();
  }, [agencyData]);

  const loadTeamMembers = async () => {
    if (!agencyData) return;
    
    try {
      console.log('👥 Carregando membros da equipe...');
      const members = agencyData.colaboradores || [];
      setTeamMembers(members);
      console.log('✅ Membros carregados:', members.length);
    } catch (error) {
      console.error('❌ Erro ao carregar membros da equipe:', error);
    }
  };

  const loadKanbanData = async () => {
    if (!agencyData) {
      console.log('❌ Usuário não faz parte de uma empresa');
      return;
    }

    try {
      console.log('Carregando dados do Kanban para empresa:', agencyData.id);
      
      const existingBoard = await firestoreService.getKanbanBoard(agencyData.id);
      const existingSettings = await firestoreService.getKanbanSettings(agencyData.id);
      
      if (existingBoard) {
        console.log('✅ Board existente carregado do Firebase');
        setBoards({ main: existingBoard });
      } else {
        console.log('📝 Criando board inicial para empresa');
        const initialBoard: KanbanBoard = {
          'todo': {
            title: 'A Fazer',
            color: 'bg-red-50 border-red-200',
            items: []
          },
          'inProgress': {
            title: 'Em Produção',
            color: 'bg-yellow-50 border-yellow-200',
            items: []
          },
          'review': {
            title: 'Em Revisão',
            color: 'bg-blue-50 border-blue-200',
            items: []
          },
          'done': {
            title: 'Finalizado',
            color: 'bg-green-50 border-green-200',
            items: []
          }
        };

        setBoards({ main: initialBoard });
        await saveKanbanState(initialBoard);
      }

      if (existingSettings) {
        setKanbanSettings(existingSettings);
      } else {
        const initialSettings: KanbanSettings = { tags: [], customColumns: [] };
        setKanbanSettings(initialSettings);
        await saveKanbanSettings(initialSettings);
      }
    } catch (error) {
      console.error('Erro ao carregar Kanban:', error);
    }
  };

  const saveKanbanState = async (boardData: KanbanBoard) => {
    if (!agencyData) return;

    try {
      console.log('Salvando estado do Kanban no Firebase...');
      await firestoreService.saveKanbanBoard(agencyData.id, boardData);
    } catch (error) {
      console.error('Erro ao salvar Kanban:', error);
    }
  };

  const saveKanbanSettings = async (settings: KanbanSettings) => {
    if (!agencyData) return;

    try {
      await firestoreService.saveKanbanSettings(agencyData.id, settings);
    } catch (error) {
      console.error('Erro ao salvar configurações do Kanban:', error);
    }
  };

  const sendNotificationToAllMembers = async (message: string) => {
    if (!agencyData || !('Notification' in window)) return;

    try {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      if (Notification.permission === 'granted') {
        // Notificar todos os membros da empresa
        teamMembers.forEach(() => {
          new Notification('FinanceFlow - Kanban', {
            body: message,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png'
          });
        });

        // Notificar o usuário atual também
        new Notification('FinanceFlow - Kanban', {
          body: message,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png'
        });
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const board = boards[activeBoard];
    
    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = board[source.droppableId];
      const destColumn = board[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);
      
      const newBoard = {
        ...board,
        [source.droppableId]: {
          ...sourceColumn,
          items: sourceItems
        },
        [destination.droppableId]: {
          ...destColumn,
          items: destItems
        }
      };

      setBoards({
        ...boards,
        [activeBoard]: newBoard
      });

      await saveKanbanState(newBoard);
      await sendNotificationToAllMembers(`Tarefa "${removed.title}" movida para ${destColumn.title}`);
      
      toast({
        title: "Sucesso",
        description: "Tarefa movida com sucesso"
      });
    } else {
      const column = board[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      
      const newBoard = {
        ...board,
        [source.droppableId]: {
          ...column,
          items: copiedItems
        }
      };

      setBoards({
        ...boards,
        [activeBoard]: newBoard
      });

      await saveKanbanState(newBoard);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle || !newTaskDescription) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const newTask: KanbanTask = {
        id: `task_${Date.now()}`,
        title: newTaskTitle,
        description: newTaskDescription,
        value: newTaskValue || 'Não informado',
        deadline: newTaskDeadline || 'Não definido',
        responsible: newTaskResponsible || user?.name || 'Não atribuído',
        type: newTaskType || 'Geral',
        comments: 0,
        attachments: 0,
        priority: newTaskPriority,
        tags: newTaskTags,
        createdAt: new Date().toISOString()
      };

      const board = boards[activeBoard];
      const updatedBoard = {
        ...board,
        [selectedColumn]: {
          ...board[selectedColumn],
          items: [...board[selectedColumn].items, newTask]
        }
      };

      setBoards({
        ...boards,
        [activeBoard]: updatedBoard
      });

      await saveKanbanState(updatedBoard);
      await sendNotificationToAllMembers(`Nova tarefa adicionada: "${newTaskTitle}"`);

      // Limpar formulário
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskValue('');
      setNewTaskDeadline('');
      setNewTaskResponsible('');
      setNewTaskType('');
      setNewTaskPriority('média');
      setNewTaskTags([]);

      toast({
        title: "Sucesso",
        description: "Tarefa adicionada com sucesso"
      });
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar tarefa",
        variant: "destructive"
      });
    }
  };

  const handleSaveTaskEdit = async () => {
    if (!selectedTask) return;

    try {
      const board = boards[activeBoard];
      let updatedBoard = { ...board };

      Object.keys(updatedBoard).forEach(columnId => {
        const taskIndex = updatedBoard[columnId].items.findIndex(item => item.id === selectedTask.id);
        if (taskIndex !== -1) {
          updatedBoard[columnId].items[taskIndex] = selectedTask;
        }
      });

      setBoards({
        ...boards,
        [activeBoard]: updatedBoard
      });

      await saveKanbanState(updatedBoard);
      setIsEditingTask(false);

      await sendNotificationToAllMembers(`Tarefa "${selectedTask.title}" foi atualizada`);

      toast({
        title: "Sucesso",
        description: "Tarefa atualizada com sucesso"
      });
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar tarefa",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const board = boards[activeBoard];
      let updatedBoard = { ...board };

      Object.keys(updatedBoard).forEach(columnId => {
        updatedBoard[columnId].items = updatedBoard[columnId].items.filter(item => item.id !== taskId);
      });

      setBoards({
        ...boards,
        [activeBoard]: updatedBoard
      });

      await saveKanbanState(updatedBoard);
      setSelectedTask(null);

      toast({
        title: "Sucesso",
        description: "Tarefa removida com sucesso"
      });
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar tarefa",
        variant: "destructive"
      });
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const newTag: KanbanTag = {
        id: `tag_${Date.now()}`,
        name: newTagName.trim(),
        color: newTagColor
      };

      const updatedSettings = {
        ...kanbanSettings,
        tags: [...kanbanSettings.tags, newTag]
      };

      setKanbanSettings(updatedSettings);
      await saveKanbanSettings(updatedSettings);

      setNewTagName('');
      setNewTagColor('#3B82F6');
      setShowCreateTag(false);

      toast({
        title: "Sucesso",
        description: "Etiqueta criada com sucesso"
      });
    } catch (error) {
      console.error('Erro ao criar etiqueta:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar etiqueta",
        variant: "destructive"
      });
    }
  };

  const handleCreateColumn = async () => {
    if (!newColumnName.trim()) return;

    try {
      const columnId = `custom_${Date.now()}`;
      const board = boards[activeBoard];
      
      const updatedBoard = {
        ...board,
        [columnId]: {
          title: newColumnName.trim(),
          color: 'bg-purple-50 border-purple-200',
          items: []
        }
      };

      const updatedSettings = {
        ...kanbanSettings,
        customColumns: [...kanbanSettings.customColumns, columnId]
      };

      setBoards({
        ...boards,
        [activeBoard]: updatedBoard
      });

      setKanbanSettings(updatedSettings);
      
      await saveKanbanState(updatedBoard);
      await saveKanbanSettings(updatedSettings);

      setNewColumnName('');
      setShowCreateColumn(false);

      toast({
        title: "Sucesso",
        description: "Coluna criada com sucesso"
      });
    } catch (error) {
      console.error('Erro ao criar coluna:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar coluna",
        variant: "destructive"
      });
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile || !agencyData) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const logoBase64 = e.target?.result as string;
        
        await firestoreService.updateField('empresas', agencyData.id, 'logoBase64', logoBase64);
        
        toast({
          title: "Sucesso",
          description: "Logo atualizado com sucesso"
        });
        
        setShowLogoUpload(false);
        setLogoFile(null);
      };
      reader.readAsDataURL(logoFile);
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do logo",
        variant: "destructive"
      });
    }
  };

  const getTagById = (tagId: string) => {
    return kanbanSettings.tags.find(tag => tag.id === tagId);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Filmagem': return 'bg-blue-100 text-blue-800';
      case 'Edição': return 'bg-purple-100 text-purple-800';
      case 'Motion Graphics': return 'bg-orange-100 text-orange-800';
      case 'Geral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Ordem fixa das colunas + colunas customizadas
  const fixedColumnOrder = ['todo', 'inProgress', 'review', 'done'];
  const allColumns = [...fixedColumnOrder, ...kanbanSettings.customColumns];
  const currentBoard = boards[activeBoard] || {};

  if (!agencyData) {
    return (
      <div className="text-center py-16">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
          <Briefcase className="h-16 w-16 mx-auto text-yellow-600 mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Acesso Restrito
          </h3>
          <p className="text-yellow-700">
            O Kanban de Projetos é exclusivo para membros de empresas. 
            Entre em contato com um administrador para ser adicionado a uma empresa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="text-purple-600" />
            Kanban de Projetos
          </h2>
          <p className="text-gray-600">
            {agencyData.name} - Gerencie o fluxo dos seus projetos
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={showLogoUpload} onOpenChange={setShowLogoUpload}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Logo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload do Logo da Empresa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
                <Button onClick={handleLogoUpload} disabled={!logoFile}>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Logo
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateColumn} onOpenChange={setShowCreateColumn}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Nova Coluna
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Coluna</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nome da coluna"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                />
                <Button onClick={handleCreateColumn}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Coluna
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Título da tarefa"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                
                <Textarea
                  placeholder="Descrição detalhada"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Valor (R$)"
                    value={newTaskValue}
                    onChange={(e) => setNewTaskValue(e.target.value)}
                  />
                  <Input
                    type="date"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select value={newTaskResponsible} onValueChange={setNewTaskResponsible}>
                    <SelectTrigger>
                      <SelectValue placeholder="Responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member, index) => (
                        <SelectItem key={index} value={member.email}>
                          {member.email}
                        </SelectItem>
                      ))}
                      <SelectItem value={user?.name || 'Eu'}>
                        {user?.name || 'Eu'}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={newTaskType} onValueChange={setNewTaskType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Filmagem">Filmagem</SelectItem>
                      <SelectItem value="Edição">Edição</SelectItem>
                      <SelectItem value="Motion Graphics">Motion Graphics</SelectItem>
                      <SelectItem value="Geral">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Select value={newTaskPriority} onValueChange={(value: 'alta' | 'média' | 'baixa') => setNewTaskPriority(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="média">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sistema de etiquetas */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Etiquetas</label>
                  <div className="flex flex-wrap gap-2">
                    {newTaskTags.map(tagId => {
                      const tag = getTagById(tagId);
                      if (!tag) return null;
                      return (
                        <Badge 
                          key={tagId} 
                          style={{ backgroundColor: tag.color, color: 'white' }}
                          className="cursor-pointer"
                          onClick={() => setNewTaskTags(prev => prev.filter(id => id !== tagId))}
                        >
                          {tag.name} ×
                        </Badge>
                      );
                    })}
                    
                    <Dialog open={showCreateTag} onOpenChange={setShowCreateTag}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Criar Nova Etiqueta</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Nome da etiqueta"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                          />
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Cor</label>
                            <div className="flex gap-2 flex-wrap">
                              {tagColors.map(color => (
                                <button
                                  key={color}
                                  className={`w-8 h-8 rounded-full border-2 ${newTagColor === color ? 'border-gray-400' : 'border-gray-200'}`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => setNewTagColor(color)}
                                />
                              ))}
                            </div>
                          </div>
                          <Button onClick={handleCreateTag}>
                            <Palette className="h-4 w-4 mr-2" />
                            Criar Etiqueta
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {kanbanSettings.tags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Etiquetas disponíveis:</p>
                      <div className="flex flex-wrap gap-1">
                        {kanbanSettings.tags.map(tag => (
                          <Badge 
                            key={tag.id}
                            style={{ backgroundColor: tag.color, color: 'white' }}
                            className="cursor-pointer text-xs"
                            onClick={() => {
                              if (!newTaskTags.includes(tag.id)) {
                                setNewTaskTags(prev => [...prev, tag.id]);
                              }
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    {allColumns.map(columnId => {
                      const column = currentBoard[columnId];
                      return (
                        <SelectItem key={columnId} value={columnId}>
                          {column?.title || columnId}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Button onClick={handleAddTask} className="w-full">
                  Adicionar Tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid lg:grid-cols-4 gap-6">
          {allColumns.map((columnId) => {
            const column = currentBoard[columnId];
            if (!column) return null;
            
            return (
              <Card key={columnId} className={`${column.color} h-fit`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-center font-semibold">
                    {column.title}
                    <Badge variant="secondary" className="ml-2">
                      {column.items?.length || 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-3 min-h-[300px] p-2 rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? 'bg-white/50' : ''
                        }`}
                      >
                        {(column.items || []).map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white shadow-sm hover:shadow-md transition-all cursor-move ${
                                  snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                                }`}
                                onClick={() => setSelectedTask(item)}
                              >
                                <CardContent className="p-0">
                                  <div className="flex">
                                    {/* Barra lateral com cor da prioridade */}
                                    <div 
                                      className="w-1 flex-shrink-0 rounded-l-lg"
                                      style={{ backgroundColor: priorityColors[item.priority] }}
                                    />
                                    
                                    <div className="flex-1 p-4 space-y-3">
                                      {/* Título */}
                                      <h4 className="font-medium text-sm leading-tight">{item.title}</h4>
                                      
                                      {/* Responsável */}
                                      <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <User className="h-3 w-3" />
                                        <span>{item.responsible}</span>
                                      </div>

                                      {/* Etiquetas */}
                                      {item.tags && item.tags.length > 0 && (
                                        <div className="space-y-1">
                                          <p className="text-xs font-medium text-gray-500">Etiquetas:</p>
                                          <div className="flex flex-wrap gap-1">
                                            {item.tags.map(tagId => {
                                              const tag = getTagById(tagId);
                                              if (!tag) return null;
                                              return (
                                                <Badge 
                                                  key={tagId}
                                                  style={{ backgroundColor: tag.color, color: 'white' }}
                                                  className="text-xs px-1 py-0"
                                                >
                                                  {tag.name}
                                                </Badge>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modal de visualização/edição de tarefa */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Detalhes da Tarefa
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingTask(!isEditingTask)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteTask(selectedTask?.id || '')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                {isEditingTask ? (
                  <Input
                    value={selectedTask.title}
                    onChange={(e) => setSelectedTask({...selectedTask, title: e.target.value})}
                  />
                ) : (
                  <p className="text-sm text-gray-600">{selectedTask.title}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Descrição</label>
                {isEditingTask ? (
                  <Textarea
                    value={selectedTask.description}
                    onChange={(e) => setSelectedTask({...selectedTask, description: e.target.value})}
                  />
                ) : (
                  <p className="text-sm text-gray-600">{selectedTask.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Valor</label>
                  {isEditingTask ? (
                    <Input
                      value={selectedTask.value}
                      onChange={(e) => setSelectedTask({...selectedTask, value: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-3 w-3" />
                      <span>{selectedTask.value}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Prazo</label>
                  {isEditingTask ? (
                    <Input
                      type="date"
                      value={selectedTask.deadline}
                      onChange={(e) => setSelectedTask({...selectedTask, deadline: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{selectedTask.deadline}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Responsável</label>
                {isEditingTask ? (
                  <Select
                    value={selectedTask.responsible}
                    onValueChange={(value) => setSelectedTask({...selectedTask, responsible: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member, index) => (
                        <SelectItem key={index} value={member.email}>
                          {member.email}
                        </SelectItem>
                      ))}
                      <SelectItem value={user?.name || 'Eu'}>
                        {user?.name || 'Eu'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-gray-600">{selectedTask.responsible}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Prioridade</label>
                {isEditingTask ? (
                  <Select
                    value={selectedTask.priority}
                    onValueChange={(value: 'alta' | 'média' | 'baixa') => setSelectedTask({...selectedTask, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="média">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge style={{ backgroundColor: priorityColors[selectedTask.priority], color: 'white' }}>
                    {selectedTask.priority}
                  </Badge>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Badge className={getTypeColor(selectedTask.type)} variant="secondary">
                  {selectedTask.type}
                </Badge>
              </div>

              {/* Etiquetas no modal */}
              {selectedTask.tags && selectedTask.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Etiquetas</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTask.tags.map(tagId => {
                      const tag = getTagById(tagId);
                      if (!tag) return null;
                      return (
                        <Badge 
                          key={tagId}
                          style={{ backgroundColor: tag.color, color: 'white' }}
                          className="text-xs"
                        >
                          {tag.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Informações adicionais */}
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    {selectedTask.comments > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {selectedTask.comments}
                      </span>
                    )}
                    {selectedTask.attachments > 0 && (
                      <span className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        {selectedTask.attachments}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isEditingTask && (
                <Button onClick={handleSaveTaskEdit} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImprovedKanban;
