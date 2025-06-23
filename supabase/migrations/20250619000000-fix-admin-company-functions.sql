
-- CORRIGIR FUNÇÕES ADMINISTRATIVAS DE EMPRESAS
-- Esta migração garante que todas as funções necessárias existam com os nomes corretos

-- 1. REMOVER FUNÇÕES EXISTENTES PARA EVITAR CONFLITOS
DROP FUNCTION IF EXISTS public.get_all_companies_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_all_companies_for_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_company_collaborators_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.invite_collaborator_admin(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.remove_collaborator_admin(UUID) CASCADE;

-- 2. CRIAR FUNÇÃO get_all_companies_admin (nome que o código espera)
CREATE OR REPLACE FUNCTION public.get_all_companies_admin()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    owner_uid UUID,
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
    
    -- Verificar se é super admin ou admin no sistema
    IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') AND
       NOT EXISTS (
           SELECT 1 FROM public.profiles 
           WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
       ) THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
    END IF;

    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        COALESCE(a.description, '')::TEXT as description,
        a.owner_id as owner_uid,
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

-- 3. CRIAR FUNÇÃO get_company_collaborators_admin
CREATE OR REPLACE FUNCTION public.get_company_collaborators_admin(
    company_id UUID
)
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
    
    -- Verificar se é super admin ou admin no sistema
    IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') AND
       NOT EXISTS (
           SELECT 1 FROM public.profiles 
           WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
       ) THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
    END IF;

    -- Verificar se a empresa existe
    IF NOT EXISTS (SELECT 1 FROM public.agencies WHERE id = company_id) THEN
        RAISE EXCEPTION 'Empresa não encontrada';
    END IF;

    RETURN QUERY
    SELECT 
        c.id,
        c.user_id,
        p.email,
        COALESCE(p.name, p.email)::TEXT as name,
        c.role,
        c.joined_at as added_at
    FROM public.agency_collaborators c
    JOIN public.profiles p ON c.user_id = p.id
    WHERE c.agency_id = company_id
    ORDER BY c.joined_at DESC;
END;
$$;

-- 4. CRIAR FUNÇÃO invite_collaborator_admin
CREATE OR REPLACE FUNCTION public.invite_collaborator_admin(
    company_id UUID,
    collaborator_email TEXT
)
RETURNS TABLE (
    id UUID,
    agency_id UUID,
    email TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_email TEXT;
    current_user_id UUID;
    target_user_id UUID;
    new_collaborator_id UUID;
BEGIN
    current_user_email := auth.jwt() ->> 'email';
    current_user_id := auth.uid();
    
    -- Verificar se é super admin ou admin no sistema
    IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') AND
       NOT EXISTS (
           SELECT 1 FROM public.profiles 
           WHERE profiles.id = current_user_id AND profiles.user_type = 'admin'
       ) THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
    END IF;

    -- Verificar se a empresa existe
    IF NOT EXISTS (SELECT 1 FROM public.agencies WHERE id = company_id) THEN
        RAISE EXCEPTION 'Empresa não encontrada';
    END IF;

    -- Buscar o usuário pelo email
    SELECT p.id INTO target_user_id
    FROM public.profiles p
    WHERE p.email = collaborator_email;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado', collaborator_email;
    END IF;

    -- Verificar se já é colaborador
    IF EXISTS (
        SELECT 1 FROM public.agency_collaborators 
        WHERE agency_id = company_id AND user_id = target_user_id
    ) THEN
        RAISE EXCEPTION 'Usuário já é colaborador desta empresa';
    END IF;

    -- Verificar se é o próprio dono
    IF EXISTS (
        SELECT 1 FROM public.agencies 
        WHERE id = company_id AND owner_id = target_user_id
    ) THEN
        RAISE EXCEPTION 'Usuário já é proprietário desta empresa';
    END IF;

    -- Adicionar como colaborador direto
    INSERT INTO public.agency_collaborators (agency_id, user_id, invited_by, role)
    VALUES (company_id, target_user_id, current_user_id, 'member')
    RETURNING agency_collaborators.id INTO new_collaborator_id;

    -- Retornar informações do convite simulado
    RETURN QUERY
    SELECT 
        new_collaborator_id as id,
        company_id as agency_id,
        collaborator_email as email,
        'accepted'::TEXT as status,
        NOW() as created_at;
END;
$$;

-- 5. CRIAR FUNÇÃO remove_collaborator_admin
CREATE OR REPLACE FUNCTION public.remove_collaborator_admin(
    collaborator_id UUID
)
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
    
    -- Verificar se é super admin ou admin no sistema
    IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') AND
       NOT EXISTS (
           SELECT 1 FROM public.profiles 
           WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
       ) THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
    END IF;

    -- Remover o colaborador
    DELETE FROM public.agency_collaborators
    WHERE id = collaborator_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count > 0;
END;
$$;

-- 6. GARANTIR QUE A COLUNA STATUS EXISTE NA TABELA AGENCIES
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'status' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.agencies ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE '✅ Coluna status adicionada à tabela agencies';
    ELSE
        RAISE NOTICE '✅ Coluna status já existe na tabela agencies';  
    END IF;
END $$;

-- 7. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_all_companies_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_collaborators_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_collaborator_admin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_collaborator_admin(UUID) TO authenticated;

-- 8. LOG DE SUCESSO
DO $$
BEGIN
    RAISE NOTICE '✅ FUNÇÕES ADMINISTRATIVAS DE EMPRESA CORRIGIDAS';
    RAISE NOTICE '🏢 Função get_all_companies_admin criada';
    RAISE NOTICE '👥 Função get_company_collaborators_admin criada';
    RAISE NOTICE '📨 Função invite_collaborator_admin criada';
    RAISE NOTICE '🗑️ Função remove_collaborator_admin criada';
    RAISE NOTICE '🔒 Permissões concedidas para authenticated users';
    RAISE NOTICE '✨ Sistema de gestão de empresas pelo admin funcionando!';
END $$;
