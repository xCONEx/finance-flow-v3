
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

      // Verificar se a tabela existe tentando fazer uma query simples
      const { data: tableCheck, error: checkError } = await supabase
        .from('kanban_boards')
        .select('id')
        .limit(1);

      if (checkError) {
        console.error('❌ Erro ao verificar tabela kanban_boards:', checkError);
        console.log('💾 Salvando no localStorage (tabela kanban_boards não disponível)');
        
        localStorage.setItem('entregaFlowProjects', JSON.stringify(projects));
        localStorage.setItem('entregaFlowUserId', userId);
        console.log('✅ Board salvo com sucesso no localStorage');
        return;
      }

      console.log('✅ Tabela kanban_boards encontrada!');

      // Deletar registros existentes do usuário
      const { error: deleteError } = await supabase
        .from('kanban_boards')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ Erro ao deletar registros antigos:', deleteError);
        throw deleteError;
      }

      // Salvar novos projetos
      if (projects.length > 0) {
        const projectsToSave = projects.map(project => ({
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
          user_id: project.user_id
        }));

        console.log('💽 Dados formatados para Supabase:', projectsToSave);

        const { data, error } = await supabase
          .from('kanban_boards')
          .insert(projectsToSave);

        if (error) {
          console.error('❌ Erro ao inserir no Supabase:', error);
          throw error;
        }

        console.log('🎉 Dados salvos com sucesso no Supabase!', data);
      }

      // Manter backup no localStorage
      localStorage.setItem('entregaFlowProjects', JSON.stringify(projects));
      localStorage.setItem('entregaFlowUserId', userId);

      console.log('✅ Board salvo com sucesso no Supabase');
    } catch (error) {
      console.error('❌ Erro ao salvar board:', error);
      
      // Fallback para localStorage
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

      // Verificar se a tabela existe
      const { data: tableCheck, error: checkError } = await supabase
        .from('kanban_boards')
        .select('id')
        .limit(1);

      if (checkError) {
        console.error('❌ Erro ao verificar tabela:', checkError);
        console.log('📦 Carregando do localStorage (tabela não disponível)');
        return this.loadFromLocalStorage(userId);
      }

      console.log('✅ Tabela encontrada, carregando dados...');

      const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar do Supabase:', error);
        console.log('📦 Carregando do localStorage como fallback');
        return this.loadFromLocalStorage(userId);
      }

      if (!data || data.length === 0) {
        console.log('📦 Nenhum dados no Supabase, tentando localStorage...');
        return this.loadFromLocalStorage(userId);
      }

      const projects: KanbanProject[] = data.map(item => ({
        id: item.id,
        title: item.title,
        client: item.client,
        dueDate: item.due_date,
        priority: item.priority,
        status: item.status,
        description: item.description,
        links: item.links || [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        user_id: item.user_id
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
      const projects = await this.loadBoard(userId);
      const updatedProjects = projects.map(p => 
        p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      await this.saveBoard(userId, updatedProjects);
      
      console.log('✅ Projeto atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar projeto:', error);
      throw error;
    }
  }

  async addProject(userId: string, project: KanbanProject): Promise<void> {
    try {
      const projects = await this.loadBoard(userId);
      const updatedProjects = [...projects, project];
      await this.saveBoard(userId, updatedProjects);
      
      console.log('✅ Projeto adicionado');
    } catch (error) {
      console.error('❌ Erro ao adicionar projeto:', error);
      throw error;
    }
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    try {
      const projects = await this.loadBoard(userId);
      const updatedProjects = projects.filter(p => p.id !== projectId);
      await this.saveBoard(userId, updatedProjects);
      
      console.log('✅ Projeto deletado');
    } catch (error) {
      console.error('❌ Erro ao deletar projeto:', error);
      throw error;
    }
  }
}

export const supabaseKanbanService = new SupabaseKanbanService();
