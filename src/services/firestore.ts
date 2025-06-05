
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
  userId: string;
}

export interface FirestoreAgency extends FirestoreUser {
  colaboradores: string[];
}

class FirestoreService {
  // User operations
  async getUserData(uid: string): Promise<FirestoreUser | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as FirestoreUser;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  async createUser(userData: FirestoreUser): Promise<void> {
    try {
      await setDoc(doc(db, 'users', userData.uid), userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUserField(uid: string, field: string, value: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        [field]: value
      });
    } catch (error) {
      console.error('Error updating user field:', error);
      throw error;
    }
  }

  // Equipaments operations
  async addEquipament(uid: string, equipament: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        equipaments: arrayUnion(equipament)
      });
    } catch (error) {
      console.error('Error adding equipament:', error);
      throw error;
    }
  }

  async removeEquipament(uid: string, equipament: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        equipaments: arrayRemove(equipament)
      });
    } catch (error) {
      console.error('Error removing equipament:', error);
      throw error;
    }
  }

  async updateEquipaments(uid: string, equipaments: any[]): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        equipaments: equipaments
      });
    } catch (error) {
      console.error('Error updating equipaments:', error);
      throw error;
    }
  }

  // Expenses operations
  async addExpense(uid: string, expense: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        expenses: arrayUnion(expense)
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  async removeExpense(uid: string, expense: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        expenses: arrayRemove(expense)
      });
    } catch (error) {
      console.error('Error removing expense:', error);
      throw error;
    }
  }

  async updateExpenses(uid: string, expenses: any[]): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        expenses: expenses
      });
    } catch (error) {
      console.error('Error updating expenses:', error);
      throw error;
    }
  }

  // Jobs operations
  async addJob(uid: string, job: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        jobs: arrayUnion(job)
      });
    } catch (error) {
      console.error('Error adding job:', error);
      throw error;
    }
  }

  async removeJob(uid: string, job: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        jobs: arrayRemove(job)
      });
    } catch (error) {
      console.error('Error removing job:', error);
      throw error;
    }
  }

  async updateJobs(uid: string, jobs: any[]): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
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
      await updateDoc(doc(db, 'users', uid), {
        routine: routine
      });
    } catch (error) {
      console.error('Error updating routine:', error);
      throw error;
    }
  }

  // Tasks operations
  async getUserTasks(userId: string): Promise<FirestoreTask[]> {
    try {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(tasksQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreTask[];
    } catch (error) {
      console.error('Error getting user tasks:', error);
      throw error;
    }
  }

  async addTask(taskData: FirestoreTask): Promise<void> {
    try {
      await setDoc(doc(collection(db, 'tasks')), taskData);
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }

  // Agency operations
  async getUserAgency(uid: string): Promise<FirestoreAgency | null> {
    try {
      const agenciesQuery = query(
        collection(db, 'agencias'),
        where('colaboradores', 'array-contains', uid)
      );
      const querySnapshot = await getDocs(agenciesQuery);
      
      if (!querySnapshot.empty) {
        const agencyDoc = querySnapshot.docs[0];
        return {
          id: agencyDoc.id,
          ...agencyDoc.data()
        } as FirestoreAgency;
      }
      return null;
    } catch (error) {
      console.error('Error getting user agency:', error);
      throw error;
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
}

export const firestoreService = new FirestoreService();
