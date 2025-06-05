
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Job, MonthlyCost, WorkItem, Task, WorkRoutine, CompanyData } from '../types';

interface AppContextType {
  jobs: Job[];
  monthlyCosts: MonthlyCost[];
  workItems: WorkItem[];
  tasks: Task[];
  workRoutine: WorkRoutine;
  companyData: CompanyData;
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateJob: (id: string, job: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  addMonthlyCost: (cost: Omit<MonthlyCost, 'id' | 'createdAt'>) => void;
  deleteMonthlyCost: (id: string) => void;
  addWorkItem: (item: Omit<WorkItem, 'id' | 'createdAt'>) => void;
  deleteWorkItem: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateWorkRoutine: (routine: WorkRoutine) => void;
  updateCompanyData: (data: CompanyData) => void;
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workRoutine, setWorkRoutine] = useState<WorkRoutine>({
    desiredSalary: 0,
    workDaysPerMonth: 22,
    workHoursPerDay: 8,
    valuePerDay: 0,
    valuePerHour: 0
  });
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: 'FinanceFlow',
    logo: '',
    address: '',
    phone: '',
    email: ''
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedJobs = localStorage.getItem('financeflow_jobs');
    const savedCosts = localStorage.getItem('financeflow_costs');
    const savedItems = localStorage.getItem('financeflow_items');
    const savedTasks = localStorage.getItem('financeflow_tasks');
    const savedRoutine = localStorage.getItem('financeflow_routine');
    const savedCompany = localStorage.getItem('financeflow_company');

    if (savedJobs) setJobs(JSON.parse(savedJobs));
    if (savedCosts) setMonthlyCosts(JSON.parse(savedCosts));
    if (savedItems) setWorkItems(JSON.parse(savedItems));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedRoutine) setWorkRoutine(JSON.parse(savedRoutine));
    if (savedCompany) setCompanyData(JSON.parse(savedCompany));
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('financeflow_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('financeflow_costs', JSON.stringify(monthlyCosts));
  }, [monthlyCosts]);

  useEffect(() => {
    localStorage.setItem('financeflow_items', JSON.stringify(workItems));
  }, [workItems]);

  useEffect(() => {
    localStorage.setItem('financeflow_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('financeflow_routine', JSON.stringify(workRoutine));
  }, [workRoutine]);

  useEffect(() => {
    localStorage.setItem('financeflow_company', JSON.stringify(companyData));
  }, [companyData]);

  const addJob = (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newJob: Job = {
      ...jobData,
      id: crypto.randomUUID(),
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

  const addMonthlyCost = (costData: Omit<MonthlyCost, 'id' | 'createdAt'>) => {
    const newCost: MonthlyCost = {
      ...costData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    setMonthlyCosts(prev => [newCost, ...prev]);
  };

  const deleteMonthlyCost = (id: string) => {
    setMonthlyCosts(prev => prev.filter(cost => cost.id !== id));
  };

  const addWorkItem = (itemData: Omit<WorkItem, 'id' | 'createdAt'>) => {
    const newItem: WorkItem = {
      ...itemData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    setWorkItems(prev => [newItem, ...prev]);
  };

  const deleteWorkItem = (id: string) => {
    setWorkItems(prev => prev.filter(item => item.id !== id));
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
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

  const updateWorkRoutine = (routine: WorkRoutine) => {
    setWorkRoutine(routine);
  };

  const updateCompanyData = (data: CompanyData) => {
    setCompanyData(data);
  };

  return (
    <AppContext.Provider value={{
      jobs,
      monthlyCosts,
      workItems,
      tasks,
      workRoutine,
      companyData,
      addJob,
      updateJob,
      deleteJob,
      addMonthlyCost,
      deleteMonthlyCost,
      addWorkItem,
      deleteWorkItem,
      addTask,
      updateTask,
      deleteTask,
      updateWorkRoutine,
      updateCompanyData
    }}>
      {children}
    </AppContext.Provider>
  );
};
