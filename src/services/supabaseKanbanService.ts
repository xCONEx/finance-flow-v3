
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
      // Use kanban_boards table if available, otherwise use localStorage as fallback
      const boardData = {
        id: `board_${userId}`,
        user_id: userId,
        name: 'EntregaFlow Board',
        data: projects,
        updated_at: new Date().toISOString()
      };

      // Try to save to kanban_boards table
      const { error } = await supabase
        .from('kanban_boards')
        .upsert(boardData);

      if (error) {
        console.warn('Kanban boards table not available, using localStorage:', error);
        localStorage.setItem('entregaFlowProjects', JSON.stringify(projects));
        return;
      }

      console.log('✅ Board salvo com sucesso no Supabase');
    } catch (error) {
      console.error('❌ Erro ao salvar board:', error);
      // Fallback to localStorage
      localStorage.setItem('entregaFlowProjects', JSON.stringify(projects));
    }
  }

  async loadBoard(userId: string): Promise<KanbanProject[]> {
    try {
      const { data, error } = await supabase
        .from('kanban_boards')
        .select('data')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.warn('Kanban boards table not available, using localStorage:', error);
        return this.loadFromLocalStorage();
      }

      console.log('📦 Board carregado do Supabase:', data.data?.length || 0, 'projetos');
      return data.data || [];
    } catch (error) {
      console.error('❌ Erro ao carregar board:', error);
      return this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage(): KanbanProject[] {
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

  async updateProject(userId: string, projectId: string, updates: Partial<KanbanProject>): Promise<void> {
    // For now, load all projects, update the specific one, and save back
    const projects = await this.loadBoard(userId);
    const updatedProjects = projects.map(p => 
      p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    await this.saveBoard(userId, updatedProjects);
  }

  async addProject(userId: string, project: KanbanProject): Promise<void> {
    const projects = await this.loadBoard(userId);
    const updatedProjects = [...projects, project];
    await this.saveBoard(userId, updatedProjects);
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    const projects = await this.loadBoard(userId);
    const updatedProjects = projects.filter(p => p.id !== projectId);
    await this.saveBoard(userId, updatedProjects);
  }
}

export const supabaseKanbanService = new SupabaseKanbanService();
