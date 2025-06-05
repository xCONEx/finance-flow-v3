
import React, { useState, useEffect } from 'react';
import { Clock, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '../contexts/AppContext';
import { toast } from '@/hooks/use-toast';

const WorkRoutine = () => {
  const { workRoutine, updateWorkRoutine } = useAppContext();
  const [formData, setFormData] = useState(workRoutine);

  useEffect(() => {
    setFormData(workRoutine);
  }, [workRoutine]);

  const calculateValues = () => {
    const valuePerDay = formData.desiredSalary / formData.workDaysPerMonth;
    const valuePerHour = valuePerDay / formData.workHoursPerDay;
    
    const updatedRoutine = {
      ...formData,
      valuePerDay,
      valuePerHour
    };
    
    setFormData(updatedRoutine);
    updateWorkRoutine(updatedRoutine);
    
    toast({
      title: "Rotina Atualizada",
      description: "Os valores foram calculados e salvos com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Clock className="text-purple-600" />
          Rotina de Trabalho
        </h2>
        <p className="text-gray-600">Calcule seu valor por hora baseado no salário desejado</p>
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
              />
            </div>

            <Button onClick={calculateValues} className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Calcular Valores
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-800">Resultados Calculados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-white rounded-lg border border-purple-200">
                <h3 className="font-semibold text-gray-700 mb-2">Valor por Dia</h3>
                <div className="text-2xl font-bold text-purple-600">
                  R$ {formData.valuePerDay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-purple-200">
                <h3 className="font-semibold text-gray-700 mb-2">Valor por Hora</h3>
                <div className="text-2xl font-bold text-purple-600">
                  R$ {formData.valuePerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {formData.valuePerHour > 0 && (
              <div className="p-4 bg-white rounded-lg border border-purple-200">
                <h4 className="font-semibold text-gray-700 mb-2">Resumo:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Salário mensal: R$ {formData.desiredSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
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
                <li>Margem de lucro desejada</li>
                <li>Complexidade do projeto</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkRoutine;
