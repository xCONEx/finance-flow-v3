
-- Desabilitar RLS temporariamente para fazer limpeza
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "super_admin_full_access" ON public.profiles;
DROP POLICY IF EXISTS "users_own_profile_select" ON public.profiles;
DROP POLICY IF EXISTS "users_own_profile_update" ON public.profiles;
DROP POLICY IF EXISTS "users_own_profile_insert" ON public.profiles;
DROP POLICY IF EXISTS "system_admin_access" ON public.profiles;
DROP POLICY IF EXISTS "Allow super admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "System admins can manage all" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "select_own_subscription" ON public.profiles;
DROP POLICY IF EXISTS "update_own_subscription" ON public.profiles;
DROP POLICY IF EXISTS "insert_subscription" ON public.profiles;

-- Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política 1: Super admins têm acesso TOTAL (mais alta prioridade)
CREATE POLICY "super_admin_full_access" ON public.profiles
  FOR ALL USING (
    auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
  );

-- Política 2: Usuários podem ver seus próprios perfis
CREATE POLICY "users_own_profile_select" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
  );

-- Política 3: Usuários podem atualizar seus próprios perfis
CREATE POLICY "users_own_profile_update" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id
  )
  WITH CHECK (
    auth.uid() = id
  );

-- Política 4: Usuários podem inserir seus próprios perfis
CREATE POLICY "users_own_profile_insert" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id
  );

-- Criar função SEGURA para verificar se usuário é admin SEM recursão
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_email TEXT;
  user_type_val user_type;
BEGIN
  -- Primeiro verificar se é super admin por email
  SELECT auth.jwt() ->> 'email' INTO user_email;
  
  IF user_email IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar se é admin regular APENAS com bypass RLS
  SELECT user_type INTO user_type_val 
  FROM public.profiles 
  WHERE id = user_id
  AND user_type = 'admin';
  
  RETURN user_type_val = 'admin';
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;

-- Atualizar função RPC para buscar perfis
CREATE OR REPLACE FUNCTION get_all_profiles_for_admin()
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
AS $$
DECLARE
  current_user_email TEXT;
BEGIN
  -- Verificar se é super admin
  SELECT auth.jwt() ->> 'email' INTO current_user_email;
  
  IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autorizado';
  END IF;

  -- Retornar todos os perfis sem verificação de RLS
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

-- Atualizar função RPC para editar perfis
CREATE OR REPLACE FUNCTION admin_update_profile(
  target_user_id UUID,
  update_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_email TEXT;
  result JSONB;
BEGIN
  -- Verificar se é super admin
  SELECT auth.jwt() ->> 'email' INTO current_user_email;
  
  IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autorizado';
  END IF;

  -- Atualizar perfil diretamente sem verificação de RLS
  UPDATE public.profiles 
  SET 
    subscription = COALESCE((update_data->>'subscription')::subscription_type, subscription),
    user_type = COALESCE((update_data->>'user_type')::user_type, user_type),
    banned = COALESCE((update_data->>'banned')::BOOLEAN, banned),
    subscription_data = COALESCE((update_data->'subscription_data'), subscription_data),
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Retornar dados atualizados
  SELECT to_jsonb(p.*) INTO result
  FROM public.profiles p
  WHERE p.id = target_user_id;
  
  RETURN result;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_all_profiles_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_profile(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user(UUID) TO authenticated;
