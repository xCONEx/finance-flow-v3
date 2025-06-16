
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
      console.log('💾 Salvando board no Supabase para usuário:', userId);
      
      // Usar a tabela jobs que já existe no schema
      // Primeiro, deletar projetos existentes do usuário
      await supabase
        .from('jobs')
        .delete()
        .eq('user_id', userId);

      // Salvar novos projetos
      if (projects.length > 0) {
        const jobsData = projects.map(project => ({
          id: project.id,
          title: project.title,
          client: project.client,
          due_date: project.dueDate,
          priority: project.priority,
          status: project.status,
          description: project.description,
          links: project.links,
          created_at: project.createdAt,
          updated_at: project.updatedAt,
          user_id: userId
        }));

        const { error } = await supabase
          .from('jobs')
          .insert(jobsData);

        if (error) throw error;
      }

      console.log('✅ Board salvo com sucesso no Supabase');
    } catch (error) {
      console.error('❌ Erro ao salvar board no Supabase:', error);
      // Fallback para localStorage apenas em caso de erro
      localStorage.setItem('entregaFlowProjects', JSON.stringify(projects));
      throw error;
    }
  }

  async loadBoard(userId: string): Promise<KanbanProject[]> {
    try {
      console.log('📦 Carregando board do Supabase para usuário:', userId);
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projects: KanbanProject[] = (data || []).map(job => ({
        id: job.id,
        title: job.title,
        client: job.client,
        dueDate: job.due_date,
        priority: job.priority,
        status: job.status,
        description: job.description || '',
        links: job.links || [],
        createdAt: job.created_at,
        updatedAt: job.updated_at,
        user_id: job.user_id
      }));

      console.log('📦 Board carregado do Supabase:', projects.length, 'projetos');
      return projects;
    } catch (error) {
      console.error('❌ Erro ao carregar board do Supabase:', error);
      // Fallback para localStorage
      return this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage(): KanbanProject[] {
    const savedBoard = localStorage.getItem('entregaFlowProjects');
    if (savedBoard) {
      try {
        const projects = JSON.parse(savedBoard);
        console.log('📦 Board carregado do localStorage (fallback):', projects?.length || 0, 'projetos');
        return projects || [];
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse do localStorage:', parseError);
        return [];
      }
    }
    return [];
  }

  async updateProject(userId: string, projectId: string, updates: Partial<KanbanProject>): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.title) updateData.title = updates.title;
      if (updates.client) updateData.client = updates.client;
      if (updates.dueDate) updateData.due_date = updates.dueDate;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.status) updateData.status = updates.status;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.links) updateData.links = updates.links;
      if (updates.updatedAt) updateData.updated_at = updates.updatedAt;

      const { error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) throw error;
      
      console.log('✅ Projeto atualizado no Supabase');
    } catch (error) {
      console.error('❌ Erro ao atualizar projeto no Supabase:', error);
      // Fallback para método anterior
      const projects = await this.loadBoard(userId);
      const updatedProjects = projects.map(p => 
        p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      await this.saveBoard(userId, updatedProjects);
    }
  }

  async addProject(userId: string, project: KanbanProject): Promise<void> {
    try {
      const jobData = {
        id: project.id,
        title: project.title,
        client: project.client,
        due_date: project.dueDate,
        priority: project.priority,
        status: project.status,
        description: project.description,
        links: project.links,
        created_at: project.createdAt,
        updated_at: project.updatedAt,
        user_id: userId
      };

      const { error } = await supabase
        .from('jobs')
        .insert([jobData]);

      if (error) throw error;
      
      console.log('✅ Projeto adicionado no Supabase');
    } catch (error) {
      console.error('❌ Erro ao adicionar projeto no Supabase:', error);
      // Fallback para método anterior
      const projects = await this.loadBoard(userId);
      const updatedProjects = [...projects, project];
      await this.saveBoard(userId, updatedProjects);
    }
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) throw error;
      
      console.log('✅ Projeto deletado do Supabase');
    } catch (error) {
      console.error('❌ Erro ao deletar projeto do Supabase:', error);
      // Fallback para método anterior
      const projects = await this.loadBoard(userId);
      const updatedProjects = projects.filter(p => p.id !== projectId);
      await this.saveBoard(userId, updatedProjects);
    }
  }
}

export const supabaseKanbanService = new SupabaseKanbanService();
