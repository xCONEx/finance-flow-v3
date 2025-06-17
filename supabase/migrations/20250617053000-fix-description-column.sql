
-- CORREÇÃO FINAL: ADICIONAR COLUNA DESCRIPTION E CORRIGIR get_user_agencies
-- Corrigir a tabela agencies e a função get_user_agencies

-- 1. ADICIONAR COLUNA DESCRIPTION NA TABELA AGENCIES
DO $$
BEGIN
    -- Verificar se a coluna description existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'description' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.agencies ADD COLUMN description TEXT DEFAULT '';
        RAISE NOTICE '✅ Coluna description adicionada à tabela agencies';
    ELSE
        RAISE NOTICE '✅ Coluna description já existe na tabela agencies';  
    END IF;
END $$;

-- 2. RECRIAR FUNÇÃO get_user_agencies CORRIGIDA
DROP FUNCTION IF EXISTS public.get_user_agencies() CASCADE;

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
    a.owner_uid as owner_id,
    'owner'::TEXT as user_role,
    true as is_owner
  FROM public.agencies a
  WHERE a.owner_uid = current_user_id
  
  UNION ALL
  
  -- Retornar agências onde é colaborador
  SELECT 
    a.id,
    a.name,
    COALESCE(a.description, '')::TEXT as description,
    a.owner_uid as owner_id,
    COALESCE(c.role, 'member')::TEXT as user_role,
    false as is_owner
  FROM public.agencies a
  JOIN public.agency_collaborators c ON a.id = c.agency_id
  WHERE c.user_id = current_user_id;
END;
$$;

-- 3. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_user_agencies() TO authenticated;

-- 4. LOG DE SUCESSO
DO $$
BEGIN
    RAISE NOTICE '✅ CORREÇÃO FINALIZADA!';
    RAISE NOTICE '📝 Coluna description adicionada à tabela agencies';
    RAISE NOTICE '🔧 Função get_user_agencies corrigida com owner_uid';
    RAISE NOTICE '🔒 Permissões concedidas';
    RAISE NOTICE '✨ Erro 42703 corrigido!';
END $$;
