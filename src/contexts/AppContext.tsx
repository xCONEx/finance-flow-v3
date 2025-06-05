
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Job, MonthlyCost, WorkItem, Task, WorkRoutine, Company } from '../types';
import { useAuth } from './AuthContext';
import { firestoreService, FirestoreUser, FirestoreAgency } from '../services/firestore';

interface AppContextType {
  jobs: Job[];
  monthlyCosts: MonthlyCost[];
  workItems: WorkItem[];
  tasks: Task[];
  workRoutine: WorkRoutine | null;
  company: Company | null;
  loading: boolean;
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateJob: (id: string, job: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  addMonthlyCost: (cost: Omit<MonthlyCost, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateMonthlyCost: (id: string, cost: Partial<MonthlyCost>) => Promise<void>;
  deleteMonthlyCost: (id: string) => Promise<void>;
  addWorkItem: (item: Omit<WorkItem, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateWorkItem: (id: string, item: Partial<WorkItem>) => Promise<void>;
  deleteWorkItem: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateWorkRoutine: (routine: Omit<WorkRoutine, 'userId'>) => Promise<void>;
  calculateJobPrice: (hours: number, difficulty: string) => {
    totalCosts: number;
    serviceValue: number;
    valueWithDiscount?: number;
    hourlyRate: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workRoutine, setWorkRoutine] = useState<WorkRoutine | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentDataSource, setCurrentDataSource] = useState<{ uid: string; isAgency: boolean } | null>(null);

  // Load data from Firestore
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Verificar se o usuário pertence a uma agência
      const userAgency = await firestoreService.getUserAgency(user.id);
      
      let userData: FirestoreUser | FirestoreAgency;
      let dataSource: { uid: string; isAgency: boolean };

      if (userAgency) {
        // Usar dados da agência
        userData = userAgency;
        dataSource = { uid: userAgency.id, isAgency: true };
      } else {
        // Usar dados do usuário individual
        const individualData = await firestoreService.getUserData(user.id);
        if (!individualData) return;
        userData = individualData;
        dataSource = { uid: user.id, isAgency: false };
      }

      setCurrentDataSource(dataSource);

      // Converter equipaments para workItems
      const convertedWorkItems: WorkItem[] = userData.equipaments.map(item => ({
        id: item.id,
        description: item.description,
        category: item.category,
        value: item.value,
        depreciationYears: 5, // valor padrão
        createdAt: new Date().toISOString(),
        userId: user.id
      }));

      // Converter expenses para monthlyCosts
      const convertedMonthlyCosts: MonthlyCost[] = userData.expenses.map(expense => ({
        id: expense.id,
        description: expense.description,
        category: expense.category,
        value: expense.value,
        month: new Date().toISOString().slice(0, 7), // formato YYYY-MM
        createdAt: new Date().toISOString(),
        userId: user.id
      }));

      // Converter jobs
      const convertedJobs: Job[] = userData.jobs.map(job => ({
        id: crypto.randomUUID(),
        description: job.descriptions,
        client: job.client,
        eventDate: job.eventDate,
        estimatedHours: job.hours,
        difficultyLevel: job.difficulty as any,
        logistics: job.logistics,
        equipment: job.equipment,
        assistance: job.assistance,
        status: job.status as any,
        category: job.category,
        discountValue: 0,
        totalCosts: job.value,
        serviceValue: job.value,
        valueWithDiscount: job.value,
        profitMargin: job.profit,
        createdAt: job.date,
        updatedAt: job.date,
        userId: user.id
      }));

      // Converter routine
      const convertedRoutine: WorkRoutine = {
        desiredSalary: userData.routine.desiredSalary,
        workDaysPerMonth: userData.routine.workDays,
        workHoursPerDay: userData.routine.dailyHours,
        valuePerDay: userData.routine.dalilyValue,
        valuePerHour: userData.routine.dalilyValue / userData.routine.dailyHours,
        userId: user.id
      };

      // Carregar tasks
      const userTasks = await firestoreService.getUserTasks(user.id);
      const convertedTasks: Task[] = userTasks.map(task => ({
        id: crypto.randomUUID(),
        title: task.name,
        description: task.description,
        completed: task.status === 'completed',
        priority: 'média' as any,
        dueDate: task.date,
        createdAt: task.date,
        userId: user.id
      }));

      setWorkItems(convertedWorkItems);
      setMonthlyCosts(convertedMonthlyCosts);
      setJobs(convertedJobs);
      setWorkRoutine(convertedRoutine);
      setTasks(convertedTasks);

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Work Items operations
  const addWorkItem = async (itemData: Omit<WorkItem, 'id' | 'createdAt' | 'userId'>) => {
    if (!user || !currentDataSource) return;

    const newItem = {
      id: crypto.randomUUID(),
      description: itemData.description,
      category: itemData.category,
      value: itemData.value
    };

    try {
      await firestoreService.addEquipament(currentDataSource.uid, newItem);
      
      const convertedItem: WorkItem = {
        ...itemData,
        id: newItem.id,
        userId: user.id,
        createdAt: new Date().toISOString()
      };
      
      setWorkItems(prev => [convertedItem, ...prev]);
    } catch (error) {
      console.error('Error adding work item:', error);
      throw error;
    }
  };

  const updateWorkItem = async (id: string, itemData: Partial<WorkItem>) => {
    if (!user || !currentDataSource) return;

    try {
      // Encontrar o item atual
      const currentItem = workItems.find(item => item.id === id);
      if (!currentItem) return;

      // Remover o item antigo
      const oldFirestoreItem = {
        id: currentItem.id,
        description: currentItem.description,
        category: currentItem.category,
        value: currentItem.value
      };
      
      await firestoreService.removeEquipament(currentDataSource.uid, oldFirestoreItem);

      // Adicionar o item atualizado
      const updatedFirestoreItem = {
        id: id,
        description: itemData.description || currentItem.description,
        category: itemData.category || currentItem.category,
        value: itemData.value || currentItem.value
      };

      await firestoreService.addEquipament(currentDataSource.uid, updatedFirestoreItem);

      setWorkItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...itemData } : item
      ));
    } catch (error) {
      console.error('Error updating work item:', error);
      throw error;
    }
  };

  const deleteWorkItem = async (id: string) => {
    if (!user || !currentDataSource) return;

    try {
      const itemToDelete = workItems.find(item => item.id === id);
      if (!itemToDelete) return;

      const firestoreItem = {
        id: itemToDelete.id,
        description: itemToDelete.description,
        category: itemToDelete.category,
        value: itemToDelete.value
      };

      await firestoreService.removeEquipament(currentDataSource.uid, firestoreItem);
      setWorkItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting work item:', error);
      throw error;
    }
  };

  // Monthly Costs operations
  const addMonthlyCost = async (costData: Omit<MonthlyCost, 'id' | 'createdAt' | 'userId'>) => {
    if (!user || !currentDataSource) return;

    const newCost = {
      id: crypto.randomUUID(),
      description: costData.description,
      category: costData.category,
      value: costData.value
    };

    try {
      await firestoreService.addExpense(currentDataSource.uid, newCost);
      
      const convertedCost: MonthlyCost = {
        ...costData,
        id: newCost.id,
        userId: user.id,
        createdAt: new Date().toISOString()
      };
      
      setMonthlyCosts(prev => [convertedCost, ...prev]);
    } catch (error) {
      console.error('Error adding monthly cost:', error);
      throw error;
    }
  };

  const updateMonthlyCost = async (id: string, costData: Partial<MonthlyCost>) => {
    if (!user || !currentDataSource) return;

    try {
      const currentCost = monthlyCosts.find(cost => cost.id === id);
      if (!currentCost) return;

      const oldFirestoreCost = {
        id: currentCost.id,
        description: currentCost.description,
        category: currentCost.category,
        value: currentCost.value
      };
      
      await firestoreService.removeExpense(currentDataSource.uid, oldFirestoreCost);

      const updatedFirestoreCost = {
        id: id,
        description: costData.description || currentCost.description,
        category: costData.category || currentCost.category,
        value: costData.value || currentCost.value
      };

      await firestoreService.addExpense(currentDataSource.uid, updatedFirestoreCost);

      setMonthlyCosts(prev => prev.map(cost => 
        cost.id === id ? { ...cost, ...costData } : cost
      ));
    } catch (error) {
      console.error('Error updating monthly cost:', error);
      throw error;
    }
  };

  const deleteMonthlyCost = async (id: string) => {
    if (!user || !currentDataSource) return;

    try {
      const costToDelete = monthlyCosts.find(cost => cost.id === id);
      if (!costToDelete) return;

      const firestoreCost = {
        id: costToDelete.id,
        description: costToDelete.description,
        category: costToDelete.category,
        value: costToDelete.value
      };

      await firestoreService.removeExpense(currentDataSource.uid, firestoreCost);
      setMonthlyCosts(prev => prev.filter(cost => cost.id !== id));
    } catch (error) {
      console.error('Error deleting monthly cost:', error);
      throw error;
    }
  };

  // Work Routine operations
  const updateWorkRoutine = async (routine: Omit<WorkRoutine, 'userId'>) => {
    if (!user || !currentDataSource) return;

    const firestoreRoutine = {
      dailyHours: routine.workHoursPerDay,
      dalilyValue: routine.valuePerDay,
      desiredSalary: routine.desiredSalary,
      workDays: routine.workDaysPerMonth
    };

    try {
      await firestoreService.updateRoutine(currentDataSource.uid, firestoreRoutine);
      
      const newRoutine: WorkRoutine = {
        ...routine,
        userId: user.id
      };
      
      setWorkRoutine(newRoutine);
    } catch (error) {
      console.error('Error updating work routine:', error);
      throw error;
    }
  };

  // Jobs operations (mantendo a estrutura existente por enquanto)
  const addJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) return;
    const newJob: Job = {
      ...jobData,
      id: crypto.randomUUID(),
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setJobs(prev => [newJob, ...prev]);
  };

  const updateJob = async (id: string, jobData: Partial<Job>) => {
    setJobs(prev => prev.map(job => 
      job.id === id ? { ...job, ...jobData, updatedAt: new Date().toISOString() } : job
    ));
  };

  const deleteJob = async (id: string) => {
    setJobs(prev => prev.filter(job => job.id !== id));
  };

  // Tasks operations (mantendo a estrutura existente por enquanto)
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      userId: user.id,
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = async (id: string, taskData: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...taskData } : task
    ));
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const calculateJobPrice = (hours: number, difficulty: string) => {
    const hourlyRate = workRoutine?.valuePerHour || 50;
    const difficultyMultiplier = difficulty === 'fácil' ? 1 : 
                                difficulty === 'médio' ? 1.2 : 
                                difficulty === 'difícil' ? 1.5 : 2;
    
    const baseServiceValue = hours * hourlyRate * difficultyMultiplier;
    
    const equipmentCosts = workItems.reduce((total, item) => {
      return total + (item.value / (item.depreciationYears * 12));
    }, 0);
    
    const totalCosts = baseServiceValue + equipmentCosts;
    
    return {
      totalCosts,
      serviceValue: baseServiceValue,
      hourlyRate: hourlyRate * difficultyMultiplier
    };
  };

  return (
    <AppContext.Provider value={{
      jobs,
      monthlyCosts,
      workItems,
      tasks,
      workRoutine,
      company,
      loading,
      addJob,
      updateJob,
      deleteJob,
      addMonthlyCost,
      updateMonthlyCost,
      deleteMonthlyCost,
      addWorkItem,
      updateWorkItem,
      deleteWorkItem,
      addTask,
      updateTask,
      deleteTask,
      updateWorkRoutine,
      calculateJobPrice
    }}>
      {children}
    </AppContext.Provider>
  );
};
