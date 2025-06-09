import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export class FirestoreService {
  private app;
  private auth;
  private db;
  private storage;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app);
  }

  // Métodos de autenticação
  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  async register(email: string, password: string, name: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Atualizar o perfil com o nome
      await updateProfile(user, { displayName: name });
      
      // Criar documento do usuário no Firestore
      await this.createUserDocument(user.uid, {
        name,
        email,
        createdAt: new Date().toISOString()
      });
      
      return user;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  }

  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error('Erro ao enviar email de redefinição de senha:', error);
      throw error;
    }
  }

  // Métodos de usuário
  async createUserDocument(userId: string, userData: any) {
    try {
      await setDoc(doc(this.db, 'usuarios', userId), {
        ...userData,
        id: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao criar documento do usuário:', error);
      throw error;
    }
  }

  async getUserData(userId: string) {
    try {
      const docRef = doc(this.db, 'usuarios', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        console.log('Nenhum documento de usuário encontrado!');
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      throw error;
    }
  }

  async updateUserData(userId: string, data: any) {
    try {
      const userRef = doc(this.db, 'usuarios', userId);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      throw error;
    }
  }

  async updateUserField(userId: string, field: string, value: any) {
    try {
      const userRef = doc(this.db, 'usuarios', userId);
      await updateDoc(userRef, {
        [field]: value,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Erro ao atualizar campo ${field} do usuário:`, error);
      throw error;
    }
  }

  // Métodos de jobs
  async createJob(userId: string, jobData: any) {
    try {
      const jobRef = collection(this.db, 'jobs');
      const newJob = {
        ...jobData,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(jobRef, newJob);
      return { id: docRef.id, ...newJob };
    } catch (error) {
      console.error('Erro ao criar job:', error);
      throw error;
    }
  }

  async getUserJobs(userId: string) {
    try {
      const jobsRef = collection(this.db, 'jobs');
      const q = query(jobsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const jobs: any[] = [];
      querySnapshot.forEach((doc) => {
        jobs.push({ id: doc.id, ...doc.data() });
      });
      
      return jobs;
    } catch (error) {
      console.error('Erro ao buscar jobs do usuário:', error);
      throw error;
    }
  }

  async updateJob(jobId: string, jobData: any) {
    try {
      const jobRef = doc(this.db, 'jobs', jobId);
      await updateDoc(jobRef, {
        ...jobData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao atualizar job:', error);
      throw error;
    }
  }

  async deleteJob(jobId: string) {
    try {
      await deleteDoc(doc(this.db, 'jobs', jobId));
    } catch (error) {
      console.error('Erro ao deletar job:', error);
      throw error;
    }
  }

  async getKanbanBoard(companyId: string) {
    try {
      const docRef = doc(this.db, 'empresas', companyId);
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();
      return data?.kanbanBoard || null;
    } catch (error) {
      console.error('Erro ao buscar board do Kanban:', error);
      throw error;
    }
  }

  async saveKanbanBoard(companyId: string, boardData: any) {
    try {
      await updateDoc(doc(this.db, 'empresas', companyId), {
        kanbanBoard: boardData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao salvar board do Kanban:', error);
      throw error;
    }
  }

  async getKanbanSettings(companyId: string) {
    try {
      const docRef = doc(this.db, 'empresas', companyId);
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();
      return data?.kanbanSettings || null;
    } catch (error) {
      console.error('Erro ao buscar configurações do Kanban:', error);
      throw error;
    }
  }

  async saveKanbanSettings(companyId: string, settings: any) {
    try {
      await updateDoc(doc(this.db, 'empresas', companyId), {
        kanbanSettings: settings,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao salvar configurações do Kanban:', error);
      throw error;
    }
  }

  // Métodos de empresa
  async createCompany(companyData: any) {
    try {
      const companyRef = collection(this.db, 'empresas');
      const newCompany = {
        ...companyData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(companyRef, newCompany);
      return { id: docRef.id, ...newCompany };
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      throw error;
    }
  }

  async getCompanyById(companyId: string) {
    try {
      const docRef = doc(this.db, 'empresas', companyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        console.log('Nenhuma empresa encontrada!');
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
      throw error;
    }
  }

  async getUserCompany(userId: string) {
    try {
      const companiesRef = collection(this.db, 'empresas');
      const q = query(companiesRef, where('ownerId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      
      // Verificar se o usuário é colaborador de alguma empresa
      const allCompanies = collection(this.db, 'empresas');
      const allCompaniesSnapshot = await getDocs(allCompanies);
      
      for (const doc of allCompaniesSnapshot.docs) {
        const companyData = doc.data();
        if (companyData.colaboradores && companyData.colaboradores.some((c: any) => c.id === userId || c.email === userId)) {
          return { id: doc.id, ...companyData };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar empresa do usuário:', error);
      throw error;
    }
  }

  async updateCompany(companyId: string, companyData: any) {
    try {
      const companyRef = doc(this.db, 'empresas', companyId);
      await updateDoc(companyRef, {
        ...companyData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      throw error;
    }
  }

  async addCollaborator(companyId: string, collaboratorData: any) {
    try {
      const companyRef = doc(this.db, 'empresas', companyId);
      const companyDoc = await getDoc(companyRef);
      
      if (companyDoc.exists()) {
        const companyData = companyDoc.data();
        const colaboradores = companyData.colaboradores || [];
        
        // Verificar se o colaborador já existe
        const exists = colaboradores.some((c: any) => c.email === collaboratorData.email);
        
        if (!exists) {
          colaboradores.push(collaboratorData);
          
          await updateDoc(companyRef, {
            colaboradores,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error);
      throw error;
    }
  }

  async removeCollaborator(companyId: string, collaboratorEmail: string) {
    try {
      const companyRef = doc(this.db, 'empresas', companyId);
      const companyDoc = await getDoc(companyRef);
      
      if (companyDoc.exists()) {
        const companyData = companyDoc.data();
        let colaboradores = companyData.colaboradores || [];
        
        colaboradores = colaboradores.filter((c: any) => c.email !== collaboratorEmail);
        
        await updateDoc(companyRef, {
          colaboradores,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Erro ao remover colaborador:', error);
      throw error;
    }
  }

  // Método genérico para atualizar um campo em uma coleção
  async updateField(collection: string, docId: string, field: string, value: any) {
    try {
      const docRef = doc(this.db, collection, docId);
      await updateDoc(docRef, {
        [field]: value,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Erro ao atualizar campo ${field}:`, error);
      throw error;
    }
  }

  // Upload de arquivos
  async uploadFile(file: File, path: string) {
    try {
      const storageRef = ref(this.storage, path);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Erro ao fazer upload de arquivo:', error);
      throw error;
    }
  }
}

export const firestoreService = new FirestoreService();
