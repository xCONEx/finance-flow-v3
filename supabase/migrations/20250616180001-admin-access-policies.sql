
-- Criar política para permitir que super admins vejam todos os profiles
CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
  );

-- Criar política para permitir que super admins atualizem todos os profiles
CREATE POLICY "Super admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
  );

-- Criar política para permitir que admins no sistema vejam todos os profiles
CREATE POLICY "Admin users can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Criar política para permitir que admins no sistema atualizem todos os profiles
CREATE POLICY "Admin users can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );
