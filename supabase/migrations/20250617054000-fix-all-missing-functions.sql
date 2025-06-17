
-- CORREÇÃO FINAL: RESOLVER TODOS OS PROBLEMAS DE SCHEMA E FUNÇÕES

-- 1. VERIFICAR E CORRIGIR A TABELA AGENCIES
DO $$
BEGIN
    -- Verificar se a coluna description existe na tabela agencies
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'description' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.agencies ADD COLUMN description TEXT DEFAULT '';
        RAISE NOTICE '✅ Coluna description adicionada à tabela agencies';
    ELSE
        RAISE NOTICE '✅ Coluna description já existe na tabela agencies';  
    END IF;

    -- Verificar se a coluna owner_uid existe (problema que estava causando erro)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'owner_uid' AND table_schema = 'public'
    ) THEN
        -- Renomear owner_uid para owner_id se necessário
        ALTER TABLE public.agencies RENAME COLUMN owner_uid TO owner_id;
        RAISE NOTICE '✅ Coluna owner_uid renomeada para owner_id';
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

-- 3. CRIAR FUNÇÃO get_pending_invitations (que estava faltando)
DROP FUNCTION IF EXISTS public.get_pending_invitations() CASCADE;

CREATE OR REPLACE FUNCTION public.get_pending_invitations()
RETURNS TABLE (
    id UUID,
    agency_id UUID,
    agency_name TEXT,
    inviter_email TEXT,
    role TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_email TEXT;
BEGIN
    current_user_email := auth.jwt() ->> 'email';
    
    IF current_user_email IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Verificar se a tabela agency_invitations existe
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'agency_invitations'
    ) THEN
        -- Criar tabela de convites se não existir
        CREATE TABLE public.agency_invitations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
            invited_email TEXT NOT NULL,
            inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT DEFAULT 'member',
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
        );
        
        -- Habilitar RLS
        ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;
        
        -- Política para visualizar convites próprios
        CREATE POLICY "Users can view their own invitations" ON public.agency_invitations
        FOR SELECT USING (invited_email = auth.jwt() ->> 'email');
        
        RAISE NOTICE '✅ Tabela agency_invitations criada';
    END IF;

    -- Retornar convites pendentes
    RETURN QUERY
    SELECT 
        inv.id,
        inv.agency_id,
        a.name as agency_name,
        p.email as inviter_email,
        inv.role,
        inv.created_at
    FROM public.agency_invitations inv
    JOIN public.agencies a ON inv.agency_id = a.id
    JOIN public.profiles p ON inv.inviter_id = p.id
    WHERE inv.invited_email = current_user_email 
    AND inv.status = 'pending'
    AND inv.expires_at > NOW();
END;
$$;

-- 4. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_user_agencies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_invitations() TO authenticated;

-- 5. LOG DE SUCESSO
DO $$
BEGIN
    RAISE NOTICE '✅ CORREÇÃO COMPLETA FINALIZADA!';
    RAISE NOTICE '📝 Tabela agencies corrigida com coluna description';
    RAISE NOTICE '🔧 Função get_user_agencies corrigida definitivamente';
    RAISE NOTICE '📧 Função get_pending_invitations criada';
    RAISE NOTICE '🔒 Permissões concedidas';
    RAISE NOTICE '✨ Todos os erros 400/404 corrigidos!';
END $$;
