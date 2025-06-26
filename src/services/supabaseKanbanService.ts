
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
      console.log('📥 Carregando board individual para usuário:', userId);
      
      const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('user_id', userId)
        .is('agency_id', null); // Apenas projetos individuais (sem agency_id)

      if (error) {
        console.error('❌ Erro ao carregar board individual:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('📄 Nenhum board individual encontrado');
        return [];
      }

      // Converter dados do banco para o formato esperado
      const projects = data.map(item => {
        const boardData = item.board_data as any;
        return {
          id: item.id,
          title: boardData?.title || '',
          client: boardData?.client || '',
          dueDate: boardData?.due_date || '',
          priority: (boardData?.priority || 'media') as 'alta' | 'media' | 'baixa',
          status: (boardData?.status || 'filmado') as 'filmado' | 'edicao' | 'revisao' | 'entregue',
          description: boardData?.description || '',
          links: boardData?.links || [],
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          user_id: item.user_id,
          agency_id: null
        };
      });

      console.log('✅ Board individual carregado com sucesso:', projects.length, 'projetos');
      return projects;
    } catch (error) {
      console.error('❌ Erro ao carregar board individual:', error);
      return [];
    }
  }

  async loadAgencyBoard(agencyId: string): Promise<KanbanProject[]> {
    try {
      console.log('📥 Carregando board da agência:', agencyId);
      
      const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('agency_id', agencyId); // Apenas projetos da agência

      if (error) {
        console.error('❌ Erro ao carregar board da agência:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('📄 Nenhum board da agência encontrado');
        return [];
      }

      // Converter dados do banco para o formato esperado
      const projects = data.map(item => {
        const boardData = item.board_data as any;
        return {
          id: item.id,
          title: boardData?.title || '',
          client: boardData?.client || '',
          dueDate: boardData?.due_date || '',
          priority: (boardData?.priority || 'media') as 'alta' | 'media' | 'baixa',
          status: (boardData?.status || 'filmado') as 'filmado' | 'edicao' | 'revisao' | 'entregue',
          description: boardData?.description || '',
          links: boardData?.links || [],
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          user_id: item.user_id || '',
          agency_id: agencyId
        };
      });

      console.log('✅ Board da agência carregado com sucesso:', projects.length, 'projetos');
      return projects;
    } catch (error) {
      console.error('❌ Erro ao carregar board da agência:', error);
      return [];
    }
  }

  async saveProject(project: KanbanProject): Promise<void> {
    try {
      console.log('💾 Salvando projeto:', project.title, 'Agency ID:', project.agency_id);
      
      const boardData = {
        title: project.title,
        client: project.client,
        due_date: project.dueDate || null,
        priority: project.priority,
        status: project.status,
        description: project.description || '',
        links: project.links || []
      };

      const projectData = {
        id: project.id,
        user_id: project.user_id,
        agency_id: project.agency_id || null,
        board_data: boardData,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('kanban_boards')
        .upsert(projectData);

      if (error) {
        console.error('❌ Erro ao salvar projeto:', error);
        throw error;
      }

      console.log('✅ Projeto salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar projeto:', error);
      throw error;
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('kanban_boards')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('❌ Erro ao deletar projeto:', error);
        throw error;
      }

      console.log('✅ Projeto deletado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar projeto:', error);
      throw error;
    }
  }

  // Métodos legados mantidos para compatibilidade, mas agora usando saveProject
  async saveBoard(userId: string, projects: KanbanProject[]): Promise<void> {
    try {
      console.log('💾 Salvando board individual:', projects.length, 'projetos');
      for (const project of projects) {
        await this.saveProject(project);
      }
      console.log('✅ Board individual salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar board individual:', error);
      throw error;
    }
  }

  async saveAgencyBoard(agencyId: string, projects: KanbanProject[]): Promise<void> {
    try {
      console.log('💾 Salvando board da agência:', agencyId, '-', projects.length, 'projetos');
      for (const project of projects) {
        await this.saveProject(project);
      }
      console.log('✅ Board da agência salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar board da agência:', error);
      throw error;
    }
  }
}

export const supabaseKanbanService = new SupabaseKanbanService();
