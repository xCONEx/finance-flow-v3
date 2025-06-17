
-- Migração: Políticas RLS simples e seguras

-- 1. Limpar todas as políticas existentes da tabela profiles
DO $$ 
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.profiles CASCADE';
    END LOOP;
    
    RAISE NOTICE 'Todas as políticas RLS removidas';
END $$;

-- 2. Desabilitar RLS temporariamente
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Garantir que os admins existam
INSERT INTO public.profiles (id, email, name, user_type, subscription, banned, created_at, updated_at)
VALUES 
  ('57cfb2d2-2a70-4483-8441-3215d71accfe'::UUID, 'yuriadrskt@gmail.com', 'Admin Principal', 'admin', 'enterprise', false, NOW(), NOW()),
  (gen_random_uuid(), 'adm.financeflow@gmail.com', 'Admin Secundário', 'admin', 'enterprise', false, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  user_type = 'admin',
  subscription = 'enterprise',
  banned = false,
  updated_at = NOW();

-- 4. Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Criar política simples para super admins (usando email direto)
CREATE POLICY "super_admin_full_access" ON public.profiles
FOR ALL 
TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
)
WITH CHECK (
  auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
);

-- 6. Criar política para usuários normais (apenas próprios dados)
CREATE POLICY "users_own_profile" ON public.profiles
FOR ALL 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Log de finalização
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS simples criadas com sucesso';
END $$;
