
-- SQL PARA O SISTEMA FINANCEIRO INDEPENDENTE
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de transações financeiras (separada da expenses existente)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    supplier TEXT,
    client_name TEXT,
    work_id TEXT,
    date DATE NOT NULL,
    time TIME,
    is_paid BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar tabela de metas de reserva
CREATE TABLE IF NOT EXISTS public.reserve_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    icon TEXT DEFAULT '🎯',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar tabela de contribuições para metas
CREATE TABLE IF NOT EXISTS public.reserve_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.reserve_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserve_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserve_contributions ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para financial_transactions
DROP POLICY IF EXISTS "users_own_financial_transactions" ON public.financial_transactions;
CREATE POLICY "users_own_financial_transactions" ON public.financial_transactions
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. Políticas RLS para reserve_goals
DROP POLICY IF EXISTS "users_own_reserve_goals" ON public.reserve_goals;
CREATE POLICY "users_own_reserve_goals" ON public.reserve_goals
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 7. Políticas RLS para reserve_contributions
DROP POLICY IF EXISTS "users_own_reserve_contributions" ON public.reserve_contributions;
CREATE POLICY "users_own_reserve_contributions" ON public.reserve_contributions
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 8. Políticas para super admins
DROP POLICY IF EXISTS "super_admin_financial_transactions" ON public.financial_transactions;
CREATE POLICY "super_admin_financial_transactions" ON public.financial_transactions
FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'));

DROP POLICY IF EXISTS "super_admin_reserve_goals" ON public.reserve_goals;
CREATE POLICY "super_admin_reserve_goals" ON public.reserve_goals
FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'));

DROP POLICY IF EXISTS "super_admin_reserve_contributions" ON public.reserve_contributions;
CREATE POLICY "super_admin_reserve_contributions" ON public.reserve_contributions
FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'));

-- 9. Índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_reserve_goals_user_id ON public.reserve_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_reserve_contributions_goal_id ON public.reserve_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_reserve_contributions_user_id ON public.reserve_contributions(user_id);

-- 10. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_financial_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Triggers para updated_at
DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON public.financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at
    BEFORE UPDATE ON public.financial_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_updated_at_column();

DROP TRIGGER IF EXISTS update_reserve_goals_updated_at ON public.reserve_goals;
CREATE TRIGGER update_reserve_goals_updated_at
    BEFORE UPDATE ON public.reserve_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_updated_at_column();

-- 12. Função para atualizar valor atual da meta automaticamente
CREATE OR REPLACE FUNCTION update_reserve_goal_current_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.reserve_goals 
        SET current_amount = current_amount + NEW.amount
        WHERE id = NEW.goal_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.reserve_goals 
        SET current_amount = current_amount - OLD.amount
        WHERE id = OLD.goal_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 13. Trigger para atualizar valor da meta automaticamente
DROP TRIGGER IF EXISTS update_reserve_goal_amount ON public.reserve_contributions;
CREATE TRIGGER update_reserve_goal_amount
    AFTER INSERT OR DELETE ON public.reserve_contributions
    FOR EACH ROW
    EXECUTE FUNCTION update_reserve_goal_current_amount();

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ SISTEMA FINANCEIRO INDEPENDENTE CRIADO COM SUCESSO!';
    RAISE NOTICE '📊 Tabelas criadas: financial_transactions, reserve_goals, reserve_contributions';
    RAISE NOTICE '🔒 RLS configurado para todas as tabelas';
    RAISE NOTICE '⚡ Índices e triggers criados para performance';
    RAISE NOTICE '🎯 Sistema de reserva inteligente funcionando!';
    RAISE NOTICE '🚀 Agora o sistema financeiro é independente da tabela expenses!';
END $$;
