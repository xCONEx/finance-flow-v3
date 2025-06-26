
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
        agency_id: null
      }));

      console.log('✅ [INDIVIDUAL] Board carregado:', projects.length, 'projetos');
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
        agency_id: agencyId
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
      console.log('💾 [SAVE] Salvando projeto:', {
        id: project.id,
        title: project.title,
        agency_id: project.agency_id,
        user_id: project.user_id,
        mode: project.agency_id ? 'AGENCY' : 'INDIVIDUAL'
      });
      
      const projectData = {
        id: project.id,
        user_id: project.user_id,
        agency_id: project.agency_id, // IMPORTANTE: sempre incluir o agency_id (null ou valor)
        title: project.title,
        client: project.client,
        due_date: project.dueDate || null,
        priority: project.priority,
        status: project.status,
        description: project.description || '',
        links: project.links || [],
        updated_at: new Date().toISOString()
      };

      console.log('💾 [SAVE] Dados a serem salvos:', projectData);

      const { error } = await supabase
        .from('kanban_boards')
        .upsert(projectData, {
          onConflict: 'id'
        });

      if (error) {
        console.error('❌ [SAVE] Erro ao salvar projeto:', error);
        throw error;
      }

      console.log('✅ [SAVE] Projeto salvo com sucesso:', project.title);
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

  // Métodos legados mantidos para compatibilidade
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
