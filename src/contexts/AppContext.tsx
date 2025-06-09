import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { firestoreService } from '../services/firestore';

interface Job {
  id: string;
  title: string;
  description: string;
  value: number;
  client?: string;
  eventDate?: string;
  estimatedHours?: number;
  difficultyLevel?: 'fácil' | 'médio' | 'complicado' | 'difícil';
  logistics?: number;
  equipment?: number;
  assistance?: number;
  status?: 'pendente' | 'aprovado';
  category?: string;
  discountValue?: number;
  totalCosts?: number;
  serviceValue?: number;
  valueWithDiscount?: number;
  profitMargin?: number;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  companyId?: string;
}

interface Equipment {
  id: string;
  name: string;
  cost: number;
}

interface Expense {
  id: string;
  description: string;
  value: number;
}

interface WorkItem {
  id: string;
  description: string;
  category: string;
  value: number;
  depreciationYears?: number;
  createdAt?: string;
  userId?: string;
  companyId?: string;
}

interface MonthlyCost {
  id: string;
  description: string;
  category: string;
  value: number;
  month: string;
  createdAt?: string;
  userId?: string;
  companyId?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'baixa' | 'média' | 'alta';
  status?: 'todo' | 'editing' | 'urgent' | 'delivered' | 'revision';
  dueDate?: string;
  createdAt?: string;
  userId?: string;
}

interface WorkRoutine {
  dailyHours: number;
  dalilyValue: number;
  desiredSalary: number;
  workDays: number;
  valuePerDay?: number;
  valuePerHour?: number;
  workDaysPerMonth?: number;
  workHoursPerDay?: number;
  userId?: string;
}

interface AppContextType {
  jobs: Job[];
  addJob: (job: Omit<Job, 'id'>) => Promise<void>;
  updateJob: (id: string, updatedJob: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  equipments: Equipment[];
  addEquipment: (equipment: Omit<Equipment, 'id'>) => Promise<void>;
  updateEquipment: (id: string, updatedEquipment: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, updatedExpense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  workItems: WorkItem[];
  addWorkItem: (item: Omit<WorkItem, 'id'>) => Promise<void>;
  updateWorkItem: (id: string, updatedItem: Partial<WorkItem>) => Promise<void>;
  deleteWorkItem: (id: string) => Promise<void>;
  monthlyCosts: MonthlyCost[];
  addMonthlyCost: (cost: Omit<MonthlyCost, 'id'>) => Promise<void>;
  updateMonthlyCost: (id: string, updatedCost: Partial<MonthlyCost>) => Promise<void>;
  deleteMonthlyCost: (id: string) => Promise<void>;
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, updatedTask: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  routine: WorkRoutine | null;
  workRoutine: WorkRoutine | null;
  updateRoutine: (updatedRoutine: Partial<WorkRoutine>) => Promise<void>;
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
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routine, setRoutine] = useState<WorkRoutine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        if (user?.id) {
          const userDetails = await firestoreService.getUserData(user.id);
          if (userDetails) {
            setJobs(userDetails.jobs || []);
            setEquipments(userDetails.equipments || []);
            setExpenses(userDetails.expenses || []);
            setWorkItems(userDetails.equipments || []);
            setMonthlyCosts(userDetails.expenses || []);
            setTasks(userDetails.tasks || []);
            setRoutine(userDetails.routine || {
              dailyHours: 8,
              dalilyValue: 0,
              desiredSalary: 0,
              workDays: 22
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    if (userData) {
      console.log('📦 Carregando dados do contexto:', userData);
      setJobs(Array.isArray(userData.jobs) ? userData.jobs : []);
      setEquipments(Array.isArray(userData.equipments) ? userData.equipments : []);
      setExpenses(Array.isArray(userData.expenses) ? userData.expenses : []);
      setWorkItems(Array.isArray(userData.equipments) ? userData.equipments : []);
      setMonthlyCosts(Array.isArray(userData.expenses) ? userData.expenses : []);
      setTasks(Array.isArray(userData.tasks) ? userData.tasks : []);
      setRoutine(userData.routine || {
        dailyHours: 8,
        dalilyValue: 0,
        desiredSalary: 0,
        workDays: 22
      });
    } else if (agencyData) {
      console.log('🏢 Carregando dados da agência:', agencyData);
      setJobs(Array.isArray(agencyData.jobs) ? agencyData.jobs : []);
      setEquipments(Array.isArray(agencyData.equipments) ? agencyData.equipments : []);
      setExpenses(Array.isArray(agencyData.expenses) ? agencyData.expenses : []);
      setWorkItems(Array.isArray(agencyData.equipments) ? agencyData.equipments : []);
      setMonthlyCosts(Array.isArray(agencyData.expenses) ? agencyData.expenses : []);
      setTasks(Array.isArray(agencyData.tasks) ? agencyData.tasks : []);
      setRoutine(agencyData.routine || {
        dailyHours: 8,
        dalilyValue: 0,
        desiredSalary: 0,
        workDays: 22
      });
    }
    setLoading(false);
  }, [userData, agencyData]);

  const addJob = async (job: Omit<Job, 'id'>) => {
    try {
      const newJob: Job = {
        ...job,
        id: Date.now().toString(),
      };

      if (agencyData?.id) {
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedJobs = Array.isArray(currentData.jobs) ? [...currentData.jobs, newJob] : [newJob];
          await firestoreService.updateCompany(agencyData.id, {
            jobs: updatedJobs
          });
        }
      } else if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedJobs = Array.isArray(currentData.jobs) ? [...currentData.jobs, newJob] : [newJob];
          await firestoreService.updateUserField(user.id, 'jobs', updatedJobs);
        }
      }

      setJobs(prev => [...prev, newJob]);
    } catch (error) {
      console.error('Erro ao adicionar job:', error);
    }
  };

