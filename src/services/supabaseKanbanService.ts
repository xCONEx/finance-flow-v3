
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
      console.log('🔍 Tentando salvar no Supabase...');
      console.log('👤 User ID:', userId);
      console.log('📊 Projetos para salvar:', projects.length);

      // Primeiro, deletar todos os projetos existentes do usuário
      const { error: deleteError } = await supabase
        .from('user_kanban_boards')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ Erro ao deletar projetos antigos:', deleteError);
        throw deleteError;
      }

      // Inserir todos os projetos
      if (projects.length > 0) {
        const projectsToInsert = projects.map(project => ({
          id: project.id,
          user_id: userId,
          title: project.title,
          client: project.client,
          due_date: project.dueDate || null,
          priority: project.priority,
          status: project.status,
          description: project.description || null,
          links: project.links,
          created_at: project.createdAt,
          updated_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('user_kanban_boards')
          .insert(projectsToInsert);

        if (insertError) {
          console.error('❌ Erro ao inserir projetos:', insertError);
          throw insertError;
        }
      }

      console.log('✅ Projetos salvos com sucesso no Supabase!');
      
      // Backup no localStorage
      localStorage.setItem('entregaFlowProjects', JSON.stringify(projects));
      localStorage.setItem('entregaFlowUserId', userId);
    } catch (error) {
      console.error('❌ Erro ao salvar board:', error);
      
      // Fallback to localStorage
      console.log('💾 Salvando no localStorage como fallback');
      localStorage.setItem('entregaFlowProjects', JSON.stringify(projects));
      localStorage.setItem('entregaFlowUserId', userId);
      
      throw error;
    }
  }

  async loadBoard(userId: string): Promise<KanbanProject[]> {
    try {
      console.log('📦 Tentando carregar do Supabase...');
      console.log('👤 User ID:', userId);

      const { data, error } = await supabase
        .from('user_kanban_boards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar do Supabase:', error);
        console.log('📦 Carregando do localStorage como fallback');
        return this.loadFromLocalStorage(userId);
      }

      if (!data || data.length === 0) {
        console.log('📦 Nenhum projeto no Supabase, tentando localStorage...');
        return this.loadFromLocalStorage(userId);
      }

      // Converter dados do Supabase para o formato KanbanProject
      const projects: KanbanProject[] = data.map(row => ({
        id: row.id,
        title: row.title,
        client: row.client,
        dueDate: row.due_date || '',
        priority: row.priority as "alta" | "media" | "baixa",
        status: row.status as "filmado" | "edicao" | "revisao" | "entregue",
        description: row.description || '',
        links: row.links || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        user_id: row.user_id
      }));

      console.log('🎉 Projetos carregados do Supabase:', projects.length);
      return projects;
    } catch (error) {
      console.error('❌ Erro ao carregar board:', error);
      console.log('📦 Carregando do localStorage como fallback');
      return this.loadFromLocalStorage(userId);
    }
  }

  private loadFromLocalStorage(userId: string): KanbanProject[] {
    const savedBoard = localStorage.getItem('entregaFlowProjects');
    const savedUserId = localStorage.getItem('entregaFlowUserId');
    
    if (savedBoard && savedUserId === userId) {
      try {
        const projects = JSON.parse(savedBoard);
        console.log('📦 Board carregado do localStorage:', projects?.length || 0, 'projetos');
        return projects || [];
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse do localStorage:', parseError);
        return [];
      }
    }
    
    console.log('📦 Nenhum board encontrado para o usuário');
    return [];
  }

  async updateProject(userId: string, projectId: string, updates: Partial<KanbanProject>): Promise<void> {
    try {
      // Primeiro atualizar no Supabase
      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.client) updateData.client = updates.client;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate || null;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.status) updateData.status = updates.status;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      if (updates.links) updateData.links = updates.links;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('user_kanban_boards')
        .update(updateData)
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erro ao atualizar no Supabase:', error);
      }

      // Atualizar localStorage como backup
      const projects = await this.loadBoard(userId);
      const updatedProjects = projects.map(p => 
        p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      localStorage.setItem('entregaFlowProjects', JSON.stringify(updatedProjects));
      
      console.log('✅ Projeto atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar projeto:', error);
      throw error;
    }
  }

  async addProject(userId: string, project: KanbanProject): Promise<void> {
    try {
      // Inserir no Supabase
      const projectData = {
        id: project.id,
        user_id: userId,
        title: project.title,
        client: project.client,
        due_date: project.dueDate || null,
        priority: project.priority,
        status: project.status,
        description: project.description || null,
        links: project.links,
        created_at: project.createdAt,
        updated_at: project.updatedAt
      };

      const { error } = await supabase
        .from('user_kanban_boards')
        .insert(projectData);

      if (error) {
        console.error('❌ Erro ao adicionar no Supabase:', error);
      }

      // Atualizar localStorage como backup
      const projects = await this.loadBoard(userId);
      const updatedProjects = [...projects, project];
      localStorage.setItem('entregaFlowProjects', JSON.stringify(updatedProjects));
      
      console.log('✅ Projeto adicionado');
    } catch (error) {
      console.error('❌ Erro ao adicionar projeto:', error);
      throw error;
    }
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    try {
      // Deletar do Supabase
      const { error } = await supabase
        .from('user_kanban_boards')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erro ao deletar do Supabase:', error);
      }

      // Atualizar localStorage como backup
      const projects = await this.loadBoard(userId);
      const updatedProjects = projects.filter(p => p.id !== projectId);
      localStorage.setItem('entregaFlowProjects', JSON.stringify(updatedProjects));
      
      console.log('✅ Projeto deletado');
    } catch (error) {
      console.error('❌ Erro ao deletar projeto:', error);
      throw error;
    }
  }
}

export const supabaseKanbanService = new SupabaseKanbanService();
