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

  async deleteUser(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
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
};
