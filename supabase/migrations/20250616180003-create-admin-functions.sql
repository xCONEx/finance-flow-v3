
-- Criar função RPC para admins obterem todos os profiles
CREATE OR REPLACE FUNCTION get_all_profiles_for_admin()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  phone TEXT,
  company TEXT,
  logo_base64 TEXT,
  image_user TEXT,
  user_type user_type,
  subscription subscription_type,
  banned BOOLEAN,
  agency_id UUID,
  role agency_role,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  subscription_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é um super admin autorizado
  IF auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.email,
      p.name,
      p.phone,
      p.company,
      p.logo_base64,
      p.image_user,
      p.user_type,
      p.subscription,
      p.banned,
      p.agency_id,
      p.role,
      p.created_at,
      p.updated_at,
      p.subscription_data
    FROM public.profiles p
    ORDER BY p.created_at DESC;
  ELSE
    -- Verificar se é admin no sistema
    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    ) THEN
      RETURN QUERY
      SELECT 
        p.id,
        p.email,
        p.name,
        p.phone,
        p.company,
        p.logo_base64,
        p.image_user,
        p.user_type,
        p.subscription,
        p.banned,
        p.agency_id,
        p.role,
        p.created_at,
        p.updated_at,
        p.subscription_data
      FROM public.profiles p
      ORDER BY p.created_at DESC;
    ELSE
      RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
    END IF;
  END IF;
END;
$$;

-- Criar função para admins atualizarem profiles
CREATE OR REPLACE FUNCTION admin_update_profile(
  target_user_id UUID,
  update_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é um super admin ou admin do sistema
  IF auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') OR
     EXISTS (
       SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND user_type = 'admin'
     ) THEN
    
    -- Atualizar o profile
    UPDATE public.profiles 
    SET 
      subscription = COALESCE((update_data->>'subscription')::subscription_type, subscription),
      user_type = COALESCE((update_data->>'user_type')::user_type, user_type),
      banned = COALESCE((update_data->>'banned')::BOOLEAN, banned),
      subscription_data = COALESCE(update_data->'subscription_data', subscription_data),
      updated_at = NOW()
    WHERE id = target_user_id;
    
    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
  END IF;
END;
$$;

-- Garantir que as funções podem ser executadas por usuários autenticados
GRANT EXECUTE ON FUNCTION get_all_profiles_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_profile(UUID, JSONB) TO authenticated;
