import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PiggyBank, Plus, Target, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePrivacy } from '@/contexts/PrivacyContext';
import AddReserveGoalModal from './AddReserveGoalModal';
import AddValueToReserveModal from './AddValueToReserveModal';

interface ReserveGoal {
  id: string;
  user_id: string;
  description: string;
  value: number;
  category: string;
  created_at: string;
}

const SmartReserve: React.FC = () => {
  const [goals, setGoals] = useState<ReserveGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showAddValueModal, setShowAddValueModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<ReserveGoal | null>(null);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { formatValue } = usePrivacy();

  const loadGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', 'Meta de Reserva')
        .ilike('description', 'RESERVE_GOAL:%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, [user]);

  const parseGoalData = (description: string) => {
    const parts = description.replace('RESERVE_GOAL: ', '').split(' | ');
    const name = parts[0];
    const target = parseFloat(parts.find(p => p.startsWith('Target:'))?.replace('Target: ', '') || '0');
    const icon = parts.find(p => p.startsWith('Icon:'))?.replace('Icon: ', '') || '🎯';
    const current = parseFloat(parts.find(p => p.startsWith('Current:'))?.replace('Current: ', '') || '0');

    return { name, target, icon, current };
  };

  const getProgressPercentage = (current: number, target: number) => {
    return target > 0 ? Math.min((current / target) * 100, 100) : 0;
  };

  const handleAddValue = (goal: ReserveGoal) => {
    setSelectedGoal(goal);
    setShowAddValueModal(true);
  };

  const handleDeleteGoal = async (goal: ReserveGoal) => {
    if (!confirm('Tem certeza que deseja excluir esta meta de reserva?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', goal.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Meta de reserva excluída com sucesso!",
      });

      loadGoals();
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir meta. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <PiggyBank className="h-6 w-6 text-purple-600" />
            Reserva Inteligente
          </h2>
          <p className="text-muted-foreground">
            Crie suas "caixinhas" de economia e acompanhe o progresso para alcançar seus objetivos financeiros.
          </p>
        </div>
        <Button onClick={() => setShowAddGoalModal(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Nova Meta</span>
          <span className="sm:hidden">Meta</span>
        </Button>
      </div>

      {/* Lista de Metas */}
      {goals.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma meta de reserva criada ainda.</h3>
            <p className="text-muted-foreground text-center mb-4">
              Clique em "+ Nova Meta" para começar a planejar seus sonhos!
            </p>
            <Button onClick={() => setShowAddGoalModal(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const goalData = parseGoalData(goal.description);
            return (
              <Card key={goal.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="text-2xl">{goalData.icon}</span>
                      {goalData.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGoal(goal)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span>{getProgressPercentage(goalData.current, goalData.target).toFixed(1)}%</span>
                    </div>
                    <Progress value={getProgressPercentage(goalData.current, goalData.target)} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Valor Atual</span>
                      <span className="font-semibold text-green-600">
                        {formatValue(goalData.current)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Meta</span>
                      <span className="font-semibold">
                        {formatValue(goalData.target)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Restante</span>
                      <span className="font-semibold text-orange-600">
                        {formatValue(Math.max(0, goalData.target - goalData.current))}
                      </span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleAddValue(goal)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Valor
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modais */}
      <AddReserveGoalModal
        isOpen={showAddGoalModal}
        onClose={() => setShowAddGoalModal(false)}
        onSuccess={loadGoals}
      />
      <AddValueToReserveModal
        isOpen={showAddValueModal}
        onClose={() => setShowAddValueModal(false)}
        onSuccess={loadGoals}
        goal={selectedGoal}
      />
    </div>
  );
};

export default SmartReserve;
