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
  importJsonData: (jsonData: any) => Promise<void>;
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
        setLoading(false);
        return;
      }

      console.log('📊 Importando dados de:', agencyData ? 'agência' : 'usuário individual');

      // Importar equipamentos -> workItems (corrigindo para "equipamentos")
      if (dataSource.equipments && dataSource.equipments.length > 0) {
        console.log(`📦 Importando ${dataSource.equipments.length} equipamentos...`);
        const convertedWorkItems: WorkItem[] = dataSource.equipments.map(item => ({
          id: item.id,
          description: item.description,
          category: item.category,
          value: item.value,
          depreciationYears: 5,
          createdAt: new Date().toISOString(),
          userId: user.id
        }));
        setWorkItems(convertedWorkItems);
        console.log('✅ Equipamentos importados:', convertedWorkItems.length);
      } else {
        setWorkItems([]);
        console.log('📦 Nenhum equipamento encontrado');
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
      } else {
        setMonthlyCosts([]);
        console.log('💰 Nenhuma despesa encontrada');
      }

      // Importar jobs
      if (dataSource.jobs && dataSource.jobs.length > 0) {
        console.log(`💼 Importando ${dataSource.jobs.length} jobs...`);
        const convertedJobs: Job[] = dataSource.jobs.map(job => ({
          id: crypto.randomUUID(),
          description: job.descriptions || job.description || 'Job importado',
          client: job.client || 'Cliente não informado',
          eventDate: job.eventDate || new Date().toISOString(),
          estimatedHours: job.hours || 1,
          difficultyLevel: (job.difficulty === 'fácil' || job.difficulty === 'médio' || job.difficulty === 'difícil' || job.difficulty === 'expert') ? job.difficulty : 'médio',
          logistics: job.logistics || 'Não informado',
          equipment: job.equipment || 'Não informado',
          assistance: job.assistance || 'Não informado',
          status: (job.status === 'pendente' || job.status === 'em-andamento' || job.status === 'concluido' || job.status === 'cancelado') ? job.status : 'pendente',
          category: job.category || 'Geral',
          discountValue: 0,
          totalCosts: job.value || 0,
          serviceValue: job.value || 0,
          valueWithDiscount: job.value || 0,
          profitMargin: job.profit || 0,
          createdAt: job.date || new Date().toISOString(),
          updatedAt: job.date || new Date().toISOString(),
          userId: user.id
        }));
        setJobs(convertedJobs);
        console.log('✅ Jobs importados:', convertedJobs.length);
      } else {
        setJobs([]);
        console.log('💼 Nenhum job encontrado');
      }

      // Importar rotina
      if (dataSource.routine) {
        console.log('⏰ Importando rotina de trabalho...');
        const convertedRoutine: WorkRoutine = {
          desiredSalary: dataSource.routine.desiredSalary || 0,
          workDaysPerMonth: dataSource.routine.workDays || 22,
          workHoursPerDay: dataSource.routine.dailyHours || 8,
          valuePerDay: dataSource.routine.dalilyValue || 0,
          valuePerHour: (dataSource.routine.dalilyValue || 0) / (dataSource.routine.dailyHours || 8),
          userId: user.id
        };
        setWorkRoutine(convertedRoutine);
        console.log('✅ Rotina importada:', convertedRoutine);
      } else {
        setWorkRoutine(null);
        console.log('⏰ Nenhuma rotina encontrada');
      }

      // Importar tasks - corrigindo para usar o serviço corretamente
      try {
        console.log('📋 Carregando tasks do usuário...');
        const userTasks = await firestoreService.getUserTasks(user.id);
        if (userTasks && userTasks.length > 0) {
          const convertedTasks: Task[] = userTasks.map((task: any) => ({
            id: task.id || crypto.randomUUID(),
            title: task.name || 'Task sem nome',
            description: task.description || '',
            completed: task.status === 'completed' || task.status === 'concluida',
            priority: 'média' as const,
            dueDate: task.date || new Date().toISOString(),
            createdAt: task.date || new Date().toISOString(),
            userId: user.id
          }));
          setTasks(convertedTasks);
          console.log('✅ Tasks importadas:', convertedTasks.length);
        } else {
          setTasks([]);
          console.log('📋 Nenhuma task encontrada');
        }
      } catch (error) {
        console.error('⚠️ Erro ao carregar tasks:', error);
        setTasks([]);
      }

      console.log('🎉 Importação concluída com sucesso!');

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

  // Work Items operations - corrigindo para usar "equipamentos"
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
      if (dataSource.isAgency) {
        console.log('📦 Adicionando item para agência:', dataSource.uid);
        await firestoreService.addAgencyEquipment(dataSource.uid, newItem);
      } else {
        console.log('📦 Adicionando item para usuário:', dataSource.uid);
        await firestoreService.addEquipment(dataSource.uid, newItem);
      }
      
      const convertedItem: WorkItem = {
        ...itemData,
        id: newItem.id,
        userId: user.id,
        createdAt: new Date().toISOString()
      };
      
      setWorkItems(prev => [convertedItem, ...prev]);
      console.log('✅ Item adicionado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar item de trabalho:', error);
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

      const updatedFirestoreItem = {
        id: id,
        description: itemData.description || currentItem.description,
        category: itemData.category || currentItem.category,
        value: itemData.value || currentItem.value
      };

      if (dataSource.isAgency) {
        console.log('🔄 Atualizando item da agência:', dataSource.uid);
        await firestoreService.removeAgencyEquipment(dataSource.uid, oldFirestoreItem);
        await firestoreService.addAgencyEquipment(dataSource.uid, updatedFirestoreItem);
      } else {
        console.log('🔄 Atualizando item do usuário:', dataSource.uid);
        await firestoreService.removeEquipment(dataSource.uid, oldFirestoreItem);
        await firestoreService.addEquipment(dataSource.uid, updatedFirestoreItem);
      }

      setWorkItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...itemData } : item
      ));
      console.log('✅ Item atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar item de trabalho:', error);
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

      if (dataSource.isAgency) {
        console.log('🗑️ Removendo item da agência:', dataSource.uid);
        await firestoreService.removeAgencyEquipment(dataSource.uid, firestoreItem);
      } else {
        console.log('🗑️ Removendo item do usuário:', dataSource.uid);
        await firestoreService.removeEquipment(dataSource.uid, firestoreItem);
      }

      setWorkItems(prev => prev.filter(item => item.id !== id));
      console.log('✅ Item removido com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar item de trabalho:', error);
      throw error;
    }
  };

  // Monthly Costs operations - usando métodos específicos conforme tipo
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
      if (dataSource.isAgency) {
        console.log('💰 Adicionando custo para agência:', dataSource.uid);
        await firestoreService.addAgencyExpense(dataSource.uid, newCost);
      } else {
        console.log('💰 Adicionando custo para usuário:', dataSource.uid);
        await firestoreService.addExpense(dataSource.uid, newCost);
      }
      
      const convertedCost: MonthlyCost = {
        ...costData,
        id: newCost.id,
        userId: user.id,
        createdAt: new Date().toISOString()
      };
      
      setMonthlyCosts(prev => [convertedCost, ...prev]);
      console.log('✅ Custo adicionado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar custo mensal:', error);
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

      const updatedFirestoreCost = {
        id: id,
        description: costData.description || currentCost.description,
        category: costData.category || currentCost.category,
        value: costData.value || currentCost.value
      };

      if (dataSource.isAgency) {
        console.log('🔄 Atualizando custo da agência:', dataSource.uid);
        await firestoreService.removeAgencyExpense(dataSource.uid, oldFirestoreCost);
        await firestoreService.addAgencyExpense(dataSource.uid, updatedFirestoreCost);
      } else {
        console.log('🔄 Atualizando custo do usuário:', dataSource.uid);
        await firestoreService.removeExpense(dataSource.uid, oldFirestoreCost);
        await firestoreService.addExpense(dataSource.uid, updatedFirestoreCost);
      }

      setMonthlyCosts(prev => prev.map(cost => 
        cost.id === id ? { ...cost, ...costData } : cost
      ));
      console.log('✅ Custo atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar custo mensal:', error);
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

      if (dataSource.isAgency) {
        console.log('🗑️ Removendo custo da agência:', dataSource.uid);
        await firestoreService.removeAgencyExpense(dataSource.uid, firestoreCost);
      } else {
        console.log('🗑️ Removendo custo do usuário:', dataSource.uid);
        await firestoreService.removeExpense(dataSource.uid, firestoreCost);
      }

      setMonthlyCosts(prev => prev.filter(cost => cost.id !== id));
      console.log('✅ Custo removido com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar custo mensal:', error);
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
    
    const dataSource = getCurrentDataSource();
    const newJob: Job = {
      ...jobData,
      id: crypto.randomUUID(),
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Converter para formato Firebase
    const firestoreJob = {
      assistance: typeof jobData.assistance === 'number' ? jobData.assistance : 0,
      category: jobData.category,
      client: jobData.client,
      date: newJob.createdAt,
      descriptions: jobData.description,
      difficulty: jobData.difficultyLevel,
      equipment: typeof jobData.equipment === 'number' ? jobData.equipment : 0,
      eventDate: jobData.eventDate,
      hours: jobData.estimatedHours,
      logistics: typeof jobData.logistics === 'number' ? jobData.logistics : 0,
      profit: jobData.profitMargin,
      status: jobData.status,
      value: jobData.serviceValue
    };

    try {
      if (dataSource.isAgency) {
        await firestoreService.addAgencyJob(dataSource.uid, firestoreJob);
      } else {
        await firestoreService.addJob(dataSource.uid, firestoreJob);
      }
      
      setJobs(prev => [newJob, ...prev]);
      console.log('✅ Job adicionado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar job:', error);
      throw error;
    }
  };

  const updateJob = async (id: string, jobData: Partial<Job>) => {
    if (!user) return;

    const dataSource = getCurrentDataSource();

    try {
      const currentJob = jobs.find(job => job.id === id);
      if (!currentJob) return;

      // Atualizar estado local primeiro
      setJobs(prev => prev.map(job => 
        job.id === id ? { ...job, ...jobData, updatedAt: new Date().toISOString() } : job
      ));

      // Converter para formato Firebase
      const updatedJob = { ...currentJob, ...jobData };
      const firestoreJob = {
        assistance: typeof updatedJob.assistance === 'number' ? updatedJob.assistance : 0,
        category: updatedJob.category,
        client: updatedJob.client,
        date: updatedJob.createdAt,
        descriptions: updatedJob.description,
        difficulty: updatedJob.difficultyLevel,
        equipment: typeof updatedJob.equipment === 'number' ? updatedJob.equipment : 0,
        eventDate: updatedJob.eventDate,
        hours: updatedJob.estimatedHours,
        logistics: typeof updatedJob.logistics === 'number' ? updatedJob.logistics : 0,
        profit: updatedJob.profitMargin,
        status: updatedJob.status,
        value: updatedJob.serviceValue
      };

      // Buscar jobs atuais
      const currentData = dataSource.isAgency ? 
        await firestoreService.getAgencyData(dataSource.uid) : 
        await firestoreService.getUserData(dataSource.uid);
      
      if (currentData && currentData.jobs) {
        // Atualizar array de jobs
        const updatedJobs = currentData.jobs.map((job: any) => 
          job.date === currentJob.createdAt ? firestoreJob : job
        );

        if (dataSource.isAgency) {
          await firestoreService.updateAgencyJobs(dataSource.uid, updatedJobs);
        } else {
          await firestoreService.updateJobs(dataSource.uid, updatedJobs);
        }
      }

      console.log('✅ Job atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar job:', error);
      throw error;
    }
  };

  const deleteJob = async (id: string) => {
    if (!user) return;

    const dataSource = getCurrentDataSource();

    try {
      const jobToDelete = jobs.find(job => job.id === id);
      if (!jobToDelete) return;

      setJobs(prev => prev.filter(job => job.id !== id));

      // Buscar jobs atuais e remover o job
      const currentData = dataSource.isAgency ? 
        await firestoreService.getAgencyData(dataSource.uid) : 
        await firestoreService.getUserData(dataSource.uid);
      
      if (currentData && currentData.jobs) {
        const updatedJobs = currentData.jobs.filter((job: any) => 
          job.date !== jobToDelete.createdAt
        );

        if (dataSource.isAgency) {
          await firestoreService.updateAgencyJobs(dataSource.uid, updatedJobs);
        } else {
          await firestoreService.updateJobs(dataSource.uid, updatedJobs);
        }
      }

      console.log('✅ Job removido com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar job:', error);
      throw error;
    }
  };

  // Tasks operations (mantendo a estrutura existente por enquanto)
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;
    
    const firestoreTask = {
      name: taskData.title,
      description: taskData.description,
      date: taskData.dueDate || new Date().toISOString(),
      status: taskData.completed ? 'completed' : 'pending',
      ownerUID: user.id
    };

    try {
      const taskId = await firestoreService.addTask(firestoreTask);
      
      const newTask: Task = {
        ...taskData,
        id: taskId,
        userId: user.id,
        createdAt: new Date().toISOString()
      };
      
      setTasks(prev => [newTask, ...prev]);
      console.log('✅ Task adicionada ao Firebase');
    } catch (error) {
      console.error('❌ Erro ao adicionar task:', error);
      throw error;
    }
  };

  const updateTask = async (id: string, taskData: Partial<Task>) => {
    if (!user) return;

    try {
      const firestoreUpdate = {
        name: taskData.title,
        description: taskData.description,
        date: taskData.dueDate,
        status: taskData.completed ? 'completed' : 'pending'
      };

      await firestoreService.updateTask(id, firestoreUpdate);
      
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...taskData } : task
      ));
      console.log('✅ Task atualizada no Firebase');
    } catch (error) {
      console.error('❌ Erro ao atualizar task:', error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await firestoreService.deleteTask(id);
      setTasks(prev => prev.filter(task => task.id !== id));
      console.log('✅ Task deletada no Firebase');
    } catch (error) {
      console.error('❌ Erro ao deletar task:', error);
      throw error;
    }
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

  // Função para importar dados JSON
  const importJsonData = async (jsonData: any) => {
    if (!user) return;

    const dataSource = getCurrentDataSource();
    
    try {
      await firestoreService.importUserData(dataSource.uid, jsonData);
      await importFirebaseData(); // Recarregar dados após importação
      console.log('✅ Dados JSON importados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao importar dados JSON:', error);
      throw error;
    }
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
      calculateJobPrice,
      importJsonData
    }}>
      {children}
    </AppContext.Provider>
  );
};
