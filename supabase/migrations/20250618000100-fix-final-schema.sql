
-- MIGRAÇÃO FINAL: CORRIGIR TODOS OS PROBLEMAS IDENTIFICADOS

-- 1. VERIFICAR E CORRIGIR TABELA EXPENSES
DO $$
BEGIN
    -- Verificar se a tabela expenses existe
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'expenses'
    ) THEN
        CREATE TABLE public.expenses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            value DECIMAL(10,2) NOT NULL,
            month TEXT NOT NULL,
            due_date DATE,
            is_recurring BOOLEAN DEFAULT false,
            installments INTEGER,
            current_installment INTEGER,
            parent_id UUID REFERENCES public.expenses(id),
            notification_enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Habilitar RLS
        ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
        
        -- Política para usuários verem apenas seus próprios dados
        CREATE POLICY "Users can manage their own expenses" ON public.expenses
        FOR ALL USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
        
        RAISE NOTICE '✅ Tabela expenses criada com sucesso';
    ELSE
        -- Adicionar colunas que podem estar faltando
        ALTER TABLE public.expenses 
        ADD COLUMN IF NOT EXISTS due_date DATE,
        ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS installments INTEGER,
        ADD COLUMN IF NOT EXISTS current_installment INTEGER,
        ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.expenses(id),
        ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        
        RAISE NOTICE '✅ Tabela expenses verificada e atualizada';
    END IF;
END $$;

-- 2. VERIFICAR E CORRIGIR TABELA AGENCIES
DO $$
BEGIN
    -- Verificar se a tabela agencies existe
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'agencies'
    ) THEN
        CREATE TABLE public.agencies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            owner_uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Habilitar RLS
        ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE '✅ Tabela agencies criada';
    ELSE
        -- Garantir que usa owner_uid, não owner_id
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'agencies' AND column_name = 'owner_id' AND table_schema = 'public'
        ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'agencies' AND column_name = 'owner_uid' AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.agencies RENAME COLUMN owner_id TO owner_uid;
            RAISE NOTICE '✅ Coluna owner_id renomeada para owner_uid';
        END IF;
        
        RAISE NOTICE '✅ Tabela agencies verificada';
    END IF;
END $$;

-- 3. LIMPAR E RECRIAR FUNÇÃO get_user_agencies SEM COLUNA DESCRIPTION
DROP FUNCTION IF EXISTS public.get_user_agencies() CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_agencies()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  owner_id UUID,
  user_role TEXT,
  is_owner BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Retornar agências onde é owner (SEM coluna description)
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    ''::TEXT as description, -- Campo vazio pois não existe na tabela
    a.owner_uid as owner_id,
    'owner'::TEXT as user_role,
    true as is_owner
  FROM public.agencies a
  WHERE a.owner_uid = current_user_id
  
  UNION ALL
  
  -- Retornar agências onde é colaborador
  SELECT 
    a.id,
    a.name,
    ''::TEXT as description,
    a.owner_uid as owner_id,
    COALESCE(c.role, 'member')::TEXT as user_role,
    false as is_owner
  FROM public.agencies a
  JOIN public.agency_collaborators c ON a.id = c.agency_id
  WHERE c.user_id = current_user_id;
END;
$$;

-- 4. CRIAR FUNÇÃO get_pending_invitations
DROP FUNCTION IF EXISTS public.get_pending_invitations() CASCADE;

CREATE OR REPLACE FUNCTION public.get_pending_invitations()
RETURNS TABLE (
    id UUID,
    agency_id UUID,
    agency_name TEXT,
    inviter_email TEXT,
    role TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_email TEXT;
BEGIN
    current_user_email := auth.jwt() ->> 'email';
    
    IF current_user_email IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Verificar se a tabela agency_invitations existe
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'agency_invitations'
    ) THEN
        -- Criar tabela de convites se não existir
        CREATE TABLE public.agency_invitations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            status TEXT NOT NULL DEFAULT 'pending',
            role TEXT DEFAULT 'member',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
            UNIQUE(agency_id, email)
        );
        
        -- Habilitar RLS
        ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;
        
        -- Política para convites
        CREATE POLICY "invitation_owner_manage" ON public.agency_invitations
        FOR ALL TO authenticated
        USING (agency_id IN (SELECT id FROM public.agencies WHERE owner_uid = auth.uid()))
        WITH CHECK (agency_id IN (SELECT id FROM public.agencies WHERE owner_uid = auth.uid()));
        
        RAISE NOTICE '✅ Tabela agency_invitations criada';
    END IF;

    -- Retornar convites pendentes (função vazia por enquanto)
    RETURN QUERY
    SELECT 
        NULL::UUID as id,
        NULL::UUID as agency_id,
        ''::TEXT as agency_name,
        ''::TEXT as inviter_email,
        ''::TEXT as role,
        NOW() as created_at
    WHERE FALSE; -- Retorna vazio por enquanto
END;
$$;

-- 5. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_user_agencies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_invitations() TO authenticated;

-- 6. APLICAR POLÍTICAS RLS NAS TABELAS
CREATE POLICY IF NOT EXISTS "super_admin_agencies_access" ON public.agencies
FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com'));

CREATE POLICY IF NOT EXISTS "agency_owner_access" ON public.agencies
FOR ALL TO authenticated
USING (owner_uid = auth.uid())
WITH CHECK (owner_uid = auth.uid());

-- 7. LOG DE SUCESSO
DO $$
BEGIN
    RAISE NOTICE '🎉 CORREÇÃO FINAL CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '📋 Tabela expenses: Estrutura corrigida para salvar custos';
    RAISE NOTICE '🏢 Tabela agencies: Schema corrigido (owner_uid)';
    RAISE NOTICE '🔧 Função get_user_agencies: Corrigida sem coluna description';
    RAISE NOTICE '📧 Função get_pending_invitations: Criada (retorna vazio)';
    RAISE NOTICE '🔒 Políticas RLS aplicadas';
    RAISE NOTICE '✅ Todos os erros 400/404 devem estar resolvidos!';
END $$;
