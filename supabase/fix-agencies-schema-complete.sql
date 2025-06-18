
-- CORREÇÃO COMPLETA DA ESTRUTURA DE AGENCIES E FUNÇÕES RPC
-- Execute este script no Supabase SQL Editor

-- 1. AJUSTAR ESTRUTURA DA TABELA AGENCIES
DO $$
BEGIN
    -- Renomear owner_uid para owner_id se necessário
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'owner_uid' AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'owner_id' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.agencies RENAME COLUMN owner_uid TO owner_id;
        RAISE NOTICE '✅ Coluna owner_uid renomeada para owner_id';
    END IF;
    
    -- Adicionar coluna description se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'description' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.agencies ADD COLUMN description TEXT;
        RAISE NOTICE '✅ Coluna description adicionada';
    END IF;
    
    -- Verificar se owner_id referencia profiles corretamente
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'agencies' AND kcu.column_name = 'owner_id' AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Primeiro, verificar se há dados inconsistentes e limpar se necessário
        DELETE FROM public.agencies WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM public.profiles);
        
        -- Adicionar foreign key constraint
        ALTER TABLE public.agencies 
        ADD CONSTRAINT agencies_owner_id_fkey 
        FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Foreign key constraint adicionada para owner_id';
    END IF;
END $$;

-- 2. REMOVER FUNÇÕES EXISTENTES SE HOUVER
DROP FUNCTION IF EXISTS public.get_all_companies_for_admin() CASCADE;
DROP FUNCTION IF EXISTS public.admin_create_company(TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.admin_update_company(UUID, TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_company(UUID) CASCADE;

-- 3. CRIAR FUNÇÃO get_all_companies_for_admin
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
        COALESCE(a.description, '')::TEXT as description,
        a.owner_id,
        p.email as owner_email,
        COALESCE(p.name, p.email)::TEXT as owner_name,
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

-- 4. CRIAR FUNÇÃO admin_create_company
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
        COALESCE(a.description, '')::TEXT as description,
        a.owner_id,
        a.created_at
    FROM public.agencies a
    WHERE a.id = new_company_id;
END;
$$;

-- 5. CRIAR FUNÇÃO admin_update_company
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

-- 6. CRIAR FUNÇÃO admin_delete_company
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

-- 7. CONCEDER PERMISSÕES PARA TODAS AS FUNÇÕES
GRANT EXECUTE ON FUNCTION public.get_all_companies_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_company(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_company(UUID, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_company(UUID) TO authenticated;

-- 8. VERIFICAR SE TUDO FOI CRIADO CORRETAMENTE
DO $$
BEGIN
    -- Verificar funções
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_all_companies_for_admin') THEN
        RAISE NOTICE '✅ Função get_all_companies_for_admin criada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_create_company') THEN
        RAISE NOTICE '✅ Função admin_create_company criada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_update_company') THEN
        RAISE NOTICE '✅ Função admin_update_company criada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_delete_company') THEN
        RAISE NOTICE '✅ Função admin_delete_company criada';
    END IF;
    
    -- Verificar estrutura da tabela
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'owner_id' AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Coluna owner_id existe';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'description' AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Coluna description existe';
    END IF;
    
    RAISE NOTICE '🎉 CORREÇÃO COMPLETA FINALIZADA - Todas as funções e estruturas estão prontas!';
END $$;
