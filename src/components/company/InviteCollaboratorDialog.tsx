
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const [email, setEmail] = useState('');

  const handleInvite = async () => {
    if (email.trim()) {
      await onInviteCollaborator(email);
      setEmail('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Convidar Colaborador</DialogTitle>
        </DialogHeader>
        {company && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Empresa: <span className="font-medium">{company.name}</span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Email do Colaborador</label>
              <Input
                type="email"
                placeholder="Digite o email do colaborador"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col md:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleInvite} disabled={!email.trim()}>
                Convidar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteCollaboratorDialog;
