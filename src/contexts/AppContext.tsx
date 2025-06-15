
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabaseAuth } from './SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  loading: boolean;
  
  // Task functions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Job functions
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  
  // Monthly cost functions
  addMonthlyCost: (cost: Omit<MonthlyCost, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateMonthlyCost: (id: string, updates: Partial<MonthlyCost>) => Promise<void>;
  deleteMonthlyCost: (id: string) => Promise<void>;
  
  // Work item functions
  addWorkItem: (item: Omit<WorkItem, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateWorkItem: (id: string, updates: Partial<WorkItem>) => Promise<void>;
  deleteWorkItem: (id: string) => Promise<void>;

  // Project functions
  addProject: (project: VideoProject) => Promise<void>;
  updateProject: (id: string, updates: Partial<VideoProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
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
  
  // Data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [workRoutine, setWorkRoutine] = useState<WorkRoutine | null>(null);
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated]);

  // Load data from Supabase
  useEffect(() => {
    if (isAuthenticated && user) {
      loadAllData();
    }
  }, [isAuthenticated, user]);

  const loadAllData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load jobs
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

      // Load equipment (work items)
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

      // Load expenses (monthly costs)
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id);
      
      if (expensesData) {
        setMonthlyCosts(expensesData.map(expense => ({
          id: expense.id,
          description: expense.description,
          category: expense.category,
          value: Number(expense.value),
          month: expense.month,
          createdAt: expense.created_at,
          userId: expense.user_id
        })));
      }

      // Load work routine
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
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
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

  // Monthly cost functions
  const addMonthlyCost = async (costData: Omit<MonthlyCost, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        description: costData.description,
        category: costData.category,
        value: costData.value,
        month: costData.month
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      const newCost: MonthlyCost = {
        id: data.id,
        description: data.description,
        category: data.category,
        value: Number(data.value),
        month: data.month,
        createdAt: data.created_at,
        userId: data.user_id
      };
      setMonthlyCosts(prev => [...prev, newCost]);
    }
  };

  const updateMonthlyCost = async (id: string, updates: Partial<MonthlyCost>) => {
    const { error } = await supabase
      .from('expenses')
      .update({
        description: updates.description,
        category: updates.category,
        value: updates.value,
        month: updates.month
      })
      .eq('id', id);

    if (error) throw error;
    setMonthlyCosts(prev => prev.map(cost => 
      cost.id === id ? { ...cost, ...updates } : cost
    ));
  };

  const deleteMonthlyCost = async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setMonthlyCosts(prev => prev.filter(cost => cost.id !== id));
  };

  // Task functions (mock for now - would need tasks table)
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: user?.id || '',
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
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
      loading,
      
      // Functions
      addTask,
      updateTask,
      deleteTask,
      addJob,
      updateJob,
      deleteJob,
      addMonthlyCost,
      updateMonthlyCost,
      deleteMonthlyCost,
      addWorkItem,
      updateWorkItem,
      deleteWorkItem,
      addProject,
      updateProject,
      deleteProject,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
