
-- Primeiro, vamos dropar a política existente se houver
DROP POLICY IF EXISTS "Users can manage their own kanban projects" ON public.user_kanban_boards;
DROP POLICY IF EXISTS "Users can manage their own kanban board" ON public.user_kanban_boards;

-- Criar nova política mais específica
CREATE POLICY "Enable all operations for authenticated users on own records" 
ON public.user_kanban_boards
FOR ALL 
TO authenticated
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Garantir que RLS está habilitado
ALTER TABLE public.user_kanban_boards ENABLE ROW LEVEL SECURITY;

-- Recriar índices se necessário
DROP INDEX IF EXISTS idx_user_kanban_boards_user_id;
DROP INDEX IF EXISTS idx_user_kanban_boards_status;

CREATE INDEX idx_user_kanban_boards_user_id ON public.user_kanban_boards(user_id);
CREATE INDEX idx_user_kanban_boards_status ON public.user_kanban_boards(status);
