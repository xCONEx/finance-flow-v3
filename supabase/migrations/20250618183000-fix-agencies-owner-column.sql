
-- CORRIGIR COLUNA DE PROPRIETÁRIO NAS TABELAS DE AGÊNCIA
-- Alterar owner_uid para owner_id para consistência

-- 1. RENOMEAR COLUNA owner_uid PARA owner_id NA TABELA AGENCIES
DO $$
BEGIN
    -- Verificar se a coluna owner_uid existe e renomear para owner_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'owner_uid') THEN
        ALTER TABLE public.agencies RENAME COLUMN owner_uid TO owner_id;
        RAISE NOTICE '✅ Coluna owner_uid renomeada para owner_id na tabela agencies';
    ELSE
        RAISE NOTICE '⚠️ Coluna owner_uid não encontrada na tabela agencies';
    END IF;
END $$;

-- 2. ATUALIZAR FUNÇÕES QUE USAM A COLUNA CORRIGIDA
-- Recriar função get_all_companies_for_admin com a coluna correta
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

-- 3. RECRIAR FUNÇÃO get_user_agencies COM A COLUNA CORRETA
CREATE OR REPLACE FUNCTION public.get_user_agencies()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  owner_id UUID,
  user_role TEXT,
  is_owner BOOLEAN
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

  -- Retornar agências onde é owner
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    COALESCE(a.description, '')::TEXT as description,
    a.owner_id,
    'owner'::TEXT as user_role,
    true as is_owner
  FROM public.agencies a
  WHERE a.owner_id = current_user_id
  
  UNION ALL
  
  -- Retornar agências onde é colaborador
  SELECT 
    a.id,
    a.name,
    COALESCE(a.description, '')::TEXT as description,
    a.owner_id,
    COALESCE(c.role, 'member')::TEXT as user_role,
    false as is_owner
  FROM public.agencies a
  JOIN public.agency_collaborators c ON a.id = c.agency_id
  WHERE c.user_id = current_user_id;
END;
$$;

-- 4. ATUALIZAR POLÍTICAS RLS DA TABELA AGENCIES
DROP POLICY IF EXISTS "agency_owner_access" ON public.agencies;
CREATE POLICY "agency_owner_access" ON public.agencies
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Política para super admins
DROP POLICY IF EXISTS "super_admin_agency_access" ON public.agencies;
CREATE POLICY "super_admin_agency_access" ON public.agencies
FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'));

-- 5. CONCEDER PERMISSÕES ATUALIZADAS
GRANT EXECUTE ON FUNCTION public.get_all_companies_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_agencies() TO authenticated;

-- 6. LOG DE SUCESSO
DO $$
BEGIN
    RAISE NOTICE '✅ CORREÇÃO DE SCHEMA CONCLUÍDA!';
    RAISE NOTICE '🔄 Coluna owner_uid renomeada para owner_id';
    RAISE NOTICE '🔧 Funções get_all_companies_for_admin e get_user_agencies atualizadas';
    RAISE NOTICE '🔒 Políticas RLS atualizadas para usar owner_id';
    RAISE NOTICE '🎯 Empresas devem aparecer corretamente no painel admin agora!';
END $$;
