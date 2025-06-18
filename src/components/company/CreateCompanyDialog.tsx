
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  user_type?: string;
}

interface CreateCompanyDialogProps {
  users: UserProfile[];
  onCreateCompany: (name: string, ownerEmail: string) => Promise<void>;
}

const CreateCompanyDialog: React.FC<CreateCompanyDialogProps> = ({
  users,
  onCreateCompany
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [selectedOwnerEmail, setSelectedOwnerEmail] = useState('');

  const handleCreate = async () => {
    await onCreateCompany(newCompanyName, selectedOwnerEmail);
    setIsOpen(false);
    setNewCompanyName('');
    setSelectedOwnerEmail('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Nova Empresa</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Criar Nova Empresa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nome da Empresa</label>
            <Input
              placeholder="Digite o nome da empresa"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Proprietário</label>
            <Select value={selectedOwnerEmail} onValueChange={setSelectedOwnerEmail}>
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
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>
              Criar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCompanyDialog;
