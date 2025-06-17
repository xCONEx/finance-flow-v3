
-- FUNÇÕES ADMINISTRATIVAS PARA GESTÃO DE EMPRESAS
-- Implementar funções para que admins possam criar, editar e gerenciar empresas

-- 1. FUNÇÃO PARA ADMINS VISUALIZAREM TODAS AS EMPRESAS
CREATE OR REPLACE FUNCTION public.get_all_companies_for_admin()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    owner_id UUID,
    owner_email TEXT,
    owner_name TEXT,
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
        a.description,
        a.owner_id,
        p.email as owner_email,
        p.name as owner_name,
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

-- 2. FUNÇÃO PARA ADMIN CRIAR EMPRESA E DESIGNAR OWNER
CREATE OR REPLACE FUNCTION public.admin_create_company(
    company_name TEXT,
    company_description TEXT DEFAULT NULL,
    owner_user_id UUID
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    owner_id UUID,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_email TEXT;
    new_company_id UUID;
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

    -- Verificar se o owner existe
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = owner_user_id) THEN
        RAISE EXCEPTION 'Usuário proprietário não encontrado';
    END IF;

    -- Criar a empresa
    INSERT INTO public.agencies (name, description, owner_id)
    VALUES (company_name, company_description, owner_user_id)
    RETURNING agencies.id INTO new_company_id;

    -- Atualizar o tipo do usuário para company_owner se necessário
    UPDATE public.profiles 
    SET user_type = 'company_owner'
    WHERE id = owner_user_id AND (user_type IS NULL OR user_type = 'individual');

    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.description,
        a.owner_id,
        a.created_at
    FROM public.agencies a
    WHERE a.id = new_company_id;
END;
$$;

-- 3. FUNÇÃO PARA ADMIN ATUALIZAR EMPRESA
CREATE OR REPLACE FUNCTION public.admin_update_company(
    company_id UUID,
    new_name TEXT,
    new_description TEXT DEFAULT NULL,
    new_owner_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_email TEXT;
    old_owner_id UUID;
    updated_count INTEGER;
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

    -- Verificar se a empresa existe e pegar o owner atual
    SELECT owner_id INTO old_owner_id
    FROM public.agencies
    WHERE id = company_id;

    IF old_owner_id IS NULL THEN
        RAISE EXCEPTION 'Empresa não encontrada';
    END IF;

    -- Verificar se o novo owner existe
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_owner_id) THEN
        RAISE EXCEPTION 'Novo proprietário não encontrado';
    END IF;

    -- Atualizar a empresa
    UPDATE public.agencies
    SET 
        name = new_name,
        description = new_description,
        owner_id = new_owner_id,
        updated_at = NOW()
    WHERE id = company_id;

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    -- Se mudou o owner, atualizar os tipos de usuário
    IF old_owner_id != new_owner_id THEN
        -- Atualizar o novo owner para company_owner
        UPDATE public.profiles 
        SET user_type = 'company_owner'
        WHERE id = new_owner_id AND (user_type IS NULL OR user_type = 'individual');

        -- Se o antigo owner não possui outras empresas, pode voltar para individual
        IF NOT EXISTS (
            SELECT 1 FROM public.agencies 
            WHERE owner_id = old_owner_id AND id != company_id
        ) THEN
            UPDATE public.profiles 
            SET user_type = 'individual'
            WHERE id = old_owner_id AND user_type = 'company_owner';
        END IF;
    END IF;

    RETURN updated_count > 0;
END;
$$;

-- 4. FUNÇÃO PARA ADMIN EXCLUIR EMPRESA
CREATE OR REPLACE FUNCTION public.admin_delete_company(
    company_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_email TEXT;
    company_owner_id UUID;
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

    -- Pegar o owner da empresa antes de deletar
    SELECT owner_id INTO company_owner_id
    FROM public.agencies
    WHERE id = company_id;

    IF company_owner_id IS NULL THEN
        RAISE EXCEPTION 'Empresa não encontrada';
    END IF;

    -- Deletar a empresa (CASCADE vai deletar colaboradores e convites)
    DELETE FROM public.agencies
    WHERE id = company_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Se o owner não possui outras empresas, voltar para individual
    IF deleted_count > 0 AND NOT EXISTS (
        SELECT 1 FROM public.agencies 
        WHERE owner_id = company_owner_id
    ) THEN
        UPDATE public.profiles 
        SET user_type = 'individual'
        WHERE id = company_owner_id AND user_type = 'company_owner';
    END IF;

    RETURN deleted_count > 0;
END;
$$;

-- 5. CONCEDER PERMISSÕES PARA AS NOVAS FUNÇÕES
GRANT EXECUTE ON FUNCTION public.get_all_companies_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_company(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_company(UUID, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_company(UUID) TO authenticated;

-- 6. LOG DE SUCESSO
DO $$
BEGIN
    RAISE NOTICE '✅ FUNÇÕES ADMINISTRATIVAS DE EMPRESA CRIADAS';
    RAISE NOTICE '🏢 Função get_all_companies_for_admin criada';
    RAISE NOTICE '➕ Função admin_create_company criada';
    RAISE NOTICE '✏️ Função admin_update_company criada';
    RAISE NOTICE '🗑️ Função admin_delete_company criada';
    RAISE NOTICE '🔒 Permissões concedidas para authenticated users';
    RAISE NOTICE '✨ Sistema de gestão de empresas pelo admin pronto!';
END $$;
