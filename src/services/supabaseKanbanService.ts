
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
      console.log('💾 Salvando no localStorage (kanban_boards table não disponível)');
      
      // Salvar no localStorage como principal método de armazenamento
      localStorage.setItem('entregaFlowProjects', JSON.stringify(projects));
      localStorage.setItem('entregaFlowUserId', userId);

      console.log('✅ Board salvo com sucesso no localStorage');
    } catch (error) {
      console.error('❌ Erro ao salvar board:', error);
      throw error;
    }
  }

  async loadBoard(userId: string): Promise<KanbanProject[]> {
    try {
      console.log('📦 Carregando board do localStorage para usuário:', userId);
      
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
    } catch (error) {
      console.error('❌ Erro ao carregar board:', error);
      return [];
    }
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
