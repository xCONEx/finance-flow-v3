
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

interface AddReserveGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddReserveGoalModal: React.FC<AddReserveGoalModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    icon: ''
  });
  const [loading, setLoading] = useState(false);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Insert into expenses table with special category for reserve goals
      const { error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          description: `[META] ${formData.name} ${formData.icon || '🎯'}`,
          value: parseFloat(formData.target_amount) || 0,
          category: 'Reserva Inteligente',
          month: new Date().toISOString().slice(0, 7)
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Meta de reserva criada com sucesso!",
      });

      onSuccess();
      onClose();
      setFormData({
        name: '',
        target_amount: '',
        icon: ''
      });
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar meta de reserva. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-purple-600">Nova Meta de Reserva</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Defina um novo objetivo para suas economias.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Meta *</Label>
            <Input
              id="name"
              placeholder="Ex: Câmera Nova, Viagem dos Sonhos"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_amount">Valor da Meta (R$) *</Label>
            <Input
              id="target_amount"
              type="number"
              step="0.01"
              placeholder="Ex: 15000"
              value={formData.target_amount}
              onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Ícone (Opcional)</Label>
            <Input
              id="icon"
              placeholder="Ex: 📷, 🏠, ✈️ (Copie e cole um emoji)"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Dica: Use um emoji para identificar sua meta visualmente!
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Meta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddReserveGoalModal;
