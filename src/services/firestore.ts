import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  addDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

export interface FirestoreUser {
  uid: string;
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  logobase64?: string;
  equipments?: any[];
  expenses?: any[];
  jobs?: any[];
  routine?: any;
  personalInfo?: {
    phone?: string;
    company?: string;
  };
  imageuser?: string;
  userType?: 'individual' | 'company_owner' | 'employee' | 'admin';
  subscription?: 'free' | 'premium' | 'enterprise';
  banned?: boolean;
  companyId?: string;
}

export const firestoreService = {
  async createUser(user: FirestoreUser) {
    try {
      console.log('Criando usuário:', user.uid);
      const userRef = doc(db, 'usuarios', user.uid);
      await setDoc(userRef, user);
      console.log('Usuário criado com sucesso');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  },

  async getUserData(uid: string) {
    try {
      console.log('Buscando dados do usuário:', uid);
      const userRef = doc(db, 'usuarios', uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        console.log('Dados do usuário encontrados');
        return userDoc.data() as FirestoreUser;
      } else {
        console.log('Usuário não encontrado');
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      throw error;
    }
  },

  async updateUserField(uid: string, field: string, value: any) {
    try {
      console.log(`Atualizando campo ${field} do usuário ${uid}`);
      const userRef = doc(db, 'usuarios', uid);
      await updateDoc(userRef, {
        [field]: value,
        updatedAt: serverTimestamp()
      });
      console.log('Campo atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar campo:', error);
      throw error;
    }
  },

  async deleteUser(uid: string) {
    try {
      console.log('Deletando usuário:', uid);
      const userRef = doc(db, 'usuarios', uid);
      await deleteDoc(userRef);
      console.log('Usuário deletado com sucesso');
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  },

  async getUserAgency(uid: string) {
    try {
      console.log('Verificando agência do usuário:', uid);
      const agenciasRef = collection(db, 'agencias');
      const q = query(agenciasRef, where('colaboradores', 'array-contains', uid));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const agencyDoc = snapshot.docs[0];
        console.log('Agência encontrada:', agencyDoc.id);
        return { id: agencyDoc.id, ...agencyDoc.data() };
      } else {
        console.log('Usuário não pertence a nenhuma agência');
        return null;
      }
    } catch (error) {
      console.error('Erro ao verificar agência:', error);
      throw error;
    }
  },

  async getAllAgencies() {
    try {
      console.log('🏢 Buscando todas as agências...');
      const agenciasRef = collection(db, 'agencias');
      const snapshot = await getDocs(agenciasRef);
      
      const agencies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Agências encontradas:', agencies.length);
      return agencies;
    } catch (error) {
      console.error('❌ Erro ao buscar agências:', error);
      throw error;
    }
  },

  async saveKanbanBoard(agencyId: string, boardData: any) {
    try {
      console.log('💾 Salvando board do Kanban para agência:', agencyId);
      const agencyRef = doc(db, 'agencias', agencyId);
      
      await updateDoc(agencyRef, {
        kanbanBoard: boardData,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Board do Kanban salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar board do Kanban:', error);
      throw error;
    }
  },

  async getKanbanBoard(agencyId: string) {
    try {
      console.log('📦 Buscando board do Kanban para agência:', agencyId);
      const agencyRef = doc(db, 'agencias', agencyId);
      const agencyDoc = await getDoc(agencyRef);
      
      if (agencyDoc.exists()) {
        const data = agencyDoc.data();
        console.log('✅ Board do Kanban encontrado');
        return data.kanbanBoard || null;
      }
      
      console.log('❌ Agência não encontrada');
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar board do Kanban:', error);
      throw error;
    }
  },

  async sendInvite(inviteData: any) {
    try {
      console.log('📧 Enviando convite:', inviteData);
      const invitesRef = collection(db, 'convites');
      
      const newInvite = {
        ...inviteData,
        sentAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(invitesRef, newInvite);
      console.log('✅ Convite enviado com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao enviar convite:', error);
      throw error;
    }
  },

  async getCompanyInvites(companyId: string) {
    try {
      console.log('📋 Buscando convites da empresa:', companyId);
      const invitesRef = collection(db, 'convites');
      const q = query(invitesRef, where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      
      const invites = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Convites encontrados:', invites.length);
      return invites;
    } catch (error) {
      console.error('❌ Erro ao buscar convites:', error);
      throw error;
    }
  },

  async removeCompanyMember(companyId: string, memberId: string) {
    try {
      console.log('👥 Removendo membro da empresa:', { companyId, memberId });
      const agencyRef = doc(db, 'agencias', companyId);
      const agencyDoc = await getDoc(agencyRef);
      
      if (agencyDoc.exists()) {
        const data = agencyDoc.data();
        const colaboradores = data.colaboradores || [];
        
        const updatedColaboradores = colaboradores.filter(colab => colab.uid !== memberId);
        
        await updateDoc(agencyRef, {
          colaboradores: updatedColaboradores,
          updatedAt: serverTimestamp()
        });
        
        console.log('✅ Membro removido com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao remover membro:', error);
      throw error;
    }
  },

  async updateField(collection: string, docId: string, field: string, value: any) {
    try {
      console.log(`💾 Atualizando ${field} em ${collection}/${docId}`);
      const docRef = doc(db, collection, docId);
      
      await updateDoc(docRef, {
        [field]: value,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Campo atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar campo:', error);
      throw error;
    }
  },

  async getAgencyData(agencyId: string) {
    try {
      console.log('🏢 Buscando dados da agência:', agencyId);
      const agencyRef = doc(db, 'agencias', agencyId);
      const agencyDoc = await getDoc(agencyRef);
      
      if (agencyDoc.exists()) {
        console.log('✅ Dados da agência encontrados');
        return { id: agencyDoc.id, ...agencyDoc.data() };
      }
      
      console.log('❌ Agência não encontrada');
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar dados da agência:', error);
      throw error;
    }
  },

  async getAllUsers() {
    try {
      console.log('👥 Buscando todos os usuários...');
      const usersRef = collection(db, 'usuarios');
      const snapshot = await getDocs(usersRef);
      
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Usuários encontrados:', users.length);
      return users;
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      throw error;
    }
  },

  async getAllCompanies() {
    try {
      console.log('🏢 Buscando todas as empresas...');
      const companiesRef = collection(db, 'agencias');
      const snapshot = await getDocs(companiesRef);
      
      const companies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Empresas encontradas:', companies.length);
      return companies;
    } catch (error) {
      console.error('❌ Erro ao buscar empresas:', error);
      throw error;
    }
  },

  async getAnalyticsData() {
    try {
      console.log('📊 Calculando dados de analytics...');
      
      const [users, companies] = await Promise.all([
        this.getAllUsers(),
        this.getAllCompanies()
      ]);

      // Calcular métricas básicas
      const totalUsers = users.length;
      const totalCompanies = companies.length;
      const activeUsers = users.filter(u => !u.banned).length;
      
      // Análise por tipo de usuário
      const userTypes = {
        individual: users.filter(u => u.userType === 'individual').length,
        company_owner: users.filter(u => u.userType === 'company_owner').length,
        employee: users.filter(u => u.userType === 'employee').length,
        admin: users.filter(u => u.userType === 'admin').length
      };

      // Análise de planos
      const subscriptionStats = {
        free: users.filter(u => !u.subscription || u.subscription === 'free').length,
        premium: users.filter(u => u.subscription === 'premium').length,
        enterprise: users.filter(u => u.subscription === 'enterprise').length
      };

      const analytics = {
        overview: {
          totalUsers,
          totalCompanies,
          activeUsers,
          totalRevenue: subscriptionStats.premium * 29 + subscriptionStats.enterprise * 99
        },
        userStats: {
          userTypes,
          subscriptionStats,
          conversionRate: totalUsers > 0 ? ((subscriptionStats.premium + subscriptionStats.enterprise) / totalUsers) * 100 : 0
        },
        businessStats: {
          totalJobs: 0,
          approvedJobs: 0,
          pendingJobs: 0,
          averageJobValue: 0,
          jobApprovalRate: 0
        },
        recentActivity: {
          newUsersThisMonth: 0,
          newCompaniesThisMonth: 0,
          newJobsThisMonth: 0
        },
        productivity: {
          taskCompletionRate: 85,
          averageTasksPerUser: 5.2
        }
      };

      console.log('✅ Analytics calculados');
      return analytics;
    } catch (error) {
      console.error('❌ Erro ao calcular analytics:', error);
      throw error;
    }
  },

  async banUser(userId: string, banned: boolean) {
    try {
      console.log(`${banned ? '🚫 Banindo' : '✅ Desbanindo'} usuário:`, userId);
      await this.updateUserField(userId, 'banned', banned);
      console.log('✅ Status do usuário atualizado');
    } catch (error) {
      console.error('❌ Erro ao alterar status do usuário:', error);
      throw error;
    }
  },

  async updateUserSubscription(userId: string, plan: string) {
    try {
      console.log('💳 Atualizando plano do usuário:', userId, plan);
      await this.updateUserField(userId, 'subscription', plan);
      console.log('✅ Plano atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar plano:', error);
      throw error;
    }
  },

  async createCompany(companyData: any) {
    try {
      console.log('🏢 Criando nova empresa:', companyData.name);
      const companiesRef = collection(db, 'agencias');
      
      const newCompany = {
        ...companyData,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(companiesRef, newCompany);
      console.log('✅ Empresa criada com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar empresa:', error);
      throw error;
    }
  },

  async updateCompanyField(companyId: string, field: string, value: any) {
    try {
      console.log(`💾 Atualizando ${field} da empresa ${companyId}`);
      const companyRef = doc(db, 'agencias', companyId);
      await updateDoc(companyRef, {
        [field]: value,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Campo da empresa atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar campo da empresa:', error);
      throw error;
    }
  },

  async getUserInvites(userEmail: string) {
    try {
      console.log('📨 Buscando convites para:', userEmail);
      const invitesRef = collection(db, 'convites');
      const q = query(
        invitesRef, 
        where('invitedEmail', '==', userEmail),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      
      const invites = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Convites encontrados:', invites.length);
      return invites;
    } catch (error) {
      console.error('❌ Erro ao buscar convites:', error);
      throw error;
    }
  },

  async acceptInvite(inviteId: string, userId: string, companyId: string) {
    try {
      console.log('✅ Aceitando convite:', inviteId);
      
      // Atualizar status do convite
      await this.updateInviteStatus(inviteId, 'accepted');
      
      // Adicionar usuário à empresa
      const companyData = await this.getAgencyData(companyId);
      if (companyData && companyData.colaboradores) {
        const userData = await this.getUserData(userId);
        if (userData) {
          const newCollaborator = {
            uid: userId,
            email: userData.email,
            role: 'employee'
          };
          
          const updatedCollaborators = [...companyData.colaboradores, newCollaborator];
          await this.updateCompanyField(companyId, 'colaboradores', updatedCollaborators);
          
          // Atualizar tipo do usuário
          await this.updateUserField(userId, 'userType', 'employee');
          await this.updateUserField(userId, 'companyId', companyId);
        }
      }
      
      console.log('✅ Convite aceito com sucesso');
    } catch (error) {
      console.error('❌ Erro ao aceitar convite:', error);
      throw error;
    }
  },

  async updateInviteStatus(inviteId: string, status: string) {
    try {
      console.log('📝 Atualizando status do convite:', inviteId, status);
      const inviteRef = doc(db, 'convites', inviteId);
      await updateDoc(inviteRef, {
        status,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Status do convite atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar status do convite:', error);
      throw error;
    }
  }
};
