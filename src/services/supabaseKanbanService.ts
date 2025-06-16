
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

// Função para gerar UUID válido
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

class SupabaseKanbanService {
  async saveBoard(userId: string, projects: KanbanProject[]): Promise<void> {
    try {
      console.log('🔍 Tentando salvar no Supabase...');
      console.log('👤 User ID:', userId);
      console.log('📊 Projetos para salvar:', projects.length);

      // Verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ Usuário não autenticado:', authError);
        throw new Error('Usuário não autenticado');
      }

      console.log('✅ Usuário autenticado:', user.id);

      // Verificar se o userId corresponde ao usuário autenticado
      if (user.id !== userId) {
        console.error('❌ ID do usuário não confere:', { authId: user.id, providedId: userId });
        throw new Error('ID do usuário não confere');
      }

      // Buscar dados atuais do perfil
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('subscription_data')
        .eq('id', userId)
        .single();

      // Preparar dados do kanban
      const kanbanData = {
        projects: projects,
        lastUpdated: new Date().toISOString()
      };

      // Preparar subscription_data com type safety
      const currentSubscriptionData = currentProfile?.subscription_data;
      const baseData = (currentSubscriptionData && typeof currentSubscriptionData === 'object' && !Array.isArray(currentSubscriptionData)) 
        ? currentSubscriptionData as Record<string, any>
        : {};

      const updatedSubscriptionData = {
        ...baseData,
        kanban_projects: kanbanData
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_data: updatedSubscriptionData as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Erro ao salvar no perfil:', updateError);
        throw updateError;
      }

      console.log('✅ Projetos salvos com sucesso no perfil do usuário!');
      
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

      // Verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ Usuário não autenticado:', authError);
        console.log('📦 Carregando do localStorage como fallback');
        return this.loadFromLocalStorage(userId);
      }

      // Verificar se o userId corresponde ao usuário autenticado
      if (user.id !== userId) {
        console.error('❌ ID do usuário não confere:', { authId: user.id, providedId: userId });
        console.log('📦 Carregando do localStorage como fallback');
        return this.loadFromLocalStorage(userId);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_data')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Erro ao carregar do Supabase:', error);
        console.log('📦 Carregando do localStorage como fallback');
        return this.loadFromLocalStorage(userId);
      }

      // Type safety para acessar kanban_projects
      const subscriptionData = data?.subscription_data;
      let kanbanData = null;

      if (subscriptionData && typeof subscriptionData === 'object' && !Array.isArray(subscriptionData)) {
        const typedData = subscriptionData as Record<string, any>;
        kanbanData = typedData.kanban_projects;
      }
      
      if (!kanbanData || !kanbanData.projects || kanbanData.projects.length === 0) {
        console.log('📦 Nenhum projeto no Supabase, tentando localStorage...');
        return this.loadFromLocalStorage(userId);
      }

      const projects: KanbanProject[] = kanbanData.projects.map((project: any) => ({
        id: project.id,
        title: project.title,
        client: project.client,
        dueDate: project.dueDate || '',
        priority: project.priority as "alta" | "media" | "baixa",
        status: project.status as "filmado" | "edicao" | "revisao" | "entregue",
        description: project.description || '',
        links: Array.isArray(project.links) ? project.links : [],
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        user_id: project.user_id
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
      // Carregar projetos atuais
      const projects = await this.loadBoard(userId);
      
      // Atualizar o projeto específico
      const updatedProjects = projects.map(p => 
        p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      
      // Salvar de volta
      await this.saveBoard(userId, updatedProjects);
      
      console.log('✅ Projeto atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar projeto:', error);
      throw error;
    }
  }

  async addProject(userId: string, project: KanbanProject): Promise<void> {
    try {
      // Garantir que o projeto tenha um UUID válido
      let validId = project.id;
      if (!validId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        validId = generateUUID();
      }

      // Carregar projetos atuais
      const projects = await this.loadBoard(userId);
      
      // Adicionar o novo projeto
      const updatedProject = { ...project, id: validId };
      const updatedProjects = [...projects, updatedProject];
      
      // Salvar de volta
      await this.saveBoard(userId, updatedProjects);
      
      console.log('✅ Projeto adicionado');
    } catch (error) {
      console.error('❌ Erro ao adicionar projeto:', error);
      throw error;
    }
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    try {
      // Carregar projetos atuais
      const projects = await this.loadBoard(userId);
      
      // Remover o projeto específico
      const updatedProjects = projects.filter(p => p.id !== projectId);
      
      // Salvar de volta
      await this.saveBoard(userId, updatedProjects);
      
      console.log('✅ Projeto deletado');
    } catch (error) {
      console.error('❌ Erro ao deletar projeto:', error);
      throw error;
    }
  }
}

export const supabaseKanbanService = new SupabaseKanbanService();
