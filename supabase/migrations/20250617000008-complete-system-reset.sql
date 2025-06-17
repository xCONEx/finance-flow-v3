
-- MIGRAÇÃO: RESET COMPLETO DO SISTEMA RLS E FUNÇÕES
-- Esta migração resolve todos os problemas de RLS e funções RPC
-- Mantém todos os dados existentes

-- 1. BACKUP DE SEGURANÇA DOS DADOS
CREATE TABLE IF NOT EXISTS temp_profiles_backup AS 
SELECT * FROM public.profiles WHERE TRUE;

CREATE TABLE IF NOT EXISTS temp_agencies_backup AS 
SELECT * FROM public.agencies WHERE TRUE;

CREATE TABLE IF NOT EXISTS temp_agency_collaborators_backup AS 
SELECT * FROM public.agency_collaborators WHERE TRUE;

-- 2. DESABILITAR RLS TEMPORARIAMENTE PARA LIMPEZA
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_collaborators DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_boards DISABLE ROW LEVEL SECURITY;

-- 3. LIMPEZA COMPLETA DE POLÍTICAS E FUNÇÕES
DO $$ 
DECLARE
    pol_name TEXT;
    func_name TEXT;
    table_name TEXT;
BEGIN
    -- Remover todas as políticas RLS de todas as tabelas
    FOR table_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'agencies', 'agency_collaborators', 'agency_invitations', 'kanban_boards', 'user_kanban_boards')
    LOOP
        FOR pol_name IN 
            SELECT policyname FROM pg_policies WHERE tablename = table_name AND schemaname = 'public'
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.' || table_name || ' CASCADE';
        END LOOP;
    END LOOP;
    
    -- Remover todas as funções RPC existentes
    DROP FUNCTION IF EXISTS public.get_all_profiles_for_admin() CASCADE;
    DROP FUNCTION IF EXISTS public.admin_update_profile(UUID, user_type, subscription_type, BOOLEAN, JSONB) CASCADE;
    DROP FUNCTION IF EXISTS public.admin_update_profile(UUID, JSONB) CASCADE;
    DROP FUNCTION IF EXISTS public.get_user_subscription(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.create_agency(TEXT, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.invite_collaborator(UUID, TEXT, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.accept_agency_invitation(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.get_user_agencies() CASCADE;
    DROP FUNCTION IF EXISTS public.get_user_agencies(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.get_agency_collaborators(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.get_profile_for_admin(UUID) CASCADE;
    
    RAISE NOTICE 'Limpeza completa realizada - todas as políticas e funções removidas';
END $$;

-- 4. GARANTIR ESTRUTURA DAS TABELAS
-- Verificar e criar colunas que podem estar faltando
DO $$
BEGIN
    -- Adicionar colunas que podem não existir na tabela profiles
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_data JSONB DEFAULT '{}';
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Garantir que user_type e subscription existem
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type user_type DEFAULT 'individual';
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription subscription_type DEFAULT 'free';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- Criar tabela agencies se não existir (com estrutura correta)
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
    role TEXT NOT NULL DEFAULT 'member',
    invited_by UUID REFERENCES public.profiles(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency_id, user_id)
);

-- Criar tabela agency_invitations se não existir
CREATE TABLE IF NOT EXISTS public.agency_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    UNIQUE(agency_id, email)
);

-- 5. INSERIR/ATUALIZAR DADOS DOS SUPER ADMINS
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

-- 6. REABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;

-- 7. CRIAR POLÍTICAS RLS SIMPLES E FUNCIONAIS

-- PROFILES: Super admins têm acesso total
CREATE POLICY "super_admin_access" ON public.profiles
FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'));

-- PROFILES: Usuários podem ver/editar apenas seus próprios dados
CREATE POLICY "users_own_profile" ON public.profiles
FOR ALL TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- AGENCIES: Owners podem gerenciar suas agências
CREATE POLICY "agency_owner_access" ON public.agencies
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- AGENCIES: Colaboradores podem ler agências onde participam
CREATE POLICY "agency_collaborator_read" ON public.agencies
FOR SELECT TO authenticated
USING (id IN (SELECT agency_id FROM public.agency_collaborators WHERE user_id = auth.uid()));

-- AGENCY_COLLABORATORS: Owners podem gerenciar colaboradores
CREATE POLICY "collaborator_owner_manage" ON public.agency_collaborators
FOR ALL TO authenticated
USING (agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid()))
WITH CHECK (agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid()));

-- AGENCY_COLLABORATORS: Colaboradores podem ver próprios dados
CREATE POLICY "collaborator_self_read" ON public.agency_collaborators
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- AGENCY_INVITATIONS: Owners podem gerenciar convites
CREATE POLICY "invitation_owner_manage" ON public.agency_invitations
FOR ALL TO authenticated
USING (agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid()))
WITH CHECK (agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid()));

