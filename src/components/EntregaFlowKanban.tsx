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
  Eye,
  Building,
  Bell,
  BellOff,
  Pencil
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { supabaseKanbanService, KanbanProject } from '../services/supabaseKanbanService';
import { useKanbanContext } from '../hooks/useKanbanContext';
import { useAgency } from '../contexts/AgencyContext';
import ContextSelector from './ContextSelector';
import ResponsibleSelector from './ResponsibleSelector';
import ProjectResponsibles from './ProjectResponsibles';
import KanbanAnalytics from './KanbanAnalytics';

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
    links: [],
    responsaveis: [],
    notificar_responsaveis: true
  });
  const [newLink, setNewLink] = useState('');
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const { isAgencyMode, currentAgencyId, currentUserId, contextLabel } = useKanbanContext();
  const { currentContext, agencies } = useAgency();
  const [editFields, setEditFields] = useState<Omit<Partial<KanbanProject>, 'priority'> & { priority?: 'alta' | 'media' | 'baixa' }>({});
  const [isEditing, setIsEditing] = useState(false);

  // Verificar se é owner da agência atual
  const isOwner = isAgencyMode && currentAgencyId && 
    agencies.find(a => a.id === currentAgencyId)?.is_owner;

  // Função para gerar UUID válido
  const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

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
    console.log('🔄 [KANBAN] useEffect disparado - Contexto alterado:', {
      isAgencyMode,
      currentAgencyId,
      currentUserId,
      contextLabel,
      userExists: !!user
    });
    
    if (user && currentUserId) {
      loadProjects();
    } else {
      console.log('❌ [KANBAN] Não carregando projetos - usuário ou currentUserId ausente');
      setProjects([]);
      setLoading(false);
    }
  }, [isAgencyMode, currentAgencyId, currentUserId, user]);

  useEffect(() => {
    if (showEditModal && selectedProject) {
      setEditFields({
        title: selectedProject.title,
        client: selectedProject.client,
        dueDate: selectedProject.dueDate,
        priority: (['alta', 'media', 'baixa'].includes(selectedProject.priority as string)
          ? selectedProject.priority
          : 'media') as 'alta' | 'media' | 'baixa',
        status: selectedProject.status,
        description: selectedProject.description,
        links: selectedProject.links ? [...selectedProject.links] : [],
        responsaveis: selectedProject.responsaveis ? [...selectedProject.responsaveis] : [],
        notificar_responsaveis: selectedProject.notificar_responsaveis ?? true,
      });
      setNewLink('');
    }
  }, [showEditModal, selectedProject]);

  useEffect(() => {
    if (showEditModal) {
      setIsEditing(false);
    }
  }, [showEditModal]);

  const loadProjects = async () => {
    if (!currentUserId) {
      console.log('❌ [KANBAN] loadProjects: Nenhum usuário logado');
      setProjects([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 [KANBAN] loadProjects iniciado para contexto:', {
        isAgencyMode,
        currentAgencyId,
        currentUserId,
        contextLabel
      });

      let loadedProjects: KanbanProject[] = [];

      if (isAgencyMode && currentAgencyId) {
        console.log('🏢 [KANBAN] Carregando projetos da agência:', currentAgencyId);
        loadedProjects = await supabaseKanbanService.loadAgencyBoard(currentAgencyId);
        console.log('✅ [KANBAN] Projetos da empresa carregados:', loadedProjects.length, 'projetos');
      } else {
        console.log('👤 [KANBAN] Carregando projetos individuais para usuário:', currentUserId);
        loadedProjects = await supabaseKanbanService.loadBoard(currentUserId);
        console.log('✅ [KANBAN] Projetos individuais carregados:', loadedProjects.length, 'projetos');
      }

      setProjects(loadedProjects);
      console.log('📊 [KANBAN] Estado final dos projetos atualizados:', {
        totalProjects: loadedProjects.length,
        agencyProjects: loadedProjects.filter(p => p.agency_id).length,
        individualProjects: loadedProjects.filter(p => !p.agency_id).length
      });
    } catch (error) {
      console.error('❌ [KANBAN] Erro ao carregar projetos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar projetos",
        variant: "destructive"
      });
      setProjects([]);
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
      
      const updatedProject = updatedProjects.find(p => p.id === result.draggableId);
      if (updatedProject) {
        try {
          console.log('💾 [KANBAN] Movendo projeto:', {
            projectId: updatedProject.id,
            newStatus: destination.droppableId,
            agencyId: updatedProject.agency_id,
            mode: updatedProject.agency_id ? 'AGENCY' : 'INDIVIDUAL'
          });
          await supabaseKanbanService.saveProject(updatedProject);
          
          // Notificar responsáveis se for projeto de agência
          if (updatedProject.agency_id && updatedProject.notificar_responsaveis && updatedProject.responsaveis?.length > 0) {
            try {
              await supabaseKanbanService.notifyProjectResponsibles(updatedProject.id, 'move');
            } catch (notificationError) {
              console.warn('⚠️ [KANBAN] Erro ao notificar responsáveis:', notificationError);
            }
          }
        } catch (error) {
          console.error('❌ [KANBAN] Erro ao salvar status do projeto:', error);
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
      const finalAgencyId = isAgencyMode && currentAgencyId ? currentAgencyId : null;
      
      const project: KanbanProject = {
        id: generateUUID(),
        title: newProject.title!,
        client: newProject.client!,
        dueDate: newProject.dueDate || '',
        priority: newProject.priority || 'media',
        status: newProject.status || 'filmado',
        description: newProject.description || '',
        links: newProject.links || [],
        responsaveis: newProject.responsaveis || [],
        notificar_responsaveis: newProject.notificar_responsaveis ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user_id: currentUserId || '',
        agency_id: finalAgencyId
      };

      console.log('💾 [KANBAN] Criando novo projeto:', {
        title: project.title,
        agencyId: project.agency_id,
        responsaveis: project.responsaveis?.length || 0,
        isAgencyMode,
        currentAgencyId,
        finalAgencyId,
        mode: project.agency_id ? 'AGENCY' : 'INDIVIDUAL'
      });

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
        links: [],
        responsaveis: [],
        notificar_responsaveis: true
      });
      setShowAddModal(false);

      toast({
        title: "Projeto Criado",
        description: `"${project.title}" foi adicionado com sucesso`
      });
    } catch (error) {
      console.error('❌ [KANBAN] Erro ao criar projeto:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar projeto",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const projectToDelete = projects.find(p => p.id === projectId);
      
      console.log('🗑️ [KANBAN] Deletando projeto:', {
        projectId,
        title: projectToDelete?.title,
        agencyId: projectToDelete?.agency_id,
        mode: projectToDelete?.agency_id ? 'AGENCY' : 'INDIVIDUAL'
      });

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
      console.error('❌ [KANBAN] Erro ao deletar projeto:', error);
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

      console.log('🔗 [KANBAN] Adicionando link ao projeto:', {
        projectId: updatedProject.id,
        agencyId: updatedProject.agency_id,
        newLink,
        mode: updatedProject.agency_id ? 'AGENCY' : 'INDIVIDUAL'
      });

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
      console.error('❌ [KANBAN] Erro ao adicionar link:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar link",
        variant: "destructive"
      });
    }
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

  // Função utilitária para garantir o tipo correto de priority
  function sanitizePriority(value: any): 'alta' | 'media' | 'baixa' {
    if (value === 'alta' || value === 'media' || value === 'baixa') return value;
    return 'media';
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="text-center">
          <p>Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header com ContextSelector integrado */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 bg-gradient-to-r ${currentTheme.primary} rounded-lg flex items-center justify-center`}>
              <Video className="text-white font-bold text-2xl"/>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">Projetos Audiovisuais</h1>
                {/* ContextSelector integrado aqui */}
                <ContextSelector />
              </div>
              <p className="text-sm text-gray-600">
                {isAgencyMode && currentAgencyId ? 
                  `Gerenciando projetos da empresa ${contextLabel}` : 
                  'Seus projetos pessoais'
                }
              </p>
              <p className="text-xs text-gray-500">
                {projects.length} projeto{projects.length !== 1 ? 's' : ''} carregado{projects.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <h2 className="text-xl font-semibold">Bem-vindo ao EntregaFlow! 🎬</h2>
          <p className="text-gray-600">Gerencie seus projetos audiovisuais de forma simples e eficiente</p>
        </div>

        <Button 
          onClick={() => setShowAddModal(true)}
          className={`bg-gradient-to-r ${currentTheme.primary} hover:opacity-90 transition-all duration-300 hover:scale-105`}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {/* Analytics */}
      <KanbanAnalytics 
        projects={projects}
        isAgencyMode={isAgencyMode}
        isOwner={isOwner || false}
      />

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
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${column.id === 'filmado' ? 'bg-blue-500' : column.id === 'edicao' ? 'bg-orange-500' : column.id === 'revisao' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <h4 className="font-semibold">{column.title}</h4>
                    <Badge className="bg-gray-100 text-gray-800">{column.count}</Badge>
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
                                      {project.priority === 'alta' && (
                                        <Badge className="bg-red-500 text-white text-xs">
                                          {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                                        </Badge>
                                      )}

                                      <h4 className="font-semibold text-sm line-clamp-2">
                                        {project.title}
                                      </h4>

                                      <div className="flex items-center gap-2">
                                        <User className="h-3 w-3 text-gray-500" />
                                        <span className="text-xs text-gray-600">{project.client}</span>
                                      </div>

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

                                      {isOverdue(project.dueDate) && project.status !== 'entregue' && (
                                        <Badge className="bg-red-500 text-white text-xs">
                                          {getDaysOverdue(project.dueDate)} dias atrasado
                                        </Badge>
                                      )}

                                      {project.links.length > 0 && (
                                        <div className="flex items-center gap-2">
                                          <ExternalLink className="h-3 w-3 text-blue-500" />
                                          <span className="text-xs text-blue-600">
                                            Link {project.links.length > 1 ? `${project.links.length}` : '1'}
                                          </span>
                                        </div>
                                      )}

                                      {/* Responsáveis do projeto */}
                                      {isAgencyMode && project.responsaveis && project.responsaveis.length > 0 && (
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1">
                                            <Building className="h-3 w-3 text-purple-500" />
                                            <span className="text-xs text-purple-600">Empresa</span>
                                          </div>
                                          <ProjectResponsibles 
                                            projectId={project.id}
                                            responsaveis={project.responsaveis}
                                            maxVisible={2}
                                            size="sm"
                                          />
                                        </div>
                                      )}

                                      {/* Indicador de notificação */}
                                      {isAgencyMode && project.notificar_responsaveis && project.responsaveis && project.responsaveis.length > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Bell className="h-3 w-3 text-green-500" />
                                          <span className="text-xs text-green-600">Notificações ativas</span>
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

                        {columnProjects.length === 0 && (
                          <Card className="border-dashed border-2 border-gray-300">
                            <CardContent className="p-6 text-center">
                              <Button
                                className="text-gray-500 bg-transparent hover:bg-gray-50"
                                onClick={() => {
                                  setNewProject({ ...newProject, status: column.id as KanbanProject['status'] });
                                  setShowAddModal(true);
                                }}
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

      {/* Modal de Novo Projeto */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Novo Projeto
              {isAgencyMode && currentAgencyId && (
                <Badge className="ml-2 bg-blue-100 text-blue-800 border border-blue-200">
                  <Building className="h-3 w-3 mr-1" />
                  {contextLabel}
                </Badge>
              )}
            </DialogTitle>
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

            {/* Seleção de Responsáveis (apenas para agências) */}
            {isAgencyMode && currentAgencyId && (
              <div>
                <label className="text-sm font-medium mb-2 block">Responsáveis</label>
                <ResponsibleSelector
                  agencyId={currentAgencyId}
                  selectedResponsibles={newProject.responsaveis || []}
                  onResponsiblesChange={(responsaveis) => setNewProject({...newProject, responsaveis})}
                  placeholder="Selecionar responsáveis..."
                />
              </div>
            )}

            {/* Opção de Notificação (apenas para agências) */}
            {isAgencyMode && currentAgencyId && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notificar_responsaveis"
                  checked={newProject.notificar_responsaveis}
                  onChange={(e) => setNewProject({...newProject, notificar_responsaveis: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <label htmlFor="notificar_responsaveis" className="text-sm text-gray-700">
                  Notificar responsáveis sobre mudanças
                </label>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Links de Entrega</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Cole o link aqui"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                />
                <Button 
                  onClick={() => {
                    if (newLink) {
                      setNewProject({
                        ...newProject,
                        links: [...(newProject.links || []), newLink],
                        priority: sanitizePriority(newProject.priority) as 'alta' | 'media' | 'baixa',
                      });
                      setNewLink('');
                    }
                  }}
                  className="bg-gray-100 text-gray-800 hover:bg-gray-200"
                >
                  Adicionar
                </Button>
              </div>
              {newProject.links && newProject.links.length > 0 && (
                <div className="mt-2 space-y-1">
                  {newProject.links.map((link, index) => (
                    <div key={index} className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      {link}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                {isAgencyMode && currentAgencyId ? (
                  <>
                    <Building className="h-4 w-4 inline mr-1" />
                    Este projeto será criado para a empresa: <strong>{contextLabel}</strong>
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 inline mr-1" />
                    Este projeto será criado como <strong>projeto pessoal</strong>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => setShowAddModal(false)} 
              className="flex-1 bg-gray-100 text-gray-800 hover:bg-gray-200"
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

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl px-2 sm:px-8">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="flex items-center gap-2">
                Editar Projeto
                {selectedProject?.priority === 'alta' && (
                  <Badge className="bg-red-500 text-white">Alta</Badge>
                )}
                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">{selectedProject?.status}</Badge>
                {selectedProject?.agency_id && (
                  <Badge className="bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
                    <Building className="h-3 w-3" />
                    Empresa
                  </Badge>
                )}
              </DialogTitle>
              {!isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  className="p-2 ml-2 text-gray-500 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                  onClick={() => setIsEditing(true)}
                  aria-label="Editar"
                >
                  <Pencil className="h-5 w-5" />
                </Button>
              )}
            </div>
          </DialogHeader>
          {selectedProject && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                // Salvar alterações
                const updatedProject = {
                  ...selectedProject,
                  ...editFields,
                  updatedAt: new Date().toISOString(),
                };
                await supabaseKanbanService.saveProject(updatedProject);
                setSelectedProject(updatedProject);
                setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                setShowEditModal(false);
                toast({
                  title: "Projeto Atualizado",
                  description: `Projeto atualizado com sucesso!`,
                });
              }}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 block">Título do Projeto</label>
                    <Input
                      value={editFields.title || ''}
                      onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))}
                      required
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 block">Cliente</label>
                    <Input
                      value={editFields.client || ''}
                      onChange={e => setEditFields(f => ({ ...f, client: e.target.value }))}
                      required
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 block">Data de Entrega</label>
                    <Input
                      type="date"
                      value={editFields.dueDate || ''}
                      onChange={e => setEditFields(f => ({ ...f, dueDate: e.target.value }))}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 block">Prioridade</label>
                    <Select
                      value={editFields.priority || 'media'}
                      onValueChange={value => setEditFields(f => ({ ...f, priority: value }))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900">
                        <SelectValue />
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
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 block">Descrição</label>
                  <Textarea
                    value={editFields.description || ''}
                    onChange={e => setEditFields(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                  />
                </div>
                {/* Responsáveis (apenas para agências) */}
                {isAgencyMode && currentAgencyId && selectedProject.agency_id && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 block">Responsáveis</label>
                    <ResponsibleSelector
                      agencyId={currentAgencyId}
                      selectedResponsibles={editFields.responsaveis || []}
                      onResponsiblesChange={responsaveis => setEditFields(f => ({ ...f, responsaveis }))}
                      placeholder="Selecionar responsáveis..."
                      disabled={!isEditing}
                    />
                  </div>
                )}
                {/* Notificação de responsáveis (apenas para agências) */}
                {isAgencyMode && currentAgencyId && selectedProject.agency_id && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="notificar_responsaveis_edit"
                      checked={editFields.notificar_responsaveis}
                      onChange={e => setEditFields(f => ({ ...f, notificar_responsaveis: e.target.checked }))}
                      className="rounded border-gray-300"
                      disabled={!isEditing}
                    />
                    <label htmlFor="notificar_responsaveis_edit" className="text-sm text-gray-700">
                      Notificar responsáveis sobre mudanças
                    </label>
                  </div>
                )}
                {/* Links de Entrega */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 block">Links de Entrega</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Cole o link aqui"
                      value={newLink}
                      onChange={e => setNewLink(e.target.value)}
                      className="w-64 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                      readOnly={!isEditing}
                      disabled={!isEditing}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (newLink) {
                          setEditFields(f => {
                            return {
                              id: f.id,
                              title: f.title,
                              client: f.client,
                              dueDate: f.dueDate,
                              status: f.status,
                              description: f.description,
                              links: [...(f.links || []), newLink],
                              createdAt: f.createdAt,
                              updatedAt: f.updatedAt,
                              user_id: f.user_id,
                              agency_id: f.agency_id,
                              responsaveis: f.responsaveis,
                              notificar_responsaveis: f.notificar_responsaveis,
                              priority: sanitizePriority(f.priority),
                            };
                          });
                          setNewLink('');
                        }
                      }}
                      className="bg-black text-white"
                      disabled={!isEditing}
                    >
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(!editFields.links || editFields.links.length === 0) ? (
                      <p className="text-sm text-gray-500 italic">Nenhum link adicionado</p>
                    ) : (
                      editFields.links.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <ExternalLink className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-700 flex-1">{link}</span>
                          <Button
                            type="button"
                            className="bg-gray-100 text-gray-800 hover:bg-gray-200"
                            onClick={() => setEditFields(f => {
                              return {
                                id: f.id,
                                title: f.title,
                                client: f.client,
                                dueDate: f.dueDate,
                                status: f.status,
                                description: f.description,
                                links: f.links ? f.links.filter((_, i) => i !== index) : [],
                                createdAt: f.createdAt,
                                updatedAt: f.updatedAt,
                                user_id: f.user_id,
                                agency_id: f.agency_id,
                                responsaveis: f.responsaveis,
                                notificar_responsaveis: f.notificar_responsaveis,
                                priority: sanitizePriority(f.priority),
                              };
                            })}
                            disabled={!isEditing}
                          >
                            Remover
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Fechar
                  </Button>
                  {isEditing ? (
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      Salvar Alterações
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="flex-1 bg-red-500 text-white hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800"
                      onClick={async () => {
                        if (selectedProject) {
                          if (window.confirm('Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.')) {
                            await handleDeleteProject(selectedProject.id);
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Deletar
                    </Button>
                  )}
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EntregaFlowKanban;
