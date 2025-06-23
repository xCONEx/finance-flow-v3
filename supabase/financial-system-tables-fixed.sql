
-- Criação das tabelas do sistema financeiro
-- Executar este script no Supabase SQL Editor

-- Verificar se as colunas necessárias existem na tabela expenses
DO $$
BEGIN
    -- Adicionar coluna month se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'expenses' AND column_name = 'month') THEN
        ALTER TABLE expenses ADD COLUMN month VARCHAR(7);
    END IF;
    
    -- Adicionar índices para melhor performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_expenses_user_category') THEN
        CREATE INDEX idx_expenses_user_category ON expenses(user_id, category);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_expenses_description_pattern') THEN
        CREATE INDEX idx_expenses_description_pattern ON expenses USING gin(description gin_trgm_ops);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_expenses_month') THEN
        CREATE INDEX idx_expenses_month ON expenses(month);
    END IF;
END$$;

-- Criar função para atualizar automaticamente o campo month
CREATE OR REPLACE FUNCTION update_expenses_month()
RETURNS TRIGGER AS $$
BEGIN
    NEW.month = to_char(NEW.created_at, 'YYYY-MM');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar month automaticamente
DROP TRIGGER IF EXISTS trigger_update_expenses_month ON expenses;
CREATE TRIGGER trigger_update_expenses_month
    BEFORE INSERT OR UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_expenses_month();

-- Atualizar registros existentes que não têm month
UPDATE expenses 
SET month = to_char(created_at, 'YYYY-MM') 
WHERE month IS NULL;

-- Criar função para buscar transações financeiras com filtros
CREATE OR REPLACE FUNCTION get_financial_transactions(
    p_user_id UUID,
    p_type TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL,
    p_paid_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    description TEXT,
    value DECIMAL,
    category VARCHAR(100),
    month VARCHAR(7),
    created_at TIMESTAMPTZ,
    transaction_type TEXT,
    is_paid BOOLEAN,
    transaction_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.user_id,
        e.description,
        e.value,
        e.category,
        e.month,
        e.created_at,
        CASE 
            WHEN e.description LIKE 'FINANCIAL_INCOME:%' THEN 'income'
            WHEN e.description LIKE 'FINANCIAL_EXPENSE:%' THEN 'expense'
            ELSE 'other'
        END as transaction_type,
        CASE 
            WHEN e.description LIKE '%Paid: true%' THEN true
            ELSE false
        END as is_paid,
        COALESCE(
            (regexp_match(e.description, 'Date: ([0-9]{4}-[0-9]{2}-[0-9]{2})'))[1]::DATE,
            e.created_at::DATE
        ) as transaction_date
    FROM expenses e
    WHERE e.user_id = p_user_id
        AND (e.description LIKE 'FINANCIAL_INCOME:%' OR e.description LIKE 'FINANCIAL_EXPENSE:%')
        AND (p_type IS NULL OR 
             (p_type = 'income' AND e.description LIKE 'FINANCIAL_INCOME:%') OR
             (p_type = 'expense' AND e.description LIKE 'FINANCIAL_EXPENSE:%'))
        AND (p_category IS NULL OR e.category ILIKE '%' || p_category || '%')
        AND (p_date_from IS NULL OR 
             COALESCE(
                (regexp_match(e.description, 'Date: ([0-9]{4}-[0-9]{2}-[0-9]{2})'))[1]::DATE,
                e.created_at::DATE
             ) >= p_date_from)
        AND (p_date_to IS NULL OR 
             COALESCE(
                (regexp_match(e.description, 'Date: ([0-9]{4}-[0-9]{2}-[0-9]{2})'))[1]::DATE,
                e.created_at::DATE
             ) <= p_date_to)
        AND (p_paid_status IS NULL OR
             (p_paid_status = 'paid' AND e.description LIKE '%Paid: true%') OR
             (p_paid_status = 'pending' AND e.description NOT LIKE '%Paid: true%'))
    ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para calcular resumo financeiro
CREATE OR REPLACE FUNCTION get_financial_summary(p_user_id UUID)
RETURNS TABLE (
    total_income DECIMAL,
    total_expenses DECIMAL,
    balance DECIMAL,
    pending_income DECIMAL,
    pending_expenses DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ABS(SUM(CASE WHEN e.description LIKE 'FINANCIAL_INCOME:%' THEN e.value ELSE 0 END)), 0) as total_income,
        COALESCE(SUM(CASE WHEN e.description LIKE 'FINANCIAL_EXPENSE:%' THEN e.value ELSE 0 END), 0) as total_expenses,
        COALESCE(ABS(SUM(CASE WHEN e.description LIKE 'FINANCIAL_INCOME:%' THEN e.value ELSE 0 END)), 0) - 
        COALESCE(SUM(CASE WHEN e.description LIKE 'FINANCIAL_EXPENSE:%' THEN e.value ELSE 0 END), 0) as balance,
        COALESCE(ABS(SUM(CASE WHEN e.description LIKE 'FINANCIAL_INCOME:%' AND e.description NOT LIKE '%Paid: true%' THEN e.value ELSE 0 END)), 0) as pending_income,
        COALESCE(SUM(CASE WHEN e.description LIKE 'FINANCIAL_EXPENSE:%' AND e.description NOT LIKE '%Paid: true%' THEN e.value ELSE 0 END), 0) as pending_expenses
    FROM expenses e
    WHERE e.user_id = p_user_id
        AND (e.description LIKE 'FINANCIAL_INCOME:%' OR e.description LIKE 'FINANCIAL_EXPENSE:%');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para gerenciar metas de reserva
CREATE OR REPLACE FUNCTION get_reserve_goals(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    description TEXT,
    value DECIMAL,
    category VARCHAR(100),
    created_at TIMESTAMPTZ,
    goal_name TEXT,
    target_amount DECIMAL,
    current_amount DECIMAL,
    icon TEXT,
    progress_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.user_id,
        e.description,
        e.value,
        e.category,
        e.created_at,
        (regexp_match(e.description, 'RESERVE_GOAL: ([^|]+)'))[1] as goal_name,
        (regexp_match(e.description, 'Target: ([0-9.]+)'))[1]::DECIMAL as target_amount,
        (regexp_match(e.description, 'Current: ([0-9.]+)'))[1]::DECIMAL as current_amount,
        COALESCE((regexp_match(e.description, 'Icon: ([^|]+)'))[1], '🎯') as icon,
        CASE 
            WHEN (regexp_match(e.description, 'Target: ([0-9.]+)'))[1]::DECIMAL > 0 THEN
                LEAST(
                    ((regexp_match(e.description, 'Current: ([0-9.]+)'))[1]::DECIMAL / 
                     (regexp_match(e.description, 'Target: ([0-9.]+)'))[1]::DECIMAL) * 100,
                    100
                )
            ELSE 0
        END as progress_percentage
    FROM expenses e
    WHERE e.user_id = p_user_id
        AND e.category = 'Meta de Reserva'
        AND e.description LIKE 'RESERVE_GOAL:%'
    ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que as políticas RLS estão corretas
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Recriar políticas se necessário
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
CREATE POLICY "Users can view own expenses" ON expenses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
CREATE POLICY "Users can insert own expenses" ON expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
CREATE POLICY "Users can update own expenses" ON expenses
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
CREATE POLICY "Users can delete own expenses" ON expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION get_financial_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION get_financial_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_reserve_goals TO authenticated;

-- Habilitar extensão trigram para busca de texto
CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMIT;
