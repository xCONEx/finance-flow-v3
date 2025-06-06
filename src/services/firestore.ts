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

  // NOVO: Método para buscar todas as agências
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

  // NOVO: Método para salvar board do Kanban
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

  // NOVO: Método para buscar board do Kanban
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

  // NOVO: Método para enviar convites
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

  // NOVO: Método para buscar convites da empresa
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

  // NOVO: Método para remover membro da empresa
  async removeCompanyMember(companyId: string, memberId: string) {
    try {
      console.log('👥 Removendo membro da empresa:', { companyId, memberId });
      const agencyRef = doc(db, 'agencias', companyId);
      const agencyDoc = await getDoc(agencyRef);
      
      if (agencyDoc.exists()) {
        const data = agencyDoc.data();
        const colaboradores = data.colaboradores || [];
        
        // Remover colaborador pelo uid
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

  // NOVO: Método genérico para atualizar campos
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

  // NOVO: Método para buscar dados da agência
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
  }
};
