
// Tipos baseados no schema SQL
export type TaskStatus = 'pendente' | 'aprovado'; // Simplified to match job status

export type Client = {
  id: string;
  user_id: string;
  company_id?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  cnpj?: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

export type UserProfile = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  logo_base64?: string;
  image_user?: string;
  user_type: 'individual' | 'company_owner' | 'employee' | 'admin';
  banned: boolean;
  agency_id?: string;
  role: 'owner' | 'editor' | 'viewer';
  created_at: string;
  updated_at: string;
  subscription: 'free' | 'basic' | 'premium' | 'enterprise' | 'enterprise-annual';
  subscription_data?: any;
};

export type Agency = {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  status: string;
  cnpj?: string;
};

export type Job = {
  id?: string;
  user_id?: string;
  agency_id?: string;
  description: string;
  client: string;
  client_id?: string;
  event_date?: string;
  estimated_hours?: number;
  difficulty_level?: 'fácil' | 'médio' | 'complicado' | 'difícil';
  logistics?: number;
  equipment?: number;
  assistance?: number;
  status?: 'pendente' | 'aprovado';
  category?: string;
  discount_value?: number;
  total_costs?: number;
  service_value?: number;
  value_with_discount?: number;
  profit_margin?: number;
  created_at?: string;
  updated_at?: string;
  is_approved?: boolean;
  // Propriedades compatíveis com o sistema de jobs existente
  title?: string;
  dueDate?: string;
  priority?: string;
  companyId?: string;
  links?: any[];
  createdAt?: string;
  updatedAt?: string;
};
