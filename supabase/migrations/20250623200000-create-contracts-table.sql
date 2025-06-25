
-- Criar tabela de contratos
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  value DECIMAL(15,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status TEXT CHECK (status IN ('ativo', 'finalizado', 'cancelado')) DEFAULT 'ativo',
  contract_file_url TEXT,
  contract_file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para performance
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_user_id ON contracts(user_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- RLS (Row Level Security)
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own contracts" ON contracts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contracts" ON contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contracts" ON contracts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contracts" ON contracts
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contracts_updated_at_trigger
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contracts_updated_at();
