
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
  Tag,
  Upload,
  Settings,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestore';

// Definições de tipos expandidas
interface KanbanTag {
  id: string;
  name: string;
  color: string;
  createdBy: string;
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
  urgency: 'alta' | 'média' | 'baixa';
  tags: string[];
  createdAt: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  items: KanbanTask[];
  isCustom?: boolean;
}

interface KanbanBoard {
  columns: { [key: string]: KanbanColumn };
  tags: KanbanTag[];
}

const ImprovedKanban = () => {
  const [board, setBoard] = useState<KanbanBoard>({ columns: {}, tags: [] });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskValue, setNewTaskValue] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskResponsible, setNewTaskResponsible] = useState('');
  const [newTaskType, setNewTaskType] = useState('');
  const [newTaskUrgency, setNewTaskUrgency] = useState<'alta' | 'média' | 'baixa'>('média');
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState('todo');
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  // Estados para etiquetas
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  
  // Estados para colunas customizadas
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('bg-gray-50 border-gray-200');
  
  // Estados para logo upload
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  const { user, agencyData } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadKanbanData();
    loadTeamMembers();
    requestNotificationPermission();
  }, [agencyData]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

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
      
      if (existingBoard && existingBoard.columns) {
        console.log('✅ Board existente carregado do Firebase');
        setBoard(existingBoard);
      } else {
        console.log('📝 Criando board inicial para empresa');
        const initialBoard: KanbanBoard = {
          columns: {
            'todo': {
              id: 'todo',
              title: 'A Fazer',
              color: 'bg-red-50 border-red-200',
              items: []
            },
            'inProgress': {
              id: 'inProgress',
              title: 'Em Produção',
              color: 'bg-yellow-50 border-yellow-200',
              items: []
            },
            'review': {
              id: 'review',
              title: 'Em Revisão',
              color: 'bg-blue-50 border-blue-200',
              items: []
            },
            'done': {
              id: 'done',
              title: 'Finalizado',
              color: 'bg-green-50 border-green-200',
              items: []
            }
          },
          tags: []
        };

        setBoard(initialBoard);
        await saveKanbanState(initialBoard);
      }
    } catch (error) {
      console.error('Erro ao carregar Kanban:', error);
    }
  };

  const sendNotificationToAllMembers = async (message: string) => {
    if (!agencyData || !('Notification' in window)) return;

    try {
      if (Notification.permission === 'granted') {
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
    
    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = board.columns[source.droppableId];
      const destColumn = board.columns[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);
      
      const newBoard = {
        ...board,
        columns: {
          ...board.columns,
          [source.droppableId]: {
            ...sourceColumn,
            items: sourceItems
          },
          [destination.droppableId]: {
            ...destColumn,
            items: destItems
          }
        }
      };

      setBoard(newBoard);
      await saveKanbanState(newBoard);
      
      await sendNotificationToAllMembers(`Tarefa "${removed.title}" movida para ${destColumn.title}`);
      
      toast({
        title: "Sucesso",
        description: "Tarefa movida com sucesso"
      });
    } else {
      const column = board.columns[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      
      const newBoard = {
        ...board,
        columns: {
          ...board.columns,
          [source.droppableId]: {
            ...column,
            items: copiedItems
          }
        }
      };

      setBoard(newBoard);
      await saveKanbanState(newBoard);
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
        priority: 'média',
        urgency: newTaskUrgency,
        tags: newTaskTags,
        createdAt: new Date().toISOString()
      };

      const updatedBoard = {
        ...board,
        columns: {
          ...board.columns,
          [selectedColumn]: {
            ...board.columns[selectedColumn],
            items: [...board.columns[selectedColumn].items, newTask]
          }
        }
      };

      setBoard(updatedBoard);
      await saveKanbanState(updatedBoard);
      await sendNotificationToAllMembers(`Nova tarefa adicionada: "${newTaskTitle}"`);

      // Limpar formulário
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskValue('');
      setNewTaskDeadline('');
      setNewTaskResponsible('');
      setNewTaskType('');
      setNewTaskUrgency('média');
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
      const updatedBoard = { ...board };

      Object.keys(updatedBoard.columns).forEach(columnId => {
        const taskIndex = updatedBoard.columns[columnId].items.findIndex(item => item.id === selectedTask.id);
        if (taskIndex !== -1) {
          updatedBoard.columns[columnId].items[taskIndex] = selectedTask;
        }
      });

      setBoard(updatedBoard);
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
      const updatedBoard = { ...board };

      Object.keys(updatedBoard.columns).forEach(columnId => {
        updatedBoard.columns[columnId].items = updatedBoard.columns[columnId].items.filter(item => item.id !== taskId);
      });

      setBoard(updatedBoard);
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

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    const newTag: KanbanTag = {
      id: `tag_${Date.now()}`,
      name: newTagName,
      color: newTagColor,
      createdBy: user?.id || ''
    };

    const updatedBoard = {
      ...board,
      tags: [...board.tags, newTag]
    };

    setBoard(updatedBoard);
    await saveKanbanState(updatedBoard);
    
    setNewTagName('');
    setNewTagColor('#3B82F6');
    setShowTagModal(false);

    toast({
      title: "Sucesso",
      description: "Etiqueta criada com sucesso"
    });
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim() || !isOwner()) return;

    const columnId = `custom_${Date.now()}`;
    const newColumn: KanbanColumn = {
      id: columnId,
      title: newColumnTitle,
      color: newColumnColor,
      items: [],
      isCustom: true
    };

    const updatedBoard = {
      ...board,
      columns: {
        ...board.columns,
        [columnId]: newColumn
      }
    };

    setBoard(updatedBoard);
    await saveKanbanState(updatedBoard);
    
    setNewColumnTitle('');
    setNewColumnColor('bg-gray-50 border-gray-200');
    setShowColumnModal(false);

    toast({
      title: "Sucesso",
      description: "Coluna criada com sucesso"
    });
  };

  const handleLogoUpload = async () => {
    if (!logoFile || !agencyData || !isOwner()) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const logoBase64 = e.target?.result as string;
        
        // Atualizar no Firebase
        await firestoreService.updateCompany(agencyData.id, { logoBase64 });
        
        toast({
          title: "Sucesso",
          description: "Logo atualizado com sucesso"
        });
        
        setShowLogoModal(false);
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

  const isOwner = () => {
    return agencyData && user && agencyData.ownerId === user.id;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'alta': return 'border-l-red-500';
      case 'média': return 'border-l-yellow-500';
      case 'baixa': return 'border-l-green-500';
      default: return 'border-l-gray-300';
    }
  };

  const getUrgencyBg = (urgency: string) => {
    switch (urgency) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'média': return 'bg-yellow-100 text-yellow-800';
      case 'baixa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Ordem fixa das colunas padrão + colunas customizadas
  const getColumnOrder = () => {
    const defaultOrder = ['todo', 'inProgress', 'review', 'done'];
    const customColumns = Object.keys(board.columns).filter(key => !defaultOrder.includes(key));
    return [...defaultOrder, ...customColumns];
  };

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Briefcase className="text-purple-600" />
            Kanban de Projetos
          </h2>
          <p className="text-gray-600">
            {agencyData.name} - Gerencie o fluxo dos seus projetos
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isOwner() && (
            <>
              <Button onClick={() => setShowLogoModal(true)} variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Logo
              </Button>
              <Button onClick={() => setShowColumnModal(true)} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Coluna
              </Button>
            </>
          )}
          <Button onClick={() => setShowTagModal(true)} variant="outline" size="sm">
            <Tag className="h-4 w-4 mr-2" />
            Etiqueta
          </Button>
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

                <div className="grid grid-cols-2 gap-2">
                  <Select value={newTaskUrgency} onValueChange={(value: any) => setNewTaskUrgency(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Urgência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="média">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {getColumnOrder().map((columnId) => (
                        <SelectItem key={columnId} value={columnId}>
                          {board.columns[columnId]?.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Etiquetas */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Etiquetas</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {board.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        style={{ backgroundColor: tag.color }}
                        className={`cursor-pointer text-white ${
                          newTaskTags.includes(tag.id) ? 'ring-2 ring-offset-1' : ''
                        }`}
                        onClick={() => {
                          if (newTaskTags.includes(tag.id)) {
                            setNewTaskTags(newTaskTags.filter(t => t !== tag.id));
                          } else {
                            setNewTaskTags([...newTaskTags, tag.id]);
                          }
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button onClick={handleAddTask} className="w-full">
                  Adicionar Tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
          {getColumnOrder().map((columnId) => {
            const column = board.columns[columnId];
            if (!column) return null;
            
            return (
              <Card key={columnId} className={`${column.color} h-fit`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-center font-semibold text-sm md:text-base">
                    {column.title}
                    <Badge variant="secondary" className="ml-2">
                      {column.items?.length || 0}
                    </Badge>
                    {column.isCustom && isOwner() && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-2 h-6 w-6 p-0"
                        onClick={() => {
                          const updatedBoard = { ...board };
                          delete updatedBoard.columns[columnId];
                          setBoard(updatedBoard);
                          saveKanbanState(updatedBoard);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-3 min-h-[200px] md:min-h-[300px] p-2 rounded-lg transition-colors ${
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
                                className={`bg-white shadow-sm hover:shadow-md transition-all cursor-move border-l-4 ${getUrgencyColor(item.urgency)} ${
                                  snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                                }`}
                                onClick={() => setSelectedTask(item)}
                              >
                                <CardContent className="p-3 md:p-4 space-y-2">
                                  <h4 className="font-medium text-sm leading-tight">{item.title}</h4>
                                  
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <User className="h-3 w-3" />
                                    <span className="truncate">{item.responsible}</span>
                                  </div>

                                  {/* Etiquetas */}
                                  {item.tags && item.tags.length > 0 && (
                                    <div className="space-y-1">
                                      <div className="text-xs text-gray-500">Etiquetas</div>
                                      <div className="flex flex-wrap gap-1">
                                        {item.tags.map((tagId) => {
                                          const tag = board.tags.find(t => t.id === tagId);
                                          return tag ? (
                                            <Badge
                                              key={tag.id}
                                              style={{ backgroundColor: tag.color }}
                                              className="text-white text-xs px-2 py-0"
                                            >
                                              {tag.name}
                                            </Badge>
                                          ) : null;
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between">
                                    <Badge className={getUrgencyBg(item.urgency)} variant="secondary">
                                      {item.urgency}
                                    </Badge>
                                    <div className="flex gap-1 text-xs text-gray-500">
                                      {item.comments > 0 && (
                                        <span className="flex items-center gap-1">
                                          <MessageCircle className="h-3 w-3" />
                                          {item.comments}
                                        </span>
                                      )}
                                      {item.attachments > 0 && (
                                        <span className="flex items-center gap-1">
                                          <Paperclip className="h-3 w-3" />
                                          {item.attachments}
                                        </span>
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
                    <p className="text-sm text-gray-600">{selectedTask.value}</p>
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
                    <p className="text-sm text-gray-600">{selectedTask.deadline}</p>
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
                <label className="text-sm font-medium">Urgência</label>
                {isEditingTask ? (
                  <Select
                    value={selectedTask.urgency}
                    onValueChange={(value: any) => setSelectedTask({...selectedTask, urgency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="média">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={getUrgencyBg(selectedTask.urgency)} variant="secondary">
                    {selectedTask.urgency}
                  </Badge>
                )}
              </div>

              {/* Etiquetas na edição */}
              {isEditingTask && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Etiquetas</label>
                  <div className="flex flex-wrap gap-1">
                    {board.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        style={{ backgroundColor: tag.color }}
                        className={`cursor-pointer text-white ${
                          selectedTask.tags?.includes(tag.id) ? 'ring-2 ring-offset-1' : ''
                        }`}
                        onClick={() => {
                          const currentTags = selectedTask.tags || [];
                          if (currentTags.includes(tag.id)) {
                            setSelectedTask({
                              ...selectedTask,
                              tags: currentTags.filter(t => t !== tag.id)
                            });
                          } else {
                            setSelectedTask({
                              ...selectedTask,
                              tags: [...currentTags, tag.id]
                            });
                          }
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

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

      {/* Modal para criar etiqueta */}
      <Dialog open={showTagModal} onOpenChange={setShowTagModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Etiqueta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome da etiqueta"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
            />
            <div>
              <label className="text-sm font-medium mb-2 block">Cor</label>
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-full h-10 rounded border"
              />
            </div>
            <Button onClick={handleAddTag} className="w-full" disabled={!newTagName.trim()}>
              Criar Etiqueta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para criar coluna (apenas owner) */}
      {isOwner() && (
        <Dialog open={showColumnModal} onOpenChange={setShowColumnModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Nova Coluna</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Nome da coluna"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
              />
              <div>
                <label className="text-sm font-medium mb-2 block">Estilo</label>
                <Select value={newColumnColor} onValueChange={setNewColumnColor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bg-purple-50 border-purple-200">Roxo</SelectItem>
                    <SelectItem value="bg-pink-50 border-pink-200">Rosa</SelectItem>
                    <SelectItem value="bg-indigo-50 border-indigo-200">Índigo</SelectItem>
                    <SelectItem value="bg-orange-50 border-orange-200">Laranja</SelectItem>
                    <SelectItem value="bg-gray-50 border-gray-200">Cinza</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddColumn} className="w-full" disabled={!newColumnTitle.trim()}>
                Criar Coluna
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal para upload de logo (apenas owner) */}
      {isOwner() && (
        <Dialog open={showLogoModal} onOpenChange={setShowLogoModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Upload do Logo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="w-full"
              />
              <Button 
                onClick={handleLogoUpload} 
                className="w-full" 
                disabled={!logoFile}
              >
                Fazer Upload
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ImprovedKanban;
