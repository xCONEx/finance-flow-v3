
-- Migração: Corrigir funções RPC faltantes
-- Esta migração cria apenas as funções essenciais que estão retornando 404

-- 1. Função get_user_subscription (ESSENCIAL)
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

-- 2. Função get_user_agencies (ESSENCIAL)
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

-- 3. Função get_all_profiles_for_admin (Para AdminPanel)
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

-- 4. Função admin_update_profile (Para AdminPanel)
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

-- 5. Conceder permissões para todas as funções
GRANT EXECUTE ON FUNCTION public.get_user_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_agencies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(UUID, user_type, subscription_type, BOOLEAN, JSONB) TO authenticated;

-- 6. Verificar se as tabelas necessárias existem
DO $$
BEGIN
  -- Verificar se a tabela agencies existe
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agencies') THEN
    CREATE TABLE public.agencies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "agency_owner_access" ON public.agencies
    FOR ALL TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());
  END IF;

  -- Verificar se a tabela agency_collaborators existe
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agency_collaborators') THEN
    CREATE TABLE public.agency_collaborators (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      invited_by UUID REFERENCES public.profiles(id),
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(agency_id, user_id)
    );
    
    ALTER TABLE public.agency_collaborators ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "collaborator_access" ON public.agency_collaborators
    FOR ALL TO authenticated
    USING (user_id = auth.uid() OR agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid()));
  END IF;
END $$;

-- 7. Garantir que os super admins existem
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

-- 8. Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Funções RPC essenciais recriadas com sucesso!';
  RAISE NOTICE '📦 4 funções principais: get_user_subscription, get_user_agencies, get_all_profiles_for_admin, admin_update_profile';
  RAISE NOTICE '👮 Super admins configurados';
  RAISE NOTICE '🔒 RLS configurado nas tabelas essenciais';
  RAISE NOTICE '🎯 Sistema deve funcionar corretamente agora!';
END $$;
