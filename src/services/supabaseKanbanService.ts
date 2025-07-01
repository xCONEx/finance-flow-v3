import { supabase } from '../integrations/supabase/client';

export interface KanbanProject {
  id: string;
  title: string;
  client: string;
  dueDate: string;
  priority: 'alta' | 'media' | 'baixa';
  status: 'filmado' | 'edicao' | 'revisao' | 'entregue';
  description: string;
  links: string[];
  createdAt: string;
  updatedAt: string;
  user_id: string;
  agency_id?: string | null;
  responsaveis?: string[]; // Array de UUIDs dos responsáveis
  notificar_responsaveis?: boolean; // Se deve notificar os responsáveis
}

export interface ProjectResponsible {
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface AgencyCollaborator {
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
}

class SupabaseKanbanService {
  async loadBoard(userId: string): Promise<KanbanProject[]> {
    try {
      console.log('📥 [INDIVIDUAL] Carregando board individual para usuário:', userId);
      
      const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('user_id', userId)
        .is('agency_id', null) // Apenas projetos individuais (sem agency_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [INDIVIDUAL] Erro ao carregar board:', error);
        throw error;
      }

      const projects = (data || []).map(item => ({
        id: item.id,
        title: item.title || '',
        client: item.client || '',
        dueDate: item.due_date || '',
        priority: (item.priority || 'media') as 'alta' | 'media' | 'baixa',
        status: (item.status || 'filmado') as 'filmado' | 'edicao' | 'revisao' | 'entregue',
        description: item.description || '',
        links: Array.isArray(item.links) ? item.links : [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        user_id: item.user_id,
        agency_id: null, // Forçar null para projetos individuais
        responsaveis: item.responsaveis || [],
        notificar_responsaveis: item.notificar_responsaveis ?? true
      }));

      console.log('✅ [INDIVIDUAL] Board carregado:', projects.length, 'projetos individuais');
      return projects;
    } catch (error) {
      console.error('❌ [INDIVIDUAL] Erro ao carregar board:', error);
      return [];
    }
  }

  async loadAgencyBoard(agencyId: string): Promise<KanbanProject[]> {
    try {
      console.log('📥 [AGENCY] Carregando board da agência:', agencyId);
      
      const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('agency_id', agencyId) // Apenas projetos da agência específica
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [AGENCY] Erro ao carregar board da agência:', error);
        throw error;
      }

      const projects = (data || []).map(item => ({
        id: item.id,
        title: item.title || '',
        client: item.client || '',
        dueDate: item.due_date || '',
        priority: (item.priority || 'media') as 'alta' | 'media' | 'baixa',
        status: (item.status || 'filmado') as 'filmado' | 'edicao' | 'revisao' | 'entregue',
        description: item.description || '',
        links: Array.isArray(item.links) ? item.links : [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        user_id: item.user_id || '',
        agency_id: agencyId, // Garantir que o agency_id seja sempre a string correta
        responsaveis: item.responsaveis || [],
        notificar_responsaveis: item.notificar_responsaveis ?? true
      }));

      console.log('✅ [AGENCY] Board da agência carregado:', projects.length, 'projetos para agência', agencyId);
      return projects;
    } catch (error) {
      console.error('❌ [AGENCY] Erro ao carregar board da agência:', error);
      return [];
    }
  }

  async saveProject(project: KanbanProject): Promise<void> {
    try {
      // CORREÇÃO PRINCIPAL: Garantir que agency_id seja sempre null ou string válida, nunca undefined
      const normalizedAgencyId = project.agency_id === undefined ? null : project.agency_id;
      
      console.log('💾 [SAVE] Salvando projeto:', {
        id: project.id,
        title: project.title,
        agency_id: normalizedAgencyId,
        user_id: project.user_id,
        responsaveis: project.responsaveis?.length || 0,
        mode: normalizedAgencyId ? 'AGENCY' : 'INDIVIDUAL'
      });
      
      const projectData = {
        id: project.id,
        user_id: project.user_id,
        agency_id: normalizedAgencyId, // IMPORTANTE: sempre null ou string válida
        title: project.title,
        client: project.client,
        due_date: project.dueDate || null,
        priority: project.priority,
        status: project.status,
        description: project.description || '',
        links: project.links || [],
        responsaveis: project.responsaveis || [],
        notificar_responsaveis: project.notificar_responsaveis ?? true,
        updated_at: new Date().toISOString()
      };

      console.log('💾 [SAVE] Dados normalizados a serem salvos:', projectData);

      const { error } = await supabase
        .from('kanban_boards')
        .upsert(projectData, {
          onConflict: 'id'
        });

      if (error) {
        console.error('❌ [SAVE] Erro ao salvar projeto:', error);
        throw error;
      }

      // Notificar responsáveis se for projeto de agência e notificação estiver ativada
      if (normalizedAgencyId && project.notificar_responsaveis && project.responsaveis?.length > 0) {
        try {
          await this.notifyProjectResponsibles(project.id, 'update');
        } catch (notificationError) {
          console.warn('⚠️ [SAVE] Erro ao notificar responsáveis:', notificationError);
        }
      }

      console.log('✅ [SAVE] Projeto salvo com sucesso:', project.title, 'Mode:', normalizedAgencyId ? 'AGENCY' : 'INDIVIDUAL');
    } catch (error) {
      console.error('❌ [SAVE] Erro ao salvar projeto:', error);
      throw error;
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      console.log('🗑️ [DELETE] Deletando projeto:', projectId);
      
      const { error } = await supabase
        .from('kanban_boards')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('❌ [DELETE] Erro ao deletar projeto:', error);
        throw error;
      }

      console.log('✅ [DELETE] Projeto deletado com sucesso:', projectId);
    } catch (error) {
      console.error('❌ [DELETE] Erro ao deletar projeto:', error);
      throw error;
    }
  }

