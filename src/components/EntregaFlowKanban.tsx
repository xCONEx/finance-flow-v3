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
  List as ListIcon,
  Columns
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
import { useUsageTracking } from '@/hooks/useUsageTracking';

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
  const { incrementProjectUsage } = useUsageTracking();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

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
      await incrementProjectUsage();
      
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

  // Função para obter cor do status (igual ao Kanban)
  const getStatusBadge = (status) => {
    switch (status) {
      case 'filmado':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">Filmado</span>;
      case 'edicao':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">Em Edição</span>;
      case 'revisao':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">Revisão</span>;
      case 'entregue':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">Entregue</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Função para cor da borda esquerda
  function getStatusColor(status) {
    switch (status) {
      case 'filmado': return '#3B82F6'; // azul
      case 'edicao': return '#F59E0B'; // laranja
      case 'revisao': return '#EAB308'; // amarelo
      case 'entregue': return '#10B981'; // verde
      default: return '#D1D5DB'; // cinza
    }
  }

  // Ordem dos status para a lista
  const statusOrder = ['filmado', 'edicao', 'revisao', 'entregue'];

  // Componente de lista simples para projetos
  const ProjectList = ({ projects }) => {
    // Ordenar projetos pela ordem dos status
    const orderedProjects = [...projects].sort((a, b) => {
      const aIdx = statusOrder.indexOf(a.status);
      const bIdx = statusOrder.indexOf(b.status);
      if (aIdx === bIdx) return 0;
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Título</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Prazo</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Criado em</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {orderedProjects.map((project, idx) => (
              <tr
                key={project.id}
                className={`transition hover:bg-blue-50 cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                style={{borderLeft: '4px solid', borderColor: getStatusColor(project.status)}}
                onClick={() => {
                  setSelectedProject(project);
                  setShowEditModal(true);
                }}
              >
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{project.title}</td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{project.client}</td>
                <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(project.status)}</td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && (
          <div className="text-center text-gray-500 py-8">Nenhum projeto encontrado.</div>
        )}
      </div>
    );
  };

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
      {/* Toggle visualização Kanban/Lista */}
      <div className="flex justify-end gap-2 mb-2">
        <button
          className={`flex items-center gap-1 px-3 py-1 rounded-md border text-sm ${viewMode === 'kanban' ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-white border-gray-300 text-gray-600'}`}
          onClick={() => setViewMode('kanban')}
        >
          <Columns className="h-4 w-4" /> Kanban
        </button>
        <button
          className={`flex items-center gap-1 px-3 py-1 rounded-md border text-sm ${viewMode === 'list' ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-white border-gray-300 text-gray-600'}`}
          onClick={() => setViewMode('list')}
        >
          <ListIcon className="h-4 w-4" /> Lista
        </button>
      </div>

      {/* Header com ContextSelector integrado, cards de resumo, botão Novo Projeto, etc - sempre visível */}
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

      {/* Pipeline de Projetos: alterna entre Kanban e Lista */}
      {viewMode === 'kanban' ? (
        <>
          {/* Pipeline Section */}
          <div>
            <h3 className="text-xl font-semibold mb-2">Pipeline de Projetos</h3>
            <p className="text-gray-600 mb-4">Arraste e solte os cards para atualizar o status dos projetos</p>

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
        </>
      ) : (
        <ProjectList projects={projects} />
      )}

      {/* Modal de edição/detalhes do projeto - sempre visível */}
      {showEditModal && selectedProject && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Projeto: {selectedProject.title}</DialogTitle>
              <DialogDescription>
                Faça as alterações necessárias no projeto.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Primeira linha */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">Título</label>
                  <Input value={editFields.title} onChange={(e) => setEditFields({ ...editFields, title: e.target.value })} />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">Cliente</label>
                  <Input value={editFields.client} onChange={(e) => setEditFields({ ...editFields, client: e.target.value })} />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">Prazo</label>
                  <Input type="date" value={editFields.dueDate} onChange={(e) => setEditFields({ ...editFields, dueDate: e.target.value })} />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">Prioridade</label>
                  <Select onValueChange={(value) => setEditFields({ ...editFields, priority: sanitizePriority(value) })} value={editFields.priority}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Segunda linha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">Status</label>
                  <Select onValueChange={(value) => setEditFields({ ...editFields, status: value })} value={editFields.status}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="filmado">Filmado</SelectItem>
                      <SelectItem value="edicao">Em Edição</SelectItem>
                      <SelectItem value="revisao">Revisão</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">Responsáveis</label>
                  <ResponsibleSelector
                    agencyId={currentAgencyId || ''}
                    selectedResponsibles={editFields.responsaveis || []}
                    onResponsiblesChange={(responsaveis) => setEditFields({ ...editFields, responsaveis })}
                  />
                </div>
              </div>
              {/* Terceira linha: Descrição */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Descrição</label>
                <Textarea value={editFields.description} onChange={(e) => setEditFields({ ...editFields, description: e.target.value })} />
              </div>
              {/* Quarta linha: Links */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Links (separados por vírgula)</label>
                <Input
                  value={Array.isArray(editFields.links) ? editFields.links.join(', ') : ''}
                  onChange={(e) =>
                    setEditFields({
                      ...editFields,
                      links: e.target.value
                        ? e.target.value.split(',').map(link => link.trim())
                        : [],
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancelar</Button>
                <Button onClick={() => {
                  const updatedProject = {
                    ...selectedProject,
                    ...editFields,
                    updatedAt: new Date().toISOString()
                  };
                  supabaseKanbanService.saveProject(updatedProject).then(() => {
                    toast({
                      title: "Projeto Atualizado",
                      description: `"${updatedProject.title}" foi atualizado com sucesso`
                    });
                    setShowEditModal(false);
                    loadProjects(); // Atualizar a lista após a edição
                  }).catch(error => {
                    console.error('❌ [KANBAN] Erro ao salvar projeto:', error);
                    toast({
                      title: "Erro",
                      description: "Erro ao salvar projeto",
                      variant: "destructive"
                    });
                  });
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EntregaFlowKanban;
