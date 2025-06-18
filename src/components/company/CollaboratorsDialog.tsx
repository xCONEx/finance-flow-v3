
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Trash2, User } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  owner_uid: string;
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

interface CollaboratorsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  collaborators: Collaborator[];
  loadingCollaborators: boolean;
  onRemoveCollaborator: (collaboratorId: string, email: string) => Promise<void>;
  onInviteCollaborator: (company: Company) => void;
}

const CollaboratorsDialog: React.FC<CollaboratorsDialogProps> = ({
  isOpen,
  onOpenChange,
  company,
  collaborators,
  loadingCollaborators,
  onRemoveCollaborator,
  onInviteCollaborator
}) => {
  if (!company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Colaboradores - {company.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {collaborators.length} colaborador{collaborators.length !== 1 ? 'es' : ''}
            </p>
            <Button
              size="sm"
              onClick={() => onInviteCollaborator(company)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>

          {loadingCollaborators ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando colaboradores...</p>
            </div>
          ) : collaborators.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum colaborador encontrado</p>
              <p className="text-sm text-gray-400 mt-2">
                Adicione pessoas para colaborar nesta empresa
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-white"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-gray-100 rounded-full flex-shrink-0">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{collaborator.email}</p>
                      {collaborator.name && collaborator.name !== 'N/A' && (
                        <p className="text-sm text-gray-600 truncate">{collaborator.name}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Adicionado em {new Date(collaborator.added_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline">{collaborator.role}</Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onRemoveCollaborator(collaborator.id, collaborator.email)}
                      className="p-2"
                      title="Remover colaborador"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CollaboratorsDialog;
