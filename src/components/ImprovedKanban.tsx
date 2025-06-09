
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
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestore';

// Definições de tipos
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

interface KanbanBoards {
  [boardId: string]: KanbanBoard;
}

const ImprovedKanban = () => {
  const [boards, setBoards] = useState<KanbanBoards>({});
  const [activeBoard, setActiveBoard] = useState('main');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskValue, setNewTaskValue] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskResponsible, setNewTaskResponsible] = useState('');
  const [newTaskType, setNewTaskType] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('todo');
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const { user, agencyData } = useAuth();
  const { toast } = useToast();

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
      
      // Tentar carregar board existente do Firebase
      const existingBoard = await firestoreService.getKanbanBoard(agencyData.id);
      
      if (existingBoard) {
        console.log('✅ Board existente carregado do Firebase');
        setBoards({ main: existingBoard });
      } else {
        console.log('📝 Criando board inicial para empresa');
        // Estrutura FIXA do Kanban - sequência definida
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
    } catch (error) {
      console.error('Erro ao carregar Kanban:', error);
    }
  };

  const sendNotificationToTeam = async (message: string) => {
    if (!agencyData || !('Notification' in window)) return;

    try {
      // Solicitar permissão se necessário
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

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
    const board = boards[activeBoard];
    
    if (source.droppableId !== destination.droppableId) {
      // Mover entre colunas
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

      // Salvar no Firebase
      await saveKanbanState(newBoard);
      
      // Enviar notificação
      await sendNotificationToTeam(`Tarefa "${removed.title}" movida para ${destColumn.title}`);
      
      toast({
        title: "Sucesso",
        description: "Tarefa movida com sucesso"
      });
    } else {
      // Reordenar na mesma coluna
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

      // Enviar notificação
      await sendNotificationToTeam(`Nova tarefa adicionada: "${newTaskTitle}"`);

      // Limpar formulário
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskValue('');
      setNewTaskDeadline('');
      setNewTaskResponsible('');
      setNewTaskType('');

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

  // NOVA FUNÇÃO: Salvar edições do card
  const handleSaveTaskEdit = async () => {
    if (!selectedTask) return;

    try {
      const board = boards[activeBoard];
      let updatedBoard = { ...board };

      // Encontrar e atualizar a tarefa em todas as colunas
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

      // Enviar notificação
      await sendNotificationToTeam(`Tarefa "${selectedTask.title}" foi atualizada`);

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

  // NOVA FUNÇÃO: Deletar tarefa
  const handleDeleteTask = async (taskId: string) => {
    try {
      const board = boards[activeBoard];
      let updatedBoard = { ...board };

      // Remover a tarefa de todas as colunas
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Filmagem': return 'bg-blue-100 text-blue-800';
      case 'Edição': return 'bg-purple-100 text-purple-800';
      case 'Motion Graphics': return 'bg-orange-100 text-orange-800';
      case 'Geral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'média': return 'bg-yellow-100 text-yellow-800';
      case 'baixa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Garantir ordem fixa das colunas
  const fixedColumnOrder = ['todo', 'inProgress', 'review', 'done'];
  const currentBoard = boards[activeBoard] || {};

  // Verificar se o usuário faz parte de uma empresa
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
              <div>
                <Input
                  placeholder="Título da tarefa"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </div>
              
              <div>
                <Textarea
                  placeholder="Descrição detalhada"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                />
              </div>

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

              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Coluna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">A Fazer</SelectItem>
                  <SelectItem value="inProgress">Em Produção</SelectItem>
                  <SelectItem value="review">Em Revisão</SelectItem>
                  <SelectItem value="done">Finalizado</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleAddTask} className="w-full">
                Adicionar Tarefa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid lg:grid-cols-4 gap-6">
          {fixedColumnOrder.map((columnId) => {
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
                                <CardContent className="p-4 space-y-3">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-medium text-sm leading-tight">{item.title}</h4>
                                    <div className="flex gap-1">
                                      <Badge className={getTypeColor(item.type)} variant="secondary">
                                        {item.type}
                                      </Badge>
                                    </div>
                                  </div>

                                  <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                                  
                                  <div className="space-y-2 text-xs text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-3 w-3" />
                                      <span className="font-semibold text-green-600">{item.value}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-3 w-3" />
                                      <span>{item.deadline}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <User className="h-3 w-3" />
                                      <span>{item.responsible}</span>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                      <div className="flex gap-2">
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
                                      <Badge className={getPriorityColor(item.priority)} variant="secondary">
                                        {item.priority}
                                      </Badge>
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
