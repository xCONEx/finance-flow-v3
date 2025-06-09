
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export const firestoreService = {
  auth,
  db,
  storage,

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Erro ao fazer login com o Google:", error);
      throw error;
    }
  },

  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      throw error;
    }
  },

  async createUser(userId: string, userData: any) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, userData, { merge: true });
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      throw error;
    }
  },

  async getUser(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      throw error;
    }
  },

  async updateUser(userId: string, data: any) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, data);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      throw error;
    }
  },

  async updateUserField(userId: string, field: string, value: any) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { [field]: value });
    } catch (error) {
      console.error("Erro ao atualizar campo do usuário:", error);
      throw error;
    }
  },

  async deleteUser(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      throw error;
    }
  },

  async getAllUsers() {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Erro ao buscar todos os usuários:", error);
      return [];
    }
  },

  async banUser(userId: string, banned: boolean) {
    try {
      await this.updateUserField(userId, 'banned', banned);
    } catch (error) {
      console.error("Erro ao banir/desbanir usuário:", error);
      throw error;
    }
  },

  async updateUserSubscription(userId: string, subscription: string) {
    try {
      await this.updateUserField(userId, 'subscription', subscription);
    } catch (error) {
      console.error("Erro ao atualizar subscription:", error);
      throw error;
    }
  },

  async getUserData(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      throw error;
    }
  },

  async updateField(collection: string, docId: string, field: string, value: any) {
    try {
      const docRef = doc(db, collection, docId);
      await updateDoc(docRef, { [field]: value });
    } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
    }
  },

  async createCompany(companyData: any) {
    try {
      const companiesRef = collection(db, 'companies');
      const docRef = doc(companiesRef);
      await setDoc(docRef, { ...companyData, id: docRef.id });
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar empresa:", error);
      throw error;
    }
  },

  async saveCompany(companyId: string, companyData: any) {
    try {
      const companyRef = doc(db, 'companies', companyId);
      await setDoc(companyRef, companyData, { merge: true });
    } catch (error) {
      console.error("Erro ao salvar empresa:", error);
      throw error;
    }
  },

  async getCompany(companyId: string) {
    try {
      const companyRef = doc(db, 'companies', companyId);
      const docSnap = await getDoc(companyRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error("Erro ao buscar empresa:", error);
      throw error;
    }
  },

  async getAllCompanies() {
    try {
      const companiesRef = collection(db, 'companies');
      const snapshot = await getDocs(companiesRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Erro ao buscar todas as empresas:", error);
      return [];
    }
  },

  async updateCompany(companyId: string, data: Partial<any>) {
    try {
      const companyRef = doc(this.db, 'companies', companyId);
      await updateDoc(companyRef, data);
      console.log('✅ Empresa atualizada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar empresa:', error);
      throw error;
    }
  },

  async updateCompanyField(companyId: string, field: string, value: any) {
    try {
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, { [field]: value });
    } catch (error) {
      console.error("Erro ao atualizar campo da empresa:", error);
      throw error;
    }
  },

  async getCompanyInvites(companyId: string) {
    try {
      const invitesRef = collection(db, 'pendingInvites');
      const q = query(invitesRef, where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Erro ao buscar convites da empresa:", error);
      return [];
    }
  },

  async sendInvite(inviteData: any) {
    try {
      const inviteRef = doc(db, 'pendingInvites', inviteData.email);
      await setDoc(inviteRef, { ...inviteData, sentAt: new Date().toISOString() }, { merge: true });
    } catch (error) {
      console.error("Erro ao enviar convite:", error);
      throw error;
    }
  },

  async getUserInvites(email: string) {
    try {
      const invitesRef = collection(db, 'pendingInvites');
      const q = query(invitesRef, where('email', '==', email));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Erro ao buscar convites do usuário:", error);
      return [];
    }
  },

  async acceptInvite(inviteId: string, userId: string, companyId: string) {
    try {
      // Adicionar usuário à empresa
      const company = await this.getCompany(companyId);
      if (company) {
        const updatedCollaborators = [...(company.colaboradores || []), { uid: userId, role: 'employee' }];
        await this.updateCompanyField(companyId, 'colaboradores', updatedCollaborators);
      }

      // Atualizar tipo de usuário
      await this.updateUserField(userId, 'userType', 'employee');
      await this.updateUserField(userId, 'companyId', companyId);

      // Remover convite
      await deleteDoc(doc(db, 'pendingInvites', inviteId));
    } catch (error) {
      console.error("Erro ao aceitar convite:", error);
      throw error;
    }
  },

  async updateInviteStatus(inviteId: string, status: string) {
    try {
      const inviteRef = doc(db, 'pendingInvites', inviteId);
      await updateDoc(inviteRef, { status });
    } catch (error) {
      console.error("Erro ao atualizar status do convite:", error);
      throw error;
    }
  },

  async removeCompanyMember(companyId: string, memberId: string) {
    try {
      const company = await this.getCompany(companyId);
      if (company) {
        const updatedCollaborators = company.colaboradores.filter((member: any) => member.uid !== memberId);
        await this.updateCompanyField(companyId, 'colaboradores', updatedCollaborators);
      }

      // Atualizar tipo de usuário de volta para individual
      await this.updateUserField(memberId, 'userType', 'individual');
      await this.updateUserField(memberId, 'companyId', null);
    } catch (error) {
      console.error("Erro ao remover membro da empresa:", error);
      throw error;
    }
  },

  async getAnalyticsData() {
    try {
      const users = await this.getAllUsers();
      const companies = await this.getAllCompanies();
      
      // Calcular métricas básicas
      const totalUsers = users.length;
      const totalCompanies = companies.length;
      const activeUsers = users.filter((user: any) => !user.banned).length;
      
      // Distribuição por tipo de usuário
      const userTypes = {
        individual: users.filter((user: any) => user.userType === 'individual').length,
        company_owner: users.filter((user: any) => user.userType === 'company_owner').length,
        employee: users.filter((user: any) => user.userType === 'employee').length,
        admin: users.filter((user: any) => user.userType === 'admin').length,
      };

      // Taxa de conversão (premium/total)
      const premiumUsers = users.filter((user: any) => user.subscription === 'premium').length;
      const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;

      return {
        overview: {
          totalUsers,
          totalCompanies,
          totalRevenue: premiumUsers * 29.99, // Assumindo valor do plano premium
          activeUsers
        },
        userStats: {
          userTypes,
          conversionRate
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
          taskCompletionRate: 0,
          averageTasksPerUser: 0
        }
      };
    } catch (error) {
      console.error("Erro ao buscar dados de analytics:", error);
      return null;
    }
  },

  async saveKanbanBoard(companyId: string, boardData: any) {
    try {
      const kanbanRef = doc(db, 'kanbanBoards', companyId);
      await setDoc(kanbanRef, boardData, { merge: true });
      console.log('✅ Kanban salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar Kanban:', error);
      throw error;
    }
  },

  async getKanbanBoard(companyId: string) {
    try {
      const kanbanRef = doc(db, 'kanbanBoards', companyId);
      const docSnap = await getDoc(kanbanRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar Kanban:', error);
      throw error;
    }
  },

  async savePendingInvite(email: string, inviteData: any) {
    try {
      const inviteRef = doc(db, 'pendingInvites', email);
      await setDoc(inviteRef, inviteData, { merge: true });
    } catch (error) {
      console.error("Erro ao salvar convite pendente:", error);
      throw error;
    }
  },

  async getPendingInvite(email: string) {
    try {
      const inviteRef = doc(db, 'pendingInvites', email);
      const docSnap = await getDoc(inviteRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error("Erro ao buscar convite pendente:", error);
      throw error;
    }
  },

  async deletePendingInvite(email: string) {
    try {
      const inviteRef = doc(db, 'pendingInvites', email);
      await deleteDoc(inviteRef);
    } catch (error) {
      console.error("Erro ao deletar convite pendente:", error);
      throw error;
    }
  },

  async uploadFile(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(this.storage, path);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Erro ao fazer upload do arquivo:", error);
      throw error;
    }
  },

  async sendNotificationToCompanyMembers(companyId: string, message: string) {
    try {
      console.log(`Enviando notificação para empresa ${companyId}: ${message}`);
      // Implementação básica - pode ser expandida com FCM
      if ('serviceWorker' in navigator && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('FinanceFlow', {
            body: message,
            icon: '/icons/icon-192.png'
          });
        }
      }
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
    }
  },

  async updateCompanyLogo(companyId: string, logoBase64: string) {
    try {
      await this.updateCompanyField(companyId, 'logoBase64', logoBase64);
    } catch (error) {
      console.error("Erro ao atualizar logo da empresa:", error);
      throw error;
    }
  },
};
