import React, { createContext, useContext, useState, useEffect } from 'react';
import { Job, MonthlyCost, WorkItem, Task, WorkRoutine } from '../types';
import { useAuth } from './AuthContext';
import { firestoreService } from '../services/firestore';

interface AppContextType {
  jobs: Job[];
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => void;
  monthlyCosts: MonthlyCost[];
  addMonthlyCost: (cost: Omit<MonthlyCost, 'id' | 'createdAt' | 'userId'>) => void;
  updateMonthlyCost: (id: string, updates: Partial<MonthlyCost>) => void;
  deleteMonthlyCost: (id: string) => void;
  workItems: WorkItem[];
  addWorkItem: (item: Omit<WorkItem, 'id' | 'createdAt' | 'userId'>) => void;
  updateWorkItem: (id: string, updates: Partial<WorkItem>) => void;
  deleteWorkItem: (id: string) => void;
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  workRoutine: WorkRoutine | null;
  updateWorkRoutine: (routine: Omit<WorkRoutine, 'userId'>) => void;
  loading: boolean;
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
  const [loading, setLoading] = useState(false);

  // Carregar dados quando usuário ou dados mudarem
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, userData, agencyData]);

  const loadUserData = () => {
    setLoading(true);
    
    // Priorizar dados da agência se disponível
    const currentData = agencyData || userData;
    
    if (currentData) {
      console.log('📦 Carregando dados do contexto:', {
        fonte: agencyData ? 'agência' : 'usuário',
        jobs: currentData.jobs?.length || 0,
        expenses: currentData.expenses?.length || 0,
        equipments: currentData.equipments?.length || 0
      });

      // Carregar jobs se existirem - com verificação de tipo
      if (currentData && 'jobs' in currentData && currentData.jobs) {
        const jobsData = currentData.jobs || [];
        setJobs(jobsData.map(job => ({
          ...job,
          userId: user!.id,
          companyId: agencyData?.id
        })));
      }

      // Carregar custos mensais (expenses) - com verificação de tipo
      if (currentData && 'expenses' in currentData) {
        const costsData = currentData.expenses || [];
        setMonthlyCosts(costsData.map(cost => ({
          id: cost.id || `temp_${Date.now()}_${Math.random()}`,
          description: cost.description || cost.name || 'Custo',
          category: cost.category || 'Geral',
          value: cost.value || 0,
          month: cost.month || new Date().toISOString().slice(0, 7),
          createdAt: cost.createdAt || new Date().toISOString(),
          userId: user!.id,
          companyId: agencyData?.id
        })));
      }

      // Carregar equipamentos (equipments) - com verificação de tipo
      if (currentData && 'equipments' in currentData) {
        const itemsData = currentData.equipments || [];
        setWorkItems(itemsData.map(item => ({
          id: item.id || `temp_${Date.now()}_${Math.random()}`,
          description: item.description || item.name || 'Item',
          category: item.category || 'Equipamento',
          value: item.value || 0,
          depreciationYears: item.depreciationYears || 5,
          createdAt: item.createdAt || new Date().toISOString(),
          userId: user!.id,
          companyId: agencyData?.id
        })));
      }

      // Carregar rotina de trabalho - com verificação de tipo
      if (currentData && 'routine' in currentData && currentData.routine) {
        const routineData = currentData.routine;
        setWorkRoutine({
          desiredSalary: routineData.desiredSalary || 0,
          workDaysPerMonth: routineData.workDays || 22,
          workHoursPerDay: routineData.dailyHours || 8,
          valuePerDay: routineData.dalilyValue || 0,
          valuePerHour: routineData.valuePerHour || 0,
          userId: user!.id
        });
      }

      // Tasks do localStorage (por enquanto)
      const storedTasks = localStorage.getItem('financeflow_tasks');
      if (storedTasks) {
        try {
          const tasksData = JSON.parse(storedTasks);
          setTasks(tasksData.filter((task: Task) => task.userId === user!.id));
        } catch (error) {
          console.error('Erro ao carregar tasks:', error);
          setTasks([]);
        }
      }
    }
    
    setLoading(false);
  };

  // CORRIGIDO: Função para salvar job no Firebase
  const updateJob = async (id: string, updates: Partial<Job>) => {
    if (!user) return;

    try {
      console.log('💾 Salvando job editado:', id, updates);
      
      // Atualizar no estado local
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === id 
            ? { ...job, ...updates, updatedAt: new Date().toISOString() }
            : job
        )
      );

      // Determinar se é usuário individual ou empresa
      const isCompanyUser = !!agencyData;
      const targetId = isCompanyUser ? agencyData.id : user.id;
      const collection = isCompanyUser ? 'agencias' : 'usuarios';

      // Buscar dados atuais
      const currentData = isCompanyUser 
        ? await firestoreService.getAgencyData(targetId)
        : await firestoreService.getUserData(targetId);

      if (currentData && 'jobs' in currentData && currentData.jobs) {
        // Atualizar job no array
        const updatedJobs = currentData.jobs.map(job => 
          job.id === id 
            ? { ...job, ...updates, updatedAt: new Date().toISOString() }
            : job
        );

        // Salvar no Firebase
        await firestoreService.updateField(collection, targetId, 'jobs', updatedJobs);
        console.log('✅ Job salvo no Firebase com sucesso');
      }

    } catch (error) {
      console.error('❌ Erro ao salvar job:', error);
    }
  };

  const addJob = (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'companyId'>) => {
    const newJob: Job = {
      ...job,
      id: `job_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user!.id,
      companyId: agencyData?.id
    };
    setJobs(prev => [...prev, newJob]);
  };

  const deleteJob = (id: string) => setJobs(prev => prev.filter(job => job.id !== id));

  const addMonthlyCost = (cost: Omit<MonthlyCost, 'id' | 'createdAt' | 'userId' | 'companyId'>) => {
    const newCost: MonthlyCost = {
      ...cost,
      id: `cost_${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: user!.id,
      companyId: agencyData?.id
    };
    setMonthlyCosts(prev => [...prev, newCost]);
  };

  const updateMonthlyCost = (id: string, updates: Partial<MonthlyCost>) => {
    setMonthlyCosts(prev => 
      prev.map(cost => cost.id === id ? { ...cost, ...updates } : cost)
    );
  };

  const deleteMonthlyCost = (id: string) => setMonthlyCosts(prev => prev.filter(cost => cost.id !== id));

  const addWorkItem = (item: Omit<WorkItem, 'id' | 'createdAt' | 'userId' | 'companyId'>) => {
    const newItem: WorkItem = {
      ...item,
      id: `item_${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: user!.id,
      companyId: agencyData?.id
    };
    setWorkItems(prev => [...prev, newItem]);
  };

  const updateWorkItem = (id: string, updates: Partial<WorkItem>) => {
    setWorkItems(prev => 
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

  const deleteWorkItem = (id: string) => setWorkItems(prev => prev.filter(item => item.id !== id));

  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    const newTask: Task = {
      ...task,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: user!.id
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.setItem('financeflow_tasks', JSON.stringify(updatedTasks));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    );
    setTasks(updatedTasks);
    localStorage.setItem('financeflow_tasks', JSON.stringify(updatedTasks));
  };

  const deleteTask = (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    localStorage.setItem('financeflow_tasks', JSON.stringify(updatedTasks));
  };

  const updateWorkRoutine = (routine: Omit<WorkRoutine, 'userId'>) => {
    const newRoutine: WorkRoutine = {
      ...routine,
      userId: user!.id
    };
    setWorkRoutine(newRoutine);
  };

  return (
    <AppContext.Provider value={{
      jobs,
      addJob,
      updateJob,
      deleteJob,
      monthlyCosts,
      addMonthlyCost,
      updateMonthlyCost,
      deleteMonthlyCost,
      workItems,
      addWorkItem,
      updateWorkItem,
      deleteWorkItem,
      tasks,
      addTask,
      updateTask,
      deleteTask,
      workRoutine,
      updateWorkRoutine,
      loading
    }}>
      {children}
    </AppContext.Provider>
  );
};
