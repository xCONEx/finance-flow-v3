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
    
    // CORRIGIDO: Sempre usar dados pessoais do usuário (userData)
    const currentData = userData;
    
    if (currentData) {
      console.log('📦 Carregando dados pessoais do usuário:', {
        jobs: currentData.jobs?.length || 0,
        expenses: currentData.expenses?.length || 0,
        equipments: currentData.equipments?.length || 0,
        routine: currentData.routine ? 'presente' : 'ausente'
      });

      // Carregar jobs pessoais
      if (currentData && 'jobs' in currentData && currentData.jobs) {
        const jobsData = currentData.jobs || [];
        console.log('📋 Jobs carregados:', jobsData);
        setJobs(jobsData.map(job => ({
          ...job,
          userId: user!.id,
          companyId: undefined
        })));
      }

      // Carregar custos mensais pessoais (expenses)
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
          companyId: undefined
        })));
      }

      // Carregar equipamentos pessoais (equipments)
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
          companyId: undefined
        })));
      }

      // CORRIGIDO: Carregar rotina de trabalho pessoal do Firebase
      if (currentData && 'routine' in currentData && currentData.routine) {
        const routineData = currentData.routine;
        console.log('⚙️ Rotina carregada do Firebase:', routineData);
        setWorkRoutine({
          desiredSalary: routineData.desiredSalary || 0,
          workDaysPerMonth: routineData.workDays || 22,
          workHoursPerDay: routineData.dailyHours || 8,
          valuePerDay: routineData.dalilyValue || 0,
          valuePerHour: routineData.valuePerHour || 0,
          userId: user!.id
        });
      } else {
        console.log('❌ Nenhuma rotina encontrada no Firebase');
        setWorkRoutine(null);
      }

      // CORRIGIDO: Tasks do localStorage filtradas por userId
      const storedTasks = localStorage.getItem('financeflow_tasks');
      if (storedTasks) {
        try {
          const tasksData = JSON.parse(storedTasks);
          console.log('📝 Tasks do localStorage:', tasksData.length);
          const userTasks = tasksData.filter((task: Task) => task.userId === user!.id);
          console.log('📝 Tasks filtradas para o usuário:', userTasks.length);
          setTasks(userTasks);
        } catch (error) {
          console.error('❌ Erro ao carregar tasks:', error);
          setTasks([]);
        }
      }
    }
    
    setLoading(false);
  };

  // CORRIGIDO: Função para salvar job pessoal no Firebase
  const updateJob = async (id: string, updates: Partial<Job>) => {
    if (!user) {
      console.error('❌ Usuário não encontrado para salvar job');
      return;
    }

    try {
      console.log('💾 Salvando job pessoal editado:', id, updates);
      
      // Atualizar no estado local primeiro
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === id 
            ? { ...job, ...updates, updatedAt: new Date().toISOString() }
            : job
        )
      );

      // Buscar dados atuais do usuário
      const currentData = await firestoreService.getUserData(user.id);

      if (currentData && 'jobs' in currentData && currentData.jobs) {
        // Atualizar job no array pessoal
        const updatedJobs = currentData.jobs.map(job => 
          job.id === id 
            ? { ...job, ...updates, updatedAt: new Date().toISOString() }
            : job
        );

        // Salvar no Firebase na coleção pessoal
        await firestoreService.updateField('usuarios', user.id, 'jobs', updatedJobs);
        console.log('✅ Job pessoal salvo no Firebase com sucesso');
      }

    } catch (error) {
      console.error('❌ Erro ao salvar job pessoal:', error);
      throw error; // Re-throw para mostrar erro na UI
    }
  };

  const addJob = (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'companyId'>) => {
    const newJob: Job = {
      ...job,
      id: `job_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user!.id,
      companyId: undefined
    };
    setJobs(prev => [...prev, newJob]);
    console.log('📋 Job adicionado ao estado local:', newJob.id);
  };

  const deleteJob = async (id: string) => {
    if (!user) {
      console.error('❌ Usuário não encontrado para deletar job');
      return;
    }

    try {
      console.log('🗑️ Deletando job:', id);
      
      // Remover do estado local
      setJobs(prev => prev.filter(job => job.id !== id));

      // Buscar dados atuais do usuário
      const currentData = await firestoreService.getUserData(user.id);

      if (currentData && 'jobs' in currentData && currentData.jobs) {
        // Remover job do array pessoal
        const updatedJobs = currentData.jobs.filter(job => job.id !== id);

        // Salvar no Firebase
        await firestoreService.updateField('usuarios', user.id, 'jobs', updatedJobs);
        console.log('✅ Job removido do Firebase com sucesso');
      }

    } catch (error) {
      console.error('❌ Erro ao deletar job:', error);
      throw error;
    }
  };

  const addMonthlyCost = (cost: Omit<MonthlyCost, 'id' | 'createdAt' | 'userId' | 'companyId'>) => {
    const newCost: MonthlyCost = {
      ...cost,
      id: `cost_${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: user!.id,
      companyId: undefined
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
      companyId: undefined
    };
    setWorkItems(prev => [...prev, newItem]);
  };

  const updateWorkItem = (id: string, updates: Partial<WorkItem>) => {
    setWorkItems(prev => 
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

  const deleteWorkItem = (id: string) => setWorkItems(prev => prev.filter(item => item.id !== id));

  // CORRIGIDO: Tasks sempre filtram por userId do usuário atual
  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    const newTask: Task = {
      ...task,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: user!.id // SEMPRE userId do usuário atual
    };
    const allTasks = [...tasks, newTask];
    setTasks(allTasks);
    
    // Salvar todas as tasks no localStorage (não apenas as do usuário)
    const storedTasks = localStorage.getItem('financeflow_tasks');
    let existingTasks = [];
    if (storedTasks) {
      try {
        existingTasks = JSON.parse(storedTasks);
      } catch (error) {
        console.error('Erro ao carregar tasks existentes:', error);
      }
    }
    
    // Adicionar a nova task às existentes
    const updatedAllTasks = [...existingTasks, newTask];
    localStorage.setItem('financeflow_tasks', JSON.stringify(updatedAllTasks));
    console.log('📝 Task adicionada e salva no localStorage');
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    // Atualizar no estado local
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    );
    setTasks(updatedTasks);
    
    // Atualizar no localStorage (todas as tasks)
    const storedTasks = localStorage.getItem('financeflow_tasks');
    if (storedTasks) {
      try {
        const allTasks = JSON.parse(storedTasks);
        const updatedAllTasks = allTasks.map((task: Task) => 
          task.id === id ? { ...task, ...updates } : task
        );
        localStorage.setItem('financeflow_tasks', JSON.stringify(updatedAllTasks));
        console.log('📝 Task atualizada no localStorage');
      } catch (error) {
        console.error('Erro ao atualizar task no localStorage:', error);
      }
    }
  };

  const deleteTask = (id: string) => {
    // Remover do estado local
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    
    // Remover do localStorage (todas as tasks)
    const storedTasks = localStorage.getItem('financeflow_tasks');
    if (storedTasks) {
      try {
        const allTasks = JSON.parse(storedTasks);
        const updatedAllTasks = allTasks.filter((task: Task) => task.id !== id);
        localStorage.setItem('financeflow_tasks', JSON.stringify(updatedAllTasks));
        console.log('📝 Task removida do localStorage');
      } catch (error) {
        console.error('Erro ao remover task do localStorage:', error);
      }
    }
  };

  const updateWorkRoutine = async (routine: Omit<WorkRoutine, 'userId'>) => {
    if (!user) {
      console.error('❌ Usuário não encontrado para salvar rotina');
      return;
    }

    const newRoutine: WorkRoutine = {
      ...routine,
      userId: user.id
    };
    
    setWorkRoutine(newRoutine);

    try {
      // Salvar no Firebase na estrutura correta
      const routineData = {
        desiredSalary: routine.desiredSalary,
        workDays: routine.workDaysPerMonth,
        dailyHours: routine.workHoursPerDay,
        dalilyValue: routine.valuePerDay,
        valuePerHour: routine.valuePerHour
      };

      await firestoreService.updateUserField(user.id, 'routine', routineData);
      console.log('✅ Rotina salva no Firebase com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar rotina no Firebase:', error);
      throw error;
    }
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
