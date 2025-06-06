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
  deleteField,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

export interface FirestoreUser {
  email: string;
  uid: string;
  logobase64: string;
  imageuser?: string; // Nova propriedade para a foto do usuário
  phone?: string;
  company?: string;
  personalInfo?: {
    phone: string;
    company: string;
  };
  equipments: Array<{
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
    id: string;
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
  ownerUID: string;
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
          equipments: data.equipments?.length || 0,
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
      console.log('🔄 Atualizando campo do usuário:', field, value);
      await updateDoc(doc(db, 'usuarios', uid), {
        [field]: value
      });
      console.log('✅ Campo atualizado:', field);
    } catch (error) {
      console.error('❌ Erro ao atualizar campo do usuário:', error);
      throw error;
    }
  }

  // Equipment operations
  async addEquipment(uid: string, equipment: any): Promise<void> {
    try {
      console.log('📦 Adicionando equipamento para uid:', uid);
      await updateDoc(doc(db, 'usuarios', uid), {
        equipments: arrayUnion(equipment)
      });
      console.log('✅ Equipamento adicionado');
    } catch (error) {
      console.error('❌ Erro ao adicionar equipamento:', error);
      throw error;
    }
  }

  async removeEquipment(uid: string, equipment: any): Promise<void> {
    try {
      console.log('🗑️ Removendo equipamento para uid:', uid);
      await updateDoc(doc(db, 'usuarios', uid), {
        equipments: arrayRemove(equipment)
      });
      console.log('✅ Equipamento removido');
    } catch (error) {
      console.error('❌ Erro ao remover equipamento:', error);
      throw error;
    }
  }

  async updateEquipments(uid: string, equipments: any[]): Promise<void> {
    try {
      console.log('🔄 Atualizando lista de equipamentos para uid:', uid);
      await updateDoc(doc(db, 'usuarios', uid), {
        equipments: equipments
      });
      console.log('✅ Lista de equipamentos atualizada');
    } catch (error) {
      console.error('❌ Erro ao atualizar equipamentos:', error);
      throw error;
    }
  }

  // Expenses operations
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

  // Jobs operations - CORRIGIDO para usar IDs únicos
  async addJob(uid: string, job: any): Promise<void> {
    try {
      console.log('💼 Adicionando job para uid:', uid);
      const currentData = await this.getUserData(uid);
      const jobs = currentData?.jobs || [];
      
      const newJob = {
        ...job,
        id: job.id || crypto.randomUUID() // Garantir que tem ID
      };
      
      jobs.push(newJob);
      
      await updateDoc(doc(db, 'usuarios', uid), {
        jobs: jobs
      });
      console.log('✅ Job adicionado com ID:', newJob.id);
    } catch (error) {
      console.error('❌ Erro ao adicionar job:', error);
      throw error;
    }
  }

  async updateJob(uid: string, jobId: string, updatedJob: any): Promise<void> {
    try {
      console.log('🔄 Atualizando job:', jobId);
      const currentData = await this.getUserData(uid);
      if (!currentData || !currentData.jobs) return;
      
      const jobs = currentData.jobs.map(job => 
        job.id === jobId ? { ...job, ...updatedJob, id: jobId } : job
      );
      
      await updateDoc(doc(db, 'usuarios', uid), {
        jobs: jobs
      });
      console.log('✅ Job atualizado no Firebase');
    } catch (error) {
      console.error('❌ Erro ao atualizar job:', error);
      throw error;
    }
  }

  async removeJob(uid: string, jobId: string): Promise<void> {
    try {
      console.log('🗑️ Removendo job:', jobId);
      const currentData = await this.getUserData(uid);
      if (!currentData || !currentData.jobs) return;
      
      const jobs = currentData.jobs.filter(job => job.id !== jobId);
      
      await updateDoc(doc(db, 'usuarios', uid), {
        jobs: jobs
      });
      console.log('✅ Job removido do Firebase');
    } catch (error) {
      console.error('❌ Erro ao remover job:', error);
      throw error;
    }
  }

  async updateJobs(uid: string, jobs: any[]): Promise<void> {
    try {
      console.log('🔄 Atualizando lista completa de jobs:', uid);
      await updateDoc(doc(db, 'usuarios', uid), {
        jobs: jobs
      });
      console.log('✅ Lista de jobs atualizada');
    } catch (error) {
      console.error('❌ Erro ao atualizar jobs:', error);
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

  // Tasks operations - usando coleção 'tasks' separada
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

  async addTask(taskData: FirestoreTask): Promise<string> {
    try {
      console.log('📝 Adicionando task com ownerUID:', taskData.ownerUID);
      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      console.log('✅ Task adicionada com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao adicionar task:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, taskData: Partial<FirestoreTask>): Promise<void> {
    try {
      console.log('📝 Atualizando task:', taskId, taskData);
      await updateDoc(doc(db, 'tasks', taskId), taskData);
      console.log('✅ Task atualizada no Firestore');
    } catch (error) {
      console.error('❌ Erro ao atualizar task:', error);
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      console.log('🗑️ Deletando task completamente:', taskId);
      await deleteDoc(doc(db, 'tasks', taskId));
      console.log('✅ Task deletada do Firestore');
    } catch (error) {
      console.error('❌ Erro ao deletar task:', error);
      throw error;
    }
  }

  // Agency operations
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

  // Métodos específicos para agências
  async addAgencyEquipment(agencyId: string, equipment: any): Promise<void> {
    try {
      console.log('📦 Adicionando equipamento para agência:', agencyId);
      await updateDoc(doc(db, 'agencias', agencyId), {
        equipments: arrayUnion(equipment)
      });
      console.log('✅ Equipamento adicionado à agência');
    } catch (error) {
      console.error('❌ Erro ao adicionar equipamento à agência:', error);
      throw error;
    }
  }

  async removeAgencyEquipment(agencyId: string, equipment: any): Promise<void> {
    try {
      console.log('🗑️ Removendo equipamento da agência:', agencyId);
      await updateDoc(doc(db, 'agencias', agencyId), {
        equipments: arrayRemove(equipment)
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

  // Métodos específicos para jobs de agências - CORRIGIDOS
  async addAgencyJob(agencyId: string, job: any): Promise<void> {
    try {
      console.log('💼 Adicionando job para agência:', agencyId);
      const currentData = await this.getAgencyData(agencyId);
      const jobs = currentData?.jobs || [];
      
      const newJob = {
        ...job,
        id: job.id || crypto.randomUUID()
      };
      
      jobs.push(newJob);
      
      await updateDoc(doc(db, 'agencias', agencyId), {
        jobs: jobs
      });
      console.log('✅ Job adicionado à agência');
    } catch (error) {
      console.error('❌ Erro ao adicionar job à agência:', error);
      throw error;
    }
  }

  async updateAgencyJob(agencyId: string, jobId: string, updatedJob: any): Promise<void> {
    try {
      console.log('🔄 Atualizando job da agência:', jobId);
      const currentData = await this.getAgencyData(agencyId);
      if (!currentData || !currentData.jobs) return;
      
      const jobs = currentData.jobs.map(job => 
        job.id === jobId ? { ...job, ...updatedJob, id: jobId } : job
      );
      
      await updateDoc(doc(db, 'agencias', agencyId), {
        jobs: jobs
      });
      console.log('✅ Job da agência atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar job da agência:', error);
      throw error;
    }
  }

  async removeAgencyJob(agencyId: string, jobId: string): Promise<void> {
    try {
      console.log('🗑️ Removendo job da agência:', jobId);
      const currentData = await this.getAgencyData(agencyId);
      if (!currentData || !currentData.jobs) return;
      
      const jobs = currentData.jobs.filter(job => job.id !== jobId);
      
      await updateDoc(doc(db, 'agencias', agencyId), {
        jobs: jobs
      });
      console.log('✅ Job removido da agência');
    } catch (error) {
      console.error('❌ Erro ao remover job da agência:', error);
      throw error;
    }
  }

  async updateAgencyJobs(agencyId: string, jobs: any[]): Promise<void> {
    try {
      console.log('🔄 Atualizando lista de jobs da agência:', agencyId);
      await updateDoc(doc(db, 'agencias', agencyId), {
        jobs: jobs
      });
      console.log('✅ Lista de jobs da agência atualizada');
    } catch (error) {
      console.error('❌ Erro ao atualizar jobs da agência:', error);
      throw error;
    }
  }

  // Método para importar dados JSON
  async importUserData(uid: string, jsonData: any): Promise<void> {
    try {
      console.log('📥 Importando dados JSON para uid:', uid);
      
      const updateData: any = {};
      
      if (jsonData.equipments) {
        updateData.equipments = jsonData.equipments;
      }
      
      if (jsonData.expenses) {
        updateData.expenses = jsonData.expenses;
      }
      
      if (jsonData.routine) {
        updateData.routine = jsonData.routine;
      }
      
      if (jsonData.jobs) {
        updateData.jobs = jsonData.jobs;
      }
      
      await updateDoc(doc(db, 'usuarios', uid), updateData);
      console.log('✅ Dados JSON importados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao importar dados JSON:', error);
      throw error;
    }
  }

  // Novos métodos para sistema administrativo e empresas
  async getAllUsers(): Promise<any[]> {
    try {
      console.log('🔍 Buscando todos os usuários...');
      const usersQuery = query(collection(db, 'usuarios'));
      const querySnapshot = await getDocs(usersQuery);
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Usuários encontrados:', users.length);
      return users;
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return [];
    }
  }

  async getAllCompanies(): Promise<any[]> {
    try {
      console.log('🔍 Buscando todas as empresas...');
      const companiesQuery = query(collection(db, 'agencias'));
      const querySnapshot = await getDocs(companiesQuery);
      const companies = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Empresas encontradas:', companies.length);
      return companies;
    } catch (error) {
      console.error('❌ Erro ao buscar empresas:', error);
      return [];
    }
  }

  async createCompany(companyData: any): Promise<string> {
    try {
      console.log('🏢 Criando nova empresa:', companyData.name);
      const docRef = await addDoc(collection(db, 'agencias'), companyData);
      console.log('✅ Empresa criada com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar empresa:', error);
      throw error;
    }
  }

  async updateUserSubscription(uid: string, subscription: string): Promise<void> {
    try {
      console.log('💳 Atualizando assinatura do usuário:', uid, subscription);
      await updateDoc(doc(db, 'usuarios', uid), {
        subscription: subscription
      });
      console.log('✅ Assinatura atualizada');
    } catch (error) {
      console.error('❌ Erro ao atualizar assinatura:', error);
      throw error;
    }
  }

  async banUser(uid: string, banned: boolean): Promise<void> {
    try {
      console.log(`🚫 ${banned ? 'Banindo' : 'Desbanindo'} usuário:`, uid);
      await updateDoc(doc(db, 'usuarios', uid), {
        banned: banned
      });
      console.log('✅ Status de ban atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar status de ban:', error);
      throw error;
    }
  }

  // Sistema de convites
  async sendInvite(inviteData: any): Promise<string> {
    try {
      console.log('📧 Enviando convite:', inviteData.email);
      const docRef = await addDoc(collection(db, 'invites'), {
        ...inviteData,
        sentAt: new Date().toISOString(),
        status: 'pending'
      });
      console.log('✅ Convite enviado com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao enviar convite:', error);
      throw error;
    }
  }

  async getUserInvites(email: string): Promise<any[]> {
    try {
      console.log('📬 Buscando convites para:', email);
      const invitesQuery = query(
        collection(db, 'invites'),
        where('email', '==', email),
        where('status', '==', 'pending')
      );
      const querySnapshot = await getDocs(invitesQuery);
      const invites = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Convites encontrados:', invites.length);
      return invites;
    } catch (error) {
      console.error('❌ Erro ao buscar convites:', error);
      return [];
    }
  }

  async getCompanyInvites(companyId: string): Promise<any[]> {
    try {
      console.log('📬 Buscando convites da empresa:', companyId);
      const invitesQuery = query(
        collection(db, 'invites'),
        where('companyId', '==', companyId)
      );
      const querySnapshot = await getDocs(invitesQuery);
      const invites = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Convites da empresa encontrados:', invites.length);
      return invites;
    } catch (error) {
      console.error('❌ Erro ao buscar convites da empresa:', error);
      return [];
    }
  }

  async acceptInvite(inviteId: string, userId: string, companyId: string): Promise<void> {
    try {
      console.log('✅ Aceitando convite:', inviteId);
      
      // Buscar dados do usuário
      const userData = await this.getUserData(userId);
      if (!userData) throw new Error('Usuário não encontrado');

      // Atualizar usuário para employee
      await updateDoc(doc(db, 'usuarios', userId), {
        userType: 'employee',
        companyId: companyId
      });

      // Adicionar usuário à empresa
      const companyRef = doc(db, 'agencias', companyId);
      await updateDoc(companyRef, {
        colaboradores: arrayUnion({ 
          uid: userId, 
          email: userData.email, 
          role: 'employee',
          joinedAt: new Date().toISOString()
        })
      });

      // Remover convite
      await deleteDoc(doc(db, 'invites', inviteId));
      
      console.log('✅ Convite aceito com sucesso');
    } catch (error) {
      console.error('❌ Erro ao aceitar convite:', error);
      throw error;
    }
  }

  async updateInviteStatus(inviteId: string, status: string): Promise<void> {
    try {
      console.log('🔄 Atualizando status do convite:', inviteId, status);
      await updateDoc(doc(db, 'invites', inviteId), {
        status: status,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Status do convite atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar status do convite:', error);
      throw error;
    }
  }

  async removeCompanyMember(companyId: string, memberId: string): Promise<void> {
    try {
      console.log('🗑️ Removendo membro da empresa:', companyId, memberId);
      
      // Buscar dados da empresa
      const companyData = await this.getAgencyData(companyId);
      if (!companyData) throw new Error('Empresa não encontrada');

      // Filtrar colaboradores removendo o membro
      const updatedColaboradores = companyData.colaboradores.filter(
        (colaborador: any) => colaborador.uid !== memberId
      );

      // Atualizar empresa
      await updateDoc(doc(db, 'agencias', companyId), {
        colaboradores: updatedColaboradores
      });

      // Atualizar usuário removido
      await updateDoc(doc(db, 'usuarios', memberId), {
        userType: 'individual',
        companyId: deleteField()
      });

      console.log('✅ Membro removido da empresa');
    } catch (error) {
      console.error('❌ Erro ao remover membro da empresa:', error);
      throw error;
    }
  }

  // Melhorar o método saveKanbanBoard
  async saveKanbanBoard(companyId: string, boardData: any): Promise<void> {
    try {
      console.log('💾 Salvando board do Kanban para empresa:', companyId);
      await setDoc(doc(db, 'kanban_boards', companyId), {
        ...boardData,
        updatedAt: new Date().toISOString(),
        companyId: companyId
      });
      console.log('✅ Board salvo');
    } catch (error) {
      console.error('❌ Erro ao salvar board:', error);
      throw error;
    }
  }

  async getKanbanBoard(companyId: string): Promise<any> {
    try {
      console.log('📋 Carregando board do Kanban para empresa:', companyId);
      const boardDoc = await getDoc(doc(db, 'kanban_boards', companyId));
      if (boardDoc.exists()) {
        return boardDoc.data();
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao carregar board:', error);
      return null;
    }
  }

  // Novos métodos para analytics
  async getAnalyticsData(): Promise<any> {
    try {
      console.log('📊 Carregando dados de analytics...');
      
      // Buscar todos os dados necessários
      const [users, companies, tasks, jobs] = await Promise.all([
        this.getAllUsers(),
        this.getAllCompanies(),
        this.getAllTasks(),
        this.getAllJobs()
      ]);

      // Calcular estatísticas
      const totalUsers = users.length;
      const totalCompanies = companies.length;
      const activeUsers = users.filter(u => !u.banned).length;
      const premiumUsers = users.filter(u => u.subscription === 'premium').length;
      const bannedUsers = users.filter(u => u.banned).length;
      
      // Estatísticas por tipo de usuário
      const userTypes = {
        individual: users.filter(u => u.userType === 'individual').length,
        company_owner: users.filter(u => u.userType === 'company_owner').length,
        employee: users.filter(u => u.userType === 'employee').length,
        admin: users.filter(u => u.userType === 'admin').length
      };

      // Estatísticas de jobs
      const totalJobs = jobs.length;
      const approvedJobs = jobs.filter(j => j.status === 'aprovado').length;
      const pendingJobs = jobs.filter(j => j.status === 'pendente').length;
      
      // Receita total dos jobs aprovados
      const totalRevenue = jobs
        .filter(j => j.status === 'aprovado')
        .reduce((sum, job) => sum + (job.valueWithDiscount || job.serviceValue || 0), 0);

      // Estatísticas de tarefas
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.completed).length;
      const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Crescimento mensal (simulado para demonstração)
      const monthlyGrowth = this.calculateMonthlyGrowth(users);

      const analyticsData = {
        overview: {
          totalUsers,
          totalCompanies,
          activeUsers,
          premiumUsers,
          bannedUsers,
          totalRevenue,
          totalJobs,
          totalTasks
        },
        userStats: {
          userTypes,
          activeUsers,
          premiumUsers,
          bannedUsers,
          conversionRate: totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0
        },
        businessStats: {
          totalJobs,
          approvedJobs,
          pendingJobs,
          totalRevenue,
          averageJobValue: approvedJobs > 0 ? totalRevenue / approvedJobs : 0,
          jobApprovalRate: totalJobs > 0 ? (approvedJobs / totalJobs) * 100 : 0
        },
        productivity: {
          totalTasks,
          completedTasks,
          taskCompletionRate,
          averageTasksPerUser: totalUsers > 0 ? totalTasks / totalUsers : 0
        },
        growth: monthlyGrowth,
        recentActivity: {
          newUsersThisMonth: users.filter(u => this.isFromThisMonth(u.createdAt)).length,
          newCompaniesThisMonth: companies.filter(c => this.isFromThisMonth(c.createdAt)).length,
          newJobsThisMonth: jobs.filter(j => this.isFromThisMonth(j.date)).length
        }
      };

      console.log('✅ Dados de analytics carregados:', analyticsData);
      return analyticsData;
    } catch (error) {
      console.error('❌ Erro ao carregar analytics:', error);
      return null;
    }
  }

  private calculateMonthlyGrowth(users: any[]): any[] {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthUsers = users.filter(user => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return userDate.getFullYear() === currentYear && userDate.getMonth() === index;
      }).length;
      
      return {
        month,
        users: monthUsers,
        revenue: monthUsers * 50 // Simulado
      };
    });
  }

  private isFromThisMonth(dateString: string): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  async getAllTasks(): Promise<any[]> {
    try {
      console.log('📋 Buscando todas as tarefas...');
      const tasksQuery = query(collection(db, 'tasks'));
      const querySnapshot = await getDocs(tasksQuery);
      const tasks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Tarefas encontradas:', tasks.length);
      return tasks;
    } catch (error) {
      console.error('❌ Erro ao buscar tarefas:', error);
      return [];
    }
  }

  async getAllJobs(): Promise<any[]> {
    try {
      console.log('💼 Buscando todos os jobs...');
      
      // Buscar jobs de usuários individuais
      const users = await this.getAllUsers();
      const allJobs = [];
      
      for (const user of users) {
        if (user.jobs && Array.isArray(user.jobs)) {
          allJobs.push(...user.jobs.map(job => ({ ...job, userId: user.id })));
        }
      }
      
      // Buscar jobs de empresas
      const companies = await this.getAllCompanies();
      for (const company of companies) {
        if (company.jobs && Array.isArray(company.jobs)) {
          allJobs.push(...company.jobs.map(job => ({ ...job, companyId: company.id })));
        }
      }
      
      console.log('✅ Jobs encontrados:', allJobs.length);
      return allJobs;
    } catch (error) {
      console.error('❌ Erro ao buscar jobs:', error);
      return [];
    }
  }
}

export const firestoreService = new FirestoreService();
