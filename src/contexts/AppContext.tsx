
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabaseAuth } from './SupabaseAuthContext';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'baixa' | 'média' | 'alta';
  status: 'todo' | 'editing' | 'urgent' | 'delivered' | 'revision';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface MonthlyCost {
  id: string;
  description: string;
  category: string;
  value: number;
  month: string;
  companyId?: string;
}

interface WorkItem {
  id: string;
  description: string;
  category: string;
  value: number;
  depreciationYears: number;
  companyId?: string;
}

interface Job {
  id: string;
  description: string;
  client: string;
  eventDate: string;
  estimatedHours: number;
  difficultyLevel: 'baixo' | 'médio' | 'alto';
  logistics: number;
  equipment: number;
  assistance: number;
  status: 'pendente' | 'aprovado' | 'cancelado';
  category: string;
  discountValue: number;
  totalCosts: number;
  serviceValue: number;
  valueWithDiscount: number;
  profitMargin: number;
  createdAt: string;
  updatedAt: string;
  companyId?: string;
}

interface WorkRoutine {
  id: string;
  workHoursPerDay: number;
  workDaysPerMonth: number;
  valuePerHour: number;
  valuePerDay: number;
  desiredSalary: number;
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
  loading: boolean;
  
  // Task functions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Job functions
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  
  // Monthly cost functions
  addMonthlyCost: (cost: Omit<MonthlyCost, 'id'>) => Promise<void>;
  updateMonthlyCost: (id: string, updates: Partial<MonthlyCost>) => Promise<void>;
  deleteMonthlyCost: (id: string) => Promise<void>;
  
  // Work item functions
  addWorkItem: (item: Omit<WorkItem, 'id'>) => Promise<void>;
  updateWorkItem: (id: string, updates: Partial<WorkItem>) => Promise<void>;
  deleteWorkItem: (id: string) => Promise<void>;
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated]);

  // Task functions
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    ));
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  // Job functions
  const addJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newJob: Job = {
      ...jobData,
      id: `job_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setJobs(prev => [...prev, newJob]);
  };

  const updateJob = async (id: string, updates: Partial<Job>) => {
    setJobs(prev => prev.map(job => 
      job.id === id 
        ? { ...job, ...updates, updatedAt: new Date().toISOString() }
        : job
    ));
  };

  const deleteJob = async (id: string) => {
    setJobs(prev => prev.filter(job => job.id !== id));
  };

  // Monthly cost functions
  const addMonthlyCost = async (costData: Omit<MonthlyCost, 'id'>) => {
    const newCost: MonthlyCost = {
      ...costData,
      id: `cost_${Date.now()}`,
    };
    setMonthlyCosts(prev => [...prev, newCost]);
  };

  const updateMonthlyCost = async (id: string, updates: Partial<MonthlyCost>) => {
    setMonthlyCosts(prev => prev.map(cost => 
      cost.id === id ? { ...cost, ...updates } : cost
    ));
  };

  const deleteMonthlyCost = async (id: string) => {
    setMonthlyCosts(prev => prev.filter(cost => cost.id !== id));
  };

  // Work item functions
  const addWorkItem = async (itemData: Omit<WorkItem, 'id'>) => {
    const newItem: WorkItem = {
      ...itemData,
      id: `item_${Date.now()}`,
    };
    setWorkItems(prev => [...prev, newItem]);
  };

  const updateWorkItem = async (id: string, updates: Partial<WorkItem>) => {
    setWorkItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteWorkItem = async (id: string) => {
    setWorkItems(prev => prev.filter(item => item.id !== id));
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
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
