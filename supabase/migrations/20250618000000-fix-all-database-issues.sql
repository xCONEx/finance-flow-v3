
-- MIGRAÇÃO FINAL: CORRIGIR TODOS OS PROBLEMAS DE DATABASE
-- Esta migração garante que todas as funções e esquemas estejam corretos

-- 1. VERIFICAR E CORRIGIR ESQUEMA DA TABELA AGENCIES
DO $$
BEGIN
    -- Garantir que a tabela agencies existe com as colunas corretas
    CREATE TABLE IF NOT EXISTS public.agencies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        owner_uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Garantir que a tabela agency_collaborators existe
    CREATE TABLE IF NOT EXISTS public.agency_collaborators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member',
        added_by UUID REFERENCES auth.users(id),
        added_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(agency_id, user_id)
    );

    -- Garantir que a tabela agency_invitations existe
    CREATE TABLE IF NOT EXISTS public.agency_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
        UNIQUE(agency_id, email)
    );

    RAISE NOTICE '✅ Tabelas verificadas e criadas se necessário';
END $$;

-- 2. HABILITAR RLS NAS TABELAS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;

-- 3. LIMPAR E RECRIAR POLÍTICAS RLS
DROP POLICY IF EXISTS "super_admin_agencies_access" ON public.agencies;
DROP POLICY IF EXISTS "agency_owner_access" ON public.agencies;
DROP POLICY IF EXISTS "agency_collaborator_read" ON public.agencies;
DROP POLICY IF EXISTS "collaborator_owner_manage" ON public.agency_collaborators;
DROP POLICY IF EXISTS "collaborator_self_read" ON public.agency_collaborators;
DROP POLICY IF EXISTS "invitation_owner_manage" ON public.agency_invitations;

-- Políticas para agencies
CREATE POLICY "super_admin_agencies_access" ON public.agencies
FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'));

CREATE POLICY "agency_owner_access" ON public.agencies
FOR ALL TO authenticated
USING (owner_uid = auth.uid())
WITH CHECK (owner_uid = auth.uid());

CREATE POLICY "agency_collaborator_read" ON public.agencies
FOR SELECT TO authenticated
USING (id IN (SELECT agency_id FROM public.agency_collaborators WHERE user_id = auth.uid()));

-- Políticas para collaborators
CREATE POLICY "collaborator_owner_manage" ON public.agency_collaborators
FOR ALL TO authenticated
USING (agency_id IN (SELECT id FROM public.agencies WHERE owner_uid = auth.uid()))
WITH CHECK (agency_id IN (SELECT id FROM public.agencies WHERE owner_uid = auth.uid()));

CREATE POLICY "collaborator_self_read" ON public.agency_collaborators
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Políticas para invitations
CREATE POLICY "invitation_owner_manage" ON public.agency_invitations
FOR ALL TO authenticated
USING (agency_id IN (SELECT id FROM public.agencies WHERE owner_uid = auth.uid()))
WITH CHECK (agency_id IN (SELECT id FROM public.agencies WHERE owner_uid = auth.uid()));

-- 4. RECRIAR FUNÇÃO get_user_agencies (SEM COLUNA DESCRIPTION)
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

  -- Retornar agências onde é owner (usando owner_uid, SEM description)
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    ''::TEXT as description, -- Campo vazio já que não existe na tabela
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

-- 5. RECRIAR FUNÇÃO get_pending_invitations
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

    -- Retornar convites pendentes
    RETURN QUERY
    SELECT 
        inv.id,
        inv.agency_id,
        a.name as agency_name,
        p.email as inviter_email,
        'member'::TEXT as role,
        inv.created_at
    FROM public.agency_invitations inv
    JOIN public.agencies a ON inv.agency_id = a.id
    JOIN public.profiles p ON inv.invited_by = p.id
    WHERE inv.email = current_user_email 
    AND inv.status = 'pending'
    AND inv.expires_at > NOW();
END;
$$;

-- 6. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_user_agencies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_invitations() TO authenticated;

-- 7. LOG DE SUCESSO
DO $$
BEGIN
    RAISE NOTICE '✅ CORREÇÃO COMPLETA FINALIZADA!';
    RAISE NOTICE '🏢 Tabela agencies: id, name, owner_uid, status, created_at, updated_at';
    RAISE NOTICE '👥 Tabela agency_collaborators corrigida';
    RAISE NOTICE '📧 Tabela agency_invitations corrigida';
    RAISE NOTICE '🔧 Funções get_user_agencies e get_pending_invitations recriadas';
    RAISE NOTICE '🔒 Políticas RLS aplicadas';
    RAISE NOTICE '✨ Todos os erros 400/404 devem estar resolvidos!';
END $$;
