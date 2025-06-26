
import { supabase } from '../integrations/supabase/client';

export interface KanbanProject {
  id: string;
  title: string;
  client: string;
  dueDate: string;
  priority: 'alta' | 'media' | 'baixa';
  status: 'filmado' | 'edicao' | 'revisao' | 'entregue';
  description: string;
  links: string[];
  createdAt: string;
  updatedAt: string;
  user_id: string;
  agency_id?: string | null;
}

class SupabaseKanbanService {
  async loadBoard(userId: string): Promise<KanbanProject[]> {
    try {
      console.log('📥 Carregando board individual para usuário:', userId);
      
      const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('user_id', userId)
        .is('agency_id', null)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erro ao carregar board individual:', error);
        return [];
      }

      if (!data || !data.board_data) {
        console.log('📄 Nenhum board individual encontrado, criando novo');
        return [];
      }

      const projects = Array.isArray(data.board_data) ? data.board_data : [];
      console.log('✅ Board individual carregado com sucesso:', projects.length, 'projetos');
      return projects;
    } catch (error) {
      console.error('❌ Erro ao carregar board individual:', error);
      return [];
    }
  }

  async loadAgencyBoard(agencyId: string): Promise<KanbanProject[]> {
    try {
      console.log('📥 Carregando board da agência:', agencyId);
      
      const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('agency_id', agencyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erro ao carregar board da agência:', error);
        return [];
      }

      if (!data || !data.board_data) {
        console.log('📄 Nenhum board da agência encontrado, criando novo');
        return [];
      }

      const projects = Array.isArray(data.board_data) ? data.board_data : [];
      console.log('✅ Board da agência carregado com sucesso:', projects.length, 'projetos');
      return projects;
    } catch (error) {
      console.error('❌ Erro ao carregar board da agência:', error);
      return [];
    }
  }

  async saveBoard(userId: string, projects: KanbanProject[]): Promise<void> {
    try {
      console.log('💾 Salvando board individual:', projects.length, 'projetos');

      const { error } = await supabase
        .from('kanban_boards')
        .upsert({
          user_id: userId,
          agency_id: null,
          board_data: projects,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Erro ao salvar board individual:', error);
        throw error;
      }

      console.log('✅ Board individual salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar board individual:', error);
      throw error;
    }
  }

  async saveAgencyBoard(agencyId: string, projects: KanbanProject[]): Promise<void> {
    try {
      console.log('💾 Salvando board da agência:', agencyId, '-', projects.length, 'projetos');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('kanban_boards')
        .upsert({
          user_id: user.id,
          agency_id: agencyId,
          board_data: projects,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Erro ao salvar board da agência:', error);
        throw error;
      }

      console.log('✅ Board da agência salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar board da agência:', error);
      throw error;
    }
  }
}

export const supabaseKanbanService = new SupabaseKanbanService();
