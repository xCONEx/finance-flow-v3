
import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Clock, TrendingUp, Save, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface PricingCalculatorProps {
  // No props needed for now
}

const PricingCalculator: React.FC<PricingCalculatorProps> = () => {
  const [formData, setFormData] = useState({
    hours: 8,
    hourlyRate: 50,
    profitMargin: 30,
    complexity: 'medium'
  });

  const [results, setResults] = useState({
    baseCost: 0,
    complexityMultiplier: 1,
    adjustedCost: 0,
    finalPrice: 0
  });

  useEffect(() => {
    calculatePricing();
  }, [formData]);

  const calculatePricing = () => {
    const baseCost = formData.hours * formData.hourlyRate;
    
    let complexityMultiplier = 1;
    switch (formData.complexity) {
      case 'simple':
        complexityMultiplier = 0.8;
        break;
      case 'medium':
        complexityMultiplier = 1;
        break;
      case 'complex':
        complexityMultiplier = 1.5;
        break;
      default:
        complexityMultiplier = 1;
    }

    const adjustedCost = baseCost * complexityMultiplier;
    const finalPrice = adjustedCost * (1 + formData.profitMargin / 100);

    setResults({
      baseCost,
      complexityMultiplier,
      adjustedCost,
      finalPrice
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSave = () => {
    toast({
      title: "Cálculo Salvo",
      description: `Orçamento de R$ ${results.finalPrice.toFixed(2)} foi salvo.`,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Calculadora de Orçamento</h2>
        <p className="text-gray-600">Calcule o preço ideal para seus serviços audiovisuais</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário de Entrada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              Parâmetros do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="hours" className="text-sm font-medium text-gray-700">
                  Horas Estimadas
                </Label>
                <Input
                  id="hours"
                  type="number"
                  value={formData.hours}
                  onChange={(e) => handleInputChange('hours', e.target.value)}
                  className="mt-1"
                  min="1"
                  step="0.5"
                />
              </div>

              <div>
                <Label htmlFor="hourlyRate" className="text-sm font-medium text-gray-700">
                  Valor por Hora (R$)
                </Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                  className="mt-1"
                  min="1"
                  step="1"
                />
              </div>

              <div>
                <Label htmlFor="complexity" className="text-sm font-medium text-gray-700">
                  Complexidade do Projeto
                </Label>
                <Select
                  value={formData.complexity}
                  onValueChange={(value) => handleInputChange('complexity', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simples (-20%)</SelectItem>
                    <SelectItem value="medium">Médio (Padrão)</SelectItem>
                    <SelectItem value="complex">Complexo (+50%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="profitMargin" className="text-sm font-medium text-gray-700">
                  Margem de Lucro (%)
                </Label>
                <Input
                  id="profitMargin"
                  type="number"
                  value={formData.profitMargin}
                  onChange={(e) => handleInputChange('profitMargin', e.target.value)}
                  className="mt-1"
                  min="0"
                  max="100"
                  step="1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Breakdown do Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Custo Base */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Custo Base</span>
                  </div>
                  <span className="text-lg font-bold text-blue-900">
                    {formatCurrency(results.baseCost)}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {formData.hours}h × R$ {formData.hourlyRate}/h
                </p>
              </div>

              {/* Ajuste de Complexidade */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Após Complexidade</span>
                  </div>
                  <span className="text-lg font-bold text-orange-900">
                    {formatCurrency(results.adjustedCost)}
                  </span>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  Multiplicador: {results.complexityMultiplier}x
                </p>
              </div>

              {/* Preço Final */}
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Preço Final</span>
                  </div>
                  <span className="text-2xl font-bold text-green-900">
                    {formatCurrency(results.finalPrice)}
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Margem de lucro: {formData.profitMargin}%
                </p>
              </div>

              <Button onClick={handleSave} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar Orçamento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Executivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Tempo Total</p>
              <p className="text-xl font-bold text-gray-900">{formData.hours}h</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Valor/Hora</p>
              <p className="text-xl font-bold text-gray-900">R$ {formData.hourlyRate}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Complexidade</p>
              <p className="text-xl font-bold text-gray-900 capitalize">{formData.complexity}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Margem</p>
              <p className="text-xl font-bold text-gray-900">{formData.profitMargin}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingCalculator;
