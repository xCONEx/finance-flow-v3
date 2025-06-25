
-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    cnpj TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own clients" ON public.clients
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (company_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.agency_collaborators 
      WHERE agency_id = clients.company_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert their own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON public.clients
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (company_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.agency_collaborators 
      WHERE agency_id = clients.company_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete their own clients" ON public.clients
  FOR DELETE USING (
    auth.uid() = user_id OR 
    (company_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.agency_collaborators 
      WHERE agency_id = clients.company_id AND user_id = auth.uid()
    ))
  );

-- Comentário para documentação
COMMENT ON TABLE public.clients IS 'Tabela para armazenar informações dos clientes';