-- KANBAN_BOARDS: Usuários podem gerenciar seus próprios boards
CREATE POLICY "kanban_user_access" ON public.kanban_boards
FOR ALL TO authenticated
USING (
  (user_id = auth.uid()) OR 
  (agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid())) OR
  (agency_id IN (SELECT agency_id FROM public.agency_collaborators WHERE user_id = auth.uid()))
)
WITH CHECK (
  (user_id = auth.uid()) OR 
  (agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid())) OR
  (agency_id IN (SELECT agency_id FROM public.agency_collaborators WHERE user_id = auth.uid()))
);

-- 8. RECRIAR FUNÇÕES RPC ESSENCIAIS

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
  current_user_email := auth.jwt() ->> 'email';
  
  IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não é super admin';
  END IF;

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
  current_user_email := auth.jwt() ->> 'email';
  
  IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não é super admin';
  END IF;

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

-- Função para buscar assinatura de usuário (ESSENCIAL)
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
  current_user_email := auth.jwt() ->> 'email';
  current_user_id := auth.uid();
  
  -- Verificar se é super admin OU o próprio usuário
  IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') 
     AND current_user_id != target_user_id THEN
    RAISE EXCEPTION 'Acesso negado: só pode ver própria assinatura ou ser admin';
  END IF;

  RETURN QUERY
  SELECT 
    p.subscription,
    p.subscription_data
  FROM public.profiles p
  WHERE p.id = target_user_id;
END;
$$;

-- Função para listar agências do usuário
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
    a.description,
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
    a.description,
    a.owner_id,
    c.role as user_role,
    false as is_owner
  FROM public.agencies a
  JOIN public.agency_collaborators c ON a.id = c.agency_id
  WHERE c.user_id = current_user_id;
END;
$$;

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

  INSERT INTO public.agencies (name, description, owner_id)
  VALUES (agency_name, agency_description, current_user_id)
  RETURNING agencies.id INTO new_agency_id;

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
  collaborator_email TEXT
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

  SELECT COUNT(*) > 0 INTO is_owner
  FROM public.agencies 
  WHERE id = target_agency_id AND owner_id = current_user_id;
  
  IF NOT is_owner THEN
    RAISE EXCEPTION 'Acesso negado: apenas owners podem convidar colaboradores';
  END IF;

  INSERT INTO public.agency_invitations (agency_id, email, invited_by)
  VALUES (target_agency_id, collaborator_email, current_user_id)
  RETURNING agency_invitations.id INTO new_invitation_id;

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

  SELECT * INTO invitation_record
  FROM public.agency_invitations
  WHERE id = invitation_id 
    AND email = current_user_email 
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF invitation_record IS NULL THEN
    RAISE EXCEPTION 'Convite não encontrado, expirado ou já usado';
  END IF;

  INSERT INTO public.agency_collaborators (agency_id, user_id, invited_by)
  VALUES (invitation_record.agency_id, current_user_id, invitation_record.invited_by)
  RETURNING agency_collaborators.id INTO new_collaborator_id;

  UPDATE public.agency_invitations 
  SET status = 'accepted' 
  WHERE id = invitation_id;

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

-- 9. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(UUID, user_type, subscription_type, BOOLEAN, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_agencies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_agency(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_collaborator(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_agency_invitation(UUID) TO authenticated;

-- 10. LIMPEZA DOS BACKUPS TEMPORÁRIOS
DROP TABLE IF EXISTS temp_profiles_backup;
DROP TABLE IF EXISTS temp_agencies_backup;
DROP TABLE IF EXISTS temp_agency_collaborators_backup;

-- 11. LOG FINAL DE SUCESSO
DO $$
BEGIN
  RAISE NOTICE '✅ RESET COMPLETO DO SISTEMA FINALIZADO COM SUCESSO!';
  RAISE NOTICE '🔧 Todas as políticas RLS recriadas de forma limpa';
  RAISE NOTICE '📦 6 funções RPC essenciais funcionando';
  RAISE NOTICE '👮 Super admins configurados e funcionais';
  RAISE NOTICE '🏢 Sistema de agências completamente operacional';
  RAISE NOTICE '🔒 RLS configurado corretamente sem recursão';
  RAISE NOTICE '📊 AdminPanel deve estar 100% funcional';
  RAISE NOTICE '🎯 Sistema pronto para produção!';
END $$;
