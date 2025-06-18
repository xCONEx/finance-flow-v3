import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus } from 'lucide-react';

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

interface InviteCollaboratorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onInviteCollaborator: (email: string) => Promise<void>;
}

const InviteCollaboratorDialog: React.FC<InviteCollaboratorDialogProps> = ({
  isOpen,
  onOpenChange,
  company,
  onInviteCollaborator
}) => {
  const [inviteEmail, setInviteEmail] = useState('');

  const handleInvite = async () => {
    await onInviteCollaborator(inviteEmail);
    onOpenChange(false);
    setInviteEmail('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Convidar Colaborador</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Empresa:</p>
            <p className="font-medium">{company?.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Email do Colaborador</label>
            <Input
              type="email"
              placeholder="Digite o email do colaborador"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              O usuário deve estar cadastrado no sistema
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInvite}>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteCollaboratorDialog;
