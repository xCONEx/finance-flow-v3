
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  user_type?: string;
}

interface EditCompanyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  users: UserProfile[];
  onEditCompany: (name: string, ownerEmail: string) => Promise<void>;
}

const EditCompanyDialog: React.FC<EditCompanyDialogProps> = ({
  isOpen,
  onOpenChange,
  company,
  users,
  onEditCompany
}) => {
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name);
      setOwnerEmail(company.owner_email);
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !ownerEmail.trim()) {
      return;
    }

    try {
      setLoading(true);
      await onEditCompany(name.trim(), ownerEmail.trim());
      onOpenChange(false);
      setName('');
      setOwnerEmail('');
    } catch (error) {
      console.error('❌ Erro ao editar empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    if (company) {
      setName(company.name);
      setOwnerEmail(company.owner_email);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome da Empresa</Label>
            <Input
              id="edit-name"
              type="text"
              placeholder="Digite o nome da empresa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-owner">Proprietário</Label>
            <Select value={ownerEmail} onValueChange={setOwnerEmail} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o proprietário" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.email}>
                    {user.name || user.email} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              disabled={loading || !name.trim() || !ownerEmail.trim()}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCompanyDialog;
