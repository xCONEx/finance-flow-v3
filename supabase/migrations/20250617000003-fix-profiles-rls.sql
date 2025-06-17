
-- Migração: Corrigir TODAS as políticas RLS da tabela profiles

-- 1. Remover TODAS as políticas existentes da tabela profiles
DO $$ 
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.profiles CASCADE';
        RAISE NOTICE 'Política removida: %', pol_name;
    END LOOP;
    
    RAISE NOTICE 'Todas as políticas RLS da tabela profiles foram removidas';
END $$;

-- 2. Desabilitar RLS temporariamente para limpeza
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Garantir que os admins estejam na tabela
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

-- 5. Criar política simples para super admins (usando email direto do JWT)
CREATE POLICY "super_admin_full_access" ON public.profiles
FOR ALL 
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'yuriadrskt@gmail.com' OR 
  auth.jwt() ->> 'email' = 'adm.financeflow@gmail.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'yuriadrskt@gmail.com' OR 
  auth.jwt() ->> 'email' = 'adm.financeflow@gmail.com'
);

-- 6. Criar política para usuários normais (apenas próprios dados)
CREATE POLICY "users_own_profile" ON public.profiles
FOR ALL 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 7. Política para leitura de perfis públicos (para funcionalidades específicas)
CREATE POLICY "public_profile_read" ON public.profiles
FOR SELECT 
TO authenticated
USING (true);

-- 8. Log de finalização
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS da tabela profiles recriadas com sucesso:';
  RAISE NOTICE '- super_admin_full_access: acesso total para super admins';
  RAISE NOTICE '- users_own_profile: usuários só veem próprios dados';
  RAISE NOTICE '- public_profile_read: leitura pública para funcionalidades específicas';
END $$;
