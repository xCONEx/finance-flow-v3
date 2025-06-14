
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
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { firestoreService } from './firestore';

export interface AgencyMember {
  uid: string;
  email: string;
  name?: string;
  role: 'editor' | 'viewer';
  addedAt: any;
}

export const agencyService = {
  async createAgency(ownerUid: string, agencyName: string, ownerEmail: string) {
    try {
      console.log('🏢 Criando agência para owner:', ownerUid);
      
      const batch = writeBatch(db);
      
      // 1. Criar documento da agência
      const agencyRef = doc(db, 'agencias', ownerUid);
      batch.set(agencyRef, {
        name: agencyName,
        createdBy: ownerUid,
        createdAt: serverTimestamp(),
        equipments: [],
        expenses: [],
        jobs: []
      });

      // 2. Atualizar usuário como owner
      const userRef = doc(db, 'usuarios', ownerUid);
      batch.update(userRef, {
        agencyId: ownerUid,
        role: 'owner',
        updatedAt: serverTimestamp()
      });

      // 3. Adicionar owner como colaborador
      const ownerCollabRef = doc(db, 'agencias', ownerUid, 'colaboradores', ownerUid);
      batch.set(ownerCollabRef, {
        email: ownerEmail,
        role: 'owner',
        addedAt: serverTimestamp()
      });

      await batch.commit();
      
      console.log('✅ Agência criada com sucesso:', ownerUid);
      return ownerUid;
    } catch (error) {
      console.error('❌ Erro ao criar agência:', error);
      throw error;
    }
  },

  async addMember(agencyId: string, memberUid: string, memberEmail: string, role: 'editor' | 'viewer') {
    try {
      console.log('👥 Adicionando membro:', { agencyId, memberUid, role });
      
      const batch = writeBatch(db);
      
      // 1. Adicionar na subcoleção colaboradores
      const collaboratorRef = doc(db, 'agencias', agencyId, 'colaboradores', memberUid);
      batch.set(collaboratorRef, {
        email: memberEmail,
        role: role,
        addedAt: serverTimestamp()
      });

      // 2. Atualizar usuário
      const userRef = doc(db, 'usuarios', memberUid);
      batch.update(userRef, {
        agencyId: agencyId,
        role: role,
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      
      console.log('✅ Membro adicionado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar membro:', error);
      throw error;
    }
  },

  async removeMember(agencyId: string, memberUid: string) {
    try {
      console.log('👥 Removendo membro:', { agencyId, memberUid });
      
      const batch = writeBatch(db);
      
      // 1. Remover da subcoleção colaboradores
      const collaboratorRef = doc(db, 'agencias', agencyId, 'colaboradores', memberUid);
      batch.delete(collaboratorRef);

      // 2. Atualizar usuário (remover agencyId e role)
      const userRef = doc(db, 'usuarios', memberUid);
      batch.update(userRef, {
        agencyId: null,
        role: 'individual',
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      
      console.log('✅ Membro removido com sucesso');
    } catch (error) {
      console.error('❌ Erro ao remover membro:', error);
      throw error;
    }
  },

  async updateMemberRole(agencyId: string, memberUid: string, newRole: 'editor' | 'viewer') {
    try {
      console.log('👥 Atualizando role:', { agencyId, memberUid, newRole });
      
      const batch = writeBatch(db);
      
      // 1. Atualizar na subcoleção colaboradores
      const collaboratorRef = doc(db, 'agencias', agencyId, 'colaboradores', memberUid);
      batch.update(collaboratorRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });

      // 2. Atualizar usuário
      const userRef = doc(db, 'usuarios', memberUid);
      batch.update(userRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      
      console.log('✅ Role atualizada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar role:', error);
      throw error;
    }
  },

  async getAgencyMembers(agencyId: string): Promise<AgencyMember[]> {
    try {
      console.log('👥 Buscando membros da agência:', agencyId);
      
      const colaboradoresRef = collection(db, 'agencias', agencyId, 'colaboradores');
      const snapshot = await getDocs(colaboradoresRef);
      
      const members: AgencyMember[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const uid = doc.id;
        
        // Buscar dados completos do usuário
        try {
          const userData = await firestoreService.getUserData(uid);
          members.push({
            uid,
            email: data.email,
            name: userData?.name || data.email.split('@')[0],
            role: data.role,
            addedAt: data.addedAt
          });
        } catch (error) {
          console.warn('⚠️ Erro ao buscar dados do membro:', uid);
          members.push({
            uid,
            email: data.email,
            name: data.email.split('@')[0],
            role: data.role,
            addedAt: data.addedAt
          });
        }
      }
      
      console.log('✅ Membros encontrados:', members.length);
      return members;
    } catch (error) {
      console.error('❌ Erro ao buscar membros:', error);
      return [];
    }
  }
};
