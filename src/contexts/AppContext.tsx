import React, { createContext, useContext, useState, useEffect } from 'react';
import { Job, MonthlyCost, WorkItem, Task, WorkRoutine } from '../types';
import { useAuth } from './AuthContext';
import { firestoreService } from '../services/firestore';
import { taskService } from '../services/taskService';

interface AppContextType {
  jobs: Job[];
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => void;
  monthlyCosts: MonthlyCost[];
  addMonthlyCost: (cost: Omit<MonthlyCost, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateMonthlyCost: (id: string, updates: Partial<MonthlyCost>) => Promise<void>;
  deleteMonthlyCost: (id: string) => Promise<void>;
  workItems: WorkItem[];
  addWorkItem: (item: Omit<WorkItem, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateWorkItem: (id: string, updates: Partial<WorkItem>) => Promise<void>;
  deleteWorkItem: (id: string) => Promise<void>;
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
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

  const loadUserData = async () => {
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

      // NOVO: Carregar tasks do Firebase e migrar localStorage se necessário
      try {
        // Primeiro, tentar migrar tasks do localStorage
        await taskService.migrateLocalStorageTasks(user!.id);
        
        // Depois carregar todas as tasks do Firebase
        const userTasks = await taskService.getUserTasks(user!.id);
        console.log('📝 Tasks carregadas do Firebase:', userTasks.length);
        setTasks(userTasks);
      } catch (error) {
        console.error('❌ Erro ao carregar/migrar tasks:', error);
        setTasks([]);
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

  // CORRIGIDO: Função para adicionar custo mensal e salvar no Firebase
  const addMonthlyCost = async (cost: Omit<MonthlyCost, 'id' | 'createdAt' | 'userId' | 'companyId'>) => {
    if (!user) {
      console.error('❌ Usuário não encontrado para salvar custo');
      throw new Error('Usuário não encontrado');
    }

    const newCost: MonthlyCost = {
      ...cost,
      id: `cost_${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: user.id,
      companyId: undefined
    };

    try {
      // Atualizar estado local primeiro
      setMonthlyCosts(prev => [...prev, newCost]);

      // Buscar dados atuais do usuário
      const currentData = await firestoreService.getUserData(user.id);

      if (currentData) {
        const currentExpenses = currentData.expenses || [];
        
        // Converter para formato do Firebase
        const firebaseExpense = {
          id: newCost.id,
          description: newCost.description,
          category: newCost.category,
          value: newCost.value,
          month: newCost.month,
          createdAt: newCost.createdAt
        };

        const updatedExpenses = [...currentExpenses, firebaseExpense];

        // Salvar no Firebase
        await firestoreService.updateField('usuarios', user.id, 'expenses', updatedExpenses);
        console.log('✅ Custo mensal salvo no Firebase com sucesso');
      }
    } catch (error) {
      // Reverter estado local em caso de erro
      setMonthlyCosts(prev => prev.filter(c => c.id !== newCost.id));
      console.error('❌ Erro ao salvar custo mensal:', error);
      throw error;
    }
  };

  const updateMonthlyCost = async (id: string, updates: Partial<MonthlyCost>) => {
    if (!user) {
      console.error('❌ Usuário não encontrado para atualizar custo');
      throw new Error('Usuário não encontrado');
    }

    try {
      // Atualizar estado local primeiro
      setMonthlyCosts(prev => 
        prev.map(cost => cost.id === id ? { ...cost, ...updates } : cost)
      );

      // Buscar dados atuais do usuário
      const currentData = await firestoreService.getUserData(user.id);

      if (currentData && currentData.expenses) {
        // Atualizar no array de expenses
        const updatedExpenses = currentData.expenses.map(expense => 
          expense.id === id 
            ? { 
                ...expense, 
                description: updates.description || expense.description,
                category: updates.category || expense.category,
                value: updates.value || expense.value,
                month: updates.month || expense.month
              }
            : expense
        );

        // Salvar no Firebase
        await firestoreService.updateField('usuarios', user.id, 'expenses', updatedExpenses);
        console.log('✅ Custo mensal atualizado no Firebase com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar custo mensal:', error);
      throw error;
    }
  };

  const deleteMonthlyCost = async (id: string) => {
    if (!user) {
      console.error('❌ Usuário não encontrado para deletar custo');
      throw new Error('Usuário não encontrado');
    }

    try {
      // Remover do estado local primeiro
      setMonthlyCosts(prev => prev.filter(cost => cost.id !== id));

      // Buscar dados atuais do usuário
      const currentData = await firestoreService.getUserData(user.id);

      if (currentData && currentData.expenses) {
        // Remover do array de expenses
        const updatedExpenses = currentData.expenses.filter(expense => expense.id !== id);

        // Salvar no Firebase
        await firestoreService.updateField('usuarios', user.id, 'expenses', updatedExpenses);
        console.log('✅ Custo mensal removido do Firebase com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao deletar custo mensal:', error);
      throw error;
    }
  };

  // CORRIGIDO: Função para adicionar item de trabalho e salvar no Firebase
  const addWorkItem = async (item: Omit<WorkItem, 'id' | 'createdAt' | 'userId' | 'companyId'>) => {
    if (!user) {
      console.error('❌ Usuário não encontrado para salvar item');
      throw new Error('Usuário não encontrado');
    }

    const newItem: WorkItem = {
      ...item,
      id: `item_${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: user.id,
      companyId: undefined
    };

    try {
      // Atualizar estado local primeiro
      setWorkItems(prev => [...prev, newItem]);

      // Buscar dados atuais do usuário
      const currentData = await firestoreService.getUserData(user.id);

      if (currentData) {
        const currentEquipments = currentData.equipments || [];
        
        // Converter para formato do Firebase
        const firebaseEquipment = {
          id: newItem.id,
          description: newItem.description,
          name: newItem.description, // Manter compatibilidade
          category: newItem.category,
          value: newItem.value,
          depreciationYears: newItem.depreciationYears,
          createdAt: newItem.createdAt
        };

        const updatedEquipments = [...currentEquipments, firebaseEquipment];

        // Salvar no Firebase
        await firestoreService.updateField('usuarios', user.id, 'equipments', updatedEquipments);
        console.log('✅ Item de trabalho salvo no Firebase com sucesso');
      }
    } catch (error) {
      // Reverter estado local em caso de erro
      setWorkItems(prev => prev.filter(i => i.id !== newItem.id));
      console.error('❌ Erro ao salvar item de trabalho:', error);
      throw error;
    }
  };

  const updateWorkItem = async (id: string, updates: Partial<WorkItem>) => {
    if (!user) {
      console.error('❌ Usuário não encontrado para atualizar item');
      throw new Error('Usuário não encontrado');
    }

    try {
      // Atualizar estado local primeiro
      setWorkItems(prev => 
        prev.map(item => item.id === id ? { ...item, ...updates } : item)
      );

      // Buscar dados atuais do usuário
      const currentData = await firestoreService.getUserData(user.id);

      if (currentData && currentData.equipments) {
        // Atualizar no array de equipments
        const updatedEquipments = currentData.equipments.map(equipment => 
          equipment.id === id 
            ? { 
                ...equipment, 
                description: updates.description || equipment.description,
                name: updates.description || equipment.name || equipment.description,
                category: updates.category || equipment.category,
                value: updates.value || equipment.value,
                depreciationYears: updates.depreciationYears || equipment.depreciationYears
              }
            : equipment
        );

        // Salvar no Firebase
        await firestoreService.updateField('usuarios', user.id, 'equipments', updatedEquipments);
        console.log('✅ Item de trabalho atualizado no Firebase com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar item de trabalho:', error);
      throw error;
    }
  };

  const deleteWorkItem = async (id: string) => {
    if (!user) {
      console.error('❌ Usuário não encontrado para deletar item');
      throw new Error('Usuário não encontrado');
    }

    try {
      // Remover do estado local primeiro
      setWorkItems(prev => prev.filter(item => item.id !== id));

      // Buscar dados atuais do usuário
      const currentData = await firestoreService.getUserData(user.id);

      if (currentData && currentData.equipments) {
        // Remover do array de equipments
        const updatedEquipments = currentData.equipments.filter(equipment => equipment.id !== id);

        // Salvar no Firebase
        await firestoreService.updateField('usuarios', user.id, 'equipments', updatedEquipments);
        console.log('✅ Item de trabalho removido do Firebase com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao deletar item de trabalho:', error);
      throw error;
    }
  };

  // CORRIGIDO: Tasks agora salvam no Firebase com validação
  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) {
      console.error('❌ Usuário não encontrado para salvar task');
      throw new Error('Usuário não encontrado');
    }

    try {
      // Salvar no Firebase primeiro
      const firebaseId = await taskService.addTask({
        ...task,
        userId: user.id
      });
      
      // Criar task para o estado local
      const newTask: Task = {
        ...task,
        id: firebaseId,
        createdAt: new Date().toISOString(),
        userId: user.id
      };
      
      setTasks(prev => [...prev, newTask]);
      console.log('✅ Task adicionada e salva no Firebase');
    } catch (error) {
      console.error('❌ Erro ao salvar task no Firebase:', error);
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) {
      console.error('❌ Usuário não encontrado para atualizar task');
      throw new Error('Usuário não encontrado');
    }

    try {
      // Atualizar no Firebase
      await taskService.updateTask(id, updates);
      
      // Atualizar no estado local
      setTasks(prev => 
        prev.map(task => 
          task.id === id ? { ...task, ...updates } : task
        )
      );
      
      console.log('✅ Task atualizada no Firebase');
    } catch (error) {
      console.error('❌ Erro ao atualizar task no Firebase:', error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) {
      console.error('❌ Usuário não encontrado para deletar task');
      throw new Error('Usuário não encontrado');
    }

    try {
      // Deletar do Firebase
      await taskService.deleteTask(id);
      
      // Remover do estado local
      setTasks(prev => prev.filter(task => task.id !== id));
      
      console.log('✅ Task deletada do Firebase');
    } catch (error) {
      console.error('❌ Erro ao deletar task do Firebase:', error);
      throw error;
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
