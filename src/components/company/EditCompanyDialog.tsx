
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface Company {
  id: string;
  name: string;
  owner_id: string; // CORRIGIDO: usar owner_id conforme schema SQL
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
  const [editName, setEditName] = useState('');
  const [editOwnerEmail, setEditOwnerEmail] = useState('');

  useEffect(() => {
    if (company) {
      setEditName(company.name);
      setEditOwnerEmail(company.owner_email);
    }
  }, [company]);

  const handleEdit = async () => {
    await onEditCompany(editName, editOwnerEmail);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nome da Empresa</label>
            <Input
              placeholder="Digite o nome da empresa"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Proprietário</label>
            <Select value={editOwnerEmail} onValueChange={setEditOwnerEmail}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o proprietário" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.email}>
                    {user.email} {user.name && `(${user.name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col md:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCompanyDialog;
