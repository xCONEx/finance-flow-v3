

-- Primeiro, remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON public.profiles;

-- Recriar políticas com abordagem mais direta para super admins
CREATE POLICY "Allow super admin full access" ON public.profiles
  FOR ALL USING (
    auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
  );

-- Política para usuários normais verem apenas seus próprios dados
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
  );

-- Política para usuários normais atualizarem apenas seus próprios dados
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id 
    OR auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
  );

-- Política para inserção de novos perfis
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id 
    OR auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
  );

-- Política para admins regulares do sistema
CREATE POLICY "System admins can manage all" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
    OR auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
  );

-- Criar função RPC para contornar RLS se necessário
CREATE OR REPLACE FUNCTION get_all_profiles_admin(admin_email TEXT)
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
BEGIN
  -- Verificar se o email é um super admin autorizado
  IF admin_email IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
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
  ELSE
    RAISE EXCEPTION 'Acesso negado: usuário não autorizado';
  END IF;
END;
$$;

-- Garantir que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION get_all_profiles_admin(TEXT) TO authenticated;

