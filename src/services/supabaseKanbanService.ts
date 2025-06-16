
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

      // Create a temporary agency ID using the user ID as reference
      const tempAgencyId = `user_${userId}`;

      // Deletar registros existentes para este usuário
      const { error: deleteError } = await supabase
        .from('kanban_boards')
        .delete()
        .eq('agency_id', tempAgencyId);

      if (deleteError) {
        console.error('❌ Erro ao deletar registros antigos:', deleteError);
        // Continue tentando salvar mesmo com erro de delete
      }

      // Salvar projetos como JSON no campo board_data
      const boardRecord = {
        agency_id: tempAgencyId,
        board_data: projects as any,
        updated_at: new Date().toISOString()
      };

      console.log('💽 Dados formatados para Supabase:', boardRecord);

      const { data, error } = await supabase
        .from('kanban_boards')
        .insert(boardRecord);

      if (error) {
        console.error('❌ Erro ao inserir no Supabase:', error);
        throw error;
      }

      console.log('🎉 Dados salvos com sucesso no Supabase!', data);

      // Manter backup no localStorage
      localStorage.setItem('entregaFlowProjects', JSON.stringify(projects));
      localStorage.setItem('entregaFlowUserId', userId);

      console.log('✅ Board salvo com sucesso no Supabase');
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

      // Use the same temporary agency ID pattern
      const tempAgencyId = `user_${userId}`;

      const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('agency_id', tempAgencyId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Erro ao carregar do Supabase:', error);
        console.log('📦 Carregando do localStorage como fallback');
        return this.loadFromLocalStorage(userId);
      }

      if (!data || data.length === 0) {
        console.log('📦 Nenhum dados no Supabase, tentando localStorage...');
        return this.loadFromLocalStorage(userId);
      }

      // Extrair projetos do campo board_data
      const boardData = data[0];
      const projects = (boardData.board_data as unknown) as KanbanProject[];

      console.log('🎉 Projetos carregados do Supabase:', projects?.length || 0);
      return projects || [];
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
