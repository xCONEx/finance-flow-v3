
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '../contexts/ThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
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
  Edit,
  Scissors,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { supabaseKanbanService, KanbanProject } from '../services/supabaseKanbanService';
import { useKanbanContext } from '../hooks/useKanbanContext';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const { currentTheme } = useTheme();
  const [selectedProject, setSelectedProject] = useState<KanbanProject | null>(null);
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
  const { isAgencyMode, currentAgencyId, currentUserId, contextLabel } = useKanbanContext();

  const columns: Column[] = [
    {
      id: 'filmado',
      title: 'Filmado',
      color: 'bg-blue-100 border-blue-300',
      icon: Video,
      count: projects.filter(p => p.status === 'filmado').length
    },
    {
      id: 'edicao',
      title: 'Em Edição',
      color: 'bg-orange-100 border-orange-300',
      icon: Scissors,
      count: projects.filter(p => p.status === 'edicao').length
    },
    {
      id: 'revisao',
      title: 'Revisão',
      color: 'bg-yellow-100 border-yellow-300',
      icon: Eye,
      count: projects.filter(p => p.status === 'revisao').length
    },
    {
      id: 'entregue',
      title: 'Entregue',
      color: 'bg-green-100 border-green-300',
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
  }, [user, isAgencyMode, currentAgencyId, currentUserId]);

  const loadProjects = async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      console.log('🔄 Carregando projetos para contexto:', {
        isAgencyMode,
        currentAgencyId,
        currentUserId,
        contextLabel
      });

      let loadedProjects: KanbanProject[] = [];

      if (isAgencyMode && currentAgencyId) {
        // Carregar projetos da empresa
        loadedProjects = await supabaseKanbanService.loadAgencyBoard(currentAgencyId);
        console.log('🏢 Projetos da empresa carregados:', loadedProjects.length);
      } else {
        // Carregar projetos individuais
        loadedProjects = await supabaseKanbanService.loadBoard(currentUserId);
        console.log('👤 Projetos individuais carregados:', loadedProjects.length);
      }

      setProjects(loadedProjects);
    } catch (error) {
      console.error('❌ Erro ao carregar projetos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar projetos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
      
      // Salvar projeto individual
      const updatedProject = updatedProjects.find(p => p.id === result.draggableId);
      if (updatedProject) {
        try {
          await supabaseKanbanService.saveProject(updatedProject);
        } catch (error) {
          console.error('❌ Erro ao salvar status do projeto:', error);
          toast({
            title: "Erro",
            description: "Erro ao salvar alteração",
            variant: "destructive"
          });
        }
      }

      const movedProject = projects.find(p => p.id === result.draggableId);
      const destColumn = columns.find(c => c.id === destination.droppableId);
      
      toast({
        title: "Projeto Movido",
        description: `"${movedProject?.title}" movido para ${destColumn?.title}`
      });
    }
  };

  // Estado adicional
  const [editData, setEditData] = useState<Partial<KanbanProject> | null>(null);

  useEffect(() => {
    if (selectedProject) {
      setEditData({ ...selectedProject });
    }
  }, [selectedProject]);

  const handleEditSave = async () => {
    if (!selectedProject || !editData) return;

    try {
      const updatedProject = { ...selectedProject, ...editData, updatedAt: new Date().toISOString() };
      
      await supabaseKanbanService.saveProject(updatedProject);
      
      const updatedProjects = projects.map(p =>
        p.id === selectedProject.id ? updatedProject : p
      );
      setProjects(updatedProjects);
      
      toast({
        title: "Projeto Atualizado",
        description: `"${editData.title}" foi salvo com sucesso`
      });

      setShowEditModal(false);
    } catch (error) {
      console.error('❌ Erro ao salvar projeto:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar projeto",
        variant: "destructive"
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

    try {
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
        updatedAt: new Date().toISOString(),
        user_id: currentUserId || '',
        agency_id: isAgencyMode ? currentAgencyId : null
      };

      await supabaseKanbanService.saveProject(project);
      
      const updatedProjects = [...projects, project];
      setProjects(updatedProjects);

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
    } catch (error) {
      console.error('❌ Erro ao criar projeto:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar projeto",
        variant: "destructive"
      });
    }
  };

  const priorityLabels: Record<string, string> = {
    alta: "Alta",
    media: "Média",
    baixa: "Baixa",
  };

  const priorityStyles: Record<
    string,
    { label: string; bgColor: string; textColor?: string }
  > = {
    alta: { label: "Alta", bgColor: "bg-red-500", textColor: "text-white" },
    media: { label: "Média", bgColor: "bg-yellow-400", textColor: "text-black" },
    baixa: { label: "Baixa", bgColor: "bg-green-500", textColor: "text-white" },
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const projectToDelete = projects.find(p => p.id === projectId);
      
      await supabaseKanbanService.deleteProject(projectId);
      
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      setSelectedProject(null);
      setShowEditModal(false);

      toast({
        title: "Projeto Excluído",
        description: `"${projectToDelete?.title}" foi excluído com sucesso`
      });
    } catch (error) {
      console.error('❌ Erro ao deletar projeto:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir projeto",
        variant: "destructive"
      });
    }
  };

  const handleAddLink = async () => {
    if (!selectedProject || !newLink) return;

    try {
      const updatedProject = {
        ...selectedProject,
        links: [...selectedProject.links, newLink],
        updatedAt: new Date().toISOString()
      };

      await supabaseKanbanService.saveProject(updatedProject);
      
      const updatedProjects = projects.map(p => 
        p.id === selectedProject.id ? updatedProject : p
      );
      setProjects(updatedProjects);
      setSelectedProject(updatedProject);
      setNewLink('');

      toast({
        title: "Link Adicionado",
        description: "Link de entrega adicionado com sucesso"
      });
    } catch (error) {
      console.error('❌ Erro ao adicionar link:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar link",
        variant: "destructive"
      });
    }
  };

  // Helper functions
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
      <div className="space-y-6 pb-20 md:pb-6 overflow-x-hidden px-4">
        <div className="text-center">
          <p>Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6 overflow-x-hidden px-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
              <Video className="text-white font-bold text-2xl"/>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Projetos - {contextLabel}</h1>
              <p className="text-sm text-gray-600">
                {isAgencyMode ? 'Gerenciamento em equipe' : 'Gerenciamento individual'}
              </p>
            </div>
          </div>
          <h2 className="text-xl font-semibold">Bem-vindo ao EntregaFlow! 🎬</h2>
          <p className="text-gray-600">Gerencie seus projetos audiovisuais de forma simples e eficiente</p>
        </div>

        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-purple-600 to-purple-800 hover:opacity-90 transition-all duration-300 hover:scale-105"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeProjects}</p>
                <p className="text-sm text-gray-600">Projetos Ativos</p>
                <p className="text-xs text-gray-500">Em andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedProjects}</p>
                <p className="text-sm text-gray-600">Entregas este mês</p>
                <p className="text-xs text-gray-500">Projetos finalizados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{urgentDeadlines}</p>
                <p className="text-sm text-gray-600">Prazos Urgentes</p>
                <p className="text-xs text-gray-500">Vencendo em 2 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueProject ? 'Atrasado' : '0'}</p>
                <p className="text-sm text-gray-600">Próxima Entrega</p>
                <p className="text-xs text-gray-500">
                  {overdueProject ? overdueProject.client : 'Sem atrasos'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Section */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Pipeline de Projetos</h3>
        <p className="text-gray-600 mb-4">Arraste e solte os cards para atualizar o status dos projetos</p>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid lg:grid-cols-4 gap-6">
            {columns.map((column) => {
              const columnProjects = projects.filter(p => p.status === column.id);
              const IconComponent = column.icon;
              
              return (
                <div key={column.id}>
                  {/* Column Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${column.id === 'filmado' ? 'bg-blue-500' : column.id === 'edicao' ? 'bg-orange-500' : column.id === 'revisao' ? 'bg-yellow-500' : 'bg-green-500'}`} />
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
                                  onClick={() => {
                                    setSelectedProject(project);
                                    setShowEditModal(true);
                                  }}
                                >
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      {/* Priority Badge */}
                                      {project.priority && (
                                        <Badge
                                          className={`text-white text-xs ${
                                            project.priority === 'alta'
                                              ? 'bg-red-500'
                                              : project.priority === 'media'
                                              ? 'bg-yellow-500'
                                              : 'bg-green-500'
                                          }`}
                                        >
                                          {priorityLabels[project.priority] || project.priority}
                                        </Badge>
                                      )}

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
                                            Link {project.links.length > 1 ? `${project.links.length}` : '1'}
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
        </DragDropContext>
      </div>

      {/* Add Project Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-sm sm:max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden px-4">
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
            <DialogDescription>
              Adicione um novo projeto ao seu pipeline de produção
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Título do Projeto</label>
              <Input
                placeholder="Ex: Comercial - Café Premium"
                value={newProject.title || ''}
                onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                className="border-orange-200 focus:border-orange-500"
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
              onClick={() => setShowAddModal(false)} 
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddProject} 
              className="flex-1 bg-black text-white hover:bg-gray-800"
            >
              Salvar Projeto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-sm sm:max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden px-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                Editar Projeto
                {selectedProject?.priority && (
                  <Badge
                    className={`${priorityStyles[selectedProject.priority]?.bgColor} ${
                      priorityStyles[selectedProject.priority]?.textColor || "text-white"
                    }`}
                  >
                    {priorityStyles[selectedProject.priority]?.label || selectedProject.priority}
                  </Badge>
                )}
                <Badge variant="outline">{selectedProject?.status}</Badge>
              </DialogTitle>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => selectedProject && handleDeleteProject(selectedProject.id)}
                className='mt-4'>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              Edite as informações do projeto
            </DialogDescription>
          </DialogHeader>

          {editData && (
            <div className="space-y-6 p-4 md:p-6 max-w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Título</label>
                  <Input
                    className="w-full"
                    value={editData.title || ''}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Cliente</label>
                  <Input
                    className="w-full"
                    value={editData.client || ''}
                    onChange={(e) => setEditData({ ...editData, client: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Data de Entrega</label>
                  <Input
                    type="date"
                    className="w-full"
                    value={editData.dueDate || ''}
                    onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Prioridade</label>
                  <Select
                    value={editData.priority || 'media'}
                    onValueChange={(value: 'alta' | 'media' | 'baixa') =>
                      setEditData({ ...editData, priority: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <Textarea
                  rows={3}
                  className="w-full"
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button
                  onClick={() => setShowEditModal(false)}
                  variant="outline"
                  className="flex-1 w-full sm:w-auto"
                >
                  Fechar
                </Button>
                <Button
                  onClick={handleEditSave}
                  className="flex-1 w-full sm:w-auto bg-black text-white hover:bg-gray-800"
                >
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EntregaFlowKanban;
