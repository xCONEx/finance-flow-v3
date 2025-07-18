
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    cnpj: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  // 1. Adicionar campo de etiquetas pré-definidas
  const TAGS = [
    { label: 'VIP', value: 'vip' },
    { label: 'Recorrente', value: 'recorrente' },
    { label: 'Potencial', value: 'potencial' },
    { label: 'Novo', value: 'novo' },
  ];
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('clients').insert([
        {
          ...formData,
          tags: selectedTags,
          user_id: user.id,
          user_email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Cliente adicionado com sucesso!',
      });

      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        cnpj: '',
        description: '',
      });

      onSuccess();
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar cliente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-lg p-2 sm:p-6">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Nome do cliente"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="cliente@email.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cnpj">CNPJ/CPF</Label>
            <Input
              id="cnpj"
              name="cnpj"
              value={formData.cnpj}
              onChange={handleInputChange}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Endereço completo"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição/Observações</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Informações adicionais sobre o cliente"
              rows={3}
            />
          </div>

          {/* 3. Adicionar UI para seleção de etiquetas antes dos botões */}
          <div>
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {TAGS.map(tag => (
                <button
                  type="button"
                  key={tag.value}
                  className={`px-3 py-1 rounded-full border text-xs transition-all ${selectedTags.includes(tag.value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                  onClick={() => setSelectedTags(tags => tags.includes(tag.value) ? tags.filter(t => t !== tag.value) : [...tags, tag.value])}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adicionando...' : 'Adicionar Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
