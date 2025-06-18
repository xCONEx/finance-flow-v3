
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  UserMinus
} from 'lucide-react';

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
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Colaboradores - {company?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Total: {collaborators.length} colaborador(es)
            </p>
            <Button
              size="sm"
              onClick={() => company && onInviteCollaborator(company)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          </div>
          
          {loadingCollaborators ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Carregando colaboradores...</p>
            </div>
          ) : collaborators.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead className="hidden sm:table-cell">Cargo</TableHead>
                    <TableHead className="hidden md:table-cell">Adicionado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaborators.map((collab) => (
                    <TableRow key={collab.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{collab.email}</p>
                          {collab.name && collab.name !== 'N/A' && (
                            <p className="text-xs text-gray-600">{collab.name}</p>
                          )}
                          <p className="text-xs text-gray-500 sm:hidden">{collab.role}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">
                          {collab.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm">
                          {new Date(collab.added_at).toLocaleDateString('pt-BR')}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onRemoveCollaborator(collab.id, collab.email)}
                          className="p-2"
                          title="Remover colaborador"
                        >
                          <UserMinus className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum colaborador encontrado</p>
              <Button
                className="mt-4"
                onClick={() => company && onInviteCollaborator(company)}
              >
                Adicionar primeiro colaborador
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CollaboratorsDialog;
