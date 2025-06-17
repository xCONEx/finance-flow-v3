
-- FASE 3: RLS PARA AGÊNCIAS (FOCADO NO KANBAN)
-- Implementar políticas RLS para agências e kanban compartilhado

-- 1. CRIAR TABELA KANBAN_BOARDS SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS public.kanban_boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    board_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT kanban_context_check CHECK (
        (user_id IS NOT NULL AND agency_id IS NULL) OR 
        (user_id IS NULL AND agency_id IS NOT NULL)
    )
);

-- 2. HABILITAR RLS NA TABELA KANBAN_BOARDS
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS RLS PARA AGENCIES (MELHORADAS)

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "agency_owner_access" ON public.agencies;
DROP POLICY IF EXISTS "agency_collaborator_read" ON public.agencies;

-- Owners podem gerenciar suas agências
CREATE POLICY "agency_owner_full_access" ON public.agencies
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Colaboradores podem ler agências onde participam
CREATE POLICY "agency_collaborator_read_access" ON public.agencies
FOR SELECT TO authenticated
USING (id IN (SELECT agency_id FROM public.agency_collaborators WHERE user_id = auth.uid()));

-- 4. POLÍTICAS RLS PARA AGENCY_COLLABORATORS (MELHORADAS)

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "collaborator_owner_manage" ON public.agency_collaborators;
DROP POLICY IF EXISTS "collaborator_self_read" ON public.agency_collaborators;

-- Owners podem gerenciar colaboradores de suas agências
CREATE POLICY "owner_manage_collaborators" ON public.agency_collaborators
FOR ALL TO authenticated
USING (agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid()))
WITH CHECK (agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid()));

-- Colaboradores podem ver seus próprios registros
CREATE POLICY "collaborator_self_view" ON public.agency_collaborators
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 5. POLÍTICAS RLS PARA KANBAN_BOARDS (NOVA)

-- Usuários podem gerenciar seus kanban individuais
CREATE POLICY "user_individual_kanban" ON public.kanban_boards
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Owners podem gerenciar kanban de suas agências
CREATE POLICY "owner_agency_kanban" ON public.kanban_boards
FOR ALL TO authenticated
USING (agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid()))
WITH CHECK (agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid()));

-- Colaboradores podem ver/editar kanban das agências que participam
CREATE POLICY "collaborator_agency_kanban" ON public.kanban_boards
FOR ALL TO authenticated
USING (agency_id IN (SELECT agency_id FROM public.agency_collaborators WHERE user_id = auth.uid()))
WITH CHECK (agency_id IN (SELECT agency_id FROM public.agency_collaborators WHERE user_id = auth.uid()));

-- 6. GARANTIR QUE OUTRAS TABELAS PERMANECEM PESSOAIS

-- Verificar se RLS das tabelas pessoais está correto (não alterar se já estiver)
DO $$
BEGIN
    -- Equipment permanece pessoal
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'equipment' AND policyname = 'users_own_equipment') THEN
        CREATE POLICY "users_own_equipment" ON public.equipment
        FOR ALL TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;

    -- Expenses permanece pessoal
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'users_own_expenses') THEN
        CREATE POLICY "users_own_expenses" ON public.expenses
        FOR ALL TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;

    -- Jobs permanece pessoal
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'users_own_jobs') THEN
        CREATE POLICY "users_own_jobs" ON public.jobs
        FOR ALL TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;

    -- Work_routine permanece pessoal
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_routine' AND policyname = 'users_own_routine') THEN
        CREATE POLICY "users_own_routine" ON public.work_routine
        FOR ALL TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- 7. CRIAR FUNÇÕES RPC PARA KANBAN

