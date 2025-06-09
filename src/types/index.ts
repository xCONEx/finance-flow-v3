
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  photoURL?: string;
  userType: 'admin' | 'company_owner' | 'employee' | 'individual';
  companyId?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  plan: 'free' | 'premium';
  ownerId: string;
  createdAt: string;
}

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

export interface MonthlyCost {
  id: string;
  description: string;
  category: string;
  value: number;
  month: string;
  createdAt: string;
  userId: string;
  companyId?: string;
}

export interface WorkItem {
  id: string;
  description: string;
  category: string;
  value: number;
  depreciationYears: number;
  createdAt: string;
  userId: string;
  companyId?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'baixa' | 'média' | 'alta';
  status: 'todo' | 'editing' | 'urgent' | 'delivered' | 'revision';
  dueDate?: string;
  createdAt: string;
  userId: string;
}

export interface WorkRoutine {
  desiredSalary: number;
  workDaysPerMonth: number;
  workHoursPerDay: number;
  valuePerDay: number;
  valuePerHour: number;
  userId: string;
}

export interface Theme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  colorTheme: string;
  notifications: boolean;
  language: 'pt-BR';
}
