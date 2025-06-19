
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  user_type?: string;
}

interface CreateCompanyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserProfile[];
}

const CreateCompanyDialog: React.FC<CreateCompanyDialogProps> = ({
  isOpen,
  onOpenChange,
  users,
}) => {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [selectedOwnerEmail, setSelectedOwnerEmail] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function onCreateCompany(
    name: string,
    ownerEmail: string,
    cnpj: string,
    description: string
  ) {
    setLoading(true);
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', ownerEmail)
        .single();

      if (userError || !user) {
        throw new Error('Usuário proprietário não encontrado');
      }

      const { error } = await supabase.from('agencies').insert([
        {
          name,
          owner_id: user.id,
          cnpj,
          description,
        },
      ]);

      if (error) {
        throw error;
      }

      setNewCompanyName('');
      setSelectedOwnerEmail('');
      setCnpj('');
      setDescription('');
      onOpenChange(false);
    } catch (err: any) {
      alert(`Erro ao criar empresa: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
          <div>
            <label className="text-sm font-medium">CNPJ</label>
            <Input
              placeholder="00.000.000/0000-00"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              maxLength={18}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Descrição</label>
            <Input
              placeholder="Descrição da empresa"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-col md:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={() => onCreateCompany(newCompanyName, selectedOwnerEmail, cnpj, description)} disabled={loading}>
              {loading ? 'Criando...' : 'Criar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCompanyDialog;
