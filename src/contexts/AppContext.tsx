
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Job, MonthlyCost, WorkItem, Task, WorkRoutine, Company } from '../types';
import { useAuth } from './AuthContext';

interface AppContextType {
  jobs: Job[];
  monthlyCosts: MonthlyCost[];
  workItems: WorkItem[];
  tasks: Task[];
  workRoutine: WorkRoutine | null;
  company: Company | null;
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
  updateJob: (id: string, job: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  addMonthlyCost: (cost: Omit<MonthlyCost, 'id' | 'createdAt' | 'userId'>) => void;
  updateMonthlyCost: (id: string, cost: Partial<MonthlyCost>) => void;
  deleteMonthlyCost: (id: string) => void;
  addWorkItem: (item: Omit<WorkItem, 'id' | 'createdAt' | 'userId'>) => void;
  updateWorkItem: (id: string, item: Partial<WorkItem>) => void;
  deleteWorkItem: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateWorkRoutine: (routine: Omit<WorkRoutine, 'userId'>) => void;
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
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workRoutine, setWorkRoutine] = useState<WorkRoutine | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedJobs = localStorage.getItem(`financeflow_jobs_${user.id}`);
      const savedCosts = localStorage.getItem(`financeflow_costs_${user.id}`);
      const savedItems = localStorage.getItem(`financeflow_items_${user.id}`);
      const savedTasks = localStorage.getItem(`financeflow_tasks_${user.id}`);
      const savedRoutine = localStorage.getItem(`financeflow_routine_${user.id}`);

      if (savedJobs) setJobs(JSON.parse(savedJobs));
      if (savedCosts) setMonthlyCosts(JSON.parse(savedCosts));
      if (savedItems) setWorkItems(JSON.parse(savedItems));
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedRoutine) setWorkRoutine(JSON.parse(savedRoutine));
    }
  }, [user]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`financeflow_jobs_${user.id}`, JSON.stringify(jobs));
    }
  }, [jobs, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`financeflow_costs_${user.id}`, JSON.stringify(monthlyCosts));
    }
  }, [monthlyCosts, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`financeflow_items_${user.id}`, JSON.stringify(workItems));
    }
  }, [workItems, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`financeflow_tasks_${user.id}`, JSON.stringify(tasks));
    }
  }, [tasks, user]);

  useEffect(() => {
    if (user && workRoutine) {
      localStorage.setItem(`financeflow_routine_${user.id}`, JSON.stringify(workRoutine));
    }
  }, [workRoutine, user]);

  const addJob = (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
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

  const updateJob = (id: string, jobData: Partial<Job>) => {
    setJobs(prev => prev.map(job => 
      job.id === id ? { ...job, ...jobData, updatedAt: new Date().toISOString() } : job
    ));
  };

  const deleteJob = (id: string) => {
    setJobs(prev => prev.filter(job => job.id !== id));
  };

  const addMonthlyCost = (costData: Omit<MonthlyCost, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;
    const newCost: MonthlyCost = {
      ...costData,
      id: crypto.randomUUID(),
      userId: user.id,
      createdAt: new Date().toISOString()
    };
    setMonthlyCosts(prev => [newCost, ...prev]);
  };

  const updateMonthlyCost = (id: string, costData: Partial<MonthlyCost>) => {
    setMonthlyCosts(prev => prev.map(cost => 
      cost.id === id ? { ...cost, ...costData } : cost
    ));
  };

  const deleteMonthlyCost = (id: string) => {
    setMonthlyCosts(prev => prev.filter(cost => cost.id !== id));
  };

  const addWorkItem = (itemData: Omit<WorkItem, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;
    const newItem: WorkItem = {
      ...itemData,
      id: crypto.randomUUID(),
      userId: user.id,
      createdAt: new Date().toISOString()
    };
    setWorkItems(prev => [newItem, ...prev]);
  };

  const updateWorkItem = (id: string, itemData: Partial<WorkItem>) => {
    setWorkItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...itemData } : item
    ));
  };

  const deleteWorkItem = (id: string) => {
    setWorkItems(prev => prev.filter(item => item.id !== id));
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      userId: user.id,
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = (id: string, taskData: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...taskData } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const updateWorkRoutine = (routine: Omit<WorkRoutine, 'userId'>) => {
    if (!user) return;
    const newRoutine: WorkRoutine = {
      ...routine,
      userId: user.id
    };
    setWorkRoutine(newRoutine);
  };

  const calculateJobPrice = (hours: number, difficulty: string) => {
    const hourlyRate = workRoutine?.valuePerHour || 50;
    const difficultyMultiplier = difficulty === 'fácil' ? 1 : 
                                difficulty === 'médio' ? 1.2 : 
                                difficulty === 'difícil' ? 1.5 : 2;
    
    const baseServiceValue = hours * hourlyRate * difficultyMultiplier;
    
    // Calculate equipment depreciation
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