-- Função para buscar kanban individual do usuário
CREATE OR REPLACE FUNCTION public.get_user_kanban()
RETURNS TABLE (
    id UUID,
    board_data JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    RETURN QUERY
    SELECT 
        kb.id,
        kb.board_data,
        kb.created_at,
        kb.updated_at
    FROM public.kanban_boards kb
    WHERE kb.user_id = current_user_id;
END;
$$;

-- Função para buscar kanban de uma agência específica
CREATE OR REPLACE FUNCTION public.get_agency_kanban(target_agency_id UUID)
RETURNS TABLE (
    id UUID,
    board_data JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    has_access BOOLEAN;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Verificar se o usuário tem acesso à agência (owner ou colaborador)
    SELECT COUNT(*) > 0 INTO has_access
    FROM (
        SELECT 1 FROM public.agencies WHERE id = target_agency_id AND owner_id = current_user_id
        UNION
        SELECT 1 FROM public.agency_collaborators WHERE agency_id = target_agency_id AND user_id = current_user_id
    ) access_check;

    IF NOT has_access THEN
        RAISE EXCEPTION 'Acesso negado: usuário não tem permissão para esta agência';
    END IF;

    RETURN QUERY
    SELECT 
        kb.id,
        kb.board_data,
        kb.created_at,
        kb.updated_at
    FROM public.kanban_boards kb
    WHERE kb.agency_id = target_agency_id;
END;
$$;

-- Função para salvar kanban individual
CREATE OR REPLACE FUNCTION public.save_user_kanban(kanban_data JSONB)
RETURNS TABLE (
    id UUID,
    board_data JSONB,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    kanban_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Inserir ou atualizar kanban individual
    INSERT INTO public.kanban_boards (user_id, board_data, updated_at)
    VALUES (current_user_id, kanban_data, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        board_data = EXCLUDED.board_data,
        updated_at = NOW()
    RETURNING kanban_boards.id INTO kanban_id;

    RETURN QUERY
    SELECT 
        kb.id,
        kb.board_data,
        kb.updated_at
    FROM public.kanban_boards kb
    WHERE kb.id = kanban_id;
END;
$$;

-- Função para salvar kanban de agência
CREATE OR REPLACE FUNCTION public.save_agency_kanban(target_agency_id UUID, kanban_data JSONB)
RETURNS TABLE (
    id UUID,
    board_data JSONB,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    has_write_access BOOLEAN;
    kanban_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Verificar se o usuário tem acesso de escrita à agência (owner ou colaborador)
    SELECT COUNT(*) > 0 INTO has_write_access
    FROM (
        SELECT 1 FROM public.agencies WHERE id = target_agency_id AND owner_id = current_user_id
        UNION
        SELECT 1 FROM public.agency_collaborators WHERE agency_id = target_agency_id AND user_id = current_user_id
    ) write_check;

    IF NOT has_write_access THEN
        RAISE EXCEPTION 'Acesso negado: usuário não tem permissão para editar esta agência';
    END IF;

    -- Inserir ou atualizar kanban da agência
    INSERT INTO public.kanban_boards (agency_id, board_data, updated_at)
    VALUES (target_agency_id, kanban_data, NOW())
    ON CONFLICT (agency_id) 
    DO UPDATE SET 
        board_data = EXCLUDED.board_data,
        updated_at = NOW()
    RETURNING kanban_boards.id INTO kanban_id;

    RETURN QUERY
    SELECT 
        kb.id,
        kb.board_data,
        kb.updated_at
    FROM public.kanban_boards kb
    WHERE kb.id = kanban_id;
END;
$$;

-- 8. CONCEDER PERMISSÕES PARA AS NOVAS FUNÇÕES
GRANT EXECUTE ON FUNCTION public.get_user_kanban() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agency_kanban(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_user_kanban(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_agency_kanban(UUID, JSONB) TO authenticated;

-- 9. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_kanban_boards_user_id ON public.kanban_boards(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_agency_id ON public.kanban_boards(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_collaborators_user_agency ON public.agency_collaborators(user_id, agency_id);

-- 10. LOG DE SUCESSO
DO $$
BEGIN
    RAISE NOTICE '✅ FASE 3 CONCLUÍDA: RLS PARA AGÊNCIAS E KANBAN';
    RAISE NOTICE '🏢 Políticas RLS para agencies criadas';
    RAISE NOTICE '👥 Políticas RLS para agency_collaborators criadas';
    RAISE NOTICE '📋 Políticas RLS para kanban_boards criadas';
    RAISE NOTICE '📦 4 funções RPC para kanban criadas';
    RAISE NOTICE '🔒 Jobs/Expenses/Equipment/Routine permanecem pessoais';
    RAISE NOTICE '🎯 Sistema pronto para Fase 4!';
END $$;
