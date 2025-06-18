
-- CORREÇÃO COMPLETA DO SISTEMA DE AGÊNCIAS E ROLES
-- Esta migração corrige todos os problemas de roles e sincronização

-- 1. CRIAR FUNÇÕES RPC NECESSÁRIAS PARA O AGENCYCONTEXT

-- Função para buscar agências do usuário (tanto como owner quanto colaborador)
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

  -- Retornar agências onde é owner
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    ''::TEXT as description, -- Campo vazio já que não existe na tabela
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

-- Função para buscar convites pendentes
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

    -- Retornar convites pendentes
    RETURN QUERY
    SELECT 
        inv.id,
        inv.agency_id,
        a.name as agency_name,
        p.email as inviter_email,
        'member'::TEXT as role,
        inv.created_at
    FROM public.agency_invitations inv
    JOIN public.agencies a ON inv.agency_id = a.id
    JOIN public.profiles p ON inv.invited_by = p.id
    WHERE inv.email = current_user_email 
    AND inv.status = 'pending'
    AND inv.expires_at > NOW();
END;
$$;

-- 2. FUNÇÃO PARA SINCRONIZAR PERFIL QUANDO USUÁRIO SE TORNA OWNER
CREATE OR REPLACE FUNCTION public.sync_owner_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Atualizar perfil do owner quando agência é criada
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles 
        SET 
            user_type = 'company_owner',
            agency_id = NEW.id,
            role = 'owner',
            updated_at = NOW()
        WHERE id = NEW.owner_uid;
        
        RETURN NEW;
    END IF;
    
    -- Limpar perfil do owner quando agência é deletada
    IF TG_OP = 'DELETE' THEN
        -- Verificar se o usuário ainda tem outras agências
        IF NOT EXISTS (
            SELECT 1 FROM public.agencies 
            WHERE owner_uid = OLD.owner_uid AND id != OLD.id
        ) THEN
            UPDATE public.profiles 
            SET 
                user_type = 'individual',
                agency_id = NULL,
                role = 'viewer',
                updated_at = NOW()
            WHERE id = OLD.owner_uid;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- 3. FUNÇÃO PARA SINCRONIZAR PERFIL QUANDO COLABORADOR É ADICIONADO/REMOVIDO
CREATE OR REPLACE FUNCTION public.sync_collaborator_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Atualizar perfil quando colaborador é adicionado
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles 
        SET 
            agency_id = NEW.agency_id,
            role = NEW.role::agency_role,
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        RETURN NEW;
    END IF;
    
    -- Limpar perfil quando colaborador é removido
    IF TG_OP = 'DELETE' THEN
        -- Verificar se o usuário ainda é colaborador de outras agências
        IF NOT EXISTS (
            SELECT 1 FROM public.agency_collaborators 
            WHERE user_id = OLD.user_id AND id != OLD.id
        ) THEN
            UPDATE public.profiles 
            SET 
                agency_id = NULL,
                role = 'viewer',
                updated_at = NOW()
            WHERE id = OLD.user_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- 4. CRIAR TRIGGERS PARA SINCRONIZAÇÃO AUTOMÁTICA
DROP TRIGGER IF EXISTS sync_owner_profile_trigger ON public.agencies;
CREATE TRIGGER sync_owner_profile_trigger
    AFTER INSERT OR DELETE ON public.agencies
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_owner_profile();

DROP TRIGGER IF EXISTS sync_collaborator_profile_trigger ON public.agency_collaborators;
CREATE TRIGGER sync_collaborator_profile_trigger
    AFTER INSERT OR DELETE ON public.agency_collaborators
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_collaborator_profile();

-- 5. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.get_user_agencies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_invitations() TO authenticated;

-- 6. SINCRONIZAR DADOS EXISTENTES
-- Atualizar owners existentes
UPDATE public.profiles 
SET 
    user_type = 'company_owner',
    agency_id = a.id,
    role = 'owner',
    updated_at = NOW()
FROM public.agencies a
WHERE profiles.id = a.owner_uid;

-- Atualizar colaboradores existentes
UPDATE public.profiles 
SET 
    agency_id = c.agency_id,
    role = c.role::agency_role,
    updated_at = NOW()
FROM public.agency_collaborators c
WHERE profiles.id = c.user_id;

-- 7. LOG DE SUCESSO
DO $$
BEGIN
    RAISE NOTICE '✅ SISTEMA DE AGÊNCIAS CORRIGIDO!';
    RAISE NOTICE '🏢 Funções RPC criadas: get_user_agencies, get_pending_invitations';
    RAISE NOTICE '🔄 Triggers de sincronização criados';
    RAISE NOTICE '👥 Perfis de owners e colaboradores sincronizados';
    RAISE NOTICE '✨ Roles agora funcionam corretamente!';
END $$;
