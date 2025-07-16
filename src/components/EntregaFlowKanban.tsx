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
  Pencil,
  LayoutGrid,
  List,
  Filter,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { supabaseKanbanService, KanbanProject } from '../services/supabaseKanbanService';
import { useKanbanContext } from '../hooks/useKanbanContext';
import { useAgency } from '../contexts/AgencyContext';
import ContextSelector from './ContextSelector';
import ProjectResponsibles from './ProjectResponsibles';
import ResponsibleSelector from './ResponsibleSelector';

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
  const { currentContext, agencies } = useAgency();
  const [editFields, setEditFields] = useState<Omit<Partial<KanbanProject>, 'priority'> & { priority?: 'alta' | 'media' | 'baixa' }>({});
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados para visualização
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

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
    
    if (window.innerWidth <= 768 && source.droppableId !== destination.droppableId) {
      // Bloqueia movimentação horizontal no mobile
      return;
    }

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
          
          // Funcionalidade de notificação será implementada futuramente
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user_id: currentUserId || '',
        agency_id: finalAgencyId
      };

      console.log('💾 [KANBAN] Criando novo projeto:', {
        title: project.title,
        agencyId: project.agency_id,
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
        links: []
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

  // Função para filtrar projetos
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || project.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Componente de visualização em lista
  const ListView = () => (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border">
        <div className="grid grid-cols-12 gap-4 p-4 border-b font-semibold text-sm text-muted-foreground">
          <div className="col-span-3">Projeto</div>
          <div className="col-span-2">Cliente</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Prazo</div>
          <div className="col-span-1 flex justify-end pr-6">Prioridade</div>
          <div className="col-span-2 flex justify-end pr-2">Ações</div>
        </div>
        <div className="divide-y">
          {filteredProjects.map((project) => (
            <div key={project.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => { setSelectedProject(project); setShowEditModal(true); }}>
              <div className="col-span-3">
                <h4 className="font-medium line-clamp-1">{project.title}</h4>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{project.description}</p>
                )}
                {project.links.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <ExternalLink className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-600">{project.links.length} link(s)</span>
                  </div>
                )}
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{project.client}</span>
              </div>
              <div className="col-span-2">
                <Badge 
                  className={`${
                    project.status === 'filmado' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'edicao' ? 'bg-orange-100 text-orange-800' :
                    project.status === 'revisao' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}
                >
                  {project.status === 'filmado' ? 'Filmado' :
                   project.status === 'edicao' ? 'Em Edição' :
                   project.status === 'revisao' ? 'Revisão' : 'Entregue'}
                </Badge>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                {project.dueDate ? (
                  <>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className={`text-sm ${
                      isOverdue(project.dueDate) ? 'text-red-600 font-medium' : 'text-muted-foreground'
                    }`}>
                      {new Date(project.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                    {isOverdue(project.dueDate) && project.status !== 'entregue' && (
                      <Badge className="bg-red-500 text-white text-xs ml-1">
                        {getDaysOverdue(project.dueDate)}d atrasado
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Sem prazo</span>
                )}
              </div>
              <div className="col-span-1 flex justify-end pr-6">
                <Badge className={getPriorityColor(project.priority)}>
                  {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                </Badge>
              </div>
              <div className="col-span-2 flex items-center gap-2 justify-end pr-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={e => { e.stopPropagation(); setSelectedProject(project); setShowEditModal(true); }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {filteredProjects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum projeto encontrado com os filtros aplicados</p>
        </div>
      )}
    </div>
  );

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

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => setShowAddModal(true)}
            className={`bg-gradient-to-r ${currentTheme.primary} hover:opacity-90 transition-all duration-300 hover:scale-105`}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
          
          {/* Toggle de visualização */}
          <div className="flex rounded-lg border bg-muted p-1">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="h-8"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8"
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics Card - Resumo rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">Ativos</span>
            </div>
            <p className="text-2xl font-bold mt-2">{activeProjects}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">Concluídos</span>
            </div>
            <p className="text-2xl font-bold mt-2">{completedProjects}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Prazos Urgentes</span>
            </div>
            <p className="text-2xl font-bold mt-2">{urgentDeadlines}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Atrasados</span>
            </div>
            <p className="text-2xl font-bold mt-2">
              {projects.filter(p => isOverdue(p.dueDate) && p.status !== 'entregue').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      {viewMode === 'list' && (
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="filmado">Filmado</SelectItem>
              <SelectItem value="edicao">Em Edição</SelectItem>
              <SelectItem value="revisao">Revisão</SelectItem>
              <SelectItem value="entregue">Entregue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Pipeline Section */}
      <div>
        <h3 className="text-xl font-semibold mb-2">
          {viewMode === 'kanban' ? 'Pipeline de Projetos' : 'Lista de Projetos'}
        </h3>
        <p className="text-gray-600 mb-4">
          {viewMode === 'kanban' 
            ? 'Arraste e solte os cards para atualizar o status dos projetos'
            : 'Visualize e gerencie todos os projetos em formato de lista'
          }
        </p>

        {viewMode === 'kanban' ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid lg:grid-cols-4 gap-6 overflow-x-hidden md:overflow-x-visible px-2 sm:px-0">
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
                                    className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 rounded-lg md:rounded-lg p-2 sm:p-4 bg-white shadow-sm ${
                                      column.id === 'filmado' ? 'border-l-blue-500' : 
                                      column.id === 'edicao' ? 'border-l-orange-500' : 
                                      column.id === 'revisao' ? 'border-l-yellow-500' : 'border-l-green-500'
                                    } ${snapshot.isDragging ? 'rotate-2 shadow-xl' : ''}`}
                                    style={{
                                      margin: '0.5rem 0',
                                      boxSizing: 'border-box',
                                      maxWidth: '100%',
                                      minWidth: 0
                                    }}
                                    onClick={() => {
                                      setSelectedProject(project);
                                      setShowEditModal(true);
                                    }}
                                  >
                                    <CardContent className="p-3 sm:p-4">
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

                                      {/* Indicador de empresa */}
                                      {isAgencyMode && project.agency_id && (
                                        <div className="flex items-center gap-1">
                                          <Building className="h-3 w-3 text-purple-500" />
                                          <span className="text-xs text-purple-600">Projeto da Empresa</span>
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
        ) : (
          <ListView />
        )}
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

            {/* Funcionalidades avançadas para agências serão implementadas futuramente */}

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

      {/* Modal de Edição Melhorado */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden px-2 sm:px-4">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedProject?.status === 'filmado' ? 'bg-blue-500' :
                    selectedProject?.status === 'edicao' ? 'bg-orange-500' :
                    selectedProject?.status === 'revisao' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  {isEditing ? 'Editando Projeto' : 'Detalhes do Projeto'}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedProject?.priority === 'alta' && (
                    <Badge variant="destructive">Prioridade Alta</Badge>
                  )}
                  <Badge variant="outline" className="capitalize">
                    {selectedProject?.status === 'filmado' ? 'Filmado' :
                     selectedProject?.status === 'edicao' ? 'Em Edição' :
                     selectedProject?.status === 'revisao' ? 'Revisão' : 'Entregue'}
                  </Badge>
                  {selectedProject?.agency_id && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      Projeto da Empresa
                    </Badge>
                  )}
                  {isOverdue(selectedProject?.dueDate || '') && selectedProject?.status !== 'entregue' && (
                    <Badge variant="destructive">
                      {getDaysOverdue(selectedProject?.dueDate || '')} dias atrasado
                    </Badge>
                  )}
                </div>
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="shrink-0 ml-[-5px]"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </DialogHeader>
          {selectedProject && (
            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    setIsEditing(false);
                    const updatedProject = {
                      ...selectedProject,
                      ...editFields,
                      updatedAt: new Date().toISOString(),
                    };
                    await supabaseKanbanService.saveProject(updatedProject);
                    setSelectedProject(updatedProject);
                    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
                    toast({
                      title: "Projeto Atualizado",
                      description: `"${updatedProject.title}" foi atualizado com sucesso!`,
                    });
                  } catch (error) {
                    console.error('Erro ao salvar projeto:', error);
                    toast({
                      title: "Erro",
                      description: "Erro ao salvar as alterações",
                      variant: "destructive"
                    });
                  }
                }}
                className="space-y-6 p-6"
              >
                {/* Informações principais em grid responsivo */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Título do Projeto</label>
                      {isEditing ? (
                        <Input
                          value={editFields.title || ''}
                          onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))}
                          required
                          className="text-lg font-semibold"
                          placeholder="Nome do projeto"
                        />
                      ) : (
                        <h3 className="text-lg font-semibold p-3 bg-muted rounded-md">{selectedProject.title}</h3>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Cliente</label>
                      {isEditing ? (
                        <Input
                          value={editFields.client || ''}
                          onChange={e => setEditFields(f => ({ ...f, client: e.target.value }))}
                          required
                          placeholder="Nome do cliente"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedProject.client}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block text-muted-foreground">Data de Entrega</label>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editFields.dueDate || ''}
                            onChange={e => setEditFields(f => ({ ...f, dueDate: e.target.value }))}
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className={isOverdue(selectedProject.dueDate) && selectedProject.status !== 'entregue' ? 'text-red-600 font-medium' : ''}>
                              {selectedProject.dueDate ? new Date(selectedProject.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo definido'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block text-muted-foreground">Prioridade</label>
                        {isEditing ? (
                          <Select
                            value={editFields.priority || 'media'}
                            onValueChange={value => setEditFields(f => ({ ...f, priority: sanitizePriority(value) }))}
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
                        ) : (
                          <div className="p-3 bg-muted rounded-md">
                            <Badge className={getPriorityColor(selectedProject.priority)}>
                              {selectedProject.priority.charAt(0).toUpperCase() + selectedProject.priority.slice(1)}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Descrição</label>
                      {isEditing ? (
                        <Textarea
                          value={editFields.description || ''}
                          onChange={e => setEditFields(f => ({ ...f, description: e.target.value }))}
                          rows={4}
                          placeholder="Detalhes sobre o projeto..."
                        />
                      ) : (
                        <div className="p-3 bg-muted rounded-md min-h-[100px]">
                          <p className="text-sm leading-relaxed">
                            {selectedProject.description || 'Sem descrição'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Status atual do projeto */}
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Status Atual</label>
                      <div className="p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${
                            selectedProject.status === 'filmado' ? 'bg-blue-500' :
                            selectedProject.status === 'edicao' ? 'bg-orange-500' :
                            selectedProject.status === 'revisao' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <span className="font-medium capitalize">
                            {selectedProject.status === 'filmado' ? 'Filmado' :
                             selectedProject.status === 'edicao' ? 'Em Edição' :
                             selectedProject.status === 'revisao' ? 'Revisão' : 'Entregue'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações da empresa (se aplicável) */}
                {isAgencyMode && selectedProject.agency_id && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Responsáveis</label>
                      {isEditing ? (
                        <ResponsibleSelector
                          agencyId={selectedProject.agency_id}
                          selectedResponsibles={editFields.responsaveis || []}
                          onResponsiblesChange={responsaveis => setEditFields(f => ({ ...f, responsaveis }))}
                          placeholder="Adicionar responsáveis..."
                        />
                      ) : (
                        <div className="p-3 bg-muted rounded-md flex items-center gap-2 flex-wrap min-h-[48px]">
                          <ProjectResponsibles projectId={selectedProject.id} responsaveis={selectedProject.responsaveis || []} maxVisible={4} size="md" />
                          {(!selectedProject.responsaveis || selectedProject.responsaveis.length === 0) && (
                            <span className="text-xs text-muted-foreground">Nenhum responsável atribuído</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block text-muted-foreground">Tipo de Projeto</label>
                      <div className="p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-purple-500" />
                          <span className="text-sm">Projeto da Empresa</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Links de Entrega */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Links de Entrega</label>
                  {isEditing && (
                    <div className="flex gap-2 mb-4">
                      <Input
                        placeholder="Cole o link aqui"
                        value={newLink}
                        onChange={e => setNewLink(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newLink.trim()) {
                            setEditFields(f => ({
                              ...f,
                              links: [...(f.links || []), newLink.trim()],
                              priority: sanitizePriority(f.priority)
                            }));
                            setNewLink('');
                          }
                        }}
                        disabled={!newLink.trim()}
                      >
                        Adicionar
                      </Button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {(!editFields.links || editFields.links.length === 0) && (!selectedProject.links || selectedProject.links.length === 0) ? (
                      <div className="p-4 bg-muted rounded-md text-center text-muted-foreground">
                        <ExternalLink className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum link de entrega adicionado</p>
                      </div>
                    ) : (
                      (isEditing ? editFields.links : selectedProject.links)?.map((link, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-card border rounded-md">
                          <ExternalLink className="h-4 w-4 text-blue-500 shrink-0" />
                          <a 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex-1 truncate underline"
                          >
                            {link}
                          </a>
                          {isEditing && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditFields(f => ({
                                ...f,
                                links: f.links ? f.links.filter((_, i) => i !== index) : [],
                                priority: sanitizePriority(f.priority)
                              }))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setIsEditing(false);
                    }}
                    className="flex-1"
                  >
                    {isEditing ? 'Cancelar' : 'Fechar'}
                  </Button>
                  
                  {isEditing ? (
                    <Button
                      type="submit"
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={async () => {
                        if (selectedProject) {
                          if (window.confirm('Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.')) {
                            await handleDeleteProject(selectedProject.id);
                          }
                        }
                      }}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Projeto
                    </Button>
                  )}
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EntregaFlowKanban;
