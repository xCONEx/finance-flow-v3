
import React, { useState, useEffect } from 'react';
import { Clock, Calculator, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '../utils/formatters';
import { firestoreService } from '../services/firestore';

const WorkRoutine = () => {
  const { workRoutine, loading } = useAppContext();
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    desiredSalary: 0,
    workDaysPerMonth: 22,
    workHoursPerDay: 8,
    valuePerDay: 0,
    valuePerHour: 0
  });

  useEffect(() => {
    if (workRoutine) {
      setFormData(workRoutine);
    }
  }, [workRoutine]);

  const calculateAndSaveValues = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado.",
        variant: "destructive"
      });
      return;
    }

    const valuePerDay = formData.desiredSalary / formData.workDaysPerMonth;
    const valuePerHour = valuePerDay / formData.workHoursPerDay;
    
    const updatedRoutine = {
      desiredSalary: formData.desiredSalary,
      workDays: formData.workDaysPerMonth,
      dailyHours: formData.workHoursPerDay,
      dalilyValue: valuePerDay,
      valuePerHour: valuePerHour
    };
    
    setFormData({
      ...formData,
      valuePerDay,
      valuePerHour
    });
    
    setSubmitting(true);
    
    try {
      // Salvar no Firebase na estrutura correta
      await firestoreService.updateUserField(user.id, 'routine', updatedRoutine);
      
      toast({
        title: "Rotina Atualizada",
        description: "Os valores foram calculados e salvos com sucesso.",
      });
    } catch (error) {
      console.error('❌ Erro ao salvar rotina:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar rotina de trabalho.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p>Carregando rotina de trabalho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Clock className={`text-${currentTheme.accent}`} />
          Rotina de Trabalho
        </h2>
        <p className="text-gray-600 dark:text-gray-400">Calcule seu valor por hora baseado no salário desejado</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração da Rotina</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="desiredSalary">Salário Desejado (R$/mês)</Label>
              <Input
                id="desiredSalary"
                type="number"
                step="0.01"
                value={formData.desiredSalary}
                onChange={(e) => setFormData({...formData, desiredSalary: Number(e.target.value)})}
                placeholder="8000.00"
                disabled={submitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="workDaysPerMonth">Dias de Trabalho por Mês</Label>
              <Input
                id="workDaysPerMonth"
                type="number"
                value={formData.workDaysPerMonth}
                onChange={(e) => setFormData({...formData, workDaysPerMonth: Number(e.target.value)})}
                placeholder="22"
                disabled={submitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="workHoursPerDay">Horas de Trabalho por Dia</Label>
              <Input
                id="workHoursPerDay"
                type="number"
                value={formData.workHoursPerDay}
                onChange={(e) => setFormData({...formData, workHoursPerDay: Number(e.target.value)})}
                placeholder="8"
                disabled={submitting}
              />
            </div>

            <Button 
              onClick={calculateAndSaveValues} 
              className={`w-full bg-gradient-to-r ${currentTheme.primary}`}
              disabled={submitting}
            >
              <Calculator className="h-4 w-4 mr-2" />
              {submitting ? 'Salvando...' : 'Calcular e Salvar Valores'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className={`bg-gradient-to-br ${currentTheme.secondary} border-${currentTheme.accent}/20`}>
          <CardHeader>
            <CardTitle className={`text-${currentTheme.accent}`}>Resultados Calculados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Valor por Dia</h3>
                <div className={`text-2xl font-bold text-${currentTheme.accent}`}>
                  {formatCurrency(formData.valuePerDay)}
                </div>
              </div>
              
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Valor por Hora</h3>
                <div className={`text-2xl font-bold text-${currentTheme.accent}`}>
                  {formatCurrency(formData.valuePerHour)}
                </div>
              </div>
            </div>

            {formData.valuePerHour > 0 && (
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Resumo:</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>• Salário mensal: {formatCurrency(formData.desiredSalary)}</p>
                  <p>• {formData.workDaysPerMonth} dias de trabalho por mês</p>
                  <p>• {formData.workHoursPerDay} horas por dia</p>
                  <p>• Total de {formData.workDaysPerMonth * formData.workHoursPerDay} horas mensais</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Dicas para Precificação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-semibold mb-2">Use estes valores como base para:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Calcular orçamentos de projetos</li>
                <li>Definir valor mínimo por hora</li>
                <li>Negociar contratos fixos</li>
                <li>Avaliar propostas de clientes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Lembre-se de considerar:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Custos operacionais (equipamentos, softwares)</li>
                <li>Impostos e taxas</li>
                <li>Nível de dificuldade do projeto</li>
                <li>Prazo de entrega</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkRoutine;
