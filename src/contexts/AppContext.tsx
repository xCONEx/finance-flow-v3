import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from './SupabaseAuthContext';

export interface Job {
  id: string;
  description: string;
  client: string;
  eventDate: string;
  estimatedHours: number;
  difficultyLevel: 'fácil' | 'médio' | 'complicado' | 'difícil';
  logistics: number;
  equipment: number;
  assistance: number;
  status: 'pendente' | 'aprovado' | 'em_andamento' | 'concluído' | 'cancelado';
  category: string;
  discountValue: number;
  totalCosts: number;
  serviceValue: number;
  valueWithDiscount: number;
  profitMargin: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  clientId: string | null;
  companyId?: string;
}

export interface WorkRoutine {
  id: string;
  userId: string;
  valuePerHour: number;
  dailyHours: number;
  monthlyDays: number;
  productivityPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkItem {
  id: string;
  name: string;
  value: number;
  category: string;
  userId: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyCost {
  id: string;
  description: string;
  category: string;
  value: number;
  month: string;
  isRecurring: boolean;
  notificationEnabled: boolean;
  userId: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  description: string;
  value: number;
  date: string;
  category: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface AppContextType {
  jobs: Job[];
  workRoutine: WorkRoutine | null;
  workItems: WorkItem[];
  tasks: Task[];
  monthlyCosts: MonthlyCost[];
  expenses: Expense[];
  addJob: (job: Job) => Promise<void>;
  updateJob: (jobId: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  refreshJobs: () => Promise<void>;
  setWorkRoutine: (routine: WorkRoutine) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addMonthlyCost: (cost: Omit<MonthlyCost, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMonthlyCost: (costId: string, updates: Partial<MonthlyCost>) => void;
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  refreshExpenses: () => Promise<void>;
  createNotification: (title: string, message: string, type?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Initialize all arrays as empty arrays to prevent undefined errors
  const [jobs, setJobs] = useState<Job[]>([]);
  const [workRoutine, setWorkRoutineState] = useState<WorkRoutine | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { user } = useSupabaseAuth();

  // Load jobs from Supabase
  const refreshJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform database data to frontend format
      const transformedJobs = (data || []).map(job => ({
        id: job.id,
        description: job.description,
        client: job.client,
        eventDate: job.event_date,
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
        userId: job.user_id,
        clientId: null, // client_id não existe no banco ainda
        companyId: job.agency_id
      }));
      
      console.log('🔄 Jobs carregados do banco:', {
        totalJobs: data?.length || 0,
        transformedJobs: transformedJobs.length,
        sampleJob: transformedJobs[0]
      });
      
      setJobs(transformedJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      // Keep empty array on error
      setJobs([]);
    }
  };

  // Add job
  const addJob = async (job: Job) => {
    try {
      const jobData = {
        description: job.description,
        client: job.client,
        event_date: job.eventDate,
        estimated_hours: job.estimatedHours,
        difficulty_level: job.difficultyLevel,
        logistics: job.logistics,
        equipment: job.equipment,
        assistance: job.assistance,
        status: job.status as 'pendente' | 'aprovado',
        category: job.category,
        discount_value: job.discountValue,
        total_costs: job.totalCosts,
        service_value: job.serviceValue,
        value_with_discount: job.valueWithDiscount,
        profit_margin: job.profitMargin,
        user_id: job.userId,
        agency_id: job.companyId
      };

      const { error } = await supabase
        .from('jobs')
        .insert([jobData]);

      if (error) throw error;
      await refreshJobs();
    } catch (error) {
      console.error('Error adding job:', error);
      throw error;
    }
  };

  // Update job
  const updateJob = async (jobId: string, updates: Partial<Job>) => {
    try {
      const updateData: any = {};
      
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.client !== undefined) updateData.client = updates.client;
      if (updates.eventDate !== undefined) updateData.event_date = updates.eventDate;
      if (updates.estimatedHours !== undefined) updateData.estimated_hours = updates.estimatedHours;
      if (updates.difficultyLevel !== undefined) updateData.difficulty_level = updates.difficultyLevel;
      if (updates.logistics !== undefined) updateData.logistics = updates.logistics;
      if (updates.equipment !== undefined) updateData.equipment = updates.equipment;
      if (updates.assistance !== undefined) updateData.assistance = updates.assistance;
      if (updates.status !== undefined) updateData.status = updates.status as 'pendente' | 'aprovado';
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.discountValue !== undefined) updateData.discount_value = updates.discountValue;
      if (updates.totalCosts !== undefined) updateData.total_costs = updates.totalCosts;
      if (updates.serviceValue !== undefined) updateData.service_value = updates.serviceValue;
      if (updates.valueWithDiscount !== undefined) updateData.value_with_discount = updates.valueWithDiscount;
      if (updates.profitMargin !== undefined) updateData.profit_margin = updates.profitMargin;
      if (updates.companyId !== undefined) updateData.agency_id = updates.companyId;

      const { error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', jobId);

      if (error) throw error;
      await refreshJobs();
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  };

  // Delete job
  const deleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      await refreshJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  };

  // Work routine functions
  const setWorkRoutine = async (routine: WorkRoutine) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('work_routine')
        .upsert({
          ...routine,
          user_id: user.id,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setWorkRoutineState(routine);
    } catch (error) {
      console.error('Error saving work routine:', error);
      throw error;
    }
  };

  // Load work routine
  const loadWorkRoutine = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('work_routine')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        const transformedRoutine: WorkRoutine = {
          id: data.id,
          userId: data.user_id,
          valuePerHour: data.value_per_hour || 0,
          dailyHours: data.work_hours_per_day || 8,
          monthlyDays: data.work_days_per_month || 22,
          productivityPercentage: 100, // Default value
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        setWorkRoutineState(transformedRoutine);
      }
    } catch (error) {
      console.error('Error loading work routine:', error);
    }
  };

  // Task functions
  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTasks(prev => [...(prev || []), newTask]);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => (prev || []).map(task => 
      task.id === taskId 
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => (prev || []).filter(task => task.id !== taskId));
  };

  // Monthly costs functions
  const addMonthlyCost = (cost: Omit<MonthlyCost, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCost: MonthlyCost = {
      ...cost,
      id: Date.now().toString(),
      userId: user?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setMonthlyCosts(prev => [...(prev || []), newCost]);
  };

  const updateMonthlyCost = (costId: string, updates: Partial<MonthlyCost>) => {
    setMonthlyCosts(prev => (prev || []).map(cost => 
      cost.id === costId 
        ? { ...cost, ...updates, updatedAt: new Date().toISOString() }
        : cost
    ));
  };

  // Expense functions
  const refreshExpenses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform database data to frontend format
      const transformedExpenses = (data || []).map(expense => ({
        id: expense.id,
        description: expense.description,
        value: expense.value,
        date: expense.month, // Use month as date for now
        category: expense.category,
        userId: expense.user_id,
        createdAt: expense.created_at,
        updatedAt: expense.updated_at
      }));
      
      setExpenses(transformedExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
      // Keep empty array on error
      setExpenses([]);
    }
  };

  const addExpense = async (expense: Expense) => {
    try {
      const expenseData = {
        description: expense.description,
        value: expense.value,
        month: expense.date,
        category: expense.category,
        user_id: expense.userId
      };

      const { error } = await supabase
        .from('expenses')
        .insert([expenseData]);

      if (error) throw error;
      await refreshExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  };

  const updateExpense = async (expenseId: string, updates: Partial<Expense>) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', expenseId);

      if (error) throw error;
      await refreshExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
      await refreshExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  };

  // Mock notification function
  const createNotification = (title: string, message: string, type: string = 'info') => {
    console.log('Notification:', { title, message, type });
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      refreshJobs();
      loadWorkRoutine();
      refreshExpenses();
    } else {
      // Reset all data when user logs out
      setJobs([]);
      setWorkRoutineState(null);
      setWorkItems([]);
      setTasks([]);
      setMonthlyCosts([]);
      setExpenses([]);
    }
  }, [user]);

  const value: AppContextType = {
    jobs,
    workRoutine,
    workItems,
    tasks,
    monthlyCosts,
    expenses,
    addJob,
    updateJob,
    deleteJob,
    refreshJobs,
    setWorkRoutine,
    addTask,
    updateTask,
    deleteTask,
    addMonthlyCost,
    updateMonthlyCost,
    addExpense,
    updateExpense,
    deleteExpense,
    refreshExpenses,
    createNotification,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
