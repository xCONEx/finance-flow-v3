import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PiggyBank, Plus, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import AddReserveGoalModal from './AddReserveGoalModal';

interface ReserveGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  icon: string;
  created_at: string;
}

const SmartReserve: React.FC = () => {
  const [goals, setGoals] = useState<ReserveGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const loadGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: 'SELECT * FROM reserve_goals WHERE user_id = $1 ORDER BY created_at DESC',
        params: [user.id]
      });

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return target > 0 ? Math.min((current / target) * 100, 100) : 0;
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
          Nova Meta
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
              {loading ? 'Carregando...' : 'Clique em "+ Nova Meta" para começar a planejar seus sonhos!'}
            </p>
            <Button onClick={() => setShowAddGoalModal(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <Card key={goal.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-2xl">{goal.icon}</span>
                  {goal.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{getProgressPercentage(goal.current_amount, goal.target_amount).toFixed(1)}%</span>
                  </div>
                  <Progress value={getProgressPercentage(goal.current_amount, goal.target_amount)} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Valor Atual</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(goal.current_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Meta</span>
                    <span className="font-semibold">
                      {formatCurrency(goal.target_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Restante</span>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(Math.max(0, goal.target_amount - goal.current_amount))}
                    </span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  disabled
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Valor
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal para Adicionar Meta */}
      <AddReserveGoalModal
        isOpen={showAddGoalModal}
        onClose={() => setShowAddGoalModal(false)}
        onSuccess={loadGoals}
      />
    </div>
  );
};

export default SmartReserve;
