
export interface Job {
  id: string;
  description: string;
  client: string;
  eventDate: string;
  estimatedHours: number;
  difficultyLevel: 'fácil' | 'médio' | 'difícil' | 'muito difícil';
  logistics: string;
  equipment: string;
  assistance: string;
  status: 'pendente' | 'aprovado';
  category: string;
  discountValue: number;
  totalCosts: number;
  serviceValue: number;
  valueWithDiscount: number;
  profitMargin: number;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyCost {
  id: string;
  description: string;
  category: string;
  value: number;
  month: string;
  createdAt: string;
}

export interface WorkItem {
  id: string;
  description: string;
  category: string;
  value: number;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'baixa' | 'média' | 'alta';
  dueDate?: string;
  createdAt: string;
}

export interface WorkRoutine {
  desiredSalary: number;
  workDaysPerMonth: number;
  workHoursPerDay: number;
  valuePerDay: number;
  valuePerHour: number;
}

export interface CompanyData {
  name: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
}
