
-- CRIAR FUNÇÃO get_all_companies_for_admin DE FORMA SIMPLES E DIRETA
-- Esta migração garante que a função existe e funciona corretamente

-- 1. REMOVER FUNÇÃO SE EXISTIR (para evitar conflitos)
DROP FUNCTION IF EXISTS public.get_all_companies_for_admin() CASCADE;

-- 2. VERIFICAR SE COLUNA DESCRIPTION EXISTE NA TABELA AGENCIES
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'description' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.agencies ADD COLUMN description TEXT;
        RAISE NOTICE '✅ Coluna description adicionada à tabela agencies';
    ELSE
        RAISE NOTICE '✅ Coluna description já existe na tabela agencies';  
    END IF;
END $$;

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
    -- Obter email do usuário atual
    current_user_email := auth.jwt() ->> 'email';
    
    -- Verificar se é super admin
    IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
        -- Verificar se é admin no perfil
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
        ) THEN
            RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
        END IF;
    END IF;

    -- Retornar dados das empresas
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

-- 4. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_all_companies_for_admin() TO authenticated;

-- 5. VERIFICAR SE A FUNÇÃO FOI CRIADA
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_all_companies_for_admin' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        RAISE NOTICE '✅ Função get_all_companies_for_admin criada com sucesso!';
    ELSE
        RAISE EXCEPTION '❌ Falha ao criar função get_all_companies_for_admin';
    END IF;
END $$;

-- 6. LOG FINAL
RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA - Função get_all_companies_for_admin disponível';
