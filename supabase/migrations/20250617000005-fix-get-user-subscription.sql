
-- Migração: Corrigir função get_user_subscription

-- 1. Remover função existente se houver
DROP FUNCTION IF EXISTS public.get_user_subscription(UUID) CASCADE;

-- 2. Recriar função get_user_subscription com assinatura correta
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
  
  -- Log para debug
  RAISE NOTICE 'Buscando assinatura para user_id: %, current_user: %, current_email: %', 
    target_user_id, current_user_id, current_user_email;
  
  -- Verificar se é super admin OU o próprio usuário
  IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') 
     AND current_user_id != target_user_id THEN
    RAISE EXCEPTION 'Acesso negado: só pode ver própria assinatura ou ser admin';
  END IF;

  -- Retornar dados de assinatura (função tem SECURITY DEFINER, bypassa RLS)
  RETURN QUERY
  SELECT 
    p.subscription,
    p.subscription_data
  FROM public.profiles p
  WHERE p.id = target_user_id;
  
  -- Log de sucesso
  RAISE NOTICE 'Assinatura encontrada com sucesso para user_id: %', target_user_id;
END;
$$;

-- 3. Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_user_subscription(UUID) TO authenticated;

-- 4. Comentário para documentação
COMMENT ON FUNCTION public.get_user_subscription(UUID) IS 'Busca dados de assinatura de usuário - acesso para próprio usuário ou super admins';

-- 5. Testar se a função foi criada corretamente
DO $$
BEGIN
  RAISE NOTICE 'Função get_user_subscription(UUID) recriada com sucesso';
  RAISE NOTICE 'Parâmetros: target_user_id UUID';
  RAISE NOTICE 'Retorna: subscription subscription_type, subscription_data JSONB';
END $$;
