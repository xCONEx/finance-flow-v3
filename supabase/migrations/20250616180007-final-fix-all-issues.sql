
-- LIMPEZA COMPLETA E RECONSTRUÇÃO
-- Esta migração resolve TODOS os problemas de recursão e acesso

-- 1. DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES (limpeza total)
DO $$ 
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.profiles';
    END LOOP;
END $$;

-- 3. REMOVER FUNÇÕES EXISTENTES
DROP FUNCTION IF EXISTS public.get_all_profiles_for_admin();
DROP FUNCTION IF EXISTS public.admin_update_profile(UUID, JSONB);
DROP FUNCTION IF EXISTS public.is_admin_user(UUID);

-- 4. REABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS SIMPLES E SEM RECURSÃO

-- Política para super admins (máxima prioridade)
CREATE POLICY "super_admin_access" ON public.profiles
FOR ALL 
TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
)
WITH CHECK (
  auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
);

-- Política para usuários normais (apenas seus próprios dados)
CREATE POLICY "user_own_data" ON public.profiles
FOR ALL 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. CRIAR FUNÇÃO RPC PARA ADMINS BUSCAREM TODOS OS PERFIS
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
  -- Verificar se é super admin pelo email do JWT
  current_user_email := auth.jwt() ->> 'email';
  
  IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não é super admin';
  END IF;

  -- Retornar todos os perfis (função tem SECURITY DEFINER, então bypassa RLS)
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

-- 7. CRIAR FUNÇÃO RPC PARA ADMINS ATUALIZAREM PERFIS
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  target_user_id UUID,
  update_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_email TEXT;
  result JSONB;
  updated_subscription subscription_type;
  updated_user_type user_type;
  updated_banned BOOLEAN;
  updated_subscription_data JSONB;
BEGIN
  -- Verificar se é super admin pelo email do JWT
  current_user_email := auth.jwt() ->> 'email';
  
  IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não é super admin';
  END IF;

  -- Extrair valores do JSONB com conversão de tipos
  updated_subscription := COALESCE((update_data->>'subscription')::subscription_type, NULL);
  updated_user_type := COALESCE((update_data->>'user_type')::user_type, NULL);
  updated_banned := COALESCE((update_data->>'banned')::BOOLEAN, NULL);
  updated_subscription_data := COALESCE((update_data->'subscription_data'), NULL);

  -- Atualizar perfil (função tem SECURITY DEFINER, então bypassa RLS)
  UPDATE public.profiles 
  SET 
    subscription = COALESCE(updated_subscription, subscription),
    user_type = COALESCE(updated_user_type, user_type),
    banned = COALESCE(updated_banned, banned),
    subscription_data = COALESCE(updated_subscription_data, subscription_data),
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Verificar se a atualização aconteceu
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado: %', target_user_id;
  END IF;

  -- Retornar dados atualizados
  SELECT to_jsonb(p.*) INTO result
  FROM public.profiles p
  WHERE p.id = target_user_id;
  
  RETURN result;
END;
$$;

-- 8. FUNÇÃO RPC PARA BUSCAR PERFIL ESPECÍFICO (PARA SUBSCRIPTION SERVICE)
CREATE OR REPLACE FUNCTION public.get_profile_for_admin(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  subscription subscription_type,
  subscription_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_email TEXT;
BEGIN
  -- Verificar se é super admin pelo email do JWT
  current_user_email := auth.jwt() ->> 'email';
  
  IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não é super admin';
  END IF;

  -- Retornar perfil específico
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.subscription,
    p.subscription_data
  FROM public.profiles p
  WHERE p.id = target_user_id;
END;
$$;

-- 9. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_for_admin(UUID) TO authenticated;

-- 10. VERIFICAR SE O ADMIN PRINCIPAL EXISTE E CRIAR SE NECESSÁRIO
INSERT INTO public.profiles (id, email, name, user_type, subscription, banned, created_at, updated_at)
SELECT 
  '57cfb2d2-2a70-4483-8441-3215d71accfe'::UUID,
  'yuriadrskt@gmail.com',
  'Admin Principal',
  'admin'::user_type,
  'enterprise'::subscription_type,
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'yuriadrskt@gmail.com'
);

-- Garantir que o admin principal tem os dados corretos
UPDATE public.profiles 
SET 
  user_type = 'admin'::user_type,
  subscription = 'enterprise'::subscription_type,
  banned = false,
  updated_at = NOW()
WHERE email = 'yuriadrskt@gmail.com';

-- Comentário de conclusão
COMMENT ON FUNCTION public.get_all_profiles_for_admin() IS 'Função segura para admins buscarem todos os perfis - bypassa RLS com SECURITY DEFINER';
COMMENT ON FUNCTION public.admin_update_profile(UUID, JSONB) IS 'Função segura para admins atualizarem perfis - bypassa RLS com SECURITY DEFINER';
COMMENT ON FUNCTION public.get_profile_for_admin(UUID) IS 'Função segura para admins buscarem perfil específico - bypassa RLS com SECURITY DEFINER';
