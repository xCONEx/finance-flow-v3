
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
      // Since kanban_boards table doesn't exist in current schema, use localStorage
      console.log('📦 Salvando no localStorage (kanban_boards table não disponível)');
      localStorage.setItem('entregaFlowProjects', JSON.stringify(projects));
      console.log('✅ Board salvo com sucesso no localStorage');
    } catch (error) {
      console.error('❌ Erro ao salvar board:', error);
      localStorage.setItem('entregaFlowProjects', JSON.stringify(projects));
    }
  }

  async loadBoard(userId: string): Promise<KanbanProject[]> {
    try {
      // Try localStorage first since kanban_boards table doesn't exist
      return this.loadFromLocalStorage();
    } catch (error) {
      console.error('❌ Erro ao carregar board:', error);
      return [];
    }
  }

  private loadFromLocalStorage(): KanbanProject[] {
    const savedBoard = localStorage.getItem('entregaFlowProjects');
    if (savedBoard) {
      try {
        const projects = JSON.parse(savedBoard);
        console.log('📦 Board carregado do localStorage:', projects?.length || 0, 'projetos');
        return projects || [];
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
