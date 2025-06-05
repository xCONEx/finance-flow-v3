import React, { createContext, useContext, useState, useEffect } from 'react';
import { Job, MonthlyCost, WorkItem, Task, WorkRoutine, Company } from '../types';
import { useAuth } from './AuthContext';
import { firestoreService } from '../services/firestore';

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
  const { user, userData, agencyData } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workRoutine, setWorkRoutine] = useState<WorkRoutine | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);

  // Importar dados do Firebase quando userData ou agencyData estiverem disponíveis
  useEffect(() => {
    if (user && (userData || agencyData)) {
      importFirebaseData();
    }
  }, [user, userData, agencyData]);

  const importFirebaseData = async () => {
    if (!user) return;
    
    console.log('📥 Iniciando importação de dados do Firebase...');
    setLoading(true);
    
    try {
      // Determinar qual fonte de dados usar (agência ou usuário individual)
      const dataSource = agencyData || userData;
      if (!dataSource) {
        console.log('⚠️ Nenhuma fonte de dados encontrada');
        return;
      }

      console.log('📊 Importando dados de:', agencyData ? 'agência' : 'usuário individual');

      // Importar equipamentos -> workItems
      if (dataSource.equipaments && dataSource.equipaments.length > 0) {
        console.log(`📦 Importando ${dataSource.equipaments.length} equipamentos...`);
        const convertedWorkItems: WorkItem[] = dataSource.equipaments.map(item => ({
          id: item.id,
          description: item.description,
          category: item.category,
          value: item.value,
          depreciationYears: 5, // valor padrão
          createdAt: new Date().toISOString(),
          userId: user.id
        }));
        setWorkItems(convertedWorkItems);
        console.log('✅ Equipamentos importados:', convertedWorkItems.length);
      }

      // Importar despesas -> monthlyCosts
      if (dataSource.expenses && dataSource.expenses.length > 0) {
        console.log(`💰 Importando ${dataSource.expenses.length} despesas...`);
        const convertedMonthlyCosts: MonthlyCost[] = dataSource.expenses.map(expense => ({
          id: expense.id,
          description: expense.description,
          category: expense.category,
          value: expense.value,
          month: new Date().toISOString().slice(0, 7), // formato YYYY-MM
          createdAt: new Date().toISOString(),
          userId: user.id
        }));
        setMonthlyCosts(convertedMonthlyCosts);
        console.log('✅ Despesas importadas:', convertedMonthlyCosts.length);
      }

      // Importar jobs
      if (dataSource.jobs && dataSource.jobs.length > 0) {
        console.log(`💼 Importando ${dataSource.jobs.length} jobs...`);
        const convertedJobs: Job[] = dataSource.jobs.map(job => ({
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
        setJobs(convertedJobs);
        console.log('✅ Jobs importados:', convertedJobs.length);
      }

      // Importar rotina
      if (dataSource.routine) {
        console.log('⏰ Importando rotina de trabalho...');
        const convertedRoutine: WorkRoutine = {
          desiredSalary: dataSource.routine.desiredSalary,
          workDaysPerMonth: dataSource.routine.workDays,
          workHoursPerDay: dataSource.routine.dailyHours,
          valuePerDay: dataSource.routine.dalilyValue,
          valuePerHour: dataSource.routine.dalilyValue / dataSource.routine.dailyHours,
          userId: user.id
        };
        setWorkRoutine(convertedRoutine);
        console.log('✅ Rotina importada:', convertedRoutine);
      }

      // Importar tasks
      try {
        console.log('📋 Carregando tasks do usuário...');
        const userTasks = await firestoreService.getUserTasks(user.id);
        if (userTasks && userTasks.length > 0) {
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
          setTasks(convertedTasks);
          console.log('✅ Tasks importadas:', convertedTasks.length);
        }
      } catch (error) {
        console.error('⚠️ Erro ao carregar tasks:', error);
      }

      console.log('🎉 Importação concluída com sucesso!');
      console.log('📊 Resumo da importação:', {
        workItems: workItems.length,
        monthlyCosts: monthlyCosts.length,
        jobs: jobs.length,
        tasks: tasks.length,
        workRoutine: !!workRoutine
      });

    } catch (error) {
      console.error('❌ Erro durante a importação:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDataSource = () => {
    return {
      uid: agencyData ? agencyData.id : user?.id || '',
      isAgency: !!agencyData
    };
  };

  // Work Items operations
  const addWorkItem = async (itemData: Omit<WorkItem, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;

    const dataSource = getCurrentDataSource();
    const newItem = {
      id: crypto.randomUUID(),
      description: itemData.description,
      category: itemData.category,
      value: itemData.value
    };

    try {
      await firestoreService.addEquipament(dataSource.uid, newItem);
      
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
    if (!user) return;

    const dataSource = getCurrentDataSource();

    try {
      const currentItem = workItems.find(item => item.id === id);
      if (!currentItem) return;

      const oldFirestoreItem = {
        id: currentItem.id,
        description: currentItem.description,
        category: currentItem.category,
        value: currentItem.value
      };
      
      await firestoreService.removeEquipament(dataSource.uid, oldFirestoreItem);

      const updatedFirestoreItem = {
        id: id,
        description: itemData.description || currentItem.description,
        category: itemData.category || currentItem.category,
        value: itemData.value || currentItem.value
      };

      await firestoreService.addEquipament(dataSource.uid, updatedFirestoreItem);

      setWorkItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...itemData } : item
      ));
    } catch (error) {
      console.error('Error updating work item:', error);
      throw error;
    }
  };

  const deleteWorkItem = async (id: string) => {
    if (!user) return;

    const dataSource = getCurrentDataSource();

    try {
      const itemToDelete = workItems.find(item => item.id === id);
      if (!itemToDelete) return;

      const firestoreItem = {
        id: itemToDelete.id,
        description: itemToDelete.description,
        category: itemToDelete.category,
        value: itemToDelete.value
      };

      await firestoreService.removeEquipament(dataSource.uid, firestoreItem);
      setWorkItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting work item:', error);
      throw error;
    }
  };

  // Monthly Costs operations
  const addMonthlyCost = async (costData: Omit<MonthlyCost, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;

    const dataSource = getCurrentDataSource();
    const newCost = {
      id: crypto.randomUUID(),
      description: costData.description,
      category: costData.category,
      value: costData.value
    };

    try {
      await firestoreService.addExpense(dataSource.uid, newCost);
      
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
    if (!user) return;

    const dataSource = getCurrentDataSource();

    try {
      const currentCost = monthlyCosts.find(cost => cost.id === id);
      if (!currentCost) return;

      const oldFirestoreCost = {
        id: currentCost.id,
        description: currentCost.description,
        category: currentCost.category,
        value: currentCost.value
      };
      
      await firestoreService.removeExpense(dataSource.uid, oldFirestoreCost);

      const updatedFirestoreCost = {
        id: id,
        description: costData.description || currentCost.description,
        category: costData.category || currentCost.category,
        value: costData.value || currentCost.value
      };

      await firestoreService.addExpense(dataSource.uid, updatedFirestoreCost);

      setMonthlyCosts(prev => prev.map(cost => 
        cost.id === id ? { ...cost, ...costData } : cost
      ));
    } catch (error) {
      console.error('Error updating monthly cost:', error);
      throw error;
    }
  };

  const deleteMonthlyCost = async (id: string) => {
    if (!user) return;

    const dataSource = getCurrentDataSource();

    try {
      const costToDelete = monthlyCosts.find(cost => cost.id === id);
      if (!costToDelete) return;

      const firestoreCost = {
        id: costToDelete.id,
        description: costToDelete.description,
        category: costToDelete.category,
        value: costToDelete.value
      };

      await firestoreService.removeExpense(dataSource.uid, firestoreCost);
      setMonthlyCosts(prev => prev.filter(cost => cost.id !== id));
    } catch (error) {
      console.error('Error deleting monthly cost:', error);
      throw error;
    }
  };

  // Work Routine operations
  const updateWorkRoutine = async (routine: Omit<WorkRoutine, 'userId'>) => {
    if (!user) return;

    const dataSource = getCurrentDataSource();
    const firestoreRoutine = {
      dailyHours: routine.workHoursPerDay,
      dalilyValue: routine.valuePerDay,
      desiredSalary: routine.desiredSalary,
      workDays: routine.workDaysPerMonth
    };

    try {
      await firestoreService.updateRoutine(dataSource.uid, firestoreRoutine);
      
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
