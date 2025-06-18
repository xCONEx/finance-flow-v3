import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabaseAuth } from './SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNotifications } from '../hooks/useNotifications';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'baixa' | 'média' | 'alta';
  status: 'todo' | 'editing' | 'urgent' | 'delivered' | 'revision';
  dueDate?: string;
  createdAt: string;
  userId: string;
}

interface MonthlyCost {
  id: string;
  description: string;
  category: string;
  value: number;
  month: string;
  dueDate?: string;
  isRecurring: boolean;
  installments?: number;
  currentInstallment?: number;
  parentId?: string;
  notificationEnabled: boolean;
  createdAt: string;
  userId: string;
  companyId?: string;
}

interface WorkItem {
  id: string;
  description: string;
  category: string;
  value: number;
  depreciationYears: number;
  createdAt: string;
  userId: string;
  companyId?: string;
}

interface Job {
  id: string;
  description: string;
  client: string;
  eventDate: string;
  estimatedHours: number;
  difficultyLevel: 'fácil' | 'médio' | 'complicado' | 'difícil';
  logistics: number;
  equipment: number;
  assistance: number;
  status: 'pendente' | 'aprovado';
  category: string;
  discountValue: number;
  totalCosts: number;
  serviceValue: number;
  valueWithDiscount: number;
  profitMargin: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  companyId?: string;
}

interface WorkRoutine {
  id: string;
  workHoursPerDay: number;
  workDaysPerMonth: number;
  valuePerHour: number;
  valuePerDay: number;
  desiredSalary: number;
  userId: string;
}

interface VideoProject {
  id: string;
  title: string;
  description: string;
  clientName: string;
  deadline: string;
  priority: 'alta' | 'média' | 'baixa';
  projectType: 'Casamento' | 'Evento Corporativo' | 'Comercial' | 'Documentário' | 'Social Media' | 'Outro';
  estimatedDuration: string;
  deliveryLinks: DeliveryLink[];
  createdAt: string;
  assignedTo: string;
  notes: string;
  status: 'filmado' | 'edicao' | 'revisao' | 'entregue';
}

interface DeliveryLink {
  id: string;
  url: string;
  platform: 'WeTransfer' | 'Google Drive' | 'Dropbox' | 'YouTube' | 'Vimeo' | 'Outro';
  description: string;
  uploadedAt: string;
  isPublic: boolean;
}

interface CostNotification {
  id: string;
  costId: string;
  userId: string;
  title: string;
  message: string;
  dueDate: string;
  isRead: boolean;
  createdAt: string;
}

