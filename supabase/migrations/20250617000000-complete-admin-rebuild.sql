
-- MIGRAÇÃO COMPLETA: RECONSTRUÇÃO TOTAL DO SISTEMA DE ADMIN
-- Esta migração remove TUDO e reconstrói com arquitetura segura

-- 1. LIMPAR COMPLETAMENTE TUDO
DO $$ 
DECLARE
    pol_name TEXT;
    func_name TEXT;
BEGIN
    -- Remover todas as políticas da tabela profiles
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.profiles CASCADE';
    END LOOP;
    
    -- Remover todas as funções relacionadas a admin
    DROP FUNCTION IF EXISTS public.get_all_profiles_for_admin() CASCADE;
    DROP FUNCTION IF EXISTS public.admin_update_profile(UUID, JSONB) CASCADE;
    DROP FUNCTION IF EXISTS public.get_profile_for_admin(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.is_admin_user(UUID) CASCADE;
    
    RAISE NOTICE 'Limpeza completa realizada';
END $$;

-- 2. DESABILITAR RLS TEMPORARIAMENTE PARA CONFIGURAÇÃO
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. GARANTIR QUE OS ADMINS EXISTAM NA TABELA
INSERT INTO public.profiles (id, email, name, user_type, subscription, banned, created_at, updated_at)
VALUES 
  ('57cfb2d2-2a70-4483-8441-3215d71accfe'::UUID, 'yuriadrskt@gmail.com', 'Admin Principal', 'admin', 'enterprise', false, NOW(), NOW()),
  (gen_random_uuid(), 'adm.financeflow@gmail.com', 'Admin Secundário', 'admin', 'enterprise', false, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  user_type = 'admin',
  subscription = 'enterprise',
  banned = false,
  updated_at = NOW();

-- 4. REABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS SIMPLES E SEGURAS

-- Política 1: Super Admins têm acesso total (usando email do JWT)
CREATE POLICY "super_admin_full_access" ON public.profiles
FOR ALL 
TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
)
WITH CHECK (
  auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
);

-- Política 2: Usuários normais só veem seus próprios dados
CREATE POLICY "users_own_profile" ON public.profiles
FOR ALL 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. CRIAR FUNÇÕES RPC SEGURAS PARA ADMINISTRAÇÃO

-- Função para listar todos os perfis (somente admins)
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
  -- Verificar se é super admin usando o email do JWT
  current_user_email := auth.jwt() ->> 'email';
  
  IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não é super admin';
  END IF;

  -- Retornar todos os perfis (função tem SECURITY DEFINER, bypassa RLS)
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

-- Função para buscar perfil específico por UUID (somente admins)
CREATE OR REPLACE FUNCTION public.get_profile_by_id(target_user_id UUID)
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
  -- Verificar se é super admin usando o email do JWT
  current_user_email := auth.jwt() ->> 'email';
  
  IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não é super admin';
  END IF;

  -- Retornar perfil específico
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

-- Função para atualizar perfil (somente admins)
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
  -- Verificar se é super admin usando o email do JWT
  current_user_email := auth.jwt() ->> 'email';
  
  IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não é super admin';
  END IF;

  -- Atualizar perfil (função tem SECURITY DEFINER, bypassa RLS)
  UPDATE public.profiles 
  SET 
    user_type = COALESCE(new_user_type, profiles.user_type),
    subscription = COALESCE(new_subscription, profiles.subscription),
    banned = COALESCE(new_banned, profiles.banned),
    subscription_data = COALESCE(new_subscription_data, profiles.subscription_data),
    updated_at = NOW()
  WHERE profiles.id = target_user_id;
  
  -- Verificar se a atualização aconteceu
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

-- Função para buscar assinatura de usuário específico (para subscription service)
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

-- 7. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(UUID, user_type, subscription_type, BOOLEAN, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription(UUID) TO authenticated;

-- 8. ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON FUNCTION public.get_all_profiles_for_admin() IS 'Lista todos os perfis - acesso apenas para super admins';
COMMENT ON FUNCTION public.get_profile_by_id(UUID) IS 'Busca perfil específico por UUID - acesso apenas para super admins';
COMMENT ON FUNCTION public.admin_update_profile(UUID, user_type, subscription_type, BOOLEAN, JSONB) IS 'Atualiza perfil de usuário - acesso apenas para super admins';
COMMENT ON FUNCTION public.get_user_subscription(UUID) IS 'Busca assinatura de usuário - acesso para próprio usuário ou super admins';

-- 9. TESTAR AS FUNÇÕES (logs para debug)
DO $$
BEGIN
  RAISE NOTICE 'Migração completa finalizada - todas as funções RPC criadas com sucesso';
  RAISE NOTICE 'Funções disponíveis:';
  RAISE NOTICE '- get_all_profiles_for_admin()';
  RAISE NOTICE '- get_profile_by_id(uuid)';
  RAISE NOTICE '- admin_update_profile(uuid, user_type, subscription_type, boolean, jsonb)';
  RAISE NOTICE '- get_user_subscription(uuid)';
END $$;
