
-- MIGRAÇÃO COMPLETA: RECONSTRUÇÃO TOTAL DO RLS E SISTEMA DE AGÊNCIAS
-- Esta migração limpa tudo e reconstrói o sistema do zero

-- 1. BACKUP DE SEGURANÇA DOS DADOS
CREATE TABLE IF NOT EXISTS profiles_backup_final AS 
SELECT * FROM public.profiles;

-- 2. LIMPEZA COMPLETA DE POLÍTICAS E FUNÇÕES
DO $$ 
DECLARE
    pol_name TEXT;
    func_name TEXT;
    table_name TEXT;
BEGIN
    -- Remover todas as políticas RLS de todas as tabelas relevantes
    FOR table_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'agencies', 'agency_collaborators', 'kanban_boards')
    LOOP
        FOR pol_name IN 
            SELECT policyname FROM pg_policies WHERE tablename = table_name AND schemaname = 'public'
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.' || table_name || ' CASCADE';
        END LOOP;
    END LOOP;
    
    -- Remover todas as funções RPC relacionadas
    DROP FUNCTION IF EXISTS public.get_all_profiles_for_admin() CASCADE;
    DROP FUNCTION IF EXISTS public.admin_update_profile(UUID, user_type, subscription_type, BOOLEAN, JSONB) CASCADE;
    DROP FUNCTION IF EXISTS public.get_user_subscription(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.create_agency(TEXT, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.invite_collaborator(UUID, TEXT, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.accept_agency_invitation(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.get_user_agencies(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.get_agency_collaborators(UUID) CASCADE;
    
    RAISE NOTICE 'Limpeza completa realizada - todas as políticas e funções removidas';
END $$;

-- 3. GARANTIR ESTRUTURA DAS TABELAS

-- Verificar e criar colunas necessárias na tabela profiles
DO $$
BEGIN
    -- Adicionar colunas que podem não existir
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_data JSONB DEFAULT '{}';
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type user_type DEFAULT 'individual';
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription subscription_type DEFAULT 'free';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- Criar tabela agencies se não existir
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela agency_collaborators se não existir
CREATE TABLE IF NOT EXISTS public.agency_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    invited_by UUID REFERENCES public.profiles(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency_id, user_id)
);

-- Criar tabela kanban_boards se não existir
CREATE TABLE IF NOT EXISTS public.kanban_boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    board_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Constraint: deve ter user_id OU agency_id, mas não ambos
    CHECK (
        (user_id IS NOT NULL AND agency_id IS NULL) OR 
        (user_id IS NULL AND agency_id IS NOT NULL)
    )
);

-- Criar tabela agency_invitations se não existir
CREATE TABLE IF NOT EXISTS public.agency_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    UNIQUE(agency_id, email)
);

-- 4. INSERIR/ATUALIZAR DADOS DOS SUPER ADMINS
INSERT INTO public.profiles (id, email, name, user_type, subscription, banned, created_at, updated_at, subscription_data)
VALUES 
  ('57cfb2d2-2a70-4483-8441-3215d71accfe'::UUID, 'yuriadrskt@gmail.com', 'Admin Principal', 'admin', 'enterprise', false, NOW(), NOW(), '{"status": "active", "plan": "enterprise"}'),
  (gen_random_uuid(), 'adm.financeflow@gmail.com', 'Admin Secundário', 'admin', 'enterprise', false, NOW(), NOW(), '{"status": "active", "plan": "enterprise"}')
ON CONFLICT (email) DO UPDATE SET
  user_type = 'admin',
  subscription = 'enterprise',
  banned = false,
  updated_at = NOW(),
  subscription_data = '{"status": "active", "plan": "enterprise"}';

-- 5. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR POLÍTICAS RLS SIMPLES E SEGURAS

-- PROFILES: Super admins têm acesso total, usuários só seus dados
CREATE POLICY "super_admin_full_access" ON public.profiles
FOR ALL 
TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
)
WITH CHECK (
  auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
);

CREATE POLICY "users_own_profile" ON public.profiles
FOR ALL 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- AGENCIES: Owners e colaboradores podem ver/editar
CREATE POLICY "agency_owner_access" ON public.agencies
FOR ALL 
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "agency_collaborator_read" ON public.agencies
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT agency_id FROM public.agency_collaborators 
    WHERE user_id = auth.uid()
  )
);

