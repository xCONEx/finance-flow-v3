
-- CORREÇÃO SIMPLES PARA RESOLVER RECURSÃO INFINITA
-- Remove todas as políticas RLS da tabela agencies para evitar recursão

-- 1. REMOVER TODAS AS POLÍTICAS RLS EXISTENTES
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

-- 2. DESABILITAR RLS TEMPORARIAMENTE PARA AGENCIES
ALTER TABLE public.agencies DISABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS SIMPLES SEM RECURSÃO

-- Política básica para admins
CREATE POLICY "admin_full_access" ON public.agencies
FOR ALL TO authenticated
USING (
    auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
)
WITH CHECK (
    auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
);

-- Política para proprietários (sem lookup adicional)
CREATE POLICY "owner_access" ON public.agencies
FOR ALL TO authenticated
USING (owner_uid = auth.uid())
WITH CHECK (owner_uid = auth.uid());

-- 4. REABILITAR RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- 5. GARANTIR QUE AS FUNÇÕES RPC EXISTAM
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
        a.owner_uid as owner_id, -- Mapear owner_uid para owner_id na resposta
        p.email as owner_email,
        COALESCE(p.name, p.email)::TEXT as owner_name,
        COALESCE(a.status, 'active')::TEXT as status,
        a.created_at,
        COALESCE(collab_count.count, 0) as collaborators_count
    FROM public.agencies a
    JOIN public.profiles p ON a.owner_uid = p.id -- Usar owner_uid aqui
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

-- 6. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_all_companies_admin() TO authenticated;

-- 7. LOG DE SUCESSO
DO $$
BEGIN
    RAISE NOTICE '✅ CORREÇÃO DE RECURSÃO CONCLUÍDA!';
    RAISE NOTICE '🔒 RLS desabilitado e reabilitado com políticas simples';
    RAISE NOTICE '🔧 Função get_all_companies_admin atualizada';
    RAISE NOTICE '✨ Problema de recursão infinita deve estar resolvido!';
END $$;
