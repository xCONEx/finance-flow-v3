
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

      // First check if we have any agencies for this user
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Erro ao buscar perfil do usuário:', profileError);
        console.log('💾 Salvando no localStorage (erro no perfil)');
        localStorage.setItem('entregaFlowProjects', JSON.stringify(projects));
        localStorage.setItem('entregaFlowUserId', userId);
        return;
      }

      // If user doesn't have an agency, create one
      let agencyId = userProfile.agency_id;
      
      if (!agencyId) {
        console.log('🏢 Usuário não tem agência, criando uma...');
        
        const { data: newAgency, error: agencyError } = await supabase
          .from('agencies')
          .insert({
            name: 'Minha Agência',
            owner_uid: userId
          })
          .select('id')
          .single();

        if (agencyError) {
          console.error('❌ Erro ao criar agência:', agencyError);
          console.log('💾 Salvando no localStorage (erro ao criar agência)');
          localStorage.setItem('entregaFlowProjects', JSON.stringify(projects));
          localStorage.setItem('entregaFlowUserId', userId);
          return;
        }

        agencyId = newAgency.id;

        // Update user profile with agency_id
        await supabase
          .from('profiles')
          .update({ agency_id: agencyId })
          .eq('id', userId);

        console.log('✅ Agência criada com ID:', agencyId);
      }

      console.log('🏢 Usando agência ID:', agencyId);

      // Delete existing records for this agency
      const { error: deleteError } = await supabase
        .from('kanban_boards')
        .delete()
        .eq('agency_id', agencyId);

      if (deleteError) {
        console.error('❌ Erro ao deletar registros antigos:', deleteError);
        // Continue trying to save
      }

      // Save projects as JSON in board_data field
      const boardRecord = {
        agency_id: agencyId,
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

      // Get user's agency_id
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', userId)
        .single();

      if (profileError || !userProfile.agency_id) {
        console.log('❌ Usuário não tem agência, carregando do localStorage');
        return this.loadFromLocalStorage(userId);
      }

      const agencyId = userProfile.agency_id;
      console.log('🏢 Carregando dados da agência:', agencyId);

      const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('agency_id', agencyId)
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

      // Extract projects from board_data field
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
