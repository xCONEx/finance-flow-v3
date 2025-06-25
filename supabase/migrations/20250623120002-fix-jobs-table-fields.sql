
-- Adicionar campos que estão faltando na tabela jobs para o PricingCalculator funcionar corretamente

-- Adicionar campo 'is_approved' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'is_approved') THEN
        ALTER TABLE public.jobs ADD COLUMN is_approved BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Adicionar campo 'client' se não existir (mantendo client_name também)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'client') THEN
        ALTER TABLE public.jobs ADD COLUMN client TEXT;
    END IF;
END $$;

-- Adicionar campo 'description' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'description') THEN
        ALTER TABLE public.jobs ADD COLUMN description TEXT;
    END IF;
END $$;

-- Adicionar campo 'event_date' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'event_date') THEN
        ALTER TABLE public.jobs ADD COLUMN event_date DATE;
    END IF;
END $$;

-- Adicionar campo 'estimated_hours' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'estimated_hours') THEN
        ALTER TABLE public.jobs ADD COLUMN estimated_hours NUMERIC DEFAULT 1;
    END IF;
END $$;

-- Adicionar campo 'difficulty_level' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'difficulty_level') THEN
        ALTER TABLE public.jobs ADD COLUMN difficulty_level TEXT CHECK (difficulty_level IN ('fácil', 'médio', 'complicado', 'difícil')) DEFAULT 'médio';
    END IF;
END $$;

-- Adicionar campo 'logistics' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'logistics') THEN
        ALTER TABLE public.jobs ADD COLUMN logistics NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Adicionar campo 'equipment' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'equipment') THEN
        ALTER TABLE public.jobs ADD COLUMN equipment NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Adicionar campo 'assistance' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'assistance') THEN
        ALTER TABLE public.jobs ADD COLUMN assistance NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Adicionar campo 'category' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'category') THEN
        ALTER TABLE public.jobs ADD COLUMN category TEXT DEFAULT 'Ensaio Fotográfico';
    END IF;
END $$;

-- Adicionar campo 'discount_value' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'discount_value') THEN
        ALTER TABLE public.jobs ADD COLUMN discount_value NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Adicionar campo 'total_costs' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'total_costs') THEN
        ALTER TABLE public.jobs ADD COLUMN total_costs NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Adicionar campo 'service_value' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'service_value') THEN
        ALTER TABLE public.jobs ADD COLUMN service_value NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Adicionar campo 'value_with_discount' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'value_with_discount') THEN
        ALTER TABLE public.jobs ADD COLUMN value_with_discount NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Adicionar campo 'profit_margin' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'profit_margin') THEN
        ALTER TABLE public.jobs ADD COLUMN profit_margin NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Adicionar campo 'user_id' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'user_id') THEN
        ALTER TABLE public.jobs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Adicionar campo 'agency_id' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'agency_id') THEN
        ALTER TABLE public.jobs ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_agency_id ON public.jobs(agency_id);
CREATE INDEX IF NOT EXISTS idx_jobs_event_date ON public.jobs(event_date);
CREATE INDEX IF NOT EXISTS idx_jobs_is_approved ON public.jobs(is_approved);

-- Atualizar RLS policies para a tabela jobs
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;

-- Recriar políticas RLS
CREATE POLICY "Users can view their own jobs" ON public.jobs
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (agency_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.agency_collaborators 
      WHERE agency_id = jobs.agency_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert their own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs" ON public.jobs
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (agency_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.agency_collaborators 
      WHERE agency_id = jobs.agency_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete their own jobs" ON public.jobs
  FOR DELETE USING (
    auth.uid() = user_id OR 
    (agency_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.agency_collaborators 
      WHERE agency_id = jobs.agency_id AND user_id = auth.uid()
    ))
  );

-- Habilitar RLS na tabela jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Comentário para documentação
COMMENT ON TABLE public.jobs IS 'Tabela para armazenar jobs/trabalhos da calculadora de preços';
