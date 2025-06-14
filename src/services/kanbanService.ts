
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface KanbanProject {
  id: string;
  title: string;
  client: string;
  dueDate: string;
  priority: "alta" | "media" | "baixa";
  status: "filmado" | "edicao" | "revisao" | "entregue";
  description: string;
  links: string[];
  createdAt: string;
  updatedAt: string;
}

export interface KanbanBoard {
  uid: string;
  projects: KanbanProject[];
  createdAt: any;
  updatedAt: any;
}

class KanbanService {
  private getDocRef(uid: string) {
    return doc(db, 'kanban_boards', uid);
  }

  async saveBoard(uid: string, projects: KanbanProject[]): Promise<void> {
    try {
      const docRef = this.getDocRef(uid);
      const boardData: KanbanBoard = {
        uid,
        projects,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, boardData, { merge: true });
      console.log('✅ Board salvo com sucesso no Firebase');
    } catch (error) {
      console.error('❌ Erro ao salvar board:', error);
      throw error;
    }
  }

  async loadBoard(uid: string): Promise<KanbanProject[]> {
    try {
      const docRef = this.getDocRef(uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as KanbanBoard;
        console.log('📦 Board carregado do Firebase');
        return data.projects || [];
      } else {
        console.log('📝 Novo board - retornando array vazio');
        return [];
      }
    } catch (error) {
      console.error('❌ Erro ao carregar board:', error);
      // Em caso de erro, retorna dados do localStorage como fallback
      const savedBoard = localStorage.getItem('entregaFlowProjects');
      if (savedBoard) {
        try {
          return JSON.parse(savedBoard);
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse do localStorage:', parseError);
          return [];
        }
      }
      return [];
    }
  }

  async updateProject(uid: string, projectId: string, updates: Partial<KanbanProject>): Promise<void> {
    try {
      const projects = await this.loadBoard(uid);
      const updatedProjects = projects.map(project => 
        project.id === projectId 
          ? { ...project, ...updates, updatedAt: new Date().toISOString() }
          : project
      );
      
      await this.saveBoard(uid, updatedProjects);
      console.log('✅ Projeto atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar projeto:', error);
      throw error;
    }
  }

  async addProject(uid: string, project: KanbanProject): Promise<void> {
    try {
      const projects = await this.loadBoard(uid);
      const updatedProjects = [...projects, project];
      
      await this.saveBoard(uid, updatedProjects);
      console.log('✅ Projeto adicionado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar projeto:', error);
      throw error;
    }
  }

  async deleteProject(uid: string, projectId: string): Promise<void> {
    try {
      const projects = await this.loadBoard(uid);
      const updatedProjects = projects.filter(p => p.id !== projectId);
      
      await this.saveBoard(uid, updatedProjects);
      console.log('✅ Projeto excluído com sucesso');
    } catch (error) {
      console.error('❌ Erro ao excluir projeto:', error);
      throw error;
    }
  }
}

export const kanbanService = new KanbanService();
