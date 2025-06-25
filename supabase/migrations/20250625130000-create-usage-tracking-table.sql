
-- Criar tabela para rastreamento de uso
CREATE TABLE IF NOT EXISTS user_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('job', 'project')),
  count INTEGER NOT NULL DEFAULT 0,
  reset_date TEXT NOT NULL, -- formato YYYY-MM para reset mensal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para garantir apenas um registro por usuário/tipo/mês
  UNIQUE(user_id, usage_type, reset_date)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_usage_tracking_user_id ON user_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_tracking_reset_date ON user_usage_tracking(reset_date);
CREATE INDEX IF NOT EXISTS idx_user_usage_tracking_user_type_reset ON user_usage_tracking(user_id, usage_type, reset_date);

-- Habilitar RLS
ALTER TABLE user_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Política para usuários só verem seus próprios dados
CREATE POLICY "Users can view own usage tracking" ON user_usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários só modificarem seus próprios dados
CREATE POLICY "Users can modify own usage tracking" ON user_usage_tracking
  FOR ALL USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_usage_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_usage_tracking_updated_at
  BEFORE UPDATE ON user_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage_tracking_updated_at();

-- Função para resetar contadores automaticamente (pode ser chamada por um cron job)
CREATE OR REPLACE FUNCTION reset_monthly_usage_counters()
RETURNS void AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := to_char(NOW(), 'YYYY-MM');  
  
  -- Remove registros de meses anteriores para limpeza
  DELETE FROM user_usage_tracking 
  WHERE reset_date < current_month;
  
  -- Log da limpeza
  RAISE NOTICE 'Limpeza de contadores antigos concluída para o mês %', current_month;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE user_usage_tracking IS 'Tabela para rastrear uso de jobs e projetos por usuário, com reset mensal automático';
COMMENT ON COLUMN user_usage_tracking.usage_type IS 'Tipo de uso: job ou project';
COMMENT ON COLUMN user_usage_tracking.reset_date IS 'Formato YYYY-MM para controle de reset mensal';
COMMENT ON COLUMN user_usage_tracking.count IS 'Contador de uso no mês atual';
