
-- Tabela para transações financeiras (entradas e saídas)
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

-- Tabela para metas de reserva inteligente
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

-- Tabela para histórico de contribuições para metas de reserva
CREATE TABLE IF NOT EXISTS public.reserve_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.reserve_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserve_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserve_contributions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para financial_transactions
DROP POLICY IF EXISTS "users_own_transactions" ON public.financial_transactions;
CREATE POLICY "users_own_transactions" ON public.financial_transactions
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Políticas RLS para reserve_goals
DROP POLICY IF EXISTS "users_own_goals" ON public.reserve_goals;
CREATE POLICY "users_own_goals" ON public.reserve_goals
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Políticas RLS para reserve_contributions
DROP POLICY IF EXISTS "users_own_contributions" ON public.reserve_contributions;
CREATE POLICY "users_own_contributions" ON public.reserve_contributions
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_reserve_goals_user_id ON public.reserve_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_reserve_contributions_goal_id ON public.reserve_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_reserve_contributions_user_id ON public.reserve_contributions(user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON public.financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at
    BEFORE UPDATE ON public.financial_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reserve_goals_updated_at ON public.reserve_goals;
CREATE TRIGGER update_reserve_goals_updated_at
    BEFORE UPDATE ON public.reserve_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar o valor atual da meta quando há contribuições
CREATE OR REPLACE FUNCTION update_goal_current_amount()
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

-- Trigger para atualizar valor da meta automaticamente
DROP TRIGGER IF EXISTS update_goal_amount ON public.reserve_contributions;
CREATE TRIGGER update_goal_amount
    AFTER INSERT OR DELETE ON public.reserve_contributions
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_current_amount();

-- Política de acesso para super admins
DROP POLICY IF EXISTS "super_admin_full_access_transactions" ON public.financial_transactions;
CREATE POLICY "super_admin_full_access_transactions" ON public.financial_transactions
FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'));

DROP POLICY IF EXISTS "super_admin_full_access_goals" ON public.reserve_goals;
CREATE POLICY "super_admin_full_access_goals" ON public.reserve_goals
FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'));

DROP POLICY IF EXISTS "super_admin_full_access_contributions" ON public.reserve_contributions;
CREATE POLICY "super_admin_full_access_contributions" ON public.reserve_contributions
FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'));

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ SISTEMA FINANCEIRO CONFIGURADO COM SUCESSO!';
    RAISE NOTICE '📊 Tabelas criadas: financial_transactions, reserve_goals, reserve_contributions';
    RAISE NOTICE '🔒 RLS configurado para todas as tabelas';
    RAISE NOTICE '⚡ Índices e triggers criados para performance';
    RAISE NOTICE '🎯 Sistema de reserva inteligente pronto!';
END $$;