-- AGENCY_COLLABORATORS: Owners podem gerenciar, colaboradores podem ver
CREATE POLICY "agency_collaborator_owner_manage" ON public.agency_collaborators
FOR ALL 
TO authenticated
USING (
  agency_id IN (
    SELECT id FROM public.agencies WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  agency_id IN (
    SELECT id FROM public.agencies WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "agency_collaborator_self_read" ON public.agency_collaborators
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- KANBAN_BOARDS: Individual ou membros da agência
CREATE POLICY "kanban_individual_access" ON public.kanban_boards
FOR ALL 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "kanban_agency_access" ON public.kanban_boards
FOR ALL 
TO authenticated
USING (
  agency_id IS NOT NULL AND (
    -- É owner da agência
    agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid()) OR
    -- É colaborador da agência
    agency_id IN (SELECT agency_id FROM public.agency_collaborators WHERE user_id = auth.uid())
  )
)
WITH CHECK (
  agency_id IS NOT NULL AND (
    agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid()) OR
    agency_id IN (SELECT agency_id FROM public.agency_collaborators WHERE user_id = auth.uid())
  )
);

-- AGENCY_INVITATIONS: Owners podem gerenciar convites
CREATE POLICY "agency_invitation_owner_manage" ON public.agency_invitations
FOR ALL 
TO authenticated
USING (
  agency_id IN (
    SELECT id FROM public.agencies WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  agency_id IN (
    SELECT id FROM public.agencies WHERE owner_id = auth.uid()
  )
);

-- 7. CRIAR FUNÇÕES RPC ADMINISTRATIVAS

-- Função para admins listarem todos os perfis
CREATE OR REPLACE FUNCTION public.get_all_profiles_for_admin()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  subscription subscription_type,
  user_type user_type,
  banned BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  subscription_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_email TEXT;
BEGIN
  -- Verificar se é super admin
  current_user_email := auth.jwt() ->> 'email';
  
  IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não é super admin';
  END IF;

  -- Retornar todos os perfis (função bypassa RLS)
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.name,
    p.subscription,
    p.user_type,
    p.banned,
    p.created_at,
    p.updated_at,
    p.subscription_data
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- Função para admins atualizarem perfis
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  target_user_id UUID,
  new_user_type user_type DEFAULT NULL,
  new_subscription subscription_type DEFAULT NULL,
  new_banned BOOLEAN DEFAULT NULL,
  new_subscription_data JSONB DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  subscription subscription_type,
  user_type user_type,
  banned BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  subscription_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_email TEXT;
  updated_count INTEGER;
BEGIN
  -- Verificar se é super admin
  current_user_email := auth.jwt() ->> 'email';
  
  IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não é super admin';
  END IF;

  -- Atualizar perfil (função bypassa RLS)
  UPDATE public.profiles 
  SET 
    user_type = COALESCE(new_user_type, profiles.user_type),
    subscription = COALESCE(new_subscription, profiles.subscription),
    banned = COALESCE(new_banned, profiles.banned),
    subscription_data = COALESCE(new_subscription_data, profiles.subscription_data),
    updated_at = NOW()
  WHERE profiles.id = target_user_id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count = 0 THEN
    RAISE EXCEPTION 'Usuário não encontrado com ID: %', target_user_id;
  END IF;

  -- Retornar dados atualizados
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.name,
    p.subscription,
    p.user_type,
    p.banned,
    p.created_at,
    p.updated_at,
    p.subscription_data
  FROM public.profiles p
  WHERE p.id = target_user_id;
END;
$$;

-- Função para buscar assinatura de usuário
CREATE OR REPLACE FUNCTION public.get_user_subscription(target_user_id UUID)
RETURNS TABLE (
  subscription subscription_type,
  subscription_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_email TEXT;
  current_user_id UUID;
BEGIN
  -- Pegar dados do usuário atual
  current_user_email := auth.jwt() ->> 'email';
  current_user_id := auth.uid();
  
  -- Verificar se é super admin OU o próprio usuário
  IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') 
     AND current_user_id != target_user_id THEN
    RAISE EXCEPTION 'Acesso negado: só pode ver própria assinatura ou ser admin';
  END IF;

  -- Retornar dados de assinatura
  RETURN QUERY
  SELECT 
    p.subscription,
    p.subscription_data
  FROM public.profiles p
  WHERE p.id = target_user_id;
END;
$$;

-- 8. CRIAR FUNÇÕES RPC PARA SISTEMA DE AGÊNCIAS

-- Função para criar agência
CREATE OR REPLACE FUNCTION public.create_agency(
  agency_name TEXT,
  agency_description TEXT DEFAULT NULL
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
  new_agency_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Criar agência
  INSERT INTO public.agencies (name, description, owner_id)
  VALUES (agency_name, agency_description, current_user_id)
  RETURNING agencies.id INTO new_agency_id;

  -- Retornar dados da agência criada
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.description,
    a.owner_id,
    a.created_at
  FROM public.agencies a
  WHERE a.id = new_agency_id;
END;
$$;

-- Função para convidar colaborador
CREATE OR REPLACE FUNCTION public.invite_collaborator(
  target_agency_id UUID,
  collaborator_email TEXT,
  collaborator_role TEXT DEFAULT 'member'
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
  current_user_id UUID;
  is_owner BOOLEAN;
  new_invitation_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar se é owner da agência
  SELECT COUNT(*) > 0 INTO is_owner
  FROM public.agencies 
  WHERE id = target_agency_id AND owner_id = current_user_id;
  
  IF NOT is_owner THEN
    RAISE EXCEPTION 'Acesso negado: apenas owners podem convidar colaboradores';
  END IF;

  -- Criar convite
  INSERT INTO public.agency_invitations (agency_id, email, invited_by)
  VALUES (target_agency_id, collaborator_email, current_user_id)
  RETURNING agency_invitations.id INTO new_invitation_id;

  -- Retornar dados do convite
  RETURN QUERY
  SELECT 
    i.id,
    i.agency_id,
    i.email,
    i.status,
    i.created_at
  FROM public.agency_invitations i
  WHERE i.id = new_invitation_id;
END;
$$;

-- Função para aceitar convite
CREATE OR REPLACE FUNCTION public.accept_agency_invitation(invitation_id UUID)
RETURNS TABLE (
  id UUID,
  agency_id UUID,
  user_id UUID,
  role TEXT,
  joined_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
  invitation_record RECORD;
  new_collaborator_id UUID;
BEGIN
  current_user_id := auth.uid();
  current_user_email := auth.jwt() ->> 'email';
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Buscar convite
  SELECT * INTO invitation_record
  FROM public.agency_invitations
  WHERE id = invitation_id 
    AND email = current_user_email 
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF invitation_record IS NULL THEN
    RAISE EXCEPTION 'Convite não encontrado, expirado ou já usado';
  END IF;

  -- Adicionar como colaborador
  INSERT INTO public.agency_collaborators (agency_id, user_id, invited_by)
  VALUES (invitation_record.agency_id, current_user_id, invitation_record.invited_by)
  RETURNING agency_collaborators.id INTO new_collaborator_id;

  -- Marcar convite como aceito
  UPDATE public.agency_invitations 
  SET status = 'accepted' 
  WHERE id = invitation_id;

  -- Retornar dados do colaborador
  RETURN QUERY
  SELECT 
    c.id,
    c.agency_id,
    c.user_id,
    c.role,
    c.joined_at
  FROM public.agency_collaborators c
  WHERE c.id = new_collaborator_id;
END;
$$;

-- Função para listar agências do usuário
CREATE OR REPLACE FUNCTION public.get_user_agencies(target_user_id UUID DEFAULT NULL)
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
  target_user_id := COALESCE(target_user_id, current_user_id);
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Só pode ver próprias agências (exceto super admins)
  IF target_user_id != current_user_id AND 
     auth.jwt() ->> 'email' NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  -- Retornar agências onde é owner
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.description,
    a.owner_id,
    'owner'::TEXT as user_role,
    true as is_owner
  FROM public.agencies a
  WHERE a.owner_id = target_user_id
  
  UNION ALL
  
  -- Retornar agências onde é colaborador
  SELECT 
    a.id,
    a.name,
    a.description,
    a.owner_id,
    c.role as user_role,
    false as is_owner
  FROM public.agencies a
  JOIN public.agency_collaborators c ON a.id = c.agency_id
  WHERE c.user_id = target_user_id;
END;
$$;

-- 9. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(UUID, user_type, subscription_type, BOOLEAN, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_agency(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_collaborator(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_agency_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_agencies(UUID) TO authenticated;

-- 10. COMENTÁRIOS E LOGS FINAIS
COMMENT ON FUNCTION public.get_all_profiles_for_admin() IS 'Lista todos os perfis - acesso apenas para super admins';
COMMENT ON FUNCTION public.admin_update_profile(UUID, user_type, subscription_type, BOOLEAN, JSONB) IS 'Atualiza perfil de usuário - acesso apenas para super admins';
COMMENT ON FUNCTION public.get_user_subscription(UUID) IS 'Busca assinatura de usuário - acesso para próprio usuário ou super admins';
COMMENT ON FUNCTION public.create_agency(TEXT, TEXT) IS 'Cria nova agência - usuário vira owner';
COMMENT ON FUNCTION public.invite_collaborator(UUID, TEXT, TEXT) IS 'Convida colaborador para agência - apenas owners';
COMMENT ON FUNCTION public.accept_agency_invitation(UUID) IS 'Aceita convite de agência';
COMMENT ON FUNCTION public.get_user_agencies(UUID) IS 'Lista agências do usuário (owner + colaborador)';

-- Log de finalização
DO $$
BEGIN
  RAISE NOTICE '✅ MIGRAÇÃO COMPLETA FINALIZADA COM SUCESSO';
  RAISE NOTICE '🔧 Sistema RLS reconstruído do zero';
  RAISE NOTICE '👮 Funções administrativas funcionais';
  RAISE NOTICE '🏢 Sistema de agências implementado';
  RAISE NOTICE '📋 Kanban individual/empresa preparado';
  RAISE NOTICE '📊 AdminPanel deve estar funcionando';
END $$;

-- Limpar backup se tudo deu certo
DROP TABLE IF EXISTS profiles_backup_final;
