
-- Atualizar a função RPC para ser mais robusta
DROP FUNCTION IF EXISTS get_all_profiles_for_admin();
DROP FUNCTION IF EXISTS admin_update_profile(UUID, JSONB);

-- Função para obter todos os perfis (apenas para admins)
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
DECLARE
  current_user_email TEXT;
BEGIN
  -- Obter o email do usuário atual
  current_user_email := auth.jwt() ->> 'email';
  
  -- Verificar se é super admin
  IF current_user_email IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
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
    RETURN;
  END IF;
  
  -- Verificar se é admin no sistema (sem causar recursão)
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
    RETURN;
  END IF;
  
  -- Caso não seja admin, lançar erro
  RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
END;
$$;

-- Função para admins atualizarem profiles
CREATE OR REPLACE FUNCTION admin_update_profile(
  target_user_id UUID,
  update_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_email TEXT;
BEGIN
  -- Obter o email do usuário atual
  current_user_email := auth.jwt() ->> 'email';
  
  -- Verificar se é super admin ou admin do sistema
  IF current_user_email IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') OR
     EXISTS (
       SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND user_type = 'admin'
     ) THEN
    
    -- Atualizar o profile com campos opcionais
    UPDATE public.profiles 
    SET 
      subscription = CASE 
        WHEN update_data ? 'subscription' THEN (update_data->>'subscription')::subscription_type
        ELSE subscription
      END,
      user_type = CASE 
        WHEN update_data ? 'user_type' THEN (update_data->>'user_type')::user_type
        ELSE user_type
      END,
      banned = CASE 
        WHEN update_data ? 'banned' THEN (update_data->>'banned')::BOOLEAN
        ELSE banned
      END,
      subscription_data = CASE 
        WHEN update_data ? 'subscription_data' THEN update_data->'subscription_data'
        ELSE subscription_data
      END,
      updated_at = NOW()
    WHERE id = target_user_id;
    
    RETURN FOUND;
  ELSE
    RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
  END IF;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION get_all_profiles_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_profile(UUID, JSONB) TO authenticated;
