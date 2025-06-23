
export interface Client {
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
}

export interface JobHistory {
  id: string;
  client_id: string;
  description: string;
  service_value: number;
  event_date: string;
  status: string;
  created_at: string;
}
