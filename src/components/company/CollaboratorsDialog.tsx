
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, UserPlus, Trash2, Users } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  owner_uid: string; // CORRIGIDO: usar owner_uid conforme tipos TypeScript gerados
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
      <DialogContent className="max-w-4xl mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Colaboradores - {company.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Total de colaboradores: {collaborators.length}
            </p>
            <Button
              onClick={() => onInviteCollaborator(company)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Colaborador
            </Button>
          </div>

          {loadingCollaborators ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="ml-2 text-gray-600">Carregando colaboradores...</p>
            </div>
          ) : collaborators.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum colaborador encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Adicionado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaborators.map((collaborator) => (
                    <TableRow key={collaborator.id}>
                      <TableCell className="font-medium">
                        {collaborator.email}
                      </TableCell>
                      <TableCell>
                        {collaborator.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {collaborator.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(collaborator.added_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onRemoveCollaborator(collaborator.id, collaborator.email)}
                          className="p-2"
                          title="Remover colaborador"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CollaboratorsDialog;
