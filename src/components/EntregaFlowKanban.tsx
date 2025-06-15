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
  Video, 
  Calendar,
  User, 
  Plus, 
  Trash2,
  ExternalLink,
  Clock,
  AlertTriangle,
  CheckCircle,
  Scissors,
  Eye,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { kanbanService, KanbanProject } from '../services/kanbanService';

interface Column {
  id: string;
  title: string;
  color: string;
  icon: React.ComponentType<any>;
  count: number;
}

const EntregaFlowKanban = () => {
  const [projects, setProjects] = useState<KanbanProject[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<KanbanProject | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<KanbanProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState<Partial<KanbanProject>>({
    title: '',
    client: '',
    dueDate: '',
    priority: 'media',
    status: 'filmado',
    description: '',
    links: []
  });
  const [newLink, setNewLink] = useState('');
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const columns: Column[] = [
    {
      id: 'filmado',
      title: 'Filmado',
      color: 'bg-blue-50 border-blue-200',
      icon: Video,
      count: projects.filter(p => p.status === 'filmado').length
    },
    {
      id: 'edicao',
      title: 'Em Edição',
      color: 'bg-orange-50 border-orange-200',
      icon: Scissors,
      count: projects.filter(p => p.status === 'edicao').length
    },
    {
      id: 'revisao',
      title: 'Revisão',
      color: 'bg-yellow-50 border-yellow-200',
      icon: Eye,
      count: projects.filter(p => p.status === 'revisao').length
    },
    {
      id: 'entregue',
      title: 'Entregue',
      color: 'bg-green-50 border-green-200',
      icon: CheckCircle,
      count: projects.filter(p => p.status === 'entregue').length
    }
  ];

  // Estatísticas do dashboard
  const activeProjects = projects.filter(p => p.status !== 'entregue').length;
  const completedProjects = projects.filter(p => p.status === 'entregue').length;
  const urgentDeadlines = projects.filter(p => {
    if (!p.dueDate) return false;
    const deadline = new Date(p.dueDate);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2 && diffDays >= 0;
  }).length;

  const overdueProject = projects.find(p => {
    if (!p.dueDate || p.status === 'entregue') return false;
    const deadline = new Date(p.dueDate);
    const today = new Date();
    return deadline < today;
  });

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const loadedProjects = await kanbanService.loadBoard(user.id);
      setProjects(loadedProjects);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar projetos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProjects = async (projectsData: KanbanProject[]) => {
    if (!user?.id) return;
    
    try {
      await kanbanService.saveBoard(user.id, projectsData);
      localStorage.setItem('entregaFlowProjects', JSON.stringify(projectsData));
    } catch (error) {
      console.error('Erro ao salvar projetos:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar projetos",
        variant: "destructive"
      });
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId !== destination.droppableId) {
      const updatedProjects = projects.map(project => 
        project.id === result.draggableId 
          ? { ...project, status: destination.droppableId as KanbanProject['status'], updatedAt: new Date().toISOString() }
          : project
      );
      
      setProjects(updatedProjects);
      await saveProjects(updatedProjects);

      const movedProject = projects.find(p => p.id === result.draggableId);
      const destColumn = columns.find(c => c.id === destination.droppableId);
      
      toast({
        title: "Projeto Movido",
        description: `"${movedProject?.title}" movido para ${destColumn?.title}`
      });
    }
  };

  const handleAddProject = async () => {
    if (!newProject.title || !newProject.client) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos o título e cliente",
        variant: "destructive"
      });
      return;
    }

    const project: KanbanProject = {
      id: `project_${Date.now()}`,
      title: newProject.title!,
      client: newProject.client!,
      dueDate: newProject.dueDate || '',
      priority: newProject.priority || 'media',
      status: newProject.status || 'filmado',
      description: newProject.description || '',
      links: newProject.links || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedProjects = [...projects, project];
    setProjects(updatedProjects);
    await saveProjects(updatedProjects);

    setNewProject({
      title: '',
      client: '',
      dueDate: '',
      priority: 'media',
      status: 'filmado',
      description: '',
      links: []
    });
    setShowAddModal(false);

    toast({
      title: "Projeto Criado",
      description: `"${project.title}" foi adicionado com sucesso`
    });
  };

  const handleDeleteProject = async (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    const updatedProjects = projects.filter(p => p.id !== projectId);
    
    setProjects(updatedProjects);
    await saveProjects(updatedProjects);
    setSelectedProject(null);

    toast({
      title: "Projeto Excluído",
      description: `"${projectToDelete?.title}" foi excluído com sucesso`
    });
  };

  const handleAddLink = async () => {
    if (!selectedProject || !newLink) return;

    const updatedProject = {
      ...selectedProject,
      links: [...selectedProject.links, newLink],
      updatedAt: new Date().toISOString()
    };

    const updatedProjects = projects.map(p => 
      p.id === selectedProject.id ? updatedProject : p
    );

    setProjects(updatedProjects);
    await saveProjects(updatedProjects);
    setSelectedProject(updatedProject);
    setNewLink('');

    toast({
      title: "Link Adicionado",
      description: "Link de entrega adicionado com sucesso"
    });
  };

  const handleEditProject = async () => {
    if (!editingProject) return;

    const updatedProjects = projects.map(p => 
      p.id === editingProject.id 
        ? { ...editingProject, updatedAt: new Date().toISOString() }
        : p
    );

    setProjects(updatedProjects);
    await saveProjects(updatedProjects);
    setShowEditModal(false);
    setEditingProject(null);

    toast({
      title: "Projeto Atualizado",
      description: `"${editingProject.title}" foi atualizado com sucesso`
    });
  };

  const openEditModal = (project: KanbanProject) => {
    setEditingProject({ ...project });
    setShowEditModal(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baixa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getDaysOverdue = (dueDate: string) => {
    if (!dueDate) return 0;
    const deadline = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - deadline.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-20 md:pb-6 overflow-x-hidden px-2 sm:px-4">
        <div className="text-center">
          <p>Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6 overflow-x-hidden px-2 sm:px-4">
      {/* Header - Responsivo */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="w-full lg:w-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Video className="text-white h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Projetos</h1>
              <p className="text-xs sm:text-sm text-gray-600">Gerenciador de Entregas</p>
            </div>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">Bem-vindo ao EntregaFlow! 🎬</h2>
          <p className="text-sm sm:text-base text-gray-600">Gerencie seus projetos audiovisuais de forma simples e eficiente</p>
        </div>

        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 hover:bg-purple-700 w-full lg:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {/* Stats Cards - Grid responsivo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">{activeProjects}</p>
                <p className="text-sm text-blue-700">Projetos Ativos</p>
                <p className="text-xs text-blue-600">Em andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">{completedProjects}</p>
                <p className="text-sm text-green-700">Entregas este mês</p>
                <p className="text-xs text-green-600">Projetos finalizados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-900">{urgentDeadlines}</p>
                <p className="text-sm text-yellow-700">Prazos Urgentes</p>
                <p className="text-xs text-yellow-600">Vencendo em 2 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-900">{overdueProject ? 'Atrasado' : 'Ro'}</p>
                <p className="text-sm text-red-700">Próxima Entrega</p>
                <p className="text-xs text-red-600">
                  {overdueProject ? overdueProject.client : 'Ro'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Section */}
      <div>
        <h3 className="text-lg sm:text-xl font-semibold mb-2">Pipeline de Projetos</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4">Arraste e solte os cards para atualizar o status dos projetos</p>

        <DragDropContext onDragEnd={handleDragEnd}>
          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-6">
            {columns.map((column) => {
              const columnProjects = projects.filter(p => p.status === column.id);
              const IconComponent = column.icon;
              
              return (
                <div key={column.id}>
                  {/* Column Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${
                      column.id === 'filmado' ? 'bg-blue-500' : 
                      column.id === 'edicao' ? 'bg-orange-500' : 
                      column.id === 'revisao' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <h4 className="font-semibold">{column.title}</h4>
                    <Badge variant="secondary">{column.count}</Badge>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-4 min-h-[400px] ${
                          snapshot.isDraggingOver ? 'bg-gray-50 rounded-lg p-2' : ''
                        }`}
                      >
                        {columnProjects.map((project, index) => (
                          <Draggable key={project.id} draggableId={project.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Card 
                                  className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${
                                    column.id === 'filmado' ? 'border-l-blue-500' : 
                                    column.id === 'edicao' ? 'border-l-orange-500' : 
                                    column.id === 'revisao' ? 'border-l-yellow-500' : 'border-l-green-500'
                                  } ${snapshot.isDragging ? 'rotate-2 shadow-xl' : ''}`}
                                  onClick={() => setSelectedProject(project)}
                                >
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      {/* Header com botão de edição */}
                                      <div className="flex justify-between items-start">
                                        <Badge className={`text-xs ${getPriorityColor(project.priority)}`}>
                                          {project.priority === 'alta' ? 'Alta' : project.priority === 'media' ? 'Média' : 'Baixa'}
                                        </Badge>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditModal(project);
                                          }}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      </div>

                                      {/* Project Title */}
                                      <h4 className="font-semibold text-sm line-clamp-2">
                                        {project.title}
                                      </h4>

                                      {/* Client */}
                                      <div className="flex items-center gap-2">
                                        <User className="h-3 w-3 text-gray-500" />
                                        <span className="text-xs text-gray-600">{project.client}</span>
                                      </div>

                                      {/* Due Date */}
                                      {project.dueDate && (
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-3 w-3 text-gray-500" />
                                          <span className={`text-xs ${
                                            isOverdue(project.dueDate) ? 'text-red-600 font-medium' : 'text-gray-600'
                                          }`}>
                                            {new Date(project.dueDate).toLocaleDateString('pt-BR')}
                                          </span>
                                        </div>
                                      )}

                                      {/* Overdue Badge */}
                                      {isOverdue(project.dueDate) && project.status !== 'entregue' && (
                                        <Badge className="bg-red-500 text-white text-xs">
                                          {getDaysOverdue(project.dueDate)} dias atrasado
                                        </Badge>
                                      )}

                                      {/* Links */}
                                      {project.links.length > 0 && (
                                        <div className="flex items-center gap-2">
                                          <ExternalLink className="h-3 w-3 text-blue-500" />
                                          <span className="text-xs text-blue-600">
                                            {project.links.length} link(s)
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {/* Add Project Button for empty columns */}
                        {columnProjects.length === 0 && (
                          <Card className="border-dashed border-2 border-gray-300">
                            <CardContent className="p-6 text-center">
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setNewProject({ ...newProject, status: column.id as KanbanProject['status'] });
                                  setShowAddModal(true);
                                }}
                                className="text-gray-500"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Projeto
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-6">
            {columns.map((column) => {
              const columnProjects = projects.filter(p => p.status === column.id);
              const IconComponent = column.icon;
              
              return (
                <Card key={column.id} className={`${column.color}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-center font-semibold flex items-center justify-center gap-2 text-sm sm:text-base">
                      <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                      {column.title}
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {column.count}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Droppable droppableId={column.id}>
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-3"
                        >
                          {columnProjects.map((project, index) => (
                            <Draggable key={project.id} draggableId={project.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <Card 
                                    className="cursor-pointer hover:shadow-md transition-all duration-200"
                                    onClick={() => setSelectedProject(project)}
                                  >
                                    <CardContent className="p-3">
                                      <div className="space-y-2">
                                        {/* Header com botão de edição */}
                                        <div className="flex justify-between items-start">
                                          <Badge className={`text-xs ${getPriorityColor(project.priority)}`}>
                                            {project.priority === 'alta' ? 'Alta' : project.priority === 'media' ? 'Média' : 'Baixa'}
                                          </Badge>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openEditModal(project);
                                            }}
                                            className="h-6 w-6 p-0"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                        </div>

                                        <h4 className="font-semibold text-sm line-clamp-2">
                                          {project.title}
                                        </h4>

                                        <div className="flex items-center gap-2">
                                          <User className="h-3 w-3 text-gray-500" />
                                          <span className="text-xs text-gray-600">{project.client}</span>
                                        </div>

                                        {/* Due Date */}
                                        {project.dueDate && (
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3 text-gray-500" />
                                            <span className={`text-xs ${
                                              isOverdue(project.dueDate) ? 'text-red-600 font-medium' : 'text-gray-600'
                                            }`}>
                                              {new Date(project.dueDate).toLocaleDateString('pt-BR')}
                                            </span>
                                          </div>
                                        )}

                                        {/* Overdue Badge */}
                                        {isOverdue(project.dueDate) && project.status !== 'entregue' && (
                                          <Badge className="bg-red-500 text-white text-xs">
                                            {getDaysOverdue(project.dueDate)} dias atrasado
                                          </Badge>
                                        )}

                                        {/* Links */}
                                        {project.links.length > 0 && (
                                          <div className="flex items-center gap-2">
                                            <ExternalLink className="h-3 w-3 text-blue-500" />
                                            <span className="text-xs text-blue-600">
                                              {project.links.length} link(s)
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
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
      </div>

      {/* Edit Project Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Projeto</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Título do Projeto</label>
                  <Input
                    value={editingProject.title}
                    onChange={(e) => setEditingProject({...editingProject, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Cliente</label>
                  <Input
                    value={editingProject.client}
                    onChange={(e) => setEditingProject({...editingProject, client: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Data de Entrega</label>
                  <Input
                    type="date"
                    value={editingProject.dueDate}
                    onChange={(e) => setEditingProject({...editingProject, dueDate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Descrição</label>
                <Textarea
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({...editingProject, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Prioridade</label>
                  <Select 
                    value={editingProject.priority} 
                    onValueChange={(value: 'alta' | 'media' | 'baixa') => setEditingProject({...editingProject, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select 
                    value={editingProject.status} 
                    onValueChange={(value: KanbanProject['status']) => setEditingProject({...editingProject, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="filmado">Filmado</SelectItem>
                      <SelectItem value="edicao">Em Edição</SelectItem>
                      <SelectItem value="revisao">Revisão</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleEditProject} 
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Salvar Alterações
            </Button>
            <Button 
              onClick={() => setShowEditModal(false)} 
              variant="outline"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Project Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-2 block">Título do Projeto</label>
                <Input
                  placeholder="Ex: Edição MDPROD - WavePost"
                  value={newProject.title || ''}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Cliente</label>
                <Input
                  placeholder="Nome do cliente"
                  value={newProject.client || ''}
                  onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Data de Entrega</label>
                <Input
                  type="date"
                  value={newProject.dueDate || ''}
                  onChange={(e) => setNewProject({...newProject, dueDate: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Prioridade</label>
                <Select 
                  value={newProject.priority || 'media'} 
                  onValueChange={(value: 'alta' | 'media' | 'baixa') => setNewProject({...newProject, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status Inicial</label>
                <Select 
                  value={newProject.status || 'filmado'} 
                  onValueChange={(value: KanbanProject['status']) => setNewProject({...newProject, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filmado">Filmado</SelectItem>
                    <SelectItem value="edicao">Em Edição</SelectItem>
                    <SelectItem value="revisao">Revisão</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Descrição</label>
              <Textarea
                placeholder="Detalhes sobre o projeto..."
                value={newProject.description || ''}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleAddProject} 
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Criar Projeto
            </Button>
            <Button 
              onClick={() => setShowAddModal(false)} 
              variant="outline"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Details Modal */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {selectedProject?.title}
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => selectedProject && handleDeleteProject(selectedProject.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedProject && (
            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Cliente</label>
                  <p className="text-sm text-gray-900">{selectedProject.client}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Prioridade</label>
                  <Badge className={`${getPriorityColor(selectedProject.priority)} ml-2`}>
                    {selectedProject.priority === 'alta' ? 'Alta' : selectedProject.priority === 'media' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Prazo</label>
                  <p className={`text-sm ${
                    selectedProject.dueDate && isOverdue(selectedProject.dueDate) ? 'text-red-600 font-medium' : 'text-gray-900'
                  }`}>
                    {selectedProject.dueDate ? new Date(selectedProject.dueDate).toLocaleDateString('pt-BR') : 'Não definido'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedProject.status}</p>
                </div>
              </div>

              {/* Descrição */}
              {selectedProject.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Descrição</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedProject.description}</p>
                </div>
              )}

              {/* Links */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Links de Entrega</label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Link
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Link de Entrega</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="URL do arquivo de entrega"
                          value={newLink}
                          onChange={(e) => setNewLink(e.target.value)}
                        />
                        <Button onClick={handleAddLink} className="w-full">
                          Adicionar Link
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-2">
                  {(!selectedProject.links || selectedProject.links.length === 0) ? (
                    <p className="text-sm text-gray-500 italic">Nenhum link de entrega adicionado</p>
                  ) : (
                    selectedProject.links.map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700 truncate flex-1">{link}</span>
                        <Button size="sm" variant="outline" asChild>
                          <a href={link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EntregaFlowKanban;
