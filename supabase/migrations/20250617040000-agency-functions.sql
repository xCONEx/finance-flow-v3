
-- FASE 4: FUNCIONALIDADES DE AGÊNCIA
-- Implementar funções para criar agências, convidar colaboradores e aceitar convites

-- 1. CRIAR TABELA DE CONVITES SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS public.agency_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    role TEXT NOT NULL DEFAULT 'member',
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    responded_at TIMESTAMPTZ,
    UNIQUE(agency_id, invited_email)
);

-- 2. HABILITAR RLS NA TABELA DE CONVITES
ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS RLS PARA AGENCY_INVITATIONS

-- Owners podem gerenciar convites de suas agências
CREATE POLICY "owner_manage_invitations" ON public.agency_invitations
FOR ALL TO authenticated
USING (agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid()))
WITH CHECK (agency_id IN (SELECT id FROM public.agencies WHERE owner_id = auth.uid()));

-- Usuários podem ver convites enviados para eles
CREATE POLICY "user_view_own_invitations" ON public.agency_invitations
FOR SELECT TO authenticated
USING (invited_email = auth.jwt() ->> 'email');

-- 4. FUNÇÃO PARA CRIAR AGÊNCIA
CREATE OR REPLACE FUNCTION public.create_agency(
    agency_name TEXT,
    agency_description TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    owner_id UUID,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    new_agency_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Verificar se o usuário pode criar agências (não há limite específico por enquanto)
    INSERT INTO public.agencies (name, description, owner_id)
    VALUES (agency_name, agency_description, current_user_id)
    RETURNING agencies.id INTO new_agency_id;

    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.description,
        a.owner_id,
        a.created_at
    FROM public.agencies a
    WHERE a.id = new_agency_id;
END;
$$;

-- 5. FUNÇÃO PARA CONVIDAR COLABORADOR
CREATE OR REPLACE FUNCTION public.invite_collaborator(
    target_agency_id UUID,
    collaborator_email TEXT,
    collaborator_role TEXT DEFAULT 'member'
)
RETURNS TABLE (
    id UUID,
    agency_name TEXT,
    invited_email TEXT,
    role TEXT,
    invited_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    is_owner BOOLEAN;
    invitation_id UUID;
    agency_name_result TEXT;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Verificar se o usuário é owner da agência
    SELECT COUNT(*) > 0, a.name INTO is_owner, agency_name_result
    FROM public.agencies a
    WHERE a.id = target_agency_id AND a.owner_id = current_user_id
    GROUP BY a.name;

    IF NOT is_owner THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é owner desta agência';
    END IF;

    -- Verificar se o email já foi convidado ou já é colaborador
    IF EXISTS (
        SELECT 1 FROM public.agency_invitations 
        WHERE agency_id = target_agency_id AND invited_email = collaborator_email AND status = 'pending'
    ) THEN
        RAISE EXCEPTION 'Usuário já foi convidado para esta agência';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.agency_collaborators ac
        JOIN public.profiles p ON ac.user_id = p.id
        WHERE ac.agency_id = target_agency_id AND p.email = collaborator_email
    ) THEN
        RAISE EXCEPTION 'Usuário já é colaborador desta agência';
    END IF;

    -- Criar convite
    INSERT INTO public.agency_invitations (agency_id, invited_email, invited_by, role)
    VALUES (target_agency_id, collaborator_email, current_user_id, collaborator_role)
    RETURNING agency_invitations.id INTO invitation_id;

    RETURN QUERY
    SELECT 
        inv.id,
        agency_name_result as agency_name,
        inv.invited_email,
        inv.role,
        inv.invited_at,
        inv.expires_at
    FROM public.agency_invitations inv
    WHERE inv.id = invitation_id;
END;
$$;

-- 6. FUNÇÃO PARA ACEITAR CONVITE
CREATE OR REPLACE FUNCTION public.accept_agency_invitation(
    invitation_id UUID
)
RETURNS TABLE (
    agency_id UUID,
    agency_name TEXT,
    user_role TEXT,
    joined_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
    invitation_record RECORD;
BEGIN
    current_user_id := auth.uid();
    current_user_email := auth.jwt() ->> 'email';
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Buscar convite válido
    SELECT inv.*, a.name as agency_name
    INTO invitation_record
    FROM public.agency_invitations inv
    JOIN public.agencies a ON inv.agency_id = a.id
    WHERE inv.id = invitation_id 
    AND inv.invited_email = current_user_email
    AND inv.status = 'pending'
    AND inv.expires_at > NOW();

    IF invitation_record IS NULL THEN
        RAISE EXCEPTION 'Convite não encontrado, expirado ou já utilizado';
    END IF;

    -- Verificar se já é colaborador
    IF EXISTS (
        SELECT 1 FROM public.agency_collaborators
        WHERE agency_id = invitation_record.agency_id AND user_id = current_user_id
    ) THEN
        RAISE EXCEPTION 'Usuário já é colaborador desta agência';
    END IF;

    -- Aceitar convite: criar colaborador e marcar convite como aceito
    INSERT INTO public.agency_collaborators (agency_id, user_id, role, invited_by)
    VALUES (invitation_record.agency_id, current_user_id, invitation_record.role, invitation_record.invited_by);

    UPDATE public.agency_invitations
    SET status = 'accepted', responded_at = NOW()
    WHERE id = invitation_id;

    RETURN QUERY
    SELECT 
        invitation_record.agency_id,
        invitation_record.agency_name,
        invitation_record.role as user_role,
        NOW() as joined_at;
END;
$$;

-- 7. FUNÇÃO PARA LISTAR CONVITES PENDENTES DO USUÁRIO
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
    current_user_email TEXT;
BEGIN
    current_user_email := auth.jwt() ->> 'email';
    
    IF current_user_email IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    RETURN QUERY
    SELECT 
        inv.id,
        inv.agency_id,
        a.name as agency_name,
        a.description as agency_description,
        p.name as invited_by_name,
        inv.role,
        inv.invited_at,
        inv.expires_at
    FROM public.agency_invitations inv
    JOIN public.agencies a ON inv.agency_id = a.id
    JOIN public.profiles p ON inv.invited_by = p.id
    WHERE inv.invited_email = current_user_email
    AND inv.status = 'pending'
    AND inv.expires_at > NOW()
    ORDER BY inv.invited_at DESC;
END;
$$;

-- 8. FUNÇÃO PARA REJEITAR CONVITE
CREATE OR REPLACE FUNCTION public.reject_agency_invitation(
    invitation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_email TEXT;
    updated_count INTEGER;
BEGIN
    current_user_email := auth.jwt() ->> 'email';
    
    IF current_user_email IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    UPDATE public.agency_invitations
    SET status = 'rejected', responded_at = NOW()
    WHERE id = invitation_id 
    AND invited_email = current_user_email
    AND status = 'pending';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count > 0;
END;
$$;

-- 9. CONCEDER PERMISSÕES PARA AS NOVAS FUNÇÕES
GRANT EXECUTE ON FUNCTION public.create_agency(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_collaborator(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_agency_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_agency_invitation(UUID) TO authenticated;

-- 10. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_agency_invitations_email_status ON public.agency_invitations(invited_email, status);
CREATE INDEX IF NOT EXISTS idx_agency_invitations_agency_status ON public.agency_invitations(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_agency_invitations_expires ON public.agency_invitations(expires_at) WHERE status = 'pending';

-- 11. LOG DE SUCESSO
DO $$
BEGIN
    RAISE NOTICE '✅ FASE 4 CONCLUÍDA: FUNCIONALIDADES DE AGÊNCIA';
    RAISE NOTICE '🏢 Função create_agency criada';
    RAISE NOTICE '📧 Função invite_collaborator criada';
    RAISE NOTICE '✅ Função accept_agency_invitation criada';
    RAISE NOTICE '📋 Função get_pending_invitations criada';
    RAISE NOTICE '❌ Função reject_agency_invitation criada';
    RAISE NOTICE '🔒 Políticas RLS para convites criadas';
    RAISE NOTICE '🎯 Sistema pronto para Fase 5!';
END $$;