  async getProjectResponsibles(projectId: string): Promise<ProjectResponsible[]> {
    try {
      console.log('👥 [RESPONSIBLES] Buscando responsáveis do projeto:', projectId);
      
      const { data, error } = await supabase
        .rpc('get_project_responsibles', { project_id: projectId });

      if (error) {
        console.error('❌ [RESPONSIBLES] Erro ao buscar responsáveis:', error);
        throw error;
      }

      const responsaveis = (data || []).map((item: any) => ({
        user_id: item.user_id,
        name: item.name,
        email: item.email,
        avatar_url: item.avatar_url
      }));

      console.log('✅ [RESPONSIBLES] Responsáveis encontrados:', responsaveis.length);
      return responsaveis;
    } catch (error) {
      console.error('❌ [RESPONSIBLES] Erro ao buscar responsáveis:', error);
      return [];
    }
  }

  async getAgencyCollaborators(agencyId: string): Promise<AgencyCollaborator[]> {
    try {
      console.log('👥 [COLLABORATORS] Buscando colaboradores da agência:', agencyId);
      
      const { data, error } = await supabase
        .rpc('get_agency_collaborators_for_selection', { p_agency_id: agencyId });

      if (error) {
        console.error('❌ [COLLABORATORS] Erro ao buscar colaboradores:', error);
        throw error;
      }

      const collaborators = (data || []).map((item: any) => ({
        user_id: item.user_id,
        name: item.name,
        email: item.email,
        avatar_url: item.avatar_url,
        role: item.role
      }));

      console.log('✅ [COLLABORATORS] Colaboradores encontrados:', collaborators.length);
      return collaborators;
    } catch (error) {
      console.error('❌ [COLLABORATORS] Erro ao buscar colaboradores:', error);
      return [];
    }
  }

  async notifyProjectResponsibles(projectId: string, notificationType: string = 'update'): Promise<boolean> {
    try {
      console.log('🔔 [NOTIFY] Notificando responsáveis do projeto:', projectId, 'Tipo:', notificationType);
      
      const { data, error } = await supabase
        .rpc('notify_project_responsibles', { 
          project_id: projectId, 
          notification_type: notificationType 
        });

      if (error) {
        console.error('❌ [NOTIFY] Erro ao notificar responsáveis:', error);
        throw error;
      }

      console.log('✅ [NOTIFY] Notificação enviada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ [NOTIFY] Erro ao notificar responsáveis:', error);
      return false;
    }
  }

  async saveBoard(userId: string, projects: KanbanProject[]): Promise<void> {
    try {
      console.log('💾 [LEGACY] Salvando board individual:', projects.length, 'projetos');
      for (const project of projects) {
        await this.saveProject(project);
      }
      console.log('✅ [LEGACY] Board individual salvo com sucesso');
    } catch (error) {
      console.error('❌ [LEGACY] Erro ao salvar board individual:', error);
      throw error;
    }
  }

  async saveAgencyBoard(agencyId: string, projects: KanbanProject[]): Promise<void> {
    try {
      console.log('💾 [LEGACY] Salvando board da agência:', agencyId, '-', projects.length, 'projetos');
      for (const project of projects) {
        await this.saveProject(project);
      }
      console.log('✅ [LEGACY] Board da agência salvo com sucesso');
    } catch (error) {
      console.error('❌ [LEGACY] Erro ao salvar board da agência:', error);
      throw error;
    }
  }
}

export const supabaseKanbanService = new SupabaseKanbanService();
