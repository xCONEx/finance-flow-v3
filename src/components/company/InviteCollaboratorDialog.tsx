
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return;
    }

    try {
      setLoading(true);
      await onInviteCollaborator(email.trim());
      onOpenChange(false);
      setEmail('');
    } catch (error) {
      console.error('❌ Erro ao convidar colaborador:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setEmail('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Convidar Colaborador
            {company && (
              <span className="block text-sm font-normal text-gray-500 mt-1">
                Para: {company.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collaborator-email">Email do Colaborador</Label>
            <Input
              id="collaborator-email"
              type="email"
              placeholder="Digite o email do colaborador"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !email.trim()}
            >
              {loading ? 'Convidando...' : 'Enviar Convite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteCollaboratorDialog;
