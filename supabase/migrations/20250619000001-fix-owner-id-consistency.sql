
-- MIGRAÇÃO: Corrigir inconsistência owner_id e criar funções RPC necessárias

-- 1. GARANTIR QUE A COLUNA owner_id EXISTE NA TABELA AGENCIES
DO $$
BEGIN
    -- Verificar se a coluna owner_id existe, se não, renomear owner_uid para owner_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'owner_uid') THEN
        ALTER TABLE public.agencies RENAME COLUMN owner_uid TO owner_id;
        RAISE NOTICE '✅ Coluna owner_uid renomeada para owner_id na tabela agencies';
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'owner_id') THEN
        RAISE EXCEPTION '❌ Nem owner_uid nem owner_id encontradas na tabela agencies';
    ELSE
        RAISE NOTICE '✅ Coluna owner_id já existe na tabela agencies';
    END IF;
END $$;

-- 2. REMOVER POLÍTICAS RLS EXISTENTES QUE PODEM CAUSAR RECURSÃO
DO $$ 
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'agencies' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.agencies CASCADE';
        RAISE NOTICE 'Política removida: %', pol_name;
    END LOOP;
    
    RAISE NOTICE 'Todas as políticas RLS da tabela agencies foram removidas';
END $$;

-- 3. CRIAR POLÍTICAS RLS SIMPLES E SEM RECURSÃO

-- Política para proprietários das agências
CREATE POLICY "agency_owner_access" ON public.agencies
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Política para super admins
CREATE POLICY "super_admin_agency_access" ON public.agencies
FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'));

-- Política para leitura de colaboradores
CREATE POLICY "agency_collaborator_read" ON public.agencies
FOR SELECT TO authenticated
USING (id IN (SELECT agency_id FROM public.agency_collaborators WHERE user_id = auth.uid()));

-- 4. REMOVER FUNÇÕES RPC EXISTENTES
DROP FUNCTION IF EXISTS public.get_all_companies_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_company_collaborators_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.invite_collaborator_admin(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.remove_collaborator_admin(UUID) CASCADE;

-- 5. CRIAR FUNÇÃO RPC PARA BUSCAR TODAS AS EMPRESAS (ADMIN)
CREATE OR REPLACE FUNCTION public.get_all_companies_admin()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    owner_id UUID,
    owner_email TEXT,
    owner_name TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    collaborators_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_email TEXT;
BEGIN
    current_user_email := auth.jwt() ->> 'email';
    
    -- Verificar se é super admin
    IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
    END IF;

    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        COALESCE(a.description, '')::TEXT as description,
        a.owner_id,
        p.email as owner_email,
        COALESCE(p.name, p.email)::TEXT as owner_name,
        COALESCE(a.status, 'active')::TEXT as status,
        a.created_at,
        COALESCE(collab_count.count, 0) as collaborators_count
    FROM public.agencies a
    JOIN public.profiles p ON a.owner_id = p.id
    LEFT JOIN (
        SELECT 
            agency_id, 
            COUNT(*) as count 
        FROM public.agency_collaborators 
        GROUP BY agency_id
    ) collab_count ON a.id = collab_count.agency_id
    ORDER BY a.created_at DESC;
END;
$$;

-- 6. CRIAR FUNÇÃO RPC PARA BUSCAR COLABORADORES DE UMA EMPRESA (ADMIN)
CREATE OR REPLACE FUNCTION public.get_company_collaborators_admin(company_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    email TEXT,
    name TEXT,
    role TEXT,
    added_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_email TEXT;
BEGIN
    current_user_email := auth.jwt() ->> 'email';
    
    -- Verificar se é super admin
    IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
    END IF;

    RETURN QUERY
    SELECT 
        c.id,
        c.user_id,
        p.email,
        p.name,
        c.role,
        c.added_at
    FROM public.agency_collaborators c
    JOIN public.profiles p ON c.user_id = p.id
    WHERE c.agency_id = company_id
    ORDER BY c.added_at DESC;
END;
$$;

-- 7. CRIAR FUNÇÃO RPC PARA CONVIDAR COLABORADOR (ADMIN)
CREATE OR REPLACE FUNCTION public.invite_collaborator_admin(
    company_id UUID,
    collaborator_email TEXT
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    agency_id UUID,
    role TEXT,
    added_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_email TEXT;
    target_user_id UUID;
    new_collaborator_id UUID;
BEGIN
    current_user_email := auth.jwt() ->> 'email';
    
    -- Verificar se é super admin
    IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
    END IF;

    -- Buscar o ID do usuário pelo email
    SELECT p.id INTO target_user_id
    FROM public.profiles p
    WHERE p.email = collaborator_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado com email: %', collaborator_email;
    END IF;

    -- Verificar se já é colaborador
    IF EXISTS (
        SELECT 1 FROM public.agency_collaborators 
        WHERE agency_id = company_id AND user_id = target_user_id
    ) THEN
        RAISE EXCEPTION 'Usuário já é colaborador desta empresa';
    END IF;

    -- Inserir novo colaborador
    INSERT INTO public.agency_collaborators (agency_id, user_id, role, added_by)
    VALUES (company_id, target_user_id, 'member', auth.uid())
    RETURNING agency_collaborators.id INTO new_collaborator_id;

    RETURN QUERY
    SELECT 
        c.id,
        c.user_id,
        c.agency_id,
        c.role,
        c.added_at
    FROM public.agency_collaborators c
    WHERE c.id = new_collaborator_id;
END;
$$;

-- 8. CRIAR FUNÇÃO RPC PARA REMOVER COLABORADOR (ADMIN)
CREATE OR REPLACE FUNCTION public.remove_collaborator_admin(collaborator_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_email TEXT;
    deleted_count INTEGER;
BEGIN
    current_user_email := auth.jwt() ->> 'email';
    
    -- Verificar se é super admin
    IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
    END IF;

    -- Remover colaborador
    DELETE FROM public.agency_collaborators
    WHERE id = collaborator_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count = 0 THEN
        RAISE EXCEPTION 'Colaborador não encontrado com ID: %', collaborator_id;
    END IF;

    RETURN TRUE;
END;
$$;

-- 9. CONCEDER PERMISSÕES PARA AS FUNÇÕES
GRANT EXECUTE ON FUNCTION public.get_all_companies_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_collaborators_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_collaborator_admin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_collaborator_admin(UUID) TO authenticated;

-- 10. ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON FUNCTION public.get_all_companies_admin() IS 'Busca todas as empresas com informações de proprietário e contagem de colaboradores - acesso apenas para super admins';
COMMENT ON FUNCTION public.get_company_collaborators_admin(UUID) IS 'Busca colaboradores de uma empresa específica - acesso apenas para super admins';
COMMENT ON FUNCTION public.invite_collaborator_admin(UUID, TEXT) IS 'Convida um colaborador para uma empresa - acesso apenas para super admins';
COMMENT ON FUNCTION public.remove_collaborator_admin(UUID) IS 'Remove um colaborador de uma empresa - acesso apenas para super admins';

-- 11. LOG DE FINALIZAÇÃO
DO $$
BEGIN
  RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '🔄 Coluna owner_id configurada corretamente';
  RAISE NOTICE '🔒 Políticas RLS simples criadas (sem recursão)';
  RAISE NOTICE '📦 4 funções RPC criadas para administração de empresas';
  RAISE NOTICE '🎯 Sistema deve funcionar sem erros de recursão agora!';
END $$;
