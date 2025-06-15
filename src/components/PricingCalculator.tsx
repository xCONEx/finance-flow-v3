
import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Clock, TrendingUp, Save, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PercentageInput } from '@/components/ui/percentage-input';
import { usePrivacy } from '../contexts/PrivacyContext';
import { useApp } from '../contexts/AppContext';
import { toast } from '@/hooks/use-toast';

interface PricingCalculatorProps {
  // No props needed for now
}

const PricingCalculator: React.FC<PricingCalculatorProps> = () => {
  const { formatValue } = usePrivacy();
  const [estimatedHours, setEstimatedHours] = useState<number>(8);
  const [hourlyRate, setHourlyRate] = useState<number>(50);
  const [profitMargin, setProfitMargin] = useState<number>(30);
  const [difficultyLevel, setDifficultyLevel] = useState<'baixo' | 'médio' | 'alto'>('médio');
  const [totalCost, setTotalCost] = useState<number>(0);
  const [serviceValue, setServiceValue] = useState<number>(0);
  const [finalValue, setFinalValue] = useState<number>(0);

  useEffect(() => {
    // Calculate total cost based on estimated hours and hourly rate
    const newTotalCost = estimatedHours * hourlyRate;
    setTotalCost(newTotalCost);

    // Calculate service value based on total cost and difficulty level
    let difficultyMultiplier = 1;
    switch (difficultyLevel) {
      case 'baixo':
        difficultyMultiplier = 1;
        break;
      case 'médio':
        difficultyMultiplier = 1.2;
        break;
      case 'alto':
        difficultyMultiplier = 1.5;
        break;
    }
    const newServiceValue = newTotalCost * difficultyMultiplier;
    setServiceValue(newServiceValue);

    // Calculate final value based on service value and profit margin
    const newFinalValue = newServiceValue * (1 + profitMargin / 100);
    setFinalValue(newFinalValue);
  }, [estimatedHours, hourlyRate, profitMargin, difficultyLevel]);

  const handleSave = () => {
    toast({
      title: "Simulação Salva",
      description: "Os valores calculados foram salvos.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculadora de Orçamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="estimatedHours">Horas Estimadas</Label>
            <Input
              id="estimatedHours"
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(Number(e.target.value))}
              placeholder="Ex: 8"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Valor da Hora (R$)</Label>
            <CurrencyInput
              id="hourlyRate"
              value={hourlyRate}
              onChange={(value) => setHourlyRate(value)}
              placeholder="Ex: 50,00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="profitMargin">Margem de Lucro (%)</Label>
            <PercentageInput
              id="profitMargin"
              value={profitMargin}
              onChange={(value) => setProfitMargin(value)}
              placeholder="Ex: 30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="difficultyLevel">Nível de Dificuldade</Label>
            <Select value={difficultyLevel} onValueChange={(value) => setDifficultyLevel(value as 'baixo' | 'médio' | 'alto')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixo">Baixo</SelectItem>
                <SelectItem value="médio">Médio</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Custo Total</Label>
            <div className="mt-2 rounded-md border bg-secondary p-2">
              {formatValue(totalCost)}
            </div>
          </div>
          <div>
            <Label>Valor do Serviço</Label>
            <div className="mt-2 rounded-md border bg-secondary p-2">
              {formatValue(serviceValue)}
            </div>
          </div>
          <div>
            <Label>Valor Final</Label>
            <div className="mt-2 rounded-md border bg-secondary p-2">
              {formatValue(finalValue)}
            </div>
          </div>
        </div>

        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Simulação
        </Button>
      </CardContent>
    </Card>
  );
};

export default PricingCalculator;
