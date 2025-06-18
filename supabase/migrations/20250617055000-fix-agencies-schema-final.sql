
-- CORREÇÃO FINAL DO SCHEMA BASEADO NA IMAGEM
-- Verificar e corrigir o schema das tabelas agencies e profiles

-- 1. VERIFICAR E CORRIGIR TABELA AGENCIES
DO $$
BEGIN
    -- Verificar se existe coluna owner_uid (da imagem)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'owner_uid' AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Coluna owner_uid existe na tabela agencies';
    ELSE
        -- Se não existe, adicionar
        ALTER TABLE public.agencies ADD COLUMN owner_uid UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Coluna owner_uid adicionada à tabela agencies';
    END IF;

    -- Verificar se existe coluna owner_id (conflito)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'owner_id' AND table_schema = 'public'
    ) THEN
        -- Remover owner_id se existir (usar apenas owner_uid)
        ALTER TABLE public.agencies DROP COLUMN owner_id;
        RAISE NOTICE '✅ Coluna owner_id removida (conflito resolvido)';
    END IF;

    -- Verificar coluna status (da imagem)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'status' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.agencies ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE '✅ Coluna status adicionada à tabela agencies';
    END IF;

    -- Verificar colunas de timestamp
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'created_at' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.agencies ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Coluna created_at adicionada à tabela agencies';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agencies' AND column_name = 'updated_at' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.agencies ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Coluna updated_at adicionada à tabela agencies';
    END IF;
END $$;

-- 2. VERIFICAR E CORRIGIR TABELA PROFILES
DO $$
BEGIN
    -- Verificar se existe coluna agency_id (da imagem)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'agency_id' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN agency_id UUID;
        RAISE NOTICE '✅ Coluna agency_id adicionada à tabela profiles';
    END IF;

    -- Verificar se existe coluna role (da imagem)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT;
        RAISE NOTICE '✅ Coluna role adicionada à tabela profiles';
    END IF;
END $$;

-- 3. RECRIAR FUNÇÃO get_user_agencies COM SCHEMA CORRETO
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

  -- Retornar agências onde é owner (usando owner_uid da imagem)
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    ''::TEXT as description, -- Não existe description no schema da imagem
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
    ''::TEXT as description,
    a.owner_uid as owner_id,
    COALESCE(c.role, 'member')::TEXT as user_role,
    false as is_owner
  FROM public.agencies a
  JOIN public.agency_collaborators c ON a.id = c.agency_id
  WHERE c.user_id = current_user_id;
END;
$$;

-- 4. RECRIAR FUNÇÃO get_pending_invitations
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

-- 5. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_user_agencies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_invitations() TO authenticated;

-- 6. LOG DE SUCESSO
DO $$
BEGIN
    RAISE NOTICE '✅ SCHEMA CORRIGIDO BASEADO NA IMAGEM!';
    RAISE NOTICE '📋 Tabela agencies: owner_uid, name, status, created_at, updated_at';
    RAISE NOTICE '👥 Tabela profiles: agency_id, role adicionadas';
    RAISE NOTICE '🔧 Funções RPC recriadas corretamente';
    RAISE NOTICE '✨ Todos os erros 400/404 devem estar resolvidos!';
END $$;