interface AppContextType {
  currentView: string;
  setCurrentView: (view: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Data state
  tasks: Task[];
  jobs: Job[];
  monthlyCosts: MonthlyCost[];
  workItems: WorkItem[];
  workRoutine: WorkRoutine | null;
  projects: VideoProject[];
  notifications: CostNotification[];
  loading: boolean;
  
  // Task functions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Job functions
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  refreshJobs: () => Promise<void>;
  
  // Monthly cost functions
  addMonthlyCost: (cost: Omit<MonthlyCost, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateMonthlyCost: (id: string, updates: Partial<MonthlyCost>) => Promise<void>;
  deleteMonthlyCost: (id: string) => Promise<void>;
  
  // Work item functions
  addWorkItem: (item: Omit<WorkItem, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateWorkItem: (id: string, updates: Partial<WorkItem>) => Promise<void>;
  deleteWorkItem: (id: string) => Promise<void>;

  // Work routine functions
  refreshWorkRoutine: () => Promise<void>;

  // Project functions
  addProject: (project: VideoProject) => Promise<void>;
  updateProject: (id: string, updates: Partial<VideoProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Notification functions
  getUpcomingNotifications: () => CostNotification[];
  markNotificationAsRead: (id: string) => Promise<void>;
  checkDueNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useSupabaseAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data state - declare monthlyCosts before using it
  const [tasks, setTasks] = useState<Task[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [workRoutine, setWorkRoutine] = useState<WorkRoutine | null>(null);
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [notifications, setNotifications] = useState<CostNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // Now we can safely use monthlyCosts in useNotifications
  const { scheduleNotification, sendImmediateNotification } = useNotifications(monthlyCosts);

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated]);

  // Load data from Supabase
  useEffect(() => {
    if (isAuthenticated && user) {
      loadAllData();
      // Check for due notifications every minute
      const interval = setInterval(checkDueNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  // Function to save tasks to Supabase
  const saveTasksToSupabase = async (tasksToSave: Task[]) => {
    if (!user) return;

    try {
      console.log('🔍 Salvando tasks no Supabase...');

      // Buscar dados atuais do perfil
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('subscription_data')
        .eq('id', user.id)
        .single();

      // Preparar dados das tasks
      const tasksData = {
        tasks: tasksToSave,
        lastUpdated: new Date().toISOString()
      };

      // Preparar subscription_data com type safety
      const currentSubscriptionData = currentProfile?.subscription_data;
      const baseData = (currentSubscriptionData && typeof currentSubscriptionData === 'object' && !Array.isArray(currentSubscriptionData)) 
        ? currentSubscriptionData as Record<string, any>
        : {};

      const updatedSubscriptionData = {
        ...baseData,
        user_tasks: tasksData
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_data: updatedSubscriptionData as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Erro ao salvar tasks:', updateError);
        throw updateError;
      }

      console.log('✅ Tasks salvas com sucesso!');
      
      // Backup no localStorage
      localStorage.setItem('entregaFlowTasks', JSON.stringify(tasksToSave));
      localStorage.setItem('entregaFlowTasksUserId', user.id);
    } catch (error) {
      console.error('❌ Erro ao salvar tasks:', error);
      
      // Fallback to localStorage
      console.log('💾 Salvando tasks no localStorage como fallback');
      localStorage.setItem('entregaFlowTasks', JSON.stringify(tasksToSave));
      localStorage.setItem('entregaFlowTasksUserId', user.id);
    }
  };

  // Function to load tasks from Supabase
  const loadTasksFromSupabase = async (): Promise<Task[]> => {
    if (!user) return [];

    try {
      console.log('📦 Carregando tasks do Supabase...');

      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_data')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ Erro ao carregar tasks:', error);
        return loadTasksFromLocalStorage();
      }

      // Type safety para acessar user_tasks
      const subscriptionData = data?.subscription_data;
      let tasksData = null;

      if (subscriptionData && typeof subscriptionData === 'object' && !Array.isArray(subscriptionData)) {
        const typedData = subscriptionData as Record<string, any>;
        tasksData = typedData.user_tasks;
      }
      
      if (!tasksData || !tasksData.tasks || tasksData.tasks.length === 0) {
        console.log('📦 Nenhuma task no Supabase, tentando localStorage...');
        return loadTasksFromLocalStorage();
      }

      const loadedTasks: Task[] = tasksData.tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        completed: task.completed || false,
        priority: task.priority as 'baixa' | 'média' | 'alta',
        status: task.status as 'todo' | 'editing' | 'urgent' | 'delivered' | 'revision',
        dueDate: task.dueDate || '',
        createdAt: task.createdAt,
        userId: task.userId
      }));

      console.log('🎉 Tasks carregadas do Supabase:', loadedTasks.length);
      return loadedTasks;
    } catch (error) {
      console.error('❌ Erro ao carregar tasks:', error);
      return loadTasksFromLocalStorage();
    }
  };

  // Function to load tasks from localStorage
  const loadTasksFromLocalStorage = (): Task[] => {
    const savedTasks = localStorage.getItem('entregaFlowTasks');
    const savedUserId = localStorage.getItem('entregaFlowTasksUserId');
    
    if (savedTasks && savedUserId === user?.id) {
      try {
        const tasks = JSON.parse(savedTasks);
        console.log('📦 Tasks carregadas do localStorage:', tasks?.length || 0);
        return tasks || [];
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse das tasks do localStorage:', parseError);
        return [];
      }
    }
    
    console.log('📦 Nenhuma task encontrada para o usuário');
    return [];
  };

  const loadMonthlyCosts = async () => {
    if (!user) return;
    
    try {
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id);
      
      if (expensesError) {
        console.error('❌ Erro ao carregar despesas:', expensesError);
      } else if (expensesData) {
        setMonthlyCosts(expensesData.map(expense => ({
          id: expense.id,
          description: expense.description,
          category: expense.category,
          value: Number(expense.value),
          month: expense.month,
          dueDate: (expense as any).due_date || undefined,
          isRecurring: (expense as any).is_recurring || false,
          installments: (expense as any).installments || undefined,
          currentInstallment: (expense as any).current_installment || undefined,
          parentId: (expense as any).parent_id || undefined,
          notificationEnabled: (expense as any).notification_enabled !== false,
          createdAt: expense.created_at,
          userId: expense.user_id
        })));
      }
    } catch (error) {
      console.error('❌ Erro ao carregar despesas:', error);
    }
  };

  const loadAllData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load tasks
      const loadedTasks = await loadTasksFromSupabase();
      setTasks(loadedTasks);

      // Load jobs
      await refreshJobs();

      // Load equipment (work items)
      try {
        const { data: equipmentData } = await supabase
          .from('equipment')
          .select('*')
          .eq('user_id', user.id);
        
        if (equipmentData) {
          setWorkItems(equipmentData.map(item => ({
            id: item.id,
            description: item.description,
            category: item.category,
            value: Number(item.value),
            depreciationYears: item.depreciation_years || 5,
            createdAt: item.created_at,
            userId: item.user_id
          })));
        }
      } catch (error) {
        console.warn('Erro ao carregar equipamentos:', error);
      }

      // Load expenses (monthly costs)
      await loadMonthlyCosts();

      // Load work routine
      await refreshWorkRoutine();

      // Load notifications - skip if table doesn't exist yet
      try {
        await loadNotifications();
      } catch (error) {
        console.warn('Cost notifications table not available yet:', error);
        setNotifications([]);
      }

      // Check for due notifications
      checkDueNotifications();

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      // Use any type to bypass TypeScript errors for now
      const { data: notificationsData } = await (supabase as any)
        .from('cost_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('due_date', { ascending: true });
      
      if (notificationsData) {
        setNotifications(notificationsData.map((notification: any) => ({
          id: notification.id,
          costId: notification.cost_id,
          userId: notification.user_id,
          title: notification.title,
          message: notification.message,
          dueDate: notification.due_date,
          isRead: notification.is_read,
          createdAt: notification.created_at
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const checkDueNotifications = () => {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    monthlyCosts.forEach(cost => {
      if (cost.dueDate && cost.notificationEnabled) {
        const dueDate = new Date(cost.dueDate);
        const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 3) {
          toast({
            title: "Vencimento em 3 dias",
            description: `${cost.description} vence em ${cost.dueDate}`,
          });
        } else if (daysDiff === 0) {
          toast({
            title: "Vencimento hoje",
            description: `${cost.description} vence hoje!`,
            variant: "destructive"
          });
        }
      }
    });
  };

  const createRecurringCosts = async (baseCost: MonthlyCost) => {
    if (!baseCost.isRecurring) return;
    
    const nextMonth = new Date(baseCost.month + '-01');
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const nextMonthStr = nextMonth.toISOString().slice(0, 7);
    
    // Check if next month's cost already exists
    const existingCost = monthlyCosts.find(cost => 
      cost.parentId === baseCost.id && cost.month === nextMonthStr
    );
    
    if (!existingCost) {
      const nextCost = {
        ...baseCost,
        id: `${baseCost.id}_${nextMonthStr}`,
        month: nextMonthStr,
        parentId: baseCost.id,
        dueDate: baseCost.dueDate ? baseCost.dueDate.replace(baseCost.month, nextMonthStr) : undefined
      };
      
      await addMonthlyCost(nextCost);
    }
  };

  const createInstallmentCosts = async (baseCost: MonthlyCost) => {
    if (!baseCost.installments || baseCost.installments <= 1) return;
    
    const installmentValue = baseCost.value / baseCost.installments;
    
    for (let i = 1; i < baseCost.installments; i++) {
      const installmentDate = new Date(baseCost.month + '-01');
      installmentDate.setMonth(installmentDate.getMonth() + i);
      
      const installmentMonth = installmentDate.toISOString().slice(0, 7);
      
      const installmentCost: Omit<MonthlyCost, 'id' | 'createdAt' | 'userId'> = {
        description: `${baseCost.description} (${i + 1}/${baseCost.installments})`,
        category: baseCost.category,
        value: installmentValue,
        month: installmentMonth,
        dueDate: baseCost.dueDate ? baseCost.dueDate.replace(baseCost.month, installmentMonth) : undefined,
        isRecurring: false,
        installments: baseCost.installments,
        currentInstallment: i + 1,
        parentId: baseCost.id,
        notificationEnabled: baseCost.notificationEnabled
      };
      
      await addMonthlyCost(installmentCost);
    }
    
    // Update the base cost to show it's the first installment
    await updateMonthlyCost(baseCost.id, {
      description: `${baseCost.description} (1/${baseCost.installments})`,
      value: installmentValue,
      currentInstallment: 1
    });
  };

  const createInstallments = async (baseCost: MonthlyCost, installments: number) => {
    const installmentValue = baseCost.value / installments;
    
    for (let i = 1; i < installments; i++) {
      const installmentDate = new Date(baseCost.month + '-01');
      installmentDate.setMonth(installmentDate.getMonth() + i);
      
      const installmentMonth = installmentDate.toISOString().slice(0, 7);
      
      const installmentCost: Omit<MonthlyCost, 'id' | 'createdAt' | 'userId'> = {
        description: `${baseCost.description} (${i + 1}/${installments})`,
        category: baseCost.category,
        value: installmentValue,
        month: installmentMonth,
        dueDate: baseCost.dueDate ? baseCost.dueDate.replace(baseCost.month, installmentMonth) : undefined,
        isRecurring: false,
        installments: installments,
        currentInstallment: i + 1,
        parentId: baseCost.id,
        notificationEnabled: baseCost.notificationEnabled
      };
      
      await addMonthlyCost(installmentCost);
    }
  };

  // Refresh functions
  const refreshJobs = async () => {
    if (!user) return;
    
    try {
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id);
      
      if (jobsData) {
        setJobs(jobsData.map(job => ({
          id: job.id,
          description: job.description,
          client: job.client,
          eventDate: job.event_date || '',
          estimatedHours: job.estimated_hours || 0,
          difficultyLevel: job.difficulty_level || 'médio',
          logistics: job.logistics || 0,
          equipment: job.equipment || 0,
          assistance: job.assistance || 0,
          status: job.status || 'pendente',
          category: job.category || '',
          discountValue: job.discount_value || 0,
          totalCosts: job.total_costs || 0,
          serviceValue: job.service_value || 0,
          valueWithDiscount: job.value_with_discount || 0,
          profitMargin: job.profit_margin || 30,
          createdAt: job.created_at,
          updatedAt: job.updated_at,
          userId: job.user_id
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar jobs:', error);
    }
  };

  const refreshWorkRoutine = async () => {
    if (!user) return;
    
    try {
      const { data: routineData } = await supabase
        .from('work_routine')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (routineData) {
        setWorkRoutine({
          id: routineData.id,
          workHoursPerDay: routineData.work_hours_per_day || 8,
          workDaysPerMonth: routineData.work_days_per_month || 22,
          valuePerHour: Number(routineData.value_per_hour) || 0,
          valuePerDay: Number(routineData.value_per_day) || 0,
          desiredSalary: Number(routineData.desired_salary) || 0,
          userId: routineData.user_id
        });
      }
    } catch (error) {
      console.error('Erro ao carregar rotina de trabalho:', error);
    }
  };

  // Job functions
  const addJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        description: jobData.description,
        client: jobData.client,
        event_date: jobData.eventDate || null,
        estimated_hours: jobData.estimatedHours,
        difficulty_level: jobData.difficultyLevel,
        logistics: jobData.logistics,
        equipment: jobData.equipment,
        assistance: jobData.assistance,
        status: jobData.status,
        category: jobData.category,
        discount_value: jobData.discountValue,
        total_costs: jobData.totalCosts,
        service_value: jobData.serviceValue,
        value_with_discount: jobData.valueWithDiscount,
        profit_margin: jobData.profitMargin
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      const newJob: Job = {
        id: data.id,
        description: data.description,
        client: data.client,
        eventDate: data.event_date || '',
        estimatedHours: data.estimated_hours || 0,
        difficultyLevel: data.difficulty_level || 'médio',
        logistics: data.logistics || 0,
        equipment: data.equipment || 0,
        assistance: data.assistance || 0,
        status: data.status || 'pendente',
        category: data.category || '',
        discountValue: data.discount_value || 0,
        totalCosts: data.total_costs || 0,
        serviceValue: data.service_value || 0,
        valueWithDiscount: data.value_with_discount || 0,
        profitMargin: data.profit_margin || 30,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        userId: data.user_id
      };
      setJobs(prev => [...prev, newJob]);
    }
  };

  const updateJob = async (id: string, updates: Partial<Job>) => {
    const { error } = await supabase
      .from('jobs')
      .update({
        description: updates.description,
        client: updates.client,
        event_date: updates.eventDate || null,
        estimated_hours: updates.estimatedHours,
        difficulty_level: updates.difficultyLevel,
        logistics: updates.logistics,
        equipment: updates.equipment,
        assistance: updates.assistance,
        status: updates.status,
        category: updates.category,
        discount_value: updates.discountValue,
        total_costs: updates.totalCosts,
        service_value: updates.serviceValue,
        value_with_discount: updates.valueWithDiscount,
        profit_margin: updates.profitMargin
      })
      .eq('id', id);

    if (error) throw error;
    setJobs(prev => prev.map(job => 
      job.id === id ? { ...job, ...updates, updatedAt: new Date().toISOString() } : job
    ));
  };

  const deleteJob = async (id: string) => {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setJobs(prev => prev.filter(job => job.id !== id));
  };

  // Work item functions
  const addWorkItem = async (itemData: Omit<WorkItem, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('equipment')
      .insert({
        user_id: user.id,
        description: itemData.description,
        category: itemData.category,
        value: itemData.value,
        depreciation_years: itemData.depreciationYears
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      const newItem: WorkItem = {
        id: data.id,
        description: data.description,
        category: data.category,
        value: Number(data.value),
        depreciationYears: data.depreciation_years || 5,
        createdAt: data.created_at,
        userId: data.user_id
      };
      setWorkItems(prev => [...prev, newItem]);
    }
  };

  const updateWorkItem = async (id: string, updates: Partial<WorkItem>) => {
    const { error } = await supabase
      .from('equipment')
      .update({
        description: updates.description,
        category: updates.category,
        value: updates.value,
        depreciation_years: updates.depreciationYears
      })
      .eq('id', id);

    if (error) throw error;
    setWorkItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteWorkItem = async (id: string) => {
    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setWorkItems(prev => prev.filter(item => item.id !== id));
  };

  // Monthly cost functions - melhorar tratamento de dados
  const addMonthlyCost = async (costData: any) => {
    try {
      console.log('💰 Adicionando custo mensal:', costData);
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const dataToInsert = {
        user_id: user.id,
        description: costData.description,
        category: costData.category,
        value: costData.value,
        month: costData.month,
        due_date: costData.dueDate,
        is_recurring: costData.isRecurring || false,
        installments: costData.installments,
        current_installment: costData.currentInstallment,
        parent_id: costData.parentId,
        notification_enabled: costData.notificationEnabled !== false
      };

      console.log('📝 Dados para inserir:', dataToInsert);

      const { data, error } = await supabase
        .from('expenses')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro detalhado ao inserir custo:', error);
        throw error;
      }

      console.log('✅ Custo inserido com sucesso:', data);

      // Converter para MonthlyCost para uso nas funções
      const monthlyCostData: MonthlyCost = {
        id: data.id,
        description: data.description,
        category: data.category,
        value: Number(data.value),
        month: data.month,
        dueDate: (data as any).due_date,
        isRecurring: (data as any).is_recurring || false,
        installments: (data as any).installments,
        currentInstallment: (data as any).current_installment,
        parentId: (data as any).parent_id,
        notificationEnabled: (data as any).notification_enabled !== false,
        createdAt: data.created_at,
        userId: data.user_id
      };

      // Agendar notificação se habilitada
      if (monthlyCostData.notificationEnabled && monthlyCostData.dueDate) {
        try {
          await scheduleNotification(monthlyCostData);
          console.log('🔔 Notificação agendada para:', data.description);
        } catch (notificationError) {
          console.error('❌ Erro ao agendar notificação:', notificationError);
        }
      }

      // Processar parcelas se existirem
      if (costData.installments && costData.installments > 1) {
        await createInstallments(monthlyCostData, costData.installments);
      }

      await loadMonthlyCosts();
    } catch (error) {
      console.error('❌ Erro ao adicionar custo:', error);
      throw error;
    }
  };

  const updateMonthlyCost = async (id: string, updates: any) => {
    try {
      console.log('📝 Atualizando custo:', id, updates);
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const dataToUpdate = {
        description: updates.description,
        category: updates.category,
        value: updates.value,
        month: updates.month,
        due_date: updates.dueDate,
        is_recurring: updates.isRecurring || false,
        installments: updates.installments,
        current_installment: updates.currentInstallment,
        parent_id: updates.parentId,
        notification_enabled: updates.notificationEnabled !== false,
        updated_at: new Date().toISOString()
      };

      console.log('📝 Dados para atualizar:', dataToUpdate);

      const { data, error } = await supabase
        .from('expenses')
        .update(dataToUpdate)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar custo:', error);
        throw error;
      }

      console.log('✅ Custo atualizado:', data);

      // Reagendar notificação se necessário - converter para MonthlyCost
      if ((data as any).notification_enabled && (data as any).due_date) {
        try {
          const monthlyCostForNotification: MonthlyCost = {
            id: data.id,
            description: data.description,
            category: data.category,
            value: Number(data.value),
            month: data.month,
            dueDate: (data as any).due_date,
            isRecurring: (data as any).is_recurring || false,
            installments: (data as any).installments,
            currentInstallment: (data as any).current_installment,
            parentId: (data as any).parent_id,
            notificationEnabled: (data as any).notification_enabled !== false,
            createdAt: data.created_at,
            userId: data.user_id
          };
          
          await scheduleNotification(monthlyCostForNotification);
          console.log('🔔 Notificação reagendada para:', data.description);
        } catch (notificationError) {
          console.error('❌ Erro ao reagendar notificação:', notificationError);
        }
      }

      await loadMonthlyCosts();
    } catch (error) {
      console.error('❌ Erro ao atualizar custo:', error);
      throw error;
    }
  };

  const deleteMonthlyCost = async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setMonthlyCosts(prev => prev.filter(cost => cost.id !== id));
    
    // Also delete related installments or recurring costs
    const relatedCosts = monthlyCosts.filter(cost => cost.parentId === id);
    for (const relatedCost of relatedCosts) {
      await deleteMonthlyCost(relatedCost.id);
    }
  };

  const getUpcomingNotifications = (): CostNotification[] => {
    return notifications.filter(notification => !notification.isRead);
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('cost_notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      setNotifications(prev => prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      ));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Task functions (mock for now - would need tasks table)
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      userId: user?.id || '',
    };
    
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    await saveTasksToSupabase(updatedTasks);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    );
    setTasks(updatedTasks);
    await saveTasksToSupabase(updatedTasks);
  };

  const deleteTask = async (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    await saveTasksToSupabase(updatedTasks);
  };

  // Project functions (mock for now - would need projects table)
  const addProject = async (projectData: VideoProject) => {
    setProjects(prev => [...prev, projectData]);
  };

  const updateProject = async (id: string, updates: Partial<VideoProject>) => {
    setProjects(prev => prev.map(project => 
      project.id === id ? { ...project, ...updates } : project
    ));
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id));
  };

  return (
    <AppContext.Provider value={{
      currentView,
      setCurrentView,
      sidebarOpen,
      setSidebarOpen,
      
      // Data state
      tasks,
      jobs,
      monthlyCosts,
      workItems,
      workRoutine,
      projects,
      notifications,
      loading,
      
      // Functions
      addTask,
      updateTask,
      deleteTask,
      addJob,
      updateJob,
      deleteJob,
      refreshJobs,
      addMonthlyCost,
      updateMonthlyCost,
      deleteMonthlyCost,
      addWorkItem,
      updateWorkItem,
      deleteWorkItem,
      refreshWorkRoutine,
      addProject,
      updateProject,
      deleteProject,
      getUpcomingNotifications,
      markNotificationAsRead,
      checkDueNotifications,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
