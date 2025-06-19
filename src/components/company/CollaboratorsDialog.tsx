import React, { useEffect, useState } from 'react';
import CollaboratorsDialog from './CollaboratorsDialog'; // seu componente que você enviou
import { supabase } from '@/lib/supabaseClient'; // ajuste o caminho conforme seu projeto

interface Company {
  id: string;
  name: string;
  owner_id: string;
  owner_email: string;
  owner_name?: string;
  status: string;
  created_at: string;
  collaborators_count: number;
}

interface Collaborator {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  role: string;
  added_at: string;
}

const CollaboratorsDialogContainer: React.FC<{ company: Company | null }> = ({ company }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar colaboradores sem admins
  const fetchCollaborators = async () => {
    if (!company) return;
    setLoadingCollaborators(true);
    setError(null);

    const { data, error } = await supabase
      .rpc('get_company_collaborators_no_admins', { company_uuid: company.id });

    if (error) {
      setError('Erro ao buscar colaboradores: ' + error.message);
      setCollaborators([]);
    } else {
      setCollaborators(data || []);
    }

    setLoadingCollaborators(false);
  };

  // Atualiza lista toda vez que abrir o diálogo
  useEffect(() => {
    if (isOpen && company) {
      fetchCollaborators();
    }
  }, [isOpen, company]);

  // Simulação da função para remover colaborador
  const onRemoveCollaborator = async (collaboratorId: string, email: string) => {
    // Aqui você pode colocar a lógica real para remover colaborador no banco
    if (!confirm(`Confirmar remoção do colaborador ${email}?`)) return;

    // Exemplo de remoção (ajuste conforme seu esquema)
    const { error } = await supabase
      .from('collaborators')
      .delete()
      .eq('id', collaboratorId);

    if (error) {
      alert('Erro ao remover colaborador: ' + error.message);
    } else {
      alert('Colaborador removido');
      fetchCollaborators(); // Recarrega lista
    }
  };

  // Simulação da função para convidar colaborador
  const onInviteCollaborator = (company: Company) => {
    alert(`Abrir modal para convidar colaborador na empresa ${company.name}`);
    // Aqui você pode abrir modal/form para convidar colaborador
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Ver colaboradores
      </button>

      <CollaboratorsDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        company={company}
        collaborators={collaborators}
        loadingCollaborators={loadingCollaborators}
        onRemoveCollaborator={onRemoveCollaborator}
        onInviteCollaborator={onInviteCollaborator}
      />

      {error && <p className="text-red-600 mt-2">{error}</p>}
    </>
  );
};

export default CollaboratorsDialogContainer;
