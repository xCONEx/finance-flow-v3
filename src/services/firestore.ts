
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  arrayUnion,
  arrayRemove,
  deleteField
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

export interface FirestoreUser {
  email: string;
  uid: string;
  logobase64: string;
  equipaments: Array<{
    id: string;
    description: string;
    category: string;
    value: number;
  }>;
  expenses: Array<{
    id: string;
    description: string;
    category: string;
    value: number;
  }>;
  jobs: Array<{
    assistance: string;
    category: string;
    client: string;
    date: string;
    descriptions: string;
    difficulty: string;
    equipment: string;
    eventDate: string;
    hours: number;
    logistics: string;
    profit: number;
    status: string;
    value: number;
  }>;
  routine: {
    dailyHours: number;
    dalilyValue: number;
    desiredSalary: number;
    workDays: number;
  };
}

export interface FirestoreTask {
  name: string;
  description: string;
  date: string;
  status: string;
  ownerUID: string; // Confirma que tasks usam ownerUID
}

export interface FirestoreAgency extends FirestoreUser {
  colaboradores: Array<{
    uid: string;
    email: string;
    name?: string;
  }>;
  ownerUID: string;
}

class FirestoreService {
  // User operations - usando coleção 'usuarios' com uid
  async getUserData(uid: string): Promise<FirestoreUser | null> {
    try {
      console.log('🔍 Buscando dados do usuário na coleção usuarios:', uid);
      const userDoc = await getDoc(doc(db, 'usuarios', uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as FirestoreUser;
        console.log('✅ Dados do usuário encontrados:', {
          equipaments: data.equipaments?.length || 0,
          expenses: data.expenses?.length || 0,
          jobs: data.jobs?.length || 0,
          routine: data.routine
        });
        return data;
      }
      console.log('❌ Usuário não encontrado na coleção usuarios');
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar dados do usuário:', error);
      throw error;
    }
  }

  async createUser(userData: FirestoreUser): Promise<void> {
    try {
      console.log('📝 Criando usuário na coleção usuarios:', userData.uid);
      await setDoc(doc(db, 'usuarios', userData.uid), userData);
      console.log('✅ Usuário criado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      throw error;
    }
  }

  async updateUserField(uid: string, field: string, value: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'usuarios', uid), {
        [field]: value
      });
      console.log('✅ Campo atualizado:', field);
    } catch (error) {
      console.error('❌ Erro ao atualizar campo do usuário:', error);
      throw error;
    }
  }

  // Equipaments operations - estrutura de array no documento do usuário/agência
  async addEquipament(uid: string, equipament: any): Promise<void> {
    try {
      console.log('📦 Adicionando equipamento para uid:', uid);
      await updateDoc(doc(db, 'usuarios', uid), {
        equipaments: arrayUnion(equipament)
      });
      console.log('✅ Equipamento adicionado');
    } catch (error) {
      console.error('❌ Erro ao adicionar equipamento:', error);
      throw error;
    }
  }

  async removeEquipament(uid: string, equipament: any): Promise<void> {
    try {
      console.log('🗑️ Removendo equipamento para uid:', uid);
      await updateDoc(doc(db, 'usuarios', uid), {
        equipaments: arrayRemove(equipament)
      });
      console.log('✅ Equipamento removido');
    } catch (error) {
      console.error('❌ Erro ao remover equipamento:', error);
      throw error;
    }
  }

  async updateEquipaments(uid: string, equipaments: any[]): Promise<void> {
    try {
      console.log('🔄 Atualizando lista de equipamentos para uid:', uid);
      await updateDoc(doc(db, 'usuarios', uid), {
        equipaments: equipaments
      });
      console.log('✅ Lista de equipamentos atualizada');
    } catch (error) {
      console.error('❌ Erro ao atualizar equipamentos:', error);
      throw error;
    }
  }

  // Expenses operations - estrutura de array no documento do usuário/agência
  async addExpense(uid: string, expense: any): Promise<void> {
    try {
      console.log('💰 Adicionando despesa para uid:', uid);
      await updateDoc(doc(db, 'usuarios', uid), {
        expenses: arrayUnion(expense)
      });
      console.log('✅ Despesa adicionada');
    } catch (error) {
      console.error('❌ Erro ao adicionar despesa:', error);
      throw error;
    }
  }

  async removeExpense(uid: string, expense: any): Promise<void> {
    try {
      console.log('🗑️ Removendo despesa para uid:', uid);
      await updateDoc(doc(db, 'usuarios', uid), {
        expenses: arrayRemove(expense)
      });
      console.log('✅ Despesa removida');
    } catch (error) {
      console.error('❌ Erro ao remover despesa:', error);
      throw error;
    }
  }

  async updateExpenses(uid: string, expenses: any[]): Promise<void> {
    try {
      console.log('🔄 Atualizando lista de despesas para uid:', uid);
      await updateDoc(doc(db, 'usuarios', uid), {
        expenses: expenses
      });
      console.log('✅ Lista de despesas atualizada');
    } catch (error) {
      console.error('❌ Erro ao atualizar despesas:', error);
      throw error;
    }
  }

  // Jobs operations
  async addJob(uid: string, job: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'usuarios', uid), {
        jobs: arrayUnion(job)
      });
    } catch (error) {
      console.error('Error adding job:', error);
      throw error;
    }
  }

  async removeJob(uid: string, job: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'usuarios', uid), {
        jobs: arrayRemove(job)
      });
    } catch (error) {
      console.error('Error removing job:', error);
      throw error;
    }
  }

  async updateJobs(uid: string, jobs: any[]): Promise<void> {
    try {
      await updateDoc(doc(db, 'usuarios', uid), {
        jobs: jobs
      });
    } catch (error) {
      console.error('Error updating jobs:', error);
      throw error;
    }
  }

  // Routine operations
  async updateRoutine(uid: string, routine: any): Promise<void> {
    try {
      console.log('⏰ Atualizando rotina para uid:', uid);
      await updateDoc(doc(db, 'usuarios', uid), {
        routine: routine
      });
      console.log('✅ Rotina atualizada');
    } catch (error) {
      console.error('❌ Erro ao atualizar rotina:', error);
      throw error;
    }
  }

  // Tasks operations - usando coleção 'tasks' separada com ownerUID
  async getUserTasks(userId: string): Promise<FirestoreTask[]> {
    try {
      console.log('📋 Buscando tasks para ownerUID:', userId);
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('ownerUID', '==', userId)
      );
      const querySnapshot = await getDocs(tasksQuery);
      const tasks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FirestoreTask & { id: string }));
      console.log('✅ Tasks encontradas:', tasks.length);
      return tasks;
    } catch (error) {
      console.error('❌ Erro ao buscar tasks:', error);
      return [];
    }
  }

  async addTask(taskData: FirestoreTask): Promise<void> {
    try {
      console.log('📝 Adicionando task com ownerUID:', taskData.ownerUID);
      await setDoc(doc(collection(db, 'tasks')), taskData);
      console.log('✅ Task adicionada');
    } catch (error) {
      console.error('❌ Erro ao adicionar task:', error);
      throw error;
    }
  }

  // Agency operations - verificando colaboradores com estrutura correta
  async getUserAgency(uid: string): Promise<(FirestoreAgency & { id: string }) | null> {
    try {
      console.log('🏢 Buscando agência para uid:', uid);
      
      // Primeiro verificar se é colaborador
      const agenciesQuery = query(
        collection(db, 'agencias'),
        where('colaboradores', 'array-contains', { uid: uid })
      );
      const querySnapshot = await getDocs(agenciesQuery);
      
      if (!querySnapshot.empty) {
        const agencyDoc = querySnapshot.docs[0];
        const agencyData = {
          id: agencyDoc.id,
          ...agencyDoc.data()
        } as FirestoreAgency & { id: string };
        console.log('✅ Agência encontrada como colaborador:', agencyData.id);
        return agencyData;
      }
      
      // Se não encontrar como colaborador, verificar se é owner
      const ownerQuery = query(
        collection(db, 'agencias'),
        where('ownerUID', '==', uid)
      );
      const ownerSnapshot = await getDocs(ownerQuery);
      
      if (!ownerSnapshot.empty) {
        const agencyDoc = ownerSnapshot.docs[0];
        const agencyData = {
          id: agencyDoc.id,
          ...agencyDoc.data()
        } as FirestoreAgency & { id: string };
        console.log('✅ Agência encontrada como owner:', agencyData.id);
        return agencyData;
      }
      
      console.log('❌ Usuário não pertence a nenhuma agência');
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar agência:', error);
      return null;
    }
  }

  async getAgencyData(agencyId: string): Promise<FirestoreAgency | null> {
    try {
      const agencyDoc = await getDoc(doc(db, 'agencias', agencyId));
      if (agencyDoc.exists()) {
        return agencyDoc.data() as FirestoreAgency;
      }
      return null;
    } catch (error) {
      console.error('Error getting agency data:', error);
      throw error;
    }
  }

  // Métodos específicos para agências (quando necessário)
  async addAgencyEquipament(agencyId: string, equipament: any): Promise<void> {
    try {
      console.log('📦 Adicionando equipamento para agência:', agencyId);
      await updateDoc(doc(db, 'agencias', agencyId), {
        equipaments: arrayUnion(equipament)
      });
      console.log('✅ Equipamento adicionado à agência');
    } catch (error) {
      console.error('❌ Erro ao adicionar equipamento à agência:', error);
      throw error;
    }
  }

  async removeAgencyEquipament(agencyId: string, equipament: any): Promise<void> {
    try {
      console.log('🗑️ Removendo equipamento da agência:', agencyId);
      await updateDoc(doc(db, 'agencias', agencyId), {
        equipaments: arrayRemove(equipament)
      });
      console.log('✅ Equipamento removido da agência');
    } catch (error) {
      console.error('❌ Erro ao remover equipamento da agência:', error);
      throw error;
    }
  }

  async addAgencyExpense(agencyId: string, expense: any): Promise<void> {
    try {
      console.log('💰 Adicionando despesa para agência:', agencyId);
      await updateDoc(doc(db, 'agencias', agencyId), {
        expenses: arrayUnion(expense)
      });
      console.log('✅ Despesa adicionada à agência');
    } catch (error) {
      console.error('❌ Erro ao adicionar despesa à agência:', error);
      throw error;
    }
  }

  async removeAgencyExpense(agencyId: string, expense: any): Promise<void> {
    try {
      console.log('🗑️ Removendo despesa da agência:', agencyId);
      await updateDoc(doc(db, 'agencias', agencyId), {
        expenses: arrayRemove(expense)
      });
      console.log('✅ Despesa removida da agência');
    } catch (error) {
      console.error('❌ Erro ao remover despesa da agência:', error);
      throw error;
    }
  }
}

export const firestoreService = new FirestoreService();
