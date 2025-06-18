
-- Remover tabela antiga se existir
DROP TABLE IF EXISTS public.user_kanban_boards;

-- Criar tabela com estrutura correta para os projetos kanban
CREATE TABLE public.user_kanban_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- Políticas RLS para user_kanban_boards
CREATE POLICY "Users can manage their own kanban projects" ON public.user_kanban_boards
  FOR ALL USING (auth.uid() = user_id);

-- Criar índice para performance
CREATE INDEX idx_user_kanban_boards_user_id ON public.user_kanban_boards(user_id);
CREATE INDEX idx_user_kanban_boards_status ON public.user_kanban_boards(status);
