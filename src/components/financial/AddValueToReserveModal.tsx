
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

interface AddValueToReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal: any;
}

const AddValueToReserveModal: React.FC<AddValueToReserveModalProps> = ({ isOpen, onClose, onSuccess, goal }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const parseGoalData = (description: string) => {
    const parts = description.replace('RESERVE_GOAL: ', '').split(' | ');
    const name = parts[0];
    const target = parseFloat(parts.find(p => p.startsWith('Target:'))?.replace('Target: ', '') || '0');
    const icon = parts.find(p => p.startsWith('Icon:'))?.replace('Icon: ', '') || '🎯';
    const current = parseFloat(parts.find(p => p.startsWith('Current:'))?.replace('Current: ', '') || '0');

    return { name, target, icon, current };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !goal) return;

    setLoading(true);
    try {
      const goalData = parseGoalData(goal.description);
      const newCurrentValue = goalData.current + parseFloat(amount);
      
      // Update the goal with new current value
      const updatedDescription = `RESERVE_GOAL: ${goalData.name} | Target: ${goalData.target} | Icon: ${goalData.icon} | Current: ${newCurrentValue}`;
      
      const { error } = await supabase
        .from('expenses')
        .update({
          description: updatedDescription,
          value: newCurrentValue
        })
        .eq('id', goal.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Valor de R$ ${parseFloat(amount).toFixed(2)} adicionado à meta "${goalData.name}"!`,
      });

      onSuccess();
      onClose();
      setAmount('');
    } catch (error) {
      console.error('Erro ao adicionar valor:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar valor à meta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!goal) return null;

  const goalData = parseGoalData(goal.description);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-purple-600 flex items-center gap-2">
            <span className="text-2xl">{goalData.icon}</span>
            Adicionar Valor - {goalData.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Valor atual: R$ {goalData.current.toFixed(2)} / Meta: R$ {goalData.target.toFixed(2)}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor a Adicionar (R$) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Novo valor:</strong> R$ {(goalData.current + parseFloat(amount || '0')).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Restante para meta:</strong> R$ {Math.max(0, goalData.target - (goalData.current + parseFloat(amount || '0'))).toFixed(2)}
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
              {loading ? 'Adicionando...' : 'Adicionar Valor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddValueToReserveModal;