  const updateJob = async (id: string, updatedJob: Partial<Job>) => {
    try {
      if (agencyData?.id) {
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedJobs = Array.isArray(currentData.jobs) ? 
            currentData.jobs.map((jb: Job) => jb.id === id ? { ...jb, ...updatedJob } : jb) : [];
          await firestoreService.updateCompany(agencyData.id, {
            jobs: updatedJobs
          });
        }
      } else if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedJobs = Array.isArray(currentData.jobs) ? 
            currentData.jobs.map((jb: Job) => jb.id === id ? { ...jb, ...updatedJob } : jb) : [];
          await firestoreService.updateUserField(user.id, 'jobs', updatedJobs);
        }
      }

      setJobs(prev => prev.map(jb => jb.id === id ? { ...jb, ...updatedJob } : jb));
    } catch (error) {
      console.error('Erro ao atualizar job:', error);
    }
  };

  const deleteJob = async (id: string) => {
    try {
      if (agencyData?.id) {
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedJobs = Array.isArray(currentData.jobs) ? 
            currentData.jobs.filter((jb: Job) => jb.id !== id) : [];
          await firestoreService.updateCompany(agencyData.id, {
            jobs: updatedJobs
          });
        }
      } else if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedJobs = Array.isArray(currentData.jobs) ? 
            currentData.jobs.filter((jb: Job) => jb.id !== id) : [];
          await firestoreService.updateUserField(user.id, 'jobs', updatedJobs);
        }
      }

      setJobs(prev => prev.filter(jb => jb.id !== id));
    } catch (error) {
      console.error('Erro ao deletar job:', error);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      const newExpense: Expense = {
        ...expense,
        id: Date.now().toString(),
      };

      if (agencyData?.id) {
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedExpenses = Array.isArray(currentData.expenses) ? [...currentData.expenses, newExpense] : [newExpense];
          await firestoreService.updateCompany(agencyData.id, {
            expenses: updatedExpenses
          });
        }
      } else if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedExpenses = Array.isArray(currentData.expenses) ? [...currentData.expenses, newExpense] : [newExpense];
          await firestoreService.updateUserField(user.id, 'expenses', updatedExpenses);
        }
      }

      setExpenses(prev => [...prev, newExpense]);
    } catch (error) {
      console.error('Erro ao adicionar gasto:', error);
    }
  };

  const updateExpense = async (id: string, updatedExpense: Partial<Expense>) => {
    try {
      if (agencyData?.id) {
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedExpenses = Array.isArray(currentData.expenses) ? 
            currentData.expenses.map((exp: Expense) => exp.id === id ? { ...exp, ...updatedExpense } : exp) : [];
          await firestoreService.updateCompany(agencyData.id, {
            expenses: updatedExpenses
          });
        }
      } else if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedExpenses = Array.isArray(currentData.expenses) ? 
            currentData.expenses.map((exp: Expense) => exp.id === id ? { ...exp, ...updatedExpense } : exp) : [];
          await firestoreService.updateUserField(user.id, 'expenses', updatedExpenses);
        }
      }

      setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, ...updatedExpense } : exp));
    } catch (error) {
      console.error('Erro ao atualizar gasto:', error);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      if (agencyData?.id) {
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedExpenses = Array.isArray(currentData.expenses) ? 
            currentData.expenses.filter((exp: Expense) => exp.id !== id) : [];
          await firestoreService.updateCompany(agencyData.id, {
            expenses: updatedExpenses
          });
        }
      } else if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedExpenses = Array.isArray(currentData.expenses) ? 
            currentData.expenses.filter((exp: Expense) => exp.id !== id) : [];
          await firestoreService.updateUserField(user.id, 'expenses', updatedExpenses);
        }
      }

      setExpenses(prev => prev.filter(exp => exp.id !== id));
    } catch (error) {
      console.error('Erro ao deletar gasto:', error);
    }
  };

  const addEquipment = async (equipment: Omit<Equipment, 'id'>) => {
    try {
      const newEquipment: Equipment = {
        ...equipment,
        id: Date.now().toString(),
      };

      if (agencyData?.id) {
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedEquipments = Array.isArray(currentData.equipments) ? [...currentData.equipments, newEquipment] : [newEquipment];
          await firestoreService.updateCompany(agencyData.id, {
            equipments: updatedEquipments
          });
        }
      } else if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedEquipments = Array.isArray(currentData.equipments) ? [...currentData.equipments, newEquipment] : [newEquipment];
          await firestoreService.updateUserField(user.id, 'equipments', updatedEquipments);
        }
      }

      setEquipments(prev => [...prev, newEquipment]);
    } catch (error) {
      console.error('Erro ao adicionar equipamento:', error);
    }
  };

  const updateEquipment = async (id: string, updatedEquipment: Partial<Equipment>) => {
    try {
      if (agencyData?.id) {
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedEquipments = Array.isArray(currentData.equipments) ? 
            currentData.equipments.map((eq: Equipment) => eq.id === id ? { ...eq, ...updatedEquipment } : eq) : [];
          await firestoreService.updateCompany(agencyData.id, {
            equipments: updatedEquipments
          });
        }
      } else if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedEquipments = Array.isArray(currentData.equipments) ? 
            currentData.equipments.map((eq: Equipment) => eq.id === id ? { ...eq, ...updatedEquipment } : eq) : [];
          await firestoreService.updateUserField(user.id, 'equipments', updatedEquipments);
        }
      }

      setEquipments(prev => prev.map(eq => eq.id === id ? { ...eq, ...updatedEquipment } : eq));
    } catch (error) {
      console.error('Erro ao atualizar equipamento:', error);
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      if (agencyData?.id) {
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedEquipments = Array.isArray(currentData.equipments) ? 
            currentData.equipments.filter((eq: Equipment) => eq.id !== id) : [];
          await firestoreService.updateCompany(agencyData.id, {
            equipments: updatedEquipments
          });
        }
      } else if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedEquipments = Array.isArray(currentData.equipments) ? 
            currentData.equipments.filter((eq: Equipment) => eq.id !== id) : [];
          await firestoreService.updateUserField(user.id, 'equipments', updatedEquipments);
        }
      }

      setEquipments(prev => prev.filter(eq => eq.id !== id));
    } catch (error) {
      console.error('Erro ao deletar equipamento:', error);
    }
  };

  // WorkItems functions
  const addWorkItem = async (item: Omit<WorkItem, 'id'>) => {
    try {
      const newItem: WorkItem = {
        ...item,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        userId: user?.id
      };

      if (agencyData?.id) {
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedItems = Array.isArray(currentData.equipments) ? [...currentData.equipments, newItem] : [newItem];
          await firestoreService.updateCompany(agencyData.id, { equipments: updatedItems });
        }
      } else if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedItems = Array.isArray(currentData.equipments) ? [...currentData.equipments, newItem] : [newItem];
          await firestoreService.updateUserField(user.id, 'equipments', updatedItems);
        }
      }

      setWorkItems(prev => [...prev, newItem]);
    } catch (error) {
      console.error('Erro ao adicionar item de trabalho:', error);
    }
  };

  const updateWorkItem = async (id: string, updatedItem: Partial<WorkItem>) => {
    try {
      if (agencyData?.id) {
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedItems = Array.isArray(currentData.equipments) ? 
            currentData.equipments.map((item: WorkItem) => item.id === id ? { ...item, ...updatedItem } : item) : [];
          await firestoreService.updateCompany(agencyData.id, { equipments: updatedItems });
        }
      } else if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedItems = Array.isArray(currentData.equipments) ? 
            currentData.equipments.map((item: WorkItem) => item.id === id ? { ...item, ...updatedItem } : item) : [];
          await firestoreService.updateUserField(user.id, 'equipments', updatedItems);
        }
      }

      setWorkItems(prev => prev.map(item => item.id === id ? { ...item, ...updatedItem } : item));
    } catch (error) {
      console.error('Erro ao atualizar item de trabalho:', error);
    }
  };

  const deleteWorkItem = async (id: string) => {
    try {
      if (agencyData?.id) {
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedItems = Array.isArray(currentData.equipments) ? 
            currentData.equipments.filter((item: WorkItem) => item.id !== id) : [];
          await firestoreService.updateCompany(agencyData.id, { equipments: updatedItems });
        }
      } else if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedItems = Array.isArray(currentData.equipments) ? 
            currentData.equipments.filter((item: WorkItem) => item.id !== id) : [];
          await firestoreService.updateUserField(user.id, 'equipments', updatedItems);
        }
      }

      setWorkItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Erro ao deletar item de trabalho:', error);
    }
  };

  // MonthlyCosts functions
  const addMonthlyCost = async (cost: Omit<MonthlyCost, 'id'>) => {
    try {
      const newCost: MonthlyCost = {
        ...cost,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        userId: user?.id
      };

      if (agencyData?.id) {
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedCosts = Array.isArray(currentData.expenses) ? [...currentData.expenses, newCost] : [newCost];
          await firestoreService.updateCompany(agencyData.id, { expenses: updatedCosts });
        }
      } else if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedCosts = Array.isArray(currentData.expenses) ? [...currentData.expenses, newCost] : [newCost];
          await firestoreService.updateUserField(user.id, 'expenses', updatedCosts);
        }
      }

      setMonthlyCosts(prev => [...prev, newCost]);
    } catch (error) {
      console.error('Erro ao adicionar custo mensal:', error);
    }
  };

  const updateMonthlyCost = async (id: string, updatedCost: Partial<MonthlyCost>) => {
    try {
      if (agencyData?.id) {
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedCosts = Array.isArray(currentData.expenses) ? 
            currentData.expenses.map((cost: MonthlyCost) => cost.id === id ? { ...cost, ...updatedCost } : cost) : [];
          await firestoreService.updateCompany(agencyData.id, { expenses: updatedCosts });
        }
      } else if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedCosts = Array.isArray(currentData.expenses) ? 
            currentData.expenses.map((cost: MonthlyCost) => cost.id === id ? { ...cost, ...updatedCost } : cost) : [];
          await firestoreService.updateUserField(user.id, 'expenses', updatedCosts);
        }
      }

      setMonthlyCosts(prev => prev.map(cost => cost.id === id ? { ...cost, ...updatedCost } : cost));
    } catch (error) {
      console.error('Erro ao atualizar custo mensal:', error);
    }
  };

  const deleteMonthlyCost = async (id: string) => {
    try {
      if (agencyData?.id) {
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedCosts = Array.isArray(currentData.expenses) ? 
            currentData.expenses.filter((cost: MonthlyCost) => cost.id !== id) : [];
          await firestoreService.updateCompany(agencyData.id, { expenses: updatedCosts });
        }
      } else if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedCosts = Array.isArray(currentData.expenses) ? 
            currentData.expenses.filter((cost: MonthlyCost) => cost.id !== id) : [];
          await firestoreService.updateUserField(user.id, 'expenses', updatedCosts);
        }
      }

      setMonthlyCosts(prev => prev.filter(cost => cost.id !== id));
    } catch (error) {
      console.error('Erro ao deletar custo mensal:', error);
    }
  };

  // Tasks functions
  const addTask = async (task: Omit<Task, 'id'>) => {
    try {
      const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        userId: user?.id
      };

      if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedTasks = Array.isArray(currentData.tasks) ? [...currentData.tasks, newTask] : [newTask];
          await firestoreService.updateUserField(user.id, 'tasks', updatedTasks);
        }
      }

      setTasks(prev => [...prev, newTask]);
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
    }
  };

  const updateTask = async (id: string, updatedTask: Partial<Task>) => {
    try {
      if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedTasks = Array.isArray(currentData.tasks) ? 
            currentData.tasks.map((task: Task) => task.id === id ? { ...task, ...updatedTask } : task) : [];
          await firestoreService.updateUserField(user.id, 'tasks', updatedTasks);
        }
      }

      setTasks(prev => prev.map(task => task.id === id ? { ...task, ...updatedTask } : task));
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      if (user?.id) {
        const currentData = await firestoreService.getUserData(user.id);
        if (currentData) {
          const updatedTasks = Array.isArray(currentData.tasks) ? 
            currentData.tasks.filter((task: Task) => task.id !== id) : [];
          await firestoreService.updateUserField(user.id, 'tasks', updatedTasks);
        }
      }

      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
    }
  };

  const updateRoutine = async (updatedRoutine: Partial<WorkRoutine>) => {
    try {
      if (user?.id) {
        await firestoreService.updateUserField(user.id, 'routine', {
          ...routine,
          ...updatedRoutine
        });
        setRoutine(prev => ({ ...prev, ...updatedRoutine }) as WorkRoutine);
      }
    } catch (error) {
      console.error('Erro ao atualizar rotina de trabalho:', error);
    }
  };

  const value: AppContextType = {
    jobs,
    addJob,
    updateJob,
    deleteJob,
    equipments,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    workItems,
    addWorkItem,
    updateWorkItem,
    deleteWorkItem,
    monthlyCosts,
    addMonthlyCost,
    updateMonthlyCost,
    deleteMonthlyCost,
    tasks,
    addTask,
    updateTask,
    deleteTask,
    routine,
    workRoutine: routine,
    updateRoutine,
    loading
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
