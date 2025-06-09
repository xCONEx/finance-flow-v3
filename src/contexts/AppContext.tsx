import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { firestoreService } from '../services/firestore';

interface Job {
  id: string;
  title: string;
  description: string;
  value: number;
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

interface WorkRoutine {
  dailyHours: number;
  dalilyValue: number;
  desiredSalary: number;
  workDays: number;
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
  routine: WorkRoutine | null;
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
        // Se é agência, atualizar no documento da empresa
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedJobs = Array.isArray(currentData.jobs) ? [...currentData.jobs, newJob] : [newJob];
          await firestoreService.updateCompany(agencyData.id, {
            jobs: updatedJobs
          });
        }
      } else if (user?.id) {
        // Se é usuário individual, atualizar no documento do usuário
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
        // Se é agência, atualizar no documento da empresa
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedJobs = Array.isArray(currentData.jobs) ? 
            currentData.jobs.map((jb: Job) => jb.id === id ? { ...jb, ...updatedJob } : jb) : [];
          await firestoreService.updateCompany(agencyData.id, {
            jobs: updatedJobs
          });
        }
      } else if (user?.id) {
        // Se é usuário individual, atualizar no documento do usuário
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
        // Se é agência, atualizar no documento da empresa
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedJobs = Array.isArray(currentData.jobs) ? 
            currentData.jobs.filter((jb: Job) => jb.id !== id) : [];
          await firestoreService.updateCompany(agencyData.id, {
            jobs: updatedJobs
          });
        }
      } else if (user?.id) {
        // Se é usuário individual, atualizar no documento do usuário
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
        // Se é agência, atualizar no documento da empresa
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedExpenses = Array.isArray(currentData.expenses) ? [...currentData.expenses, newExpense] : [newExpense];
          await firestoreService.updateCompany(agencyData.id, {
            expenses: updatedExpenses
          });
        }
      } else if (user?.id) {
        // Se é usuário individual, atualizar no documento do usuário
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
        // Se é agência, atualizar no documento da empresa
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedExpenses = Array.isArray(currentData.expenses) ? 
            currentData.expenses.map((exp: Expense) => exp.id === id ? { ...exp, ...updatedExpense } : exp) : [];
          await firestoreService.updateCompany(agencyData.id, {
            expenses: updatedExpenses
          });
        }
      } else if (user?.id) {
        // Se é usuário individual, atualizar no documento do usuário
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
        // Se é agência, atualizar no documento da empresa
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedExpenses = Array.isArray(currentData.expenses) ? 
            currentData.expenses.filter((exp: Expense) => exp.id !== id) : [];
          await firestoreService.updateCompany(agencyData.id, {
            expenses: updatedExpenses
          });
        }
      } else if (user?.id) {
        // Se é usuário individual, atualizar no documento do usuário
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
        // Se é agência, atualizar no documento da empresa
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedEquipments = Array.isArray(currentData.equipments) ? [...currentData.equipments, newEquipment] : [newEquipment];
          await firestoreService.updateCompany(agencyData.id, {
            equipments: updatedEquipments
          });
        }
      } else if (user?.id) {
        // Se é usuário individual, atualizar no documento do usuário
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
        // Se é agência, atualizar no documento da empresa
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedEquipments = Array.isArray(currentData.equipments) ? 
            currentData.equipments.map((eq: Equipment) => eq.id === id ? { ...eq, ...updatedEquipment } : eq) : [];
          await firestoreService.updateCompany(agencyData.id, {
            equipments: updatedEquipments
          });
        }
      } else if (user?.id) {
        // Se é usuário individual, atualizar no documento do usuário
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
        // Se é agência, atualizar no documento da empresa
        const currentData = await firestoreService.getCompanyById(agencyData.id);
        if (currentData) {
          const updatedEquipments = Array.isArray(currentData.equipments) ? 
            currentData.equipments.filter((eq: Equipment) => eq.id !== id) : [];
          await firestoreService.updateCompany(agencyData.id, {
            equipments: updatedEquipments
          });
        }
      } else if (user?.id) {
        // Se é usuário individual, atualizar no documento do usuário
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
    routine,
    updateRoutine,
    loading
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
