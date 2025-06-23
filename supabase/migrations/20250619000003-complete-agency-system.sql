
-- MIGRAÇÃO COMPLETA DO SISTEMA DE AGÊNCIAS
-- Remove problemas de RLS e implementa sistema completo

-- 1. LIMPAR POLÍTICAS EXISTENTES E RECRIAR SCHEMA
DO $$ 
DECLARE
    pol_name TEXT;
BEGIN
    -- Remover todas as políticas RLS problemáticas
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'agencies' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.agencies CASCADE';
        RAISE NOTICE 'Política removida: %', pol_name;
    END LOOP;
END $$;

-- 2. CORRIGIR INCONSISTÊNCIAS DE SCHEMA
-- Verificar se a coluna owner_id existe, se não, adicionar
DO $$
BEGIN
    -- Verificar se owner_uid existe e owner_id não existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'owner_uid') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'owner_id') THEN
        -- Renomear owner_uid para owner_id
        ALTER TABLE public.agencies RENAME COLUMN owner_uid TO owner_id;
        RAISE NOTICE 'Coluna owner_uid renomeada para owner_id';
    END IF;
    
    -- Se owner_id não existe, criar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'owner_id') THEN
        ALTER TABLE public.agencies ADD COLUMN owner_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Coluna owner_id adicionada';
    END IF;
END $$;

-- 3. DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE public.agencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_collaborators DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_invitations DISABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLÍTICAS RLS SEGURAS

-- Políticas para agencies
CREATE POLICY "admin_agencies_all" ON public.agencies
FOR ALL TO authenticated
USING (
    auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
);

CREATE POLICY "owner_agencies_all" ON public.agencies
FOR ALL TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "collaborator_agencies_read" ON public.agencies
FOR SELECT TO authenticated
USING (
    id IN (
        SELECT agency_id FROM public.agency_collaborators 
        WHERE user_id = auth.uid()
    )
);

-- Políticas para agency_collaborators
CREATE POLICY "admin_collaborators_all" ON public.agency_collaborators
FOR ALL TO authenticated
USING (
    auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
);

