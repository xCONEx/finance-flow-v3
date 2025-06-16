
import { supabase } from '@/integrations/supabase/client';

export interface KanbanProject {
  id: string;
  title: string;
  client: string;
  dueDate: string;
  priority: "alta" | "media" | "baixa";
  status: "filmado" | "edicao" | "revisao" | "entregue";
  description: string;
  links: string[];
  createdAt: string;
  updatedAt: string;
  user_id: string;
}

class SupabaseKanbanService {
  async saveBoard(userId: string, projects: KanbanProject[]): Promise<void> {
    try {
      // Primeiro, deletar todos os projetos existentes do usuário
      await supabase
        .from('kanban_projects')
        .delete()
        .eq('user_id', userId);

      // Inserir os novos projetos
      if (projects.length > 0) {
        const projectsToInsert = projects.map(project => ({
          id: project.id,
          title: project.title,
          client: project.client,
          due_date: project.dueDate || null,
          priority: project.priority,
          status: project.status,
          description: project.description || '',
          links: project.links || [],
          user_id: userId,
          created_at: project.createdAt,
          updated_at: project.updatedAt
        }));

        const { error } = await supabase
          .from('kanban_projects')
          .insert(projectsToInsert);

        if (error) throw error;
      }

      console.log('✅ Board salvo com sucesso no Supabase');
    } catch (error) {
      console.error('❌ Erro ao salvar board:', error);
      throw error;
    }
  }

  async loadBoard(userId: string): Promise<KanbanProject[]> {
    try {
      const { data, error } = await supabase
        .from('kanban_projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projects: KanbanProject[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        client: item.client,
        dueDate: item.due_date || '',
        priority: item.priority,
        status: item.status,
        description: item.description || '',
        links: item.links || [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        user_id: item.user_id
      }));

      console.log('📦 Board carregado do Supabase:', projects.length, 'projetos');
      return projects;
    } catch (error) {
      console.error('❌ Erro ao carregar board:', error);
      // Em caso de erro, retorna dados do localStorage como fallback
      const savedBoard = localStorage.getItem('entregaFlowProjects');
      if (savedBoard) {
        try {
          return JSON.parse(savedBoard);
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse do localStorage:', parseError);
          return [];
        }
      }
      return [];
    }
  }

  async updateProject(userId: string, projectId: string, updates: Partial<KanbanProject>): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.client !== undefined) updateData.client = updates.client;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.links !== undefined) updateData.links = updates.links;

      const { error } = await supabase
        .from('kanban_projects')
        .update(updateData)
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) throw error;
      
      console.log('✅ Projeto atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar projeto:', error);
      throw error;
    }
  }

  async addProject(userId: string, project: KanbanProject): Promise<void> {
    try {
      const projectData = {
        id: project.id,
        title: project.title,
        client: project.client,
        due_date: project.dueDate || null,
        priority: project.priority,
        status: project.status,
        description: project.description || '',
        links: project.links || [],
        user_id: userId,
        created_at: project.createdAt,
        updated_at: project.updatedAt
      };

      const { error } = await supabase
        .from('kanban_projects')
        .insert(projectData);

      if (error) throw error;
      
      console.log('✅ Projeto adicionado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar projeto:', error);
      throw error;
    }
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('kanban_projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) throw error;
      
      console.log('✅ Projeto excluído com sucesso');
    } catch (error) {
      console.error('❌ Erro ao excluir projeto:', error);
      throw error;
    }
  }
}

export const supabaseKanbanService = new SupabaseKanbanService();
