
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
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erro ao carregar board individual:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('📄 Nenhum board individual encontrado, criando novo');
        return [];
      }

      // Converter dados do banco para o formato esperado
      const projects = data.map(item => ({
        id: item.id,
        title: item.title,
        client: item.client,
        dueDate: item.due_date || '',
        priority: item.priority as 'alta' | 'media' | 'baixa',
        status: item.status as 'filmado' | 'edicao' | 'revisao' | 'entregue',
        description: item.description || '',
        links: Array.isArray(item.links) ? item.links : [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        user_id: item.user_id,
        agency_id: null
      }));

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
      
      // Buscar todos os usuários da agência
      const { data: collaborators, error: collabError } = await supabase
        .from('agency_collaborators')
        .select('user_id')
        .eq('agency_id', agencyId);

      if (collabError) {
        console.error('❌ Erro ao buscar colaboradores:', collabError);
        return [];
      }

      // Buscar o owner da agência
      const { data: agency, error: agencyError } = await supabase
        .from('agencies')
        .select('owner_id')
        .eq('id', agencyId)
        .single();

      if (agencyError) {
        console.error('❌ Erro ao buscar owner da agência:', agencyError);
        return [];
      }

      // Combinar owner e colaboradores
      const userIds = [agency.owner_id, ...(collaborators?.map(c => c.user_id) || [])];
      
      // Buscar projetos de todos os usuários da agência
      const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .in('user_id', userIds);

      if (error) {
        console.error('❌ Erro ao carregar board da agência:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('📄 Nenhum board da agência encontrado');
        return [];
      }

      // Converter dados do banco para o formato esperado
      const projects = data.map(item => ({
        id: item.id,
        title: item.title,
        client: item.client,
        dueDate: item.due_date || '',
        priority: item.priority as 'alta' | 'media' | 'baixa',
        status: item.status as 'filmado' | 'edicao' | 'revisao' | 'entregue',
        description: item.description || '',
        links: Array.isArray(item.links) ? item.links : [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        user_id: item.user_id,
        agency_id: agencyId
      }));

      console.log('✅ Board da agência carregado com sucesso:', projects.length, 'projetos');
      return projects;
    } catch (error) {
      console.error('❌ Erro ao carregar board da agência:', error);
      return [];
    }
  }

  async saveBoard(userId: string, projects: KanbanProject[]): Promise<void> {
    try {
      console.log('💾 Salvando board individual:', projects.length, 'projetos');

      // Salvar cada projeto individualmente
      for (const project of projects) {
        const projectData = {
          id: project.id,
          user_id: userId,
          title: project.title,
          client: project.client,
          due_date: project.dueDate || null,
          priority: project.priority,
          status: project.status,
          description: project.description || '',
          links: project.links || [],
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('kanban_boards')
          .upsert(projectData);

        if (error) {
          console.error('❌ Erro ao salvar projeto:', error);
          throw error;
        }
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Salvar cada projeto individualmente
      for (const project of projects) {
        const projectData = {
          id: project.id,
          user_id: project.user_id, // Manter o user_id original do projeto
          title: project.title,
          client: project.client,
          due_date: project.dueDate || null,
          priority: project.priority,
          status: project.status,
          description: project.description || '',
          links: project.links || [],
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('kanban_boards')
          .upsert(projectData);

        if (error) {
          console.error('❌ Erro ao salvar projeto da agência:', error);
          throw error;
        }
      }

      console.log('✅ Board da agência salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar board da agência:', error);
      throw error;
    }
  }

  async saveProject(project: KanbanProject): Promise<void> {
    try {
      const projectData = {
        id: project.id,
        user_id: project.user_id,
        title: project.title,
        client: project.client,
        due_date: project.dueDate || null,
        priority: project.priority,
        status: project.status,
        description: project.description || '',
        links: project.links || [],
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
}

export const supabaseKanbanService = new SupabaseKanbanService();