CREATE POLICY "agency_owner_collaborators_all" ON public.agency_collaborators
FOR ALL TO authenticated
USING (
    agency_id IN (
        SELECT id FROM public.agencies WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "collaborator_read_own" ON public.agency_collaborators
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Políticas para agency_invitations
CREATE POLICY "admin_invitations_all" ON public.agency_invitations
FOR ALL TO authenticated
USING (
    auth.jwt() ->> 'email' IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com')
);

CREATE POLICY "agency_owner_invitations_all" ON public.agency_invitations
FOR ALL TO authenticated
USING (
    agency_id IN (
        SELECT id FROM public.agencies WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "invitee_read_own" ON public.agency_invitations
FOR SELECT TO authenticated
USING (
    email = auth.jwt() ->> 'email'
);

CREATE POLICY "invitee_update_own" ON public.agency_invitations
FOR UPDATE TO authenticated
USING (
    email = auth.jwt() ->> 'email'
);

-- 5. REABILITAR RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;

-- 6. FUNÇÕES RPC PARA ADMIN

-- Função para admin visualizar todas as empresas
CREATE OR REPLACE FUNCTION public.get_all_companies_admin()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    owner_id UUID,
    owner_email TEXT,
    owner_name TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    collaborators_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_email TEXT;
BEGIN
    current_user_email := auth.jwt() ->> 'email';
    
    -- Verificar se é super admin
    IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
    END IF;

    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        COALESCE(a.description, '')::TEXT as description,
        a.owner_id,
        p.email as owner_email,
        COALESCE(p.name, p.email)::TEXT as owner_name,
        COALESCE(a.status, 'active')::TEXT as status,
        a.created_at,
        COALESCE(collab_count.count, 0) as collaborators_count
    FROM public.agencies a
    JOIN public.profiles p ON a.owner_id = p.id
    LEFT JOIN (
        SELECT 
            agency_id, 
            COUNT(*) as count 
        FROM public.agency_collaborators 
        GROUP BY agency_id
    ) collab_count ON a.id = collab_count.agency_id
    ORDER BY a.created_at DESC;
END;
$$;

-- Função para admin visualizar todos os perfis
CREATE OR REPLACE FUNCTION public.get_all_profiles_for_admin()
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    user_type TEXT,
    agency_id UUID,
    agency_name TEXT,
    role TEXT,
    subscription TEXT,
    banned BOOLEAN,
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
    
    -- Verificar se é super admin
    IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        COALESCE(p.name, '')::TEXT as name,
        COALESCE(p.user_type::TEXT, 'individual') as user_type,
        p.agency_id,
        COALESCE(a.name, '')::TEXT as agency_name,
        COALESCE(p.role::TEXT, 'viewer') as role,
        COALESCE(p.subscription::TEXT, 'free') as subscription,
        COALESCE(p.banned, false) as banned,
        p.created_at
    FROM public.profiles p
    LEFT JOIN public.agencies a ON p.agency_id = a.id
    ORDER BY p.created_at DESC;
END;
$$;

-- Função para admin atualizar perfil
CREATE OR REPLACE FUNCTION public.admin_update_profile(
    target_user_id UUID,
    new_user_type TEXT DEFAULT NULL,
    new_subscription TEXT DEFAULT NULL,
    new_banned BOOLEAN DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_email TEXT;
    result JSON;
BEGIN
    current_user_email := auth.jwt() ->> 'email';
    
    -- Verificar se é super admin
    IF current_user_email NOT IN ('yuriadrskt@gmail.com', 'adm.financeflow@gmail.com') THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
    END IF;

    -- Atualizar apenas campos não nulos
    UPDATE public.profiles SET
        user_type = COALESCE(new_user_type::user_type, user_type),
        subscription = COALESCE(new_subscription::subscription_type, subscription),
        banned = COALESCE(new_banned, banned),
        updated_at = now()
    WHERE id = target_user_id;

    SELECT json_build_object(
        'success', true,
        'message', 'Perfil atualizado com sucesso'
    ) INTO result;

    RETURN result;
END;
$$;

-- 7. FUNÇÕES RPC PARA AGÊNCIAS

-- Função para obter agências do usuário
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
BEGIN
    RETURN QUERY
    -- Agências que o usuário possui
    SELECT 
        a.id,
        a.name,
        COALESCE(a.description, '')::TEXT as description,
        a.owner_id,
        'owner'::TEXT as user_role,
        true as is_owner
    FROM public.agencies a
    WHERE a.owner_id = auth.uid()
    
    UNION ALL
    
    -- Agências onde o usuário é colaborador
    SELECT 
        a.id,
        a.name,
        COALESCE(a.description, '')::TEXT as description,
        a.owner_id,
        COALESCE(ac.role, 'member')::TEXT as user_role,
        false as is_owner
    FROM public.agencies a
    JOIN public.agency_collaborators ac ON a.id = ac.agency_id
    WHERE ac.user_id = auth.uid()
    
    ORDER BY is_owner DESC, name ASC;
END;
$$;

-- Função para criar agência
CREATE OR REPLACE FUNCTION public.create_agency(
    agency_name TEXT,
    agency_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_agency_id UUID;
    result JSON;
BEGIN
    -- Inserir nova agência
    INSERT INTO public.agencies (name, description, owner_id, status)
    VALUES (agency_name, agency_description, auth.uid(), 'active')
    RETURNING id INTO new_agency_id;
    
    -- Atualizar perfil do usuário para ser company_owner
    UPDATE public.profiles 
    SET 
        user_type = 'company_owner',
        updated_at = now()
    WHERE id = auth.uid();

    SELECT json_build_object(
        'success', true,
        'agency_id', new_agency_id,
        'message', 'Agência criada com sucesso'
    ) INTO result;

    RETURN result;
END;
$$;

-- Função para convidar colaborador
CREATE OR REPLACE FUNCTION public.invite_collaborator(
    target_agency_id UUID,
    collaborator_email TEXT,
    collaborator_role TEXT DEFAULT 'member'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    target_user_id UUID;
BEGIN
    -- Verificar se o usuário é dono da agência
    IF NOT EXISTS (
        SELECT 1 FROM public.agencies 
        WHERE id = target_agency_id AND owner_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Acesso negado: você não é o dono desta agência';
    END IF;
    
    -- Verificar se o email existe
    SELECT id INTO target_user_id 
    FROM public.profiles 
    WHERE email = collaborator_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado com este email';
    END IF;
    
    -- Verificar se já é colaborador
    IF EXISTS (
        SELECT 1 FROM public.agency_collaborators 
        WHERE agency_id = target_agency_id AND user_id = target_user_id
    ) THEN
        RAISE EXCEPTION 'Usuário já é colaborador desta agência';
    END IF;
    
    -- Criar convite
    INSERT INTO public.agency_invitations (
        agency_id, 
        email, 
        invited_by, 
        role, 
        status,
        invited_at,
        expires_at
    ) VALUES (
        target_agency_id,
        collaborator_email,
        auth.uid(),
        collaborator_role,
        'pending',
        now(),
        now() + INTERVAL '7 days'
    );

    SELECT json_build_object(
        'success', true,
        'message', 'Convite enviado com sucesso'
    ) INTO result;

    RETURN result;
END;
$$;

-- Função para obter convites pendentes
CREATE OR REPLACE FUNCTION public.get_pending_invitations()
RETURNS TABLE (
    id UUID,
    agency_id UUID,
    agency_name TEXT,
    agency_description TEXT,
    invited_by_name TEXT,
    role TEXT,
    invited_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email TEXT;
BEGIN
    user_email := auth.jwt() ->> 'email';
    
    RETURN QUERY
    SELECT 
        i.id,
        i.agency_id,
        a.name as agency_name,
        COALESCE(a.description, '')::TEXT as agency_description,
        COALESCE(p.name, p.email)::TEXT as invited_by_name,
        i.role,
        i.invited_at,
        i.expires_at
    FROM public.agency_invitations i
    JOIN public.agencies a ON i.agency_id = a.id
    JOIN public.profiles p ON i.invited_by = p.id
    WHERE i.email = user_email 
      AND i.status = 'pending' 
      AND i.expires_at > now()
    ORDER BY i.invited_at DESC;
END;
$$;

-- Função para aceitar convite
CREATE OR REPLACE FUNCTION public.accept_agency_invitation(
    invitation_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invitation_record RECORD;
    result JSON;
BEGIN
    -- Buscar convite
    SELECT * INTO invitation_record
    FROM public.agency_invitations
    WHERE id = invitation_id 
      AND email = auth.jwt() ->> 'email'
      AND status = 'pending'
      AND expires_at > now();
    
    IF invitation_record IS NULL THEN
        RAISE EXCEPTION 'Convite não encontrado ou expirado';
    END IF;
    
    -- Adicionar como colaborador
    INSERT INTO public.agency_collaborators (
        agency_id,
        user_id,
        role,
        added_by,
        added_at
    ) VALUES (
        invitation_record.agency_id,
        auth.uid(),
        invitation_record.role,
        invitation_record.invited_by,
        now()
    );
    
    -- Atualizar status do convite
    UPDATE public.agency_invitations
    SET 
        status = 'accepted',
        responded_at = now()
    WHERE id = invitation_id;
    
    -- Atualizar tipo de usuário se necessário
    UPDATE public.profiles 
    SET 
        user_type = CASE 
            WHEN user_type = 'individual' THEN 'employee' 
            ELSE user_type 
        END,
        updated_at = now()
    WHERE id = auth.uid();

    SELECT json_build_object(
        'success', true,
        'message', 'Convite aceito com sucesso'
    ) INTO result;

    RETURN result;
END;
$$;

-- Função para rejeitar convite
CREATE OR REPLACE FUNCTION public.reject_agency_invitation(
    invitation_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    -- Atualizar status do convite
    UPDATE public.agency_invitations
    SET 
        status = 'rejected',
        responded_at = now()
    WHERE id = invitation_id 
      AND email = auth.jwt() ->> 'email'
      AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Convite não encontrado';
    END IF;

    SELECT json_build_object(
        'success', true,
        'message', 'Convite rejeitado com sucesso'
    ) INTO result;

    RETURN result;
END;
$$;

-- 8. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_all_companies_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_profiles_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(UUID, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_agencies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_agency(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_collaborator(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_agency_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_agency_invitation(UUID) TO authenticated;

-- 9. LOG DE SUCESSO
DO $$
BEGIN
    RAISE NOTICE '✅ SISTEMA DE AGÊNCIAS IMPLEMENTADO COMPLETAMENTE!';
    RAISE NOTICE '🔒 RLS configurado corretamente';
    RAISE NOTICE '🔧 Todas as funções RPC criadas';
    RAISE NOTICE '🏢 Sistema de agências pronto para uso';
    RAISE NOTICE '📧 Sistema de convites implementado';
END $$;
