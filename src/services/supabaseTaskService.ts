
import { supabase } from '@/integrations/supabase/client';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'alta' | 'média' | 'baixa';
  status: 'todo' | 'in_progress' | 'done';
  completed: boolean;
  dueDate?: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

export const supabaseTaskService = {
  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      console.log('📋 Buscando tasks do usuário:', userId);
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tasks: Task[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        priority: item.priority as 'alta' | 'média' | 'baixa',
        status: item.status as 'todo' | 'in_progress' | 'done',
        completed: item.completed || false,
        dueDate: item.due_date || '',
        userId: item.user_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      console.log('✅ Tasks encontradas:', tasks.length);
      return tasks;
    } catch (error) {
      console.error('❌ Erro ao buscar tasks:', error);
      throw error;
    }
  },

  async addTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<string> {
    try {
      console.log('💾 Salvando nova task:', task.title);
      
      const taskData = {
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        completed: task.completed,
        due_date: task.dueDate && task.dueDate.trim() ? task.dueDate : null,
        user_id: task.userId
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Task salva com ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('❌ Erro ao salvar task:', error);
      throw error;
    }
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      console.log('🔄 Atualizando task:', taskId);
      
      const updateData: any = {};

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.completed !== undefined) updateData.completed = updates.completed;
      if (updates.dueDate !== undefined) {
        updateData.due_date = updates.dueDate && updates.dueDate.trim() ? updates.dueDate : null;
      }
      
      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
      
      console.log('✅ Task atualizada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar task:', error);
      throw error;
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    try {
      console.log('🗑️ Deletando task:', taskId);
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      console.log('✅ Task deletada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar task:', error);
      throw error;
    }
  }
};
