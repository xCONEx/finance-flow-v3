
-- Adicionar novos valores ao enum subscription_type
ALTER TYPE subscription_type ADD VALUE 'basic';
ALTER TYPE subscription_type ADD VALUE 'enterprise-annual';

-- Adicionar coluna subscription_data à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN subscription_data JSONB;

-- Atualizar valores padrão se necessário
UPDATE public.profiles 
SET subscription_data = '{}'::jsonb 
WHERE subscription_data IS NULL;
