
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Task } from '../types';

export const taskService = {
  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      console.log('📋 Buscando tasks do usuário:', userId);
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      
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
      const tasksRef = collection(db, 'tasks');
      
      // Filtrar campos undefined antes de salvar
      const cleanTask: any = {
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        completed: task.completed,
        userId: task.userId,
        createdAt: serverTimestamp()
      };

      // Só adicionar dueDate se existir e não for vazio
      if (task.dueDate && task.dueDate.trim()) {
        cleanTask.dueDate = task.dueDate;
      }
      
      const docRef = await addDoc(tasksRef, cleanTask);
      console.log('✅ Task salva com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao salvar task:', error);
      throw error;
    }
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      console.log('🔄 Atualizando task:', taskId);
      const taskRef = doc(db, 'tasks', taskId);
      
      // Filtrar campos undefined antes de atualizar
      const cleanUpdates: any = {
        updatedAt: serverTimestamp()
      };

      // Só adicionar campos que não são undefined
      if (updates.title !== undefined) cleanUpdates.title = updates.title;
      if (updates.description !== undefined) cleanUpdates.description = updates.description;
      if (updates.priority !== undefined) cleanUpdates.priority = updates.priority;
      if (updates.status !== undefined) cleanUpdates.status = updates.status;
      if (updates.completed !== undefined) cleanUpdates.completed = updates.completed;
      if (updates.dueDate !== undefined && updates.dueDate.trim()) {
        cleanUpdates.dueDate = updates.dueDate;
      }
      
      await updateDoc(taskRef, cleanUpdates);
      console.log('✅ Task atualizada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar task:', error);
      throw error;
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    try {
      console.log('🗑️ Deletando task:', taskId);
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
      console.log('✅ Task deletada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar task:', error);
      throw error;
    }
  },

  // NOVO: Função para migrar tasks do localStorage para Firebase
  async migrateLocalStorageTasks(userId: string): Promise<void> {
    try {
      console.log('🔄 Verificando tasks no localStorage para migrar...');
      
      // Buscar tasks do localStorage
      const localTasks = localStorage.getItem('tasks');
      if (!localTasks) {
        console.log('📭 Nenhuma task encontrada no localStorage');
        return;
      }

      const tasks = JSON.parse(localTasks);
      if (!Array.isArray(tasks) || tasks.length === 0) {
        console.log('📭 Nenhuma task válida encontrada no localStorage');
        return;
      }

      console.log(`📦 Encontradas ${tasks.length} tasks no localStorage para migrar`);

      // Migrar cada task para o Firebase
      for (const task of tasks) {
        try {
          const taskData: any = {
            title: task.title || 'Task sem título',
            description: task.description || '',
            priority: task.priority || 'média',
            status: task.status || 'todo',
            completed: task.completed || false,
            userId: userId
          };

          // Só adicionar dueDate se existir e não for vazio
          if (task.dueDate && task.dueDate.trim()) {
            taskData.dueDate = task.dueDate;
          }

          await this.addTask(taskData);
          console.log('✅ Task migrada:', task.title);
        } catch (error) {
          console.error('❌ Erro ao migrar task:', task.title, error);
        }
      }

      // Limpar localStorage após migração bem-sucedida
      localStorage.removeItem('tasks');
      console.log('🧹 localStorage limpo após migração');
      
    } catch (error) {
      console.error('❌ Erro na migração do localStorage:', error);
    }
  }
};
