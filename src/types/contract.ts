
export type Contract = {
  id: string;
  user_id: string; 
  client_id: string;
  title: string;
  description?: string;
  value?: number;
  start_date?: string;
  end_date?: string;
  status: 'ativo' | 'finalizado' | 'cancelado';
  created_at: string;
  updated_at: string;
};
