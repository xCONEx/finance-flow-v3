
-- Dropar a tabela existente e recriar tudo do zero
DROP TABLE IF EXISTS public.user_kanban_boards CASCADE;

-- Criar tabela com estrutura correta
CREATE TABLE public.user_kanban_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client TEXT NOT NULL,
  due_date DATE,
  priority TEXT NOT NULL CHECK (priority IN ('alta', 'media', 'baixa')),
  status TEXT NOT NULL CHECK (status IN ('filmado', 'edicao', 'revisao', 'entregue')),
  description TEXT,
  links JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.user_kanban_boards ENABLE ROW LEVEL SECURITY;

-- Criar política única e simples para todas as operações
CREATE POLICY "kanban_user_access" ON public.user_kanban_boards
  FOR ALL 
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Criar índices para performance
CREATE INDEX idx_user_kanban_boards_user_id ON public.user_kanban_boards(user_id);
CREATE INDEX idx_user_kanban_boards_status ON public.user_kanban_boards(status);
CREATE INDEX idx_user_kanban_boards_priority ON public.user_kanban_boards(priority);

-- Adicionar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_kanban_boards_updated_at 
    BEFORE UPDATE ON public.user_kanban_boards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
