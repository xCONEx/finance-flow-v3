
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
  status: 'pendente' | 'aprovado' | 'em_andamento' | 'concluído';
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
  // ULTRA-CRITICAL FIX: Ensure ALL arrays are IMMEDIATELY initialized as empty arrays
  const [jobs, setJobs] = useState<Job[]>(() => {
    console.log('AppContext - Initializing jobs as empty array');
    return [];
  });
  const [workRoutine, setWorkRoutineState] = useState<WorkRoutine | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>(() => {
    console.log('AppContext - Initializing workItems as empty array');
    return [];
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    console.log('AppContext - Initializing tasks as empty array');
    return [];
  });
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>(() => {
    console.log('AppContext - Initializing monthlyCosts as empty array');
    return [];
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    console.log('AppContext - Initializing expenses as empty array');
    return [];
  });
  const { user } = useSupabaseAuth();

  // ULTRA-CRITICAL: Add comprehensive logging for state changes
  useEffect(() => {
    console.log('🔥 AppContext ULTRA-DEBUG:', { 
      timestamp: new Date().toISOString(),
      jobs: {
        type: typeof jobs,
        isArray: Array.isArray(jobs),
        length: Array.isArray(jobs) ? jobs.length : 'NOT_ARRAY',
        value: jobs
      },
      tasks: {
        type: typeof tasks,
        isArray: Array.isArray(tasks),
        length: Array.isArray(tasks) ? tasks.length : 'NOT_ARRAY',
        value: tasks
      },
      monthlyCosts: {
        type: typeof monthlyCosts,
        isArray: Array.isArray(monthlyCosts),
        length: Array.isArray(monthlyCosts) ? monthlyCosts.length : 'NOT_ARRAY',
        value: monthlyCosts
      },
      expenses: {
        type: typeof expenses,
        isArray: Array.isArray(expenses),
        length: Array.isArray(expenses) ? expenses.length : 'NOT_ARRAY',
        value: expenses
      },
      workItems: {
        type: typeof workItems,
        isArray: Array.isArray(workItems),
        length: Array.isArray(workItems) ? workItems.length : 'NOT_ARRAY',
        value: workItems
      }
    });
  }, [jobs, tasks, monthlyCosts, expenses, workItems]);

  // Load jobs from Supabase
  const refreshJobs = async () => {
    if (!user) {
      console.log('🔥 refreshJobs - No user, setting empty jobs array');
      setJobs([]);
      return;
    }

    try {
      console.log('🔥 refreshJobs - Loading jobs for user:', user.id);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('🔥 refreshJobs - Supabase error:', error);
        throw error;
      }
      
      // ULTRA-CRITICAL: Ensure data is always an array
      const jobsData = Array.isArray(data) ? data : [];
      console.log('🔥 refreshJobs - Jobs loaded successfully:', {
        dataType: typeof data,
        dataIsArray: Array.isArray(data),
        jobsDataLength: jobsData.length,
        jobsData: jobsData
      });
      setJobs(jobsData);
    } catch (error) {
      console.error('🔥 refreshJobs - Error loading jobs:', error);
      setJobs([]); // Always ensure empty array on error
    }
  };

  // Add job
  const addJob = async (job: Job) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .insert([job]);

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
      const { error } = await supabase
        .from('jobs')
        .update(updates)
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
      setWorkRoutineState(data);
    } catch (error) {
      console.error('Error loading work routine:', error);
    }
  };

  // Task functions - ULTRA-CRITICAL: Ensure arrays are never undefined
  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTasks(prev => {
      const currentTasks = Array.isArray(prev) ? prev : [];
      console.log('🔥 addTask - Adding task:', { currentTasks: currentTasks.length, newTask });
      return [...currentTasks, newTask];
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const currentTasks = Array.isArray(prev) ? prev : [];
      console.log('🔥 updateTask - Updating task:', { currentTasks: currentTasks.length, taskId, updates });
      return currentTasks.map(task => 
        task.id === taskId 
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      );
    });
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => {
      const currentTasks = Array.isArray(prev) ? prev : [];
      console.log('🔥 deleteTask - Deleting task:', { currentTasks: currentTasks.length, taskId });
      return currentTasks.filter(task => task.id !== taskId);
    });
  };

  // Monthly costs functions - ULTRA-CRITICAL: Ensure arrays are never undefined
  const addMonthlyCost = (cost: Omit<MonthlyCost, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCost: MonthlyCost = {
      ...cost,
      id: Date.now().toString(),
      userId: user?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setMonthlyCosts(prev => {
      const currentCosts = Array.isArray(prev) ? prev : [];
      console.log('🔥 addMonthlyCost - Adding cost:', { currentCosts: currentCosts.length, newCost });
      return [...currentCosts, newCost];
    });
  };

  const updateMonthlyCost = (costId: string, updates: Partial<MonthlyCost>) => {
    setMonthlyCosts(prev => {
      const currentCosts = Array.isArray(prev) ? prev : [];
      console.log('🔥 updateMonthlyCost - Updating cost:', { currentCosts: currentCosts.length, costId, updates });
      return currentCosts.map(cost => 
        cost.id === costId 
          ? { ...cost, ...updates, updatedAt: new Date().toISOString() }
          : cost
      );
    });
  };

  // Expense functions
  const refreshExpenses = async () => {
    if (!user) {
      console.log('🔥 refreshExpenses - No user, setting empty expenses array');
      setExpenses([]);
      return;
    }

    try {
      console.log('🔥 refreshExpenses - Loading expenses for user:', user.id);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('🔥 refreshExpenses - Supabase error:', error);
        throw error;
      }
      
      const expensesData = Array.isArray(data) ? data : [];
      console.log('🔥 refreshExpenses - Expenses loaded successfully:', {
        dataType: typeof data,
        dataIsArray: Array.isArray(data),
        expensesDataLength: expensesData.length
      });
      setExpenses(expensesData);
    } catch (error) {
      console.error('🔥 refreshExpenses - Error loading expenses:', error);
      setExpenses([]);
    }
  };

  const addExpense = async (expense: Expense) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .insert([expense]);

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
    console.log('🔥 User effect triggered - user changed:', user?.id);
    if (user) {
      refreshJobs();
      loadWorkRoutine();
      refreshExpenses();
    } else {
      console.log('🔥 User logged out, resetting all data to empty arrays');
      setJobs([]);
      setWorkRoutineState(null);
      setWorkItems([]);
      setTasks([]);
      setMonthlyCosts([]);
      setExpenses([]);
    }
  }, [user]);

  // ULTRA-CRITICAL: Always return arrays, never undefined - with extra safety
  const value: AppContextType = {
    jobs: Array.isArray(jobs) ? jobs : [],
    workRoutine,
    workItems: Array.isArray(workItems) ? workItems : [],
    tasks: Array.isArray(tasks) ? tasks : [],
    monthlyCosts: Array.isArray(monthlyCosts) ? monthlyCosts : [],
    expenses: Array.isArray(expenses) ? expenses : [],
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

  console.log('🔥 AppContext - Providing value:', {
    jobsLength: value.jobs.length,
    tasksLength: value.tasks.length,
    monthlyCostsLength: value.monthlyCosts.length,
    expensesLength: value.expenses.length,
    workItemsLength: value.workItems.length,
    allArrays: {
      jobs: Array.isArray(value.jobs),
      tasks: Array.isArray(value.tasks),
      monthlyCosts: Array.isArray(value.monthlyCosts),
      expenses: Array.isArray(value.expenses),
      workItems: Array.isArray(value.workItems)
    }
  });

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
